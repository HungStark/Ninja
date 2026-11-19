const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const {build}=require('esbuild');
const {chromium}=require('playwright');

(async()=>{
  const {newJourney}=await import('../src/adventure-data.js');
  const {promiseMother,chooseStarter}=await import('../src/journey-story.js');
  const seed=newJourney();
  promiseMother(seed);chooseStarter(seed,'water-barrier');
  const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'inspect-field-route',setup(b){
    b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__fieldWorld=createAdventureScene();'),loader:'js'}));
  }}]});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4398'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
    await page.addInitScript(seed=>{if(!localStorage.getItem('anhoa-adventure-v1'))localStorage.setItem('anhoa-adventure-v1',JSON.stringify(seed));},seed);
    const ready=async()=>{
      await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await page.locator('#continueJourney').click();
      await page.waitForFunction(()=>!__AN_HOA__.adventure().loading&&__AN_HOA__.adventure().phase==='explore');
      await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));
    };
    const step=()=>page.evaluate(()=>__AN_HOA__.adventure().save.story.fieldMissions?.['nameless:road']?.step||0);
    const start=async()=>{
      await page.evaluate(()=>__fieldWorld.hero.root.position.fromArray(__fieldWorld.fieldRoute.state().target));
      await page.locator('#world').focus();await page.keyboard.press('e');
      await page.waitForFunction(()=>__fieldWorld.fieldRoute.state()?.started);
    };
    const finish=async i=>{
      await page.evaluate(i=>{
        for(let k=0;k<180&&(__AN_HOA__.adventure().save.story.fieldMissions?.['nameless:road']?.step||0)===i;k++){
          const field=__fieldWorld.fieldRoute.state();
          __fieldWorld.hero.root.position.fromArray(field.target);
          if(field.obstruction&&!field.obstruction.clearing)__AN_HOA__.explore.interact('field-task',field.entry.id);
          __AN_HOA__.advance(.15);
        }
      },i);
      assert.equal(await step(),i+1);
    };
    await page.goto('http://127.0.0.1:4398/?test=1&adventure=1');await ready();
    await page.locator('#journeyMenu').click();await page.getByRole('button',{name:'Bật tuyến nhiệm vụ mới'}).click();
    assert.match(await page.locator('#campaignSummary').innerText(),/Giữ dây/);
    await start();await page.evaluate(()=>__AN_HOA__.advance(.6));
    assert.ok(await page.locator('#fieldProgress').isVisible());
    assert.match(await page.locator('#fieldProgress').innerText(),/Ở gần để tiếp tục/);
    const out='test-results/field-route';await fs.mkdir(out,{recursive:true});
    await page.screenshot({path:out+'/bridge-rescue.png'});
    await finish(0);await page.reload();await ready();assert.equal(await step(),1);
    assert.match(await page.locator('#campaignSummary').innerText(),/Gia cố/);
    for(let i=1;i<5;i++){
      if(i===4)await page.setViewportSize({width:915,height:412});
      await start();await finish(i);
    }
    assert.match(await page.locator('#campaignSummary').innerText(),/Vô Danh/);
    assert.equal(await page.evaluate(()=>!!__fieldWorld.scene.getObjectByName('bridge-reinforced')),true);
    assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().save.gold),35);
    assert.deepEqual(errors,[]);
    console.log('PASS: play all five bridge tasks through normal input, resume between tasks, progress HUD and repaired bridge.');
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
