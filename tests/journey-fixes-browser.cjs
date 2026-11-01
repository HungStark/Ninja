const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{
  const {newJourney}=await import('../src/adventure-data.js'),{promiseMother,chooseStarter,villageSidequests,INTRO_SQUAD}=await import('../src/journey-story.js'),{REGIONS}=await import('../src/adventure-world.js');
  const save=newJourney('Regression');promiseMother(save);chooseStarter(save,'fire-volley');save.story.stage='infiltrate';save.story.guardianRestored=true;save.progression.attributes.mana=1;save.position=[0,7];
  const quest=villageSidequests('nameless').find(q=>q.type==='retrieve'&&REGIONS.nameless.npcs.some(n=>n.id===q.giver&&n.kind==='lore'));save.story.sidequests[quest.id]=2;
  const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'inspect-world',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__testWorld=createAdventureScene();'),loader:'js'}));}}]});
  const port='4347',server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:port},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
  const out='test-results/journey-fixes';await fs.mkdir(out,{recursive:true});
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:640,height:420}});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.message);});
    await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
    await page.addInitScript(save=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(save)),save);
    await page.goto(`http://127.0.0.1:${port}/?test=1&adventure=1`);await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.evaluate(()=>{__AN_HOA__.audio.configure({readDialogue:false});window.__loads=0;const w=__testWorld,load=w.load;w.load=(...args)=>{__loads++;return load(...args);};});
    await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
    assert.equal(await page.evaluate(()=>__loads),0,'continue reuses the already prepared map');
    await page.evaluate(()=>{__AN_HOA__.explore.setRandom(false);window.__originalObjects=[];__testWorld.scene.traverse(o=>__originalObjects.push(o));});
    console.log('CHECK: E opens completed quest thanks immediately');
    await page.evaluate(giver=>{const w=__testWorld,item=w.interactives.find(i=>i.id===giver);w.hero.root.position.set(item.x,item.y??w.heightAt(item.x,item.z),item.z);document.getElementById('gameCanvas')?.focus();},quest.giver);
    await page.keyboard.press('e');assert.equal((await page.evaluate(()=>__AN_HOA__.adventure())).phase,'dialog');
    assert.match(await page.locator('#dialogBody').getAttribute('aria-label'),/Cảm ơn/);assert.equal(await page.locator('#dialogActions button').first().innerText(),'Nhận thưởng');assert.equal(await page.locator('#dialogSpeakerName').innerText(),quest.giverName);
    await page.locator('#dialogActions button').first().click();assert.equal((await page.evaluate(()=>__AN_HOA__.adventure())).save.story.sidequests[quest.id],3);
    await page.keyboard.press('e');assert.match(await page.locator('#dialogBody').getAttribute('aria-label'),/Cảm ơn/);await page.keyboard.press('Escape');
    await page.locator('#openProgression').click();const mana=page.locator('[data-upgrade="mana"]').locator('..');assert.match(await mana.innerText(),/101 mana/);assert.match(await mana.innerText(),/5\.1 mana\/giây/);assert.match(await mana.innerText(),/\+1 mana và \+0\.1/);await page.locator('#closeProgression').click();
    const prepare=async(kind='random',details={})=>{
      await page.evaluate(({kind,details})=>{__AN_HOA__.explore.offerBattle(kind,details);for(let i=0;i<30&&!__AN_HOA__.adventure().dialogue.complete;i++)document.getElementById('dialogNext').click();},{kind,details});
      await page.locator('#dialogActions button').first().click();await page.locator('#startButton').click();await page.waitForFunction(()=>__AN_HOA__.state().started);await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.advance(2.2);});
    };
    console.log('CHECK: repeated combat returns retain map objects');const returnMs=[];
    for(let i=0;i<6;i++){
      await prepare();const s=await page.evaluate(()=>__AN_HOA__.state());assert.equal(s.maxChakra,101);assert.equal(s.chakraRegen,5.1);
      await page.evaluate(()=>{__AN_HOA__.setHealth('enemy',0);__AN_HOA__.advance(.1);});const at=Date.now();await page.locator('#nextButton').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);returnMs.push(Date.now()-at);
      const stable=await page.evaluate(()=>{const objects=[];__testWorld.scene.traverse(o=>objects.push(o));return {loads:__loads,same:objects.length===__originalObjects.length&&objects.every((o,i)=>o===__originalObjects[i])};});assert.equal(stable.loads,0);assert.equal(stable.same,true);
    }
    console.log('CHECK: temporary rig skeletons are disposed');
    const cleanup=await page.evaluate(async()=>{const w=__testWorld,c=w.spawnEnemy(w.hero.root.position.x,w.hero.root.position.z,'fire');await c.ready;__AN_HOA__.advance(.02);const skeletons=new Set();c.root.traverse(o=>{if(o.skeleton)skeletons.add(o.skeleton);});let disposed=0;for(const s of skeletons){const dispose=s.dispose.bind(s);s.dispose=()=>{disposed++;dispose();};}w.clearEnemy();return {skeletons:skeletons.size,disposed,detached:c.root.parent===null};});
    assert.ok(cleanup.skeletons>0);assert.equal(cleanup.disposed,cleanup.skeletons);assert.equal(cleanup.detached,true);
    console.log('CHECK: defeated primary and secondary enemies disappear independently');
    await prepare('random',{squad:INTRO_SQUAD});
    await page.evaluate(()=>{__AN_HOA__.setHealth('primary',0);__AN_HOA__.advance(.1);});let s=await page.evaluate(()=>__AN_HOA__.state());assert.equal(s.enemyVisible,false);assert.equal(s.won,false);assert.ok(s.squad[1].visible&&s.squad[2].visible);
    await page.evaluate(()=>{__AN_HOA__.setHealth('squad-1',0);__AN_HOA__.advance(.1);});s=await page.evaluate(()=>__AN_HOA__.state());assert.equal(s.squad[1].visible,false);assert.equal(s.squad[2].visible,true);assert.equal(s.won,false);
    await page.screenshot({path:out+'/one-survivor.png'});
    await page.evaluate(()=>{__AN_HOA__.setHealth('squad-2',0);__AN_HOA__.advance(.1);});s=await page.evaluate(()=>__AN_HOA__.state());assert.equal(s.won,true);assert.ok(s.squad.slice(1).every(a=>!a.visible));
    await page.locator('#nextButton').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
    await prepare('random',{squad:INTRO_SQUAD.slice(0,2)});assert.equal(await page.locator('#totalTargets').innerText(),'02');
    await page.evaluate(()=>{__AN_HOA__.setHealth('squad-1',0);__AN_HOA__.advance(.1);});s=await page.evaluate(()=>__AN_HOA__.state());assert.equal(s.squad[1].visible,false);assert.equal(s.enemyVisible,true);assert.equal(s.won,false);
    await page.evaluate(()=>{__AN_HOA__.setHealth('primary',0);__AN_HOA__.advance(.1);});assert.equal((await page.evaluate(()=>__AN_HOA__.state())).won,true);assert.deepEqual(errors,[]);
    console.log(JSON.stringify({returnMs,mapRebuilds:await page.evaluate(()=>__loads)}));console.log('PASS: real E quest turn-in/thanks, mana UI and combat stats, six battle returns without map reconstruction or object growth, independent multi-enemy defeat visibility.');
  }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
