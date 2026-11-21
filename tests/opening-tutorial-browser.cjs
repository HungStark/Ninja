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
    page.setDefaultTimeout(60000);
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
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
      await page.waitForSelector('#journeyDialog:not([hidden])',{state:'attached'});
      if((await state()).dialogue.autoplay){
        const subtitles=[];
        for(let i=0;i<100;i++){
          if(!await page.locator('#journeyDialog.story-shot').count())return subtitles.join(' ');
          const body=await page.locator('#storySubtitle span').textContent();
          if(body&&subtitles.at(-1)!==body)subtitles.push(body);
          await advance(1.2);
        }
        throw Error('Cutscene did not complete');
      }
      return page.evaluate(()=>{
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
    await page.locator('#journeyOpening').waitFor();await page.keyboard.press('Escape');await explore();await quiet();
    await interact('lore','nameless-resident-war-cemetery');await finishDialogue();await button(/Con hứa/).click();
    await interact('npc');
    assert.match(await finishDialogue(),/xin thần linh phù hộ/);
    await button(/Học Thủy/).click();
    assert.equal((await state()).waypoint.id,'nameless-save-1');
    await interact('intro-guardian');
    assert.match(await page.locator('#dialogTitle').innerText(),/lời phù hộ/);
    await page.keyboard.press('Escape');

    await interact('save');
    assert.equal((await state()).save.checkpointSave.snapshot.story.openingTutorial.blessed,true);
    await resume();
    assert.equal((await state()).waypoint.kind,'intro-guardian');
    assert.equal((await state()).save.story.fieldMissions['nameless:road'],undefined);

    await interact('intro-guardian');
    assert.equal((await state()).encounter?.kind,'intro-trio');
    await finishDialogue();await button('Chuẩn bị giao chiến').click();
    await page.locator('#startButton').click();
    await page.waitForFunction(()=>{const {started,battleIntro}=__AN_HOA__.state();return started&&battleIntro.loaded;});
    assert.equal(await page.evaluate(()=>__AN_HOA__.state().practiceView),'overhead');
    await page.evaluate(()=>{
      __AN_HOA__.setAIEnabled(false);
      __AN_HOA__.advance(3.5);
    });
    await page.locator('#combatSettingsButton').click();
    await page.locator('#combatView').selectOption('first-person');
    await page.locator('#closeCombatSettings').click();
    assert.equal(await page.evaluate(()=>__AN_HOA__.state().practiceView),'first-person');
    await page.evaluate(()=>{
      const {playerMaxHealth,squad}=__AN_HOA__.state();
      __AN_HOA__.setHealth('player',playerMaxHealth*.55);
      for(const {id} of squad)__AN_HOA__.setHealth(id,0);
      __AN_HOA__.advance(.2);
    });
    assert.ok(await page.evaluate(()=>__AN_HOA__.state().victory));
    await page.locator('#nextButton').click();
    assert.match(await finishDialogue(),/Con bị thương rồi.*trạm y tế/);
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
    const dispatch=await finishDialogue();assert.doesNotMatch(dispatch,/Tín gửi lời cảm ơn|Kẻ phá cầu muốn chặn/);
    await button(FIELD_ROUTE.ui.dispatchAction).click();
    assert.equal((await state()).save.story.stage,'infiltrate');

    await nearby('shop');
    assert.equal(await page.locator('#nearbyAction').innerText(),'E Mua đồ');
    await page.locator('#nearbyAction').click();
    assert.equal((await state()).phase,'shop');
    await page.locator('#closeShop').click();
    await page.evaluate(()=>__AN_HOA__.explore.offerBattle('random',{immediate:true,element:'fire'}));
    await page.locator('#startButton').click();
    await page.waitForFunction(()=>__AN_HOA__.state().started);
    const nextBattle=await page.evaluate(()=>__AN_HOA__.state());
    assert.equal(nextBattle.practiceView,'first-person');assert.equal(nextBattle.handsVisible,true);
    assert.equal(nextBattle.viewFov,68);assert.ok(nextBattle.viewPosition[1]<7);
    assert.deepEqual(errors,[]);
    console.log('PASS: new journey, chief instructions, blessing checkpoint and reload, trio victory, cancel and complete treatment, dispatch, and both facility actions.');
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
