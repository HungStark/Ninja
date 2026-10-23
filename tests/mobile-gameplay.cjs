const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');

(async()=>{
  const out='test-results/mobile-gameplay';await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url='file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/');
  const state=()=>page.evaluate(()=>__AN_HOA__.state()),journey=()=>page.evaluate(()=>__AN_HOA__.adventure()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
  const client=await page.context().newCDPSession(page);
  const touch=(type,points=[])=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points});
  let checkpoint='mobile web controls';
  try{
    await page.goto(url+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#heroForm button[type=submit]').tap();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await advance(.01);
    assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('android-ui')));
    const pad=await page.locator('#androidJoystick').boundingBox(),jump=await page.locator('[data-mobile-key=" "]').boundingBox(),e=await page.locator('[data-mobile-key="e"]').boundingBox(),c=await page.locator('[data-mobile-key="c"]').boundingBox();
    assert.ok(pad.x<915/2&&jump.x>915/2);assert.ok(Math.abs(pad.width-118.45)<.1,'joystick is 15% larger');
    assert.ok(jump.width>e.width&&jump.height===jump.width);assert.ok(e.x>jump.x+jump.width&&e.x===c.x&&c.y+c.height<e.y);
    assert.equal(await page.locator('.android-explore-actions button').count(),3);
    assert.equal(await page.locator('#campaignToggle').getAttribute('aria-expanded'),'false');
    const story=await page.locator('#campaignToggle').boundingBox(),journal=await page.locator('#openJournal').boundingBox();assert.ok(story.x+story.width<journal.x+1);
    await page.locator('#campaignToggle').tap();const panel=await page.locator('#campaignContent').boundingBox();assert.ok(panel.y>=story.y+story.height&&412-panel.y-panel.height<15);
    await page.screenshot({path:out+'/explore-story.png'});await page.locator('#campaignToggle').tap();
    checkpoint='sprint gesture and cancellation';
    const center={x:pad.x+pad.width/2,y:pad.y+pad.height/2,id:1},high={...center,y:center.y-pad.height*.8};
    const run=async()=>{await touch('touchStart',[center]);await touch('touchMove',[high]);const target=await page.locator('#androidSprintLock').boundingBox();await touch('touchMove',[{...center,y:target.y-18}]);await advance(.15);assert.equal((await journey()).sprinting,true);await touch('touchEnd');assert.equal((await journey()).sprinting,true);assert.deepEqual((await journey()).input.held,[]);};
    await run();const before=(await journey()).position;await advance(.1);assert.ok(Math.hypot(...(await journey()).position.map((v,i)=>v-before[i]))>.6,'locked run keeps moving after release');
    await touch('touchStart',[center]);await touch('touchEnd');assert.equal((await journey()).sprinting,false);const stopped=(await journey()).position;await advance(.1);assert.deepEqual((await journey()).position,stopped);
    await run();await page.locator('[data-mobile-key="c"]').tap();assert.equal((await journey()).phase,'progression');assert.equal((await journey()).sprinting,false);await page.locator('#closeProgression').tap();await advance(.01);
    await touch('touchStart',[center]);await touch('touchMove',[high]);await touch('touchCancel');assert.equal((await journey()).sprinting,false);
    await page.screenshot({path:out+'/explore-controls.png'});
    for(const [width,height] of [[568,320],[540,405],[844,390]]){
      await page.setViewportSize({width,height});await advance(.01);
      const bounds=await page.locator('#androidJoystick,.android-explore-actions,.journey-top nav').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};}));
      assert.ok(bounds.every(r=>r.left>=0&&r.top>=0&&r.right<=width&&r.bottom<=height),JSON.stringify(bounds));
      await page.locator('#campaignToggle').tap();const r=await page.locator('#campaignContent').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width&&r.y+r.height<=height&&height-r.y-r.height<15);
      const j=await page.locator('#androidJoystick').boundingBox(),x=Math.max(r.x,j.x)+5,y=Math.max(r.y,j.y)+10;
      if(x<Math.min(r.x+r.width,j.x+j.width)&&y<Math.min(r.y+r.height,j.y+j.height))assert.ok(await page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('#campaignContent'),{x,y}),'quest overlays touch controls');
      await page.screenshot({path:out+'/explore-'+width+'.png'});await page.locator('#campaignToggle').tap();
    }
    await page.setViewportSize({width:915,height:412});
    checkpoint='combat retention and automatic targeting';
    await page.goto(url+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.evaluate(()=>{document.getElementById('clearLoadout').click();for(const id of ['wind-orb','fire-volley'])document.querySelector('[data-equip="'+id+'"]').click();document.getElementById('startButton').click();__AN_HOA__.setAIEnabled(false);});
    await advance(.01);
    const recipe=await page.evaluate(()=>SealGameCore.spells.find(s=>s.id==='wind-orb').sequence);assert.equal(recipe.length,3);
    for(const k of recipe.slice(0,2))await page.locator('[data-touch-seal="'+k+'"]').tap();
    await page.locator('#castButton').tap();assert.equal((await state()).shurikenThrows,1);assert.deepEqual((await state()).sequence,recipe.slice(0,2));
    await advance(30);assert.deepEqual((await state()).sequence,recipe.slice(0,2));
    const aimed=async()=>{const s=await state(),delta=s.enemyPosition.map((v,i)=>v-s.playerPosition[i]),len=Math.hypot(...delta),dir=[-Math.sin(s.yaw)*Math.cos(s.pitch),Math.sin(s.pitch),-Math.cos(s.yaw)*Math.cos(s.pitch)];assert.ok(dir.reduce((n,v,i)=>n+v*delta[i]/len,0)>.99999);};
    await page.evaluate(()=>__AN_HOA__.aimAt([30,10,20]));await advance(.1);await aimed();await page.locator('#androidStepRight').tap();await advance(.2);await aimed();
    for(const id of ['water-lance','ice-lance','wind-volley','water-volley']){
      if(id==='ice-lance'){await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-reflect'));await advance(4);}
      await page.evaluate(id=>{const p=__AN_HOA__.state().playerPosition;__AN_HOA__.launchEnemy(id,[p[0],p[1],p[2]-2],[0,0,1]);},id);
      let controlled=false;
      for(let i=0;i<180;i++){await advance(1/60);assert.deepEqual((await state()).sequence,recipe.slice(0,2),id+' preserves partial seals');if((await state()).controlTime>0){controlled=true;break;}}
      assert.ok(controlled,id+' applies control');const blocked=await state();await page.locator('[data-touch-seal="'+recipe[2]+'"]').tap();assert.deepEqual((await state()).sequence,blocked.sequence);
      await advance(5);assert.equal((await state()).controlTime,0);assert.deepEqual((await state()).sequence,recipe.slice(0,2));
    }
    await page.locator('[data-touch-seal="'+recipe[2]+'"]').tap();await page.locator('#castButton').tap();assert.equal((await state()).casts,1);assert.deepEqual((await state()).sequence,[]);
    await page.screenshot({path:out+'/combat.png'});assert.deepEqual(errors,[]);
    console.log('PASS: mobile web layout, story overlay, 15% larger left joystick, three right actions, drag/release sprint lock, cancellation, automatic aim, shuriken/timeout/control seal retention and resumed casting.');
  }catch(error){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});error.message=checkpoint+': '+error.message;throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
