const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const {campaignFixtures}=await import('./campaign-fixtures.mjs'),{enterInterior}=await import('../src/adventure-interiors.js'),fixtures=campaignFixtures();
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'story-cast-inspect',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({loader:'js',contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__storyWorld=createAdventureScene();')}));b.onLoad({filter:/[/\\]src[/\\]adventure-dialogue\.js$/},async({path})=>({loader:'js',contents:(await fs.readFile(path,'utf8')).replace('function render(){const line=lines[index];','function render(){const line=lines[index];window.__visibleSpeaker=line.speaker;')}));}}]});
 const out='test-results/story-characters';await fs.mkdir(out,{recursive:true});const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4401'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='load';const errors=[];
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Test server exited: '+code)));});browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const mobile of [false,true]){
   page=await browser.newPage({viewport:mobile?{width:915,height:412}:{width:1280,height:900},hasTouch:mobile});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.stack));await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
   await page.addInitScript(()=>{const s=sessionStorage.getItem('cast-seed');if(s)localStorage.setItem('anhoa-adventure-v1',s);});
   await page.goto('http://127.0.0.1:4401/?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   for(const key of mobile?['wood:1','ice:2']:['wood:1','ice:2','fire:4','dark:8']){
    checkpoint=(mobile?'mobile ':'desktop ')+key;console.log('CHECK '+checkpoint);const save=structuredClone(fixtures[key]);if(key==='dark:8')enterInterior(save,'dark-council-hall',{position:[0,7],surface:null,elevation:0});
    await page.evaluate(s=>sessionStorage.setItem('cast-seed',JSON.stringify(s)),save);await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
    await page.evaluate(async()=>{__AN_HOA__.audio.configure({readDialogue:false});__AN_HOA__.explore.setRandom(false);const w=__storyWorld;w.advanceGuards=()=>[];w.caughtGuard=()=>null;const item=w.interactives.find(i=>i.kind==='village-event');if(!item)throw Error('Missing story event');w.hero.root.position.set(item.x,item.y??w.heightAt(item.x,item.z),item.z);__AN_HOA__.advance(.1);__AN_HOA__.explore.interact('village-event',item.id);await w.charactersReady();__AN_HOA__.advance(0);});
    assert.equal((await page.evaluate(()=>__AN_HOA__.adventure())).phase,'dialog');let sawThought=false;
    for(let i=0;i<45;i++){
     const result=await page.evaluate(()=>{const s=window.__visibleSpeaker,w=__storyWorld,p=w.hero.root.position;let actor=null;if(s?.sceneCharacter)w.scene.traverse(o=>{if(!actor&&o.userData.storyCharacterId===s.id)actor=o;});const a=actor?.userData.villager;return {speaker:s,actor:a&&{id:a.id,village:a.village,coat:a.coat,hair:a.hair,female:a.female,age:a.age,height:a.height},visible:actor?.visible,distance:actor?actor.getWorldPosition(p.clone()).distanceTo(p):null,dialogue:__AN_HOA__.adventure().dialogue};});
     await page.waitForFunction(()=>document.querySelector('#dialogPortrait .model-portrait')?.dataset.modelReady==='true');
     if(result.speaker.sceneCharacter){assert.ok(result.actor,result.speaker.name+' has a scene actor');assert.ok(result.visible);for(const name of ['id','village','coat','hair','female','age','height'])assert.equal(result.actor[name],result.speaker.appearance[name],result.speaker.name+' '+name);assert.ok(result.distance<13,'Speaker stays in the scene');}
     if(result.speaker.thought){sawThought=true;assert.equal(await page.locator('#dialogPortrait .model-portrait').getAttribute('data-portrait-kind'),'hero');assert.match(await page.locator('#dialogSpeakerName').innerText(),/Suy nghĩ nội tâm|Lữ Khách/);}
     if(i===0||result.speaker.thought&&key==='wood:1'){await page.evaluate(()=>__AN_HOA__.advance(0));await page.screenshot({path:out+'/'+(mobile?'mobile-':'desktop-')+key.replace(':','-')+(result.speaker.thought?'-thought':'')+'.png'});}
     if(result.dialogue.complete)break;await page.locator('#dialogNext').click();
    }
    if(key==='wood:1'||key==='dark:8')assert.ok(sawThought);if(key==='dark:8')assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().villageStory.visible),false);
    const expected=await page.evaluate(()=>__AN_HOA__.adventure().villageStory.cast.length);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().dialogue.active),false);assert.ok(await page.evaluate(n=>__AN_HOA__.adventure().villageStory.cast.length<=n,expected));
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: real desktop/touch story conversations, visible loaded speakers match portraits, Linh Chi/refugee/commander actors, hero inner thoughts, private confession and dialogue cleanup.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:e.message,errors,state:await page?.evaluate(()=>__AN_HOA__?.adventure()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
