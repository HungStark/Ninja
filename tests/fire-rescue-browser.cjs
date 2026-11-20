const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const {build}=require('esbuild');
const {chromium}=require('playwright');

(async()=>{
  const {campaignFixtures}=await import('./campaign-fixtures.mjs');
  const {enableFieldRoute}=await import('../src/field-route.js');
  const {lotusKeeperEncounter}=await import('../src/village-events.js');
  const save=campaignFixtures()['fire:1'];
  enableFieldRoute(save);
  const keeper=lotusKeeperEncounter(save,'Cụ Liên');
  const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'fire-rescue-test',setup(b){
    b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({loader:'js',contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__fireWorld=createAdventureScene();')}));
    b.onLoad({filter:/[/\\]src[/\\]main\.js$/},async({path})=>({loader:'js',contents:(await fs.readFile(path,'utf8')).replace('tick(Math.min(1 / 60, seconds - t)); render(); };','tick(Math.min(1 / 60, seconds - t)); if(seconds===0)render(); };')}));
  }}]});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4448'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  const out='test-results/fire-rescue';await fs.mkdir(out,{recursive:true});
  let browser,page;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:1100,height:650}});page.setDefaultTimeout(60000);
    const errors=[];page.on('pageerror',error=>errors.push(error.stack));
    await page.route('**/game.js',route=>route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
    await page.addInitScript(value=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(value)),save);
    const advance=dt=>page.evaluate(dt=>__AN_HOA__.advance(dt),dt);
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure());
    const interact=async(kind,id)=>page.evaluate(([kind,id])=>{
      const entry=__fireWorld.interactives.find(e=>e.kind===kind&&e.id===id);
      if(!entry)throw Error('Missing interaction '+kind+' '+id);
      const offset=id==='fire-resident-summit-lotus'?1.2:0;
      __fireWorld.hero.root.position.set(entry.x+offset,entry.y??__fireWorld.heroHeightAt(entry.x,entry.z),entry.z);
      __fireWorld.update(.1,false,false,false);
      __AN_HOA__.explore.interact(kind,id);
    },[kind,id]);
    const watch=()=>page.evaluate(()=>{
      const pages=[];
      for(let i=0;i<90;i++){
        if(!document.querySelector('#journeyDialog.story-shot'))return pages.join(' ');
        const text=document.querySelector('#storySubtitle span').textContent;
        if(text&&pages.at(-1)!==text)pages.push(text);
        __AN_HOA__.advance(1.2);
      }
      throw Error('Fire rescue cutscene stalled');
    });
    const fight=async()=>{
      await page.locator('#startButton').click();
      await page.waitForFunction(()=>__AN_HOA__.state().started&&__AN_HOA__.state().battleIntro.loaded);
      await advance(4);
    };
    const win=async()=>{
      await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);for(const actor of __AN_HOA__.state().squad)__AN_HOA__.setHealth(actor.id,0);__AN_HOA__.advance(.3);});
      assert.ok(await page.evaluate(()=>__AN_HOA__.state().victory));
      await page.locator('#nextButton').click();
      await page.waitForFunction(()=>!__AN_HOA__.adventure().loading&&__AN_HOA__.adventure().phase!=='combat');
    };
    await page.goto('http://127.0.0.1:4448/?test=1&adventure=1');
    await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#continueJourney').click();
    await page.waitForFunction(()=>__AN_HOA__.adventure().phase==='explore'&&!__AN_HOA__.adventure().loading);
    await page.evaluate(()=>{__AN_HOA__.audio.configure({muted:true});__AN_HOA__.explore.setRandom(false);__AN_HOA__.setAIEnabled(false);});

    console.log('CHECK rescue starts after both jailers lose');
    await interact('village-event','story-fire-1');await watch();
    await page.locator('#dialogActions button').first().click();await fight();
    assert.equal((await state()).encounter.storyBattle,'fire-jail');await win();
    assert.match(await watch(),/Cô ấy ngất rồi/);
    assert.equal((await state()).villageStory.captive.pose,'unconscious');
    assert.equal((await state()).waypoint.id,'fire-ha-ly-mother');

    console.log('CHECK Mother Hong, real escort route and diagnosis');
    const motherOutside=(await state()).villageStory.mother.position[2];
    await interact('story-witness','fire-ha-ly-mother');assert.match(await watch(),/Y nữ Đan/);
    assert.ok((await state()).villageStory.mother.position[2]<motherOutside-2);
    const escort=await page.evaluate(()=>__fireWorld.fieldRoute.state());
    assert.equal(escort.mode,'escort');assert.equal(escort.destination.label,'Cửa nhà lao của Hạ Ly');
    await interact('field-task',escort.entry.id);
    assert.ok(await page.evaluate(()=>__fireWorld.fieldRoute.state().started));
    await page.evaluate(()=>{
      for(let i=0;i<210;i++){
        const escort=__fireWorld.fieldRoute.state();
        if(!escort)return;
        __fireWorld.hero.root.position.fromArray(escort.target);
        __AN_HOA__.advance(.25);
      }
      throw Error('Medic Dan did not reach the prison');
    });
    assert.match(await watch(),/Đỉnh Hồng Liên/);
    assert.ok(!(await state()).save.story.questItems.includes('fire:lotus-medicine'));

    console.log('CHECK summit climb, human-phase duel, permission, book and medicine');
    await page.evaluate(()=>{
      const w=__fireWorld,stairs=w.routes.find(route=>route.id==='red-cliff');
      w.hero.root.position.set(stairs.from[0],stairs.fromY,stairs.from[1]);
      w.update(.01,false,false,false);
      if(!w.startTraversal(stairs.id))throw Error('Summit climb did not start');
      for(let i=0;i<400&&w.riding;i++)w.advanceTraversal(.1,1);
      if(w.riding||w.hero.root.position.y<35)throw Error('Summit climb did not finish');
    });
    await interact('lore','fire-resident-summit-lotus');assert.match(await watch(),/bảo vật của làng/);
    assert.equal((await state()).encounter.kind,'lotus-duel');
    assert.ok((await state()).height>=35);
    assert.ok(!(await state()).save.story.questItems.includes('fire:hong-lien'));
    await fight();
    const combat=await page.evaluate(()=>__AN_HOA__.state());
    assert.equal(combat.enemyMaxHealth,keeper.hp);assert.deepEqual(combat.enemyLoadout,keeper.spellIds);
    assert.equal(combat.boss,null);
    await win();
    assert.ok((await state()).height>=35,'the player returns to Crimson Lotus Peak after the duel');
    assert.ok(await page.evaluate(()=>{
      for(let i=0;i<120;i++){
        if(__fireWorld.storyCamera.state()?.shot==='reaction'&&document.querySelector('#storySubtitle').hidden)return true;
        __AN_HOA__.advance(.3);
      }
      return false;
    }),'the keeper gets a silent reaction before granting the lotus');
    assert.ok(await page.evaluate(()=>__fireWorld.camera.position.y>=35),'the keeper reaction is framed on the summit');
    await advance(0);
    await page.screenshot({path:out+'/lotus-keeper-reaction.png'});
    assert.match(await watch(),/Hạ Ly.*Hỏa Long Cuồng Vũ/);
    let journey=(await state()).save;
    assert.ok(journey.story.questItems.includes('fire:hong-lien'));
    assert.equal(journey.progression.books.filter(id=>id==='fire-lance').length,1);
    assert.ok(!journey.learnedSpells.includes('fire-lance'));
    await interact('story-witness','ha-ly-wounded');assert.match(await watch(),/điều chế thuốc/);
    journey=(await state()).save;
    assert.equal(journey.story.villageEvents.fire,3);
    assert.ok(journey.story.questItems.includes('fire:lotus-medicine'));
    assert.ok(!journey.story.questItems.includes('fire:hong-lien'));
    assert.deepEqual(errors,[]);
    console.log('PASS: jailers, collapse, escort, diagnosis, climb, single human-phase duel, reward book and treatment.');
  }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}
  finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
