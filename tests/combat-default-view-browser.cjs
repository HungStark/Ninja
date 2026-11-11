const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
  const out='test-results/combat-default-view';await fs.mkdir(out,{recursive:true});
  const {newJourney}=await import('../src/adventure-data.js'),{promiseMother,chooseStarter}=await import('../src/journey-story.js');
  const seed=newJourney();promiseMother(seed);chooseStarter(seed,'fire-volley');seed.story.stage='guardian';
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4393'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='load';
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const variant of process.argv.length>2?process.argv.slice(2):['desktop','mobile','android-offline','arena']){
      checkpoint=variant;console.log('CHECK: '+variant);
      const mobile=!['desktop','arena'].includes(variant),context=await browser.newContext({viewport:mobile?{width:915,height:412}:{width:1366,height:900},hasTouch:mobile,isMobile:mobile});
      page=await context.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.stack));
      const base=variant==='android-offline'?'file:///'+path.resolve('android-apk/www/index.html').replaceAll('\\','/'):'http://127.0.0.1:4393/index.html';
      const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),click=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
      const checkView=s=>{assert.equal(s.practiceView,'overhead');assert.equal(s.viewFov,40);assert.ok(s.viewPosition[1]>30,'camera is already above the arena');assert.equal(s.handsVisible,false);assert.equal(s.playerAvatar.visible,true);assert.equal(s.playerAvatar.position[2],7);assert.equal(s.practiceOverhead.fencesVisible,true);assert.equal(s.practiceOverhead.dividers.length,2);};
      await page.goto(base+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await click('#startButton');await click('#practiceOpponentConfirm');assert.equal(await page.locator('[name=practiceView][value=overhead]').isChecked(),true,'third person is preselected');await click('#practiceViewConfirm');
      checkView(await state());await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await advance(.01);checkView(await state());
      assert.equal(await page.locator('#mobileTacticalHUD').isVisible(),mobile);await page.screenshot({path:out+'/'+variant+'-practice.png'});
      // An explicit first-person practice choice must not carry into the main game.
      if(mobile){await click('#tacticalSettings');await click('[data-tactical-tab=general]');}else await page.keyboard.press('Escape');
      await click('#changeLoadout');await advance(0);await click('#startButton');await click('#practiceOpponentConfirm');assert.equal(await page.locator('[name=practiceView][value=overhead]').isChecked(),true);await page.locator('[name=practiceView][value=first-person]').check();await click('#practiceViewConfirm');assert.equal((await state()).practiceView,'first-person');
      await page.evaluate(seed=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(seed)),seed);await page.goto(base+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await click('#continueJourney');await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
      if(variant==='arena'){
        await page.evaluate(()=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.explore.offerBattle('arena',{immediate:true,element:'fire'});});await page.waitForFunction(()=>__AN_HOA__.state().started);
        checkView(await state());assert.equal((await state()).arenaEnvironment,true);await advance(.01);checkView(await state());await page.screenshot({path:out+'/arena-immediate.png'});assert.deepEqual(errors,[]);await context.close();continue;
      }
      await page.evaluate(()=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.explore.offerBattle('intro-trio');});
      for(let i=0;i<40&&!await page.evaluate(()=>__AN_HOA__.adventure().dialogue.complete);i++)await click('#dialogNext');
      const prepare=page.locator('#dialogActions button').filter({hasText:'Chuẩn bị giao chiến'}).first();if(mobile)await prepare.tap();else await prepare.click();
      await click('#startButton');await page.waitForFunction(()=>__AN_HOA__.state().started&&__AN_HOA__.state().battleIntro.loaded);await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
      let s=await state();assert.equal(s.battleIntro.active,true);checkView(s);assert.equal(s.squad.length,3);
      // Exercise actual renders while tick() exits early for the intro, including
      // the exact frame where the intro disappears before normal ticking resumes.
      for(const dt of [.3,.5,.5,.69,.03,.02,.016,.016,.1]){await advance(dt);checkView(await state());}
      assert.equal((await state()).battleIntro.active,false);assert.equal(await page.locator('#mobileTacticalHUD').isVisible(),mobile);await page.screenshot({path:out+'/'+variant+'-campaign.png'});
      if(mobile){
        const client=await context.newCDPSession(page),pad=await page.locator('#tacticalJoystick').boundingBox(),p={x:pad.x+pad.width/2,y:pad.y+pad.height/2};
        await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...p}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:p.x,y:p.y-pad.height*.35}]});await advance(5);
        await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});s=await state();assert.ok(s.position[2]>=s.practiceOverhead.bounds.player.minZ-1e-6,'walking stops at the horizontal fence');assert.ok(s.position[2]<7,'the joystick actually moved the player');
        await click('#tacticalDash');await advance(.3);s=await state();assert.ok(s.position[2]>=s.practiceOverhead.bounds.player.minZ-1e-6,'dash stops at the horizontal fence');
      }
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('PASS: desktop, mobile web and offline Android default to third person in practice/main combat; fences divide the court, movement respects them, and intro/first exposed frames keep the overhead camera without first-person hands.');
  }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:e.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
