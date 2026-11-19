const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const {build}=require('esbuild');
const {chromium}=require('playwright');

(async()=>{
  const {FIELD_ROUTE}=await import('../src/field-route.js');
  const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'inspect-opening',setup(b){
    b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__openingWorld=createAdventureScene();'),loader:'js'}));
  }}]});
  const port='4413',server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:port},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1024,height:680}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
    await page.addInitScript(()=>{
      const repaired=sessionStorage.getItem('opening-bridge-repaired');
      if(repaired){localStorage.setItem('anhoa-adventure-v1',repaired);sessionStorage.removeItem('opening-bridge-repaired');}
    });
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure());
    const advance=seconds=>page.evaluate(seconds=>__AN_HOA__.advance(seconds),seconds);
    const button=name=>page.locator('#dialogActions').getByRole('button',{name});
    const explore=()=>page.waitForFunction(()=>!__AN_HOA__.adventure().loading&&__AN_HOA__.adventure().phase==='explore');
    const quiet=()=>page.evaluate(()=>{
      __AN_HOA__.explore.setRandom(false);__AN_HOA__.audio.configure({readDialogue:false});
      for(let i=0;i<3&&__AN_HOA__.state().graphics.shadowMap;i++)document.querySelector('#qualityButton').click();
    });
    const nearby=(kind,id)=>page.evaluate(({kind,id})=>{
      const w=__openingWorld,item=w.interactives.find(i=>i.kind===kind&&(!id||i.id===id));
      if(!item)throw Error('Missing '+kind);
      w.hero.root.position.set(item.x,item.y??w.heightAt(item.x,item.z),item.z);
      w.update(.05,false,false,false);
      __AN_HOA__.advance(.05);
    },{kind,id});
    const interact=async(kind,id)=>{await nearby(kind,id);await page.keyboard.press('e');};
    const resume=async()=>{
      await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await page.locator('#continueJourney').click();await explore();await quiet();
    };
    const finishDialogue=async()=>{
      await page.waitForSelector('#journeyDialog:not([hidden])');
      await page.evaluate(()=>{
        const skip=document.querySelector('#dialogSkip'),next=document.querySelector('#dialogNext');
        if(!skip.hidden&&!next.parentElement.hidden){skip.click();return;}
        for(let i=0;i<40;i++){
          const {active,complete}=__AN_HOA__.adventure().dialogue;
          if(!active||complete)return;
          next.click();
        }
        throw Error('Dialogue did not complete');
      });
    };

    await page.goto(`http://127.0.0.1:${port}/?test=1&adventure=1`);
    await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#heroForm button[type=submit]').click();
    await page.locator('.opening-skip').click();await advance(2.3);await explore();await quiet();
    await interact('lore','nameless-resident-war-cemetery');await finishDialogue();await button(/Con hứa/).click();
    await interact('npc');await finishDialogue();
    assert.match(await page.locator('#dialogBody').innerText(),/xin thần linh phù hộ/);
    await button(/Học Thủy/).click();
    assert.equal((await state()).waypoint.id,'nameless-save-1');
    await interact('field-task');
    assert.match(await page.locator('#dialogTitle').innerText(),/lời phù hộ/);
    await page.keyboard.press('Escape');
    await interact('intro-guardian');
    assert.match(await page.locator('#dialogTitle').innerText(),/lời phù hộ/);
    await page.keyboard.press('Escape');

    await interact('save');
    assert.equal((await state()).save.checkpointSave.snapshot.story.openingTutorial.blessed,true);
    await resume();
    assert.equal((await state()).waypoint.kind,'field-task');
    await interact('field-task');
    assert.ok(await page.evaluate(()=>__openingWorld.fieldRoute.state()?.started));
    // The field-route suite plays the bridge tasks. Resume here with the bridge repaired.
    await page.evaluate(step=>{
      const key='anhoa-adventure-v1',save=JSON.parse(localStorage.getItem(key));
      save.story.fieldMissions['nameless:road']={step};
      sessionStorage.setItem('opening-bridge-repaired',JSON.stringify(save));
    },FIELD_ROUTE.opening.steps.length);
    await resume();
    assert.equal((await state()).waypoint.kind,'intro-guardian');

    await interact('intro-guardian');
    assert.equal((await state()).encounter?.kind,'intro-trio');
    await finishDialogue();await button('Chuẩn bị giao chiến').click();
    await page.locator('#startButton').click();
    await page.waitForFunction(()=>{const {started,battleIntro}=__AN_HOA__.state();return started&&battleIntro.loaded;});
    await page.evaluate(()=>{
      __AN_HOA__.setAIEnabled(false);
      __AN_HOA__.advance(3.5);
      const {playerMaxHealth,squad}=__AN_HOA__.state();
      __AN_HOA__.setHealth('player',playerMaxHealth*.55);
      for(const {id} of squad)__AN_HOA__.setHealth(id,0);
      __AN_HOA__.advance(.2);
    });
    assert.ok(await page.evaluate(()=>__AN_HOA__.state().victory));
    await page.locator('#nextButton').click();await finishDialogue();
    assert.match(await page.locator('#dialogBody').innerText(),/Con bị thương rồi.*trạm y tế/);
    await button('Tới trạm y tế').click();
    assert.equal((await state()).waypoint.kind,'clinic');
    await resume();
    assert.equal((await state()).waypoint.kind,'clinic');
    await nearby('clinic');
    assert.equal(await page.locator('#nearbyAction').innerText(),'E Hồi phục');
    await page.locator('#nearbyAction').click();await advance(.5);await page.keyboard.press('Escape');
    assert.equal((await state()).save.story.openingTutorial.treated,false);
    await interact('clinic');await advance(2.1);
    const treated=(await state()).save;
    assert.equal(treated.healthFraction,1);
    assert.equal(treated.flask.charges,1);
    assert.equal(treated.story.openingTutorial.treated,true);
    await finishDialogue();await button(FIELD_ROUTE.ui.dispatchAction).click();
    assert.equal((await state()).save.story.stage,'infiltrate');

    await nearby('shop');
    assert.equal(await page.locator('#nearbyAction').innerText(),'E Mua đồ');
    await page.locator('#nearbyAction').click();
    assert.equal((await state()).phase,'shop');
    assert.deepEqual(errors,[]);
    console.log('PASS: new journey, chief instructions, blessing checkpoint and reload, trio victory, cancel and complete treatment, dispatch, and both facility actions.');
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
