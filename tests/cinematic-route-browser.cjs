const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const {build}=require('esbuild');
const {chromium}=require('playwright');

(async()=>{
  const {campaignFixtures}=await import('./campaign-fixtures.mjs');
  const {enableFieldRoute}=await import('../src/field-route.js');
  const fixtures=campaignFixtures(),home=structuredClone(fixtures.homecoming),wind=structuredClone(fixtures['wind:3']);
  enableFieldRoute(wind);
  const instrument={name:'cinematic-route-review',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__sceneReview=createAdventureScene();'),loader:'js'}));}};
  const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[instrument]});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4395'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  const out='test-results/cinematic-route';await fs.mkdir(out,{recursive:true});
  let browser,page;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true});page.setDefaultTimeout(60000);
    const errors=[];page.on('pageerror',e=>errors.push(e.stack));
    await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
    await page.addInitScript(home=>{
      const pending=sessionStorage.getItem('story-review-pending');
      if(pending){localStorage.setItem('anhoa-adventure-v1',pending);sessionStorage.removeItem('story-review-pending');}
      else if(!localStorage.getItem('anhoa-adventure-v1'))localStorage.setItem('anhoa-adventure-v1',JSON.stringify(home));
    },home);
    const ready=async()=>{
      await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();
      await page.waitForFunction(()=>__AN_HOA__.adventure().phase==='explore'&&!__AN_HOA__.adventure().loading);
      await page.evaluate(()=>{__AN_HOA__.audio.configure({readDialogue:false});__AN_HOA__.explore.setRandom(false);});
    };
    const advance=dt=>page.evaluate(dt=>__AN_HOA__.advance(dt),dt);
    const camera=()=>page.evaluate(()=>({shot:__sceneReview.storyCamera.state(),position:__sceneReview.camera.position.toArray(),direction:__sceneReview.camera.quaternion.toArray(),fov:__sceneReview.camera.fov}));
    const until=async(predicate)=>{
      for(let i=0;i<48;i++){
        if(await page.evaluate(predicate))return;
        await advance(1);
      }
      throw Error('Cutscene timeline stalled');
    };
    const storySubtitle=page.locator('#storySubtitle');
    const cutsceneControls=page.locator('#adventure > .cutscene-controls');
    const moveTo=async(kind,id)=>page.evaluate(([kind,id])=>{
      const w=__sceneReview,entry=w.interactives.find(i=>i.kind===kind&&(!id||i.id===id));
      if(!entry)throw Error('Missing '+kind+' '+id);
      w.hero.root.position.set(entry.x,entry.y??w.heightAt(entry.x,entry.z),entry.z);
    },[kind,id]);
    const approach=async id=>{
      const key=await page.evaluate(id=>{
        const w=__sceneReview,entry=w.interactives.find(i=>i.id===id),axes=w.movementAxes();
        for(const [key,axis,sign]of [['w',axes.forward,1],['s',axes.forward,-1],['d',axes.right,1],['a',axes.right,-1]]){
          const x=entry.x-axis[0]*3.15*sign,z=entry.z-axis[1]*3.15*sign;
          if(w.blocked(x,z))continue;
          w.hero.root.position.set(x,w.heroHeightAt(x,z),z);return key;
        }
        throw Error('No approach to '+id);
      },id);
      await page.locator('#world').focus();await page.keyboard.down(key);await advance(.27);await page.keyboard.up(key);
    };
    async function checkReveals(){
      const enterEvent=async(key,size)=>{
        await page.evaluate(save=>sessionStorage.setItem('story-review-pending',JSON.stringify(save)),fixtures[key]);
        await page.setViewportSize(size);
        await page.reload();await ready();await moveTo('village-event');await advance(.1);
        await page.evaluate(()=>__AN_HOA__.explore.interact('village-event'));
      };
      const countSpeech=()=>page.evaluate(()=>__AN_HOA__.audio.state().stats.dialogueLines);
      const deck=()=>page.evaluate(()=>{
        const ship=__sceneReview.scene.getObjectByName('ice-capture-boat');
        return ship?{distance:ship.position.z,tiger:!!ship.getObjectByName('captive-ice-tiger'),visible:ship.visible}:null;
      });
      console.log('CHECK Water device and silent reaction before the memory');
      await enterEvent('water:7',{width:1280,height:800});
      const device=await camera(),speech=await countSpeech();
      assert.equal(device.shot.shot,'insert');assert.equal(device.shot.subject,'water-chakra-device');
      assert.equal(await storySubtitle.isVisible(),false);
      assert.equal(await page.locator('#journeyDialog').isVisible(),false);
      await advance(.65);assert.deepEqual(await camera(),device);assert.equal(await countSpeech(),speech);
      await page.screenshot({path:out+'/water-device-insert.png'});
      await advance(1.05);const face=await camera();
      assert.equal(face.shot.shot,'thought');assert.equal(face.shot.cut,device.shot.cut+1);
      assert.notDeepEqual(face.position,device.position);assert.notDeepEqual(face.direction,device.direction);
      assert.equal(await storySubtitle.isVisible(),false);assert.equal(await countSpeech(),speech);
      await advance(.7);assert.match(await storySubtitle.textContent(),/Thiết bị này.*kiếp trước/);
      assert.deepEqual((await camera()).position,face.position);assert.equal(await countSpeech(),speech+1);
      await page.screenshot({path:out+'/water-device-memory.png'});
      await until(()=>__AN_HOA__.adventure().phase==='explore');
      assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().save.story.villageEvents.water),8);

      console.log('CHECK Ice capture boat, silent reaction, and handoff');
      await enterEvent('ice:7',{width:915,height:412});
      assert.equal((await deck()).visible,false);
      await until(()=>__sceneReview.storyCamera.state()?.shot==='insert');
      const ship=await deck(),boatShot=await camera();
      assert.ok(ship.tiger&&ship.visible);assert.equal(boatShot.shot.subject,'ice-capture-boat');
      assert.match(await storySubtitle.textContent(),/Phong ấn siết chặt/);
      await advance(.7);assert.ok((await deck()).distance>ship.distance+.7);
      assert.deepEqual(await camera(),boatShot);
      await page.screenshot({path:out+'/ice-capture-insert.png'});
      for(let i=0;i<32&&(await camera()).shot.shot!=='thought';i++)await advance(.25);
      const thought=await camera();assert.equal(thought.shot.shot,'thought');assert.equal(thought.shot.cut,boatShot.shot.cut+1);
      assert.equal(await storySubtitle.isVisible(),false);
      await advance(.8);assert.match(await storySubtitle.textContent(),/Kiếp trước Hạ Ly không bị giam/);
      assert.deepEqual((await camera()).position,thought.position);
      await page.screenshot({path:out+'/ice-capture-memory.png'});
      await until(()=>__AN_HOA__.adventure().phase==='explore');
      assert.equal(await deck(),null);
      assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().save.story.villageEvents.ice),8);
      assert.deepEqual(errors,[]);
      console.log('PASS: both inserts, hard cuts, silent beats, thoughts, cast cleanup and automatic quest handoff.');
    }
    await page.goto('http://127.0.0.1:4395/?test=1&adventure=1');await ready();
    if(process.argv.includes('--reveals')){await checkReveals();return;}
    console.log('CHECK ordinary dialogue keeps the camera');
    await moveTo('lore','nameless-trac');
    await advance(.45);const playCamera=await camera();
    await page.evaluate(()=>__AN_HOA__.explore.interact('lore','nameless-trac'));await advance(.15);
    assert.deepEqual(await camera(),playCamera);assert.equal(await page.locator('#journeyDialog.story-shot').count(),0);
    assert.ok((await page.locator('.journey-dialog-card').boundingBox()).height<190);
    await page.keyboard.press('Escape');
    console.log('CHECK approach, reverse shot, side-quest handoff and patrols');
    await approach('nameless-resident-tea-road');
    await storySubtitle.waitFor();await advance(.3);
    assert.equal((await camera()).shot.speaker,'nameless-resident-tea-road');
    assert.equal((await camera()).shot.shot,'wide');
    assert.equal(await page.locator('.journey-dialog-card').isVisible(),false);
    assert.match(await storySubtitle.textContent(),/^[^:]+: \S/);
    assert.equal(await page.getByRole('button',{name:'Giúp một tay',exact:true}).isVisible(),false);
    const wide=await camera();await advance(.4);assert.deepEqual(await camera(),wide);
    assert.ok(await page.evaluate(()=>__sceneReview.hero.root.userData.storyActing?.nod>0));
    for(let i=0;i<40&&(await camera()).shot.cut===wide.shot.cut;i++)await advance(1/60);
    const single=await camera();assert.equal(single.shot.shot,'single');assert.equal(single.shot.cut,wide.shot.cut+1);
    assert.notDeepEqual(single.position,wide.position);assert.notDeepEqual(single.direction,wide.direction);assert.notEqual(single.fov,wide.fov);
    await advance(.1);assert.deepEqual(await camera(),single);
    await cutsceneControls.getByRole('button',{name:'Tiếp tục',exact:true}).click();
    const reverse=await camera();assert.equal(reverse.shot.speaker,'hero');assert.equal(reverse.shot.cut,single.shot.cut+1);
    await page.screenshot({path:out+'/tea-road.png'});
    await cutsceneControls.getByRole('button',{name:'Bỏ qua',exact:true}).click();
    assert.equal(await storySubtitle.isVisible(),false);
    assert.equal(await cutsceneControls.isVisible(),false);
    await page.getByRole('button',{name:'Giúp một tay',exact:true}).click();await advance(.6);
    assert.equal((await camera()).shot,null);
    assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().save.story.cinematicSides.nameless.step),0);
    assert.ok(await page.evaluate(()=>__sceneReview.sideRoute.state().started),'the resident starts the escort as the scene ends');
    assert.ok(await page.evaluate(()=>__sceneReview.sideRoute.state().end));
    assert.ok(await page.evaluate(()=>__sceneReview.patrolState().length>=2));
    await page.reload();await ready();assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().save.story.cinematicSides.nameless.step),0);
    console.log('CHECK guardian cutscene before and after combat');
    await page.evaluate(save=>sessionStorage.setItem('story-review-pending',JSON.stringify(save)),wind);
    await page.setViewportSize({width:915,height:412});
    await page.reload();await ready();await moveTo('village-event');await advance(.8);
    await page.evaluate(()=>__AN_HOA__.explore.interact('village-event'));await advance(.25);
    assert.ok((await camera()).shot?.speaker.startsWith('scene-guardian-'));
    await advance(.55);
    const subtitle=await storySubtitle.boundingBox();assert.ok(subtitle.y>300&&subtitle.y+subtitle.height<=412&&subtitle.height<82);
    await page.screenshot({path:out+'/wind-eagle-before.png'});
    await until(()=>__AN_HOA__.adventure().dialogue.complete);await page.locator('#dialogActions button').first().click();
    await page.locator('#startButton').click();await page.waitForFunction(()=>__AN_HOA__.state().started&&(!__AN_HOA__.state().battleIntro.active||__AN_HOA__.state().battleIntro.loaded));await advance(2.3);
    await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('enemy',0);});await advance(.3);
    await page.locator('#nextButton').click();await storySubtitle.waitFor();await advance(.3);
    assert.match(await storySubtitle.textContent(),/Gió đã trở lại/);
    await page.screenshot({path:out+'/wind-eagle-after.png'});
    await until(()=>__AN_HOA__.adventure().phase==='explore');
    assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().phase),'explore');
    assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().save.story.villageEvents.wind),4);
    assert.deepEqual(errors,[]);
    console.log('PASS: proactive speech, scene-only shots, side handoff, patrols, and both ends of a guardian battle.');
    await checkReveals();
  }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
