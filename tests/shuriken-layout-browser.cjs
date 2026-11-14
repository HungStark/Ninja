const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/shuriken-layout';await fs.mkdir(out,{recursive:true});
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'shuriken-test',setup(b){b.onLoad({filter:/[/\\]src[/\\]main\.js$/},async({path})=>{
  const source=(await fs.readFile(path,'utf8')).replace('if(testMode)window.__AN_HOA__.setAIEnabled=enabled=>{testAIDisabled=!enabled;};',`if(testMode){window.__AN_HOA__.setAIEnabled=enabled=>{testAIDisabled=!enabled;};window.__shurikenTest={
   world:adventure.world,fire(owner='player'){const origin=owner==='player'?playerPos():enemyPos(),target=owner==='player'?enemyPos():playerPos();launchShuriken(owner,{speed:24,damage:2,size:.08},origin,vnorm(vsub(target,origin)));},
   move(x,z){opponent.group.position.set(x,0,z);},
   wall(){walls.push({owner:'enemy',hp:1000,life:100,p:[0,0,-5],normal:[0,0,1],width:80,height:12,element:'fire'});},
   reset(){shots.length=walls.length=0;player.hp=enemy.hp=10000;player.autoRestore=enemy.autoRestore=false;camera.p=[0,1.72,12];moveTargetX=0;opponent.group.position.set(0,0,-24);won=false;},
   shots(){return shots.filter(s=>s.style==='shuriken').map(s=>({p:[...s.p],v:[...s.v],target:s.homingTargetId,owner:s.owner}));}
  };}`);
  return {contents:source,loader:'js'};
 });}}]});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4397'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='load';const errors=[];
 try{
  await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.stack));
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.goto('http://127.0.0.1:4397/?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();
  await page.locator('[name=practiceView][value=first-person]').check();await page.locator('#practiceViewConfirm').click();await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
  const advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),shots=()=>page.evaluate(()=>__shurikenTest.shots());
  checkpoint='pursuit';console.log(checkpoint);await page.evaluate(()=>{__shurikenTest.reset();__shurikenTest.fire();});assert.equal((await shots())[0].target,'primary');await advance(.15);
  await page.evaluate(()=>{__shurikenTest.move(10,-24);__AN_HOA__.aimAt([-15,1.72,-24]);});await advance(.15);
  let shot=(await shots())[0];assert.equal(shot.target,'primary');assert.ok(shot.v[0]>0);assert.ok(Math.abs(Math.hypot(...shot.v)-24)<1e-6);
  await page.keyboard.press('Escape');const paused=await shots();await advance(.5);assert.deepEqual(await shots(),paused);await page.locator('#resumeButton').click();await advance(2);assert.equal((await page.evaluate(()=>__AN_HOA__.state())).enemyHealth,9998);
  checkpoint='wall interception';console.log(checkpoint);await page.evaluate(()=>{__shurikenTest.reset();__shurikenTest.wall();__shurikenTest.fire();});await advance(2);assert.equal((await shots()).length,0);assert.equal((await page.evaluate(()=>__AN_HOA__.state())).enemyHealth,10000);
  checkpoint='desktop layout';console.log(checkpoint);
  await page.evaluate(()=>{document.getElementById('practiceHandInset').hidden=false;const potion=document.querySelector('.potion-button');potion.hidden=false;});
  for(const [width,height] of [[1440,900],[1280,720],[1024,600],[960,540],[700,500]]){
   await page.setViewportSize({width,height});
   const layout=await page.evaluate(()=>{
    document.getElementById('practiceHandInset').hidden=false;document.querySelector('.potion-button').hidden=false;
    const stack=document.querySelector('.desktop-battle-stack');stack.scrollTop=0;
    const rects=[...stack.children].map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};});
    return {rects,ammo:getComputedStyle(document.querySelector('.carried-ammo-row')).display,bottom:stack.getBoundingClientRect().bottom};
   });
   assert.equal(layout.ammo,'none');assert.ok(layout.bottom<=height);for(let i=1;i<layout.rects.length;i++)assert.ok(layout.rects[i].top>=layout.rects[i-1].bottom+8,JSON.stringify({width,height,layout}));
  }
  await page.screenshot({path:out+'/desktop-compact.png'});
  checkpoint='chief quests stay retired in existing saves';console.log(checkpoint);
  const {newJourney}=await import('../src/adventure-data.js'),save=newJourney();save.story.stage='infiltrate';save.story.guardianRestored=true;save.quests.nameless=2;
  await page.addInitScript(save=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(save)),save);
  await page.setViewportSize({width:1280,height:800});await page.goto('http://127.0.0.1:4397/?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
  await page.evaluate(()=>{const w=__shurikenTest.world,i=w.interactives.find(i=>i.kind==='npc');w.hero.root.position.set(i.x,w.heightAt(i.x,i.z),i.z);__AN_HOA__.explore.interact('npc');});await page.waitForFunction(()=>document.getElementById('dialogTitle')?.textContent==='Đường xa còn đợi');
  assert.ok(!(await page.locator('#journeyDialog').innerText()).includes('Nhận thưởng'));assert.deepEqual(errors,[]);
  console.log('PASS: actual shuriken pursuit, original lock after changing aim, speed, pause, wall collision, compact desktop stacking and retired legacy chief reward.');
 }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});error.message=checkpoint+': '+error.message;throw error;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
