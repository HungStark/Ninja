const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
 const {newJourney}=await import('../src/adventure-data.js'),{REGIONS}=await import('../src/adventure-world.js'),{villageGuards}=await import('../src/journey-story.js'),{createAdventureScene}=await import('../src/adventure-scene.js');
 global.innerWidth=915;global.innerHeight=412;const world=createAdventureScene(),errors=[],out='test-results/skill-lessons';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true});page.on('pageerror',e=>errors.push(e.stack));
 const url='file:///'+path.join(process.cwd(),'android-apk/www/index.html').replaceAll('\\','/')+'?test=1&adventure=1',state=()=>page.evaluate(()=>__AN_HOA__.adventure());
 await page.addInitScript(()=>{const s=sessionStorage.getItem('lesson-seed');if(s)localStorage.setItem('anhoa-adventure-v1',s);});
 async function load(xp){
  const s=newJourney();s.story.stage='infiltrate';s.story.guardianRestored=true;s.village='water';s.progression.xp.water=xp;s.learnedSpells=['water-barrier'];s.story.defeatedGuards=villageGuards('water').map(g=>g.id);s.lessons.water=1;s.discoveries=REGIONS.water.mentor.zoneIds.map(z=>'water:'+z);world.load('water',s);
  const m=world.interactives.find(i=>i.kind==='mentor');let near;
  for(let k=0;k<32;k++){const a=k*Math.PI/16,x=m.x+Math.cos(a)*1.1,z=m.z+Math.sin(a)*1.1;if(!world.blocked(x,z)&&Math.abs(world.heightAt(x,z)-(m.y??world.heightAt(m.x,m.z)))<.5){near=[x,z];break;}}
  assert.ok(near);s.position=near;await page.evaluate(s=>sessionStorage.setItem('lesson-seed',JSON.stringify(s)),s);await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').tap();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));
 }
 try{
  await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');
  for(const xp of [2100,0]){
   await load(xp);await page.evaluate(()=>__AN_HOA__.explore.openJournal());const task=page.locator('[data-journal-group="quests"] [data-lesson="water"]');assert.equal(await task.getAttribute('data-quest-status'),'2');assert.match(await task.innerText(),/Ném thuyền/);await page.locator('#closeJournal').tap();
   await page.evaluate(()=>__AN_HOA__.explore.interact('mentor'));assert.equal((await state()).phase,'dialog');await page.locator('#dialogSkip').tap();await page.screenshot({path:out+'/water-reward-'+xp+'.png'});await page.locator('#dialogActions button').filter({hasText:'Nhận thưởng'}).tap();
   let s=(await state()).save;assert.equal(s.mentors.water,true);assert.deepEqual(s.learnedSpells,xp?['water-barrier','water-volley']:['water-barrier']);assert.deepEqual(s.progression.books,xp?[]:['water-volley']);assert.ok(!s.learnedSpells.includes('water-lance'));
   await page.evaluate(()=>__AN_HOA__.explore.openJournal());assert.equal(await page.locator('[data-lesson="water"]').getAttribute('data-quest-status'),'3');await page.screenshot({path:out+'/journal-completed-'+xp+'.png'});await page.locator('#closeJournal').tap();
   if(!xp){await page.evaluate(()=>{__AN_HOA__.explore.gainExperience('water',420);__AN_HOA__.explore.openProgression();});await page.locator('[data-system="water"] summary').click();await page.locator('[data-book="water-volley"]').tap();s=(await state()).save;assert.deepEqual(s.learnedSpells,['water-barrier','water-volley']);assert.deepEqual(s.progression.books,[]);}
  }
  assert.deepEqual(errors,[]);console.log('PASS: Water lesson is a village quest; level 10 rewards only Boat, novice keeps only its book, completion shown in journal and later book learning works.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
