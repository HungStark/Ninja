const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[],output='test-results/enemy-encounters';await fs.mkdir(output,{recursive:true});page.on('pageerror',e=>errors.push(e.stack));
 const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
 const begin=async kind=>{await page.evaluate(kind=>__AN_HOA__.explore.offerBattle(kind),kind);await page.locator('#dialogActions button').filter({hasText:'Chuẩn bị'}).click();await page.locator('#startButton').click();};
 try{
  await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#heroForm button[type=submit]').click();
  await begin('random');const initial=await state();assert.equal(initial.enemyAppearance.kind,'ninja');assert.equal(initial.enemyAppearance.model,'ninja-random-nameless');assert.equal(initial.enemyAppearance.ninja.village,'nameless');assert.equal(initial.enemyMaxHealth,60);assert.deepEqual(initial.enemyLoadout,['water-barrier']);
  await page.keyboard.press('Space');await advance(1.1);let s=await state();assert.ok(s.enemyMovement.dodges>=1);assert.ok(Math.abs(s.enemyPosition[0])>.65);assert.equal(s.enemyHealth,60,'the enemy actually dodges a centered shuriken');
  await page.keyboard.press('Escape');const paused=s.enemyPosition;await advance(1);assert.deepEqual((await state()).enemyPosition,paused);await page.locator('#resumeButton').click();
  const signs=new Set();for(let i=0;i<32;i++){await advance(.25);s=await state();if(s.enemyMovement.velocity)signs.add(Math.sign(s.enemyMovement.velocity));}assert.equal(signs.size,2);assert.equal(s.won,false);
  await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));const stopped=(await state()).enemyPosition;await advance(.5);assert.deepEqual((await state()).enemyPosition,stopped);
  const save=await page.evaluate(()=>__AN_HOA__.adventure().save);
  await page.addInitScript(()=>{const value=sessionStorage.getItem('enemy-visual-save');if(value)localStorage.setItem('anhoa-adventure-v1',value);});
  for(const [id,kind,archetype] of [['water','quest',null],['water','boss','dragon'],['lightning','boss','bird'],['earth','boss','golem'],['dark','boss','wraith']]){
    const seeded={...save,village:id,position:[0,7],surface:null,elevation:null,mentors:{water:true,lightning:true,earth:true,dark:true},bosses:id==='dark'?{water:true,fire:true,lightning:true,earth:true,wind:true,light:true,ice:true,wood:true}:{},campaign:{treatySigned:true,deliveries:['earth','wind','light','ice','wood']}};
    await page.evaluate(save=>sessionStorage.setItem('enemy-visual-save',JSON.stringify(save)),seeded);await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await begin(kind);await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await advance(.1);s=await state();
    assert.equal(s.enemyAppearance.id,kind==='boss'?id:'quest-'+id);assert.equal(s.enemyAppearance.name,await page.evaluate(()=>__AN_HOA__.adventure().encounter.name));
    if(archetype){assert.equal(s.enemyAppearance.kind,'creature');assert.equal(s.enemyAppearance.archetype,archetype);}else{assert.equal(s.enemyAppearance.kind,'ninja');assert.equal(s.enemyAppearance.model,'ninja-quest-'+id);assert.notEqual(s.enemyAppearance.coat,initial.enemyAppearance.coat);}
    await page.screenshot({path:output+'/'+id+'-'+kind+'.png'});
    if(id==='dark'){await page.keyboard.press('Escape');await page.locator('#changeLoadout').click();await page.keyboard.press('Escape');await page.locator('#dialogActions button').filter({hasText:'Về màn hình chính'}).click();await page.locator('#duelMode').click();await page.locator('#startButton').click();assert.equal((await state()).enemyAppearance.kind,'duel');await page.screenshot({path:output+'/duel-reset.png'});}
  }
  assert.deepEqual(errors,[]);console.log('PASS: live shuriken dodge, lateral directions, pause/AI freeze, fair opening loadout, encounter-specific ninja/dragon/bird/golem/wraith and duel restoration.');
 }catch(e){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});await fs.writeFile(output+'/failure.json',JSON.stringify(await state().catch(()=>null),null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
