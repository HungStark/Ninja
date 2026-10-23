const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
  const {newJourney}=await import('../src/adventure-data.js'),{promiseMother,chooseStarter}=await import('../src/journey-story.js');
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  const url='file:///'+path.join(process.cwd(),'android-apk/www/index.html').replaceAll('\\','/'),ready=()=>page.waitForFunction(()=>document.body.dataset.ready==='true'),state=()=>page.evaluate(()=>__AN_HOA__.state());
  await page.addInitScript(()=>{const seed=sessionStorage.getItem('enemy-balance-fixture');if(seed)localStorage.setItem('anhoa-adventure-v1',seed);});
  try{
    await page.goto(url+'?test=1&mode=duel');await ready();await page.locator('#startButton').tap();let s=await state();assert.equal(s.enemyMaxHealth,220);assert.equal(s.playerMaxHealth,200);
    const seed=newJourney();promiseMother(seed);chooseStarter(seed,'water-barrier');seed.position=[0,7];
    const begin=async(save,kind)=>{await page.evaluate(save=>sessionStorage.setItem('enemy-balance-fixture',JSON.stringify(save)),save);await page.goto(url+'?test=1&adventure=1');await ready();await page.locator('#continueJourney').tap();await page.evaluate(kind=>__AN_HOA__.explore.offerBattle(kind),kind);await page.locator('#dialogActions button').first().tap();await page.locator('#startButton').tap();await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.advance(2.1);});};
    await begin(seed,'intro-trio');s=await state();assert.equal(s.squad.length,3);assert.ok(s.squad.every(actor=>actor.maxHp===94));assert.equal(s.playerMaxHealth,200);
    seed.village='water';await begin(seed,'boss');s=await state();assert.equal(s.enemyMaxHealth,257);assert.equal(s.boss.damageMultiplier,.75);assert.equal(s.enemyLoadout.length,5);await page.evaluate(()=>{__AN_HOA__.setHealth('enemy',0);__AN_HOA__.advance(3.3);});s=await state();assert.equal(s.boss.phaseNumber,2);assert.equal(s.boss.damageMultiplier,.85);assert.equal(s.enemyLoadout.length,5);assert.equal(s.enemyMovement.dashBoost.uses,0);assert.deepEqual(errors,[]);
    console.log('PASS: actual mobile practice HP220, opening trio HP94 each, Water guardian HP257/315; player HP200 retained; guardian has free human spells and full-HP monster transformation.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
