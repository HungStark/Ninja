const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
 const {newJourney}=await import('../src/adventure-data.js'),{villageGuards}=await import('../src/journey-story.js');
 const out='test-results/enemy-seal-speed';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true}),errors=[],measurements=[];page.on('pageerror',e=>errors.push(e.stack));
 const url='file:///'+path.join(process.cwd(),'android-apk/www/index.html').replaceAll('\\','/')+'?test=1&adventure=1',state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
 await page.addInitScript(()=>{const s=sessionStorage.getItem('seal-speed-seed');if(s)localStorage.setItem('anhoa-adventure-v1',s);});
 async function begin(kind,village='fire',details={}){
  const s=newJourney();s.story.stage='infiltrate';s.story.guardianRestored=true;s.bosses.nameless=true;s.village=village;s.position=[0,7];s.learnedSpells=['fire-volley'];s.progression.xp.fire=0;s.story.villageEvents[village]=4;s.story.defeatedGuards=villageGuards(village).map(g=>g.id);s.story.peaceSeals=['water','fire','lightning','earth','wind','light','ice','wood'];s.campaign={treatySigned:true,deliveries:['earth','wind','light','ice','wood']};
  await page.evaluate(s=>sessionStorage.setItem('seal-speed-seed',JSON.stringify(s)),s);await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').tap();await page.evaluate(([k,d])=>__AN_HOA__.explore.offerBattle(k,d),[kind,details]);await page.locator('#dialogActions button').filter({hasText:'Chuẩn bị giao chiến'}).tap();await page.locator('#startButton').tap();await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',10000);});await advance(2.1);
 }
 async function cadence(speed){
  const a=await page.evaluate(()=>__AN_HOA__.adventure());assert.equal(a.encounter.sealSpeedMultiplier,speed);const delay=a.encounter.sealDelay;
  await page.evaluate(()=>__AN_HOA__.setAIEnabled(true));await advance((await state()).enemyAI.timer+.002);assert.equal((await state()).enemySequence.length,1,'first seal');
  await advance(delay*.9);assert.equal((await state()).enemySequence.length,1,'must wait the actual interval');await advance(delay*.2);assert.equal((await state()).enemySequence.length,2,'next seal follows the configured interval');measurements.push({kind:a.encounter.kind,village:a.encounter.village,guardRole:a.encounter.guardRole,speed,delay,phase:(await state()).guardianPhases.phase});
 }
 try{
  await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');
  for(const [kind,role,speed]of [['random',null,1],['village-guard','hidden',1.15],['village-guard','guardian',1.3],['boss',null,1.5]]){await begin(kind,'fire',role?{guardRole:role}:{});await cadence(speed);}
  await begin('boss','dark');for(let i=0;i<2;i++){await page.evaluate(()=>__AN_HOA__.setHealth('enemy',0));await advance(3.3);}assert.equal((await state()).guardianPhases.phase,3);await cadence(1.5);
 }finally{await fs.writeFile(out+'/measurements.json',JSON.stringify({measurements,errors},null,2));await browser.close();}
 assert.deepEqual(errors,[]);console.log('PASS: actual seal spacing for ordinary/hidden guard/guardian/boss, including Dark phase three without an extra speed multiplier.');
})().catch(e=>{console.error(e);process.exitCode=1;});
