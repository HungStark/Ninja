const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
  const out='test-results/mobile-touch';await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:568,height:320},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const client=await page.context().newCDPSession(page),touch=async(type,points=[])=>{await client.send('Input.dispatchTouchEvent',{type,touchPoints:points});await page.waitForTimeout(35);},advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),journey=()=>page.evaluate(()=>__AN_HOA__.adventure());
  const url='file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/');let checkpoint='catalog scrolling';
  async function swipe(selector,down=false){
    const box=await page.locator(selector).boundingBox(),start={x:box.x+box.width*.55,y:box.y+box.height*(down?.25:.75),id:9},distance=Math.min(120,box.height*.5)*(down?1:-1);
    const before=await page.locator(selector).evaluate(el=>el.scrollTop);
    await touch('touchStart',[start]);
    for(let i=1;i<=8;i++){await touch('touchMove',[{...start,y:start.y+distance*i/8}]);await page.waitForTimeout(25);}
    await touch('touchEnd');await page.waitForTimeout(100);
    const after=await page.locator(selector).evaluate(el=>el.scrollTop);assert.ok(down?after<before-5:after>before+5,selector+' native swipe '+before+' -> '+after);
  }
  try{
    await page.goto(url+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#spellCatalog').evaluate(el=>el.scrollTop=0);await swipe('#spellCatalog');await swipe('#spellCatalog',true);
    await page.evaluate(()=>{document.getElementById('clearLoadout').click();for(const id of ['ice-reflect','wood-reflect','light-lance','fire-meteor','wind-reflect'])document.querySelector('[data-equip="'+id+'"]').click();document.getElementById('startButton').click();__AN_HOA__.setAIEnabled(false);});await advance(.01);
    checkpoint='five techniques at every mobile size';
    for(const [width,height] of [[568,320],[667,375],[540,405],[915,412],[480,270]]){
      await page.setViewportSize({width,height});await advance(.01);
      for(const expanded of [false,true]){
        if(await page.locator('#guide').evaluate(el=>el.classList.contains('is-expanded'))!==expanded)await page.locator('#guideToggle').tap();
        await page.locator('#guide').evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>a.finish()));
        const fit=await page.evaluate(()=>{const guide=document.getElementById('guide'),r=guide.getBoundingClientRect(),spells=[...guide.querySelectorAll('.spell')];return {count:spells.length,scroll:guide.scrollHeight-guide.clientHeight,rows:spells.map(el=>{const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height,visible:b.top>=r.top&&b.bottom<=r.bottom+.5,seals:[...el.querySelectorAll('kbd')].every(k=>{const s=k.getBoundingClientRect();return s.width>0&&s.height>0&&s.left>=b.left&&s.right<=b.right+.5&&s.top>=b.top&&s.bottom<=b.bottom+.5;})};})};});
        assert.equal(fit.count,5);assert.ok(fit.scroll<2,JSON.stringify({width,height,expanded,fit}));assert.ok(fit.rows.every(r=>r.visible&&r.height>=20&&(!expanded||r.seals)),JSON.stringify({width,height,expanded,fit}));
        await page.screenshot({path:out+'/guide-'+width+(expanded?'-open':'-closed')+'.png'});
      }
    }
    checkpoint='adventure scrolling';await page.setViewportSize({width:568,height:320});await page.goto(url+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#heroForm button[type=submit]').tap();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await advance(.01);
    await page.locator('#campaignToggle').tap();await swipe('#campaignContent');await swipe('#campaignContent',true);await page.locator('#campaignToggle').tap();
    await page.locator('[data-mobile-key="c"]').tap();await advance(.01);await swipe('#progressionBody');await swipe('#progressionBody',true);await page.locator('#closeProgression').tap();await advance(.01);
    await page.locator('#openJournal').tap();await advance(.01);await swipe('.journal-card');await swipe('.journal-card',true);await page.locator('#closeJournal').tap();await advance(.01);
    checkpoint='jump keeps the other thumb moving';
    const pad=await page.locator('#androidJoystick').boundingBox(),jump=await page.locator('[data-mobile-key=" "]').boundingBox(),center={x:pad.x+pad.width/2,y:pad.y+pad.height/2,id:1},forward={...center,y:pad.y+10},second={x:jump.x+jump.width/2,y:jump.y+jump.height/2,id:2};
    await touch('touchStart',[center]);await touch('touchMove',[forward]);await advance(.05);assert.ok((await journey()).input.held.includes('w'));
    await touch('touchStart',[forward,second]);assert.ok((await journey()).input.held.includes('w'));await advance(.1);assert.equal((await journey()).physics.grounded,false);
    await touch('touchEnd',[second]);assert.ok((await journey()).input.held.includes('w'));const moving=(await journey()).position;await advance(.1);assert.ok(Math.hypot(...(await journey()).position.map((v,i)=>v-moving[i]))>.3);await touch('touchEnd');assert.deepEqual((await journey()).input.held,[]);await advance(1);
    checkpoint='release must land on the sprint target';
    assert.equal(await page.locator('#androidSprintLock').isVisible(),false);
    await touch('touchStart',[center]);await touch('touchMove',[{...center,y:pad.y+2}]);assert.equal(await page.locator('#androidSprintLock').isVisible(),false);
    const gap={...center,y:pad.y-3};await touch('touchMove',[gap]);assert.equal(await page.locator('#androidSprintLock').isVisible(),true);await touch('touchEnd');assert.equal((await journey()).sprinting,false,'release in the gap does not lock sprint');
    await touch('touchStart',[center]);await touch('touchMove',[gap]);const target=await page.locator('#androidSprintLock').boundingBox(),lock={...center,x:target.x+target.width/2,y:target.y+target.height/2};await touch('touchMove',[lock]);assert.ok(await page.locator('#androidSprintLock').evaluate(el=>el.classList.contains('sprint-armed')));await touch('touchEnd');assert.equal((await journey()).sprinting,true);assert.equal(await page.locator('#androidSprintLock').getAttribute('aria-pressed'),'true');
    await page.screenshot({path:out+'/sprint-locked.png'});await page.locator('[data-mobile-key=" "]').tap();assert.equal((await journey()).sprinting,true,'jump also preserves locked running');await advance(.1);assert.equal((await journey()).physics.grounded,false);await page.locator('#androidSprintLock').tap();assert.equal((await journey()).sprinting,false);
    await touch('touchStart',[center]);await touch('touchMove',[gap]);await touch('touchMove',[lock]);await touch('touchMove',[{...lock,x:lock.x+90}]);await touch('touchEnd');assert.equal((await journey()).sprinting,false,'release beside target does not lock sprint');
    assert.deepEqual(errors,[]);console.log('PASS: real up/down touch scrolling, five visible techniques including ten seals at 480–915px, two-finger walk+jump, locked-run jump, explicit sprint target and off-target release.');
  }catch(error){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});error.message=checkpoint+': '+error.message;throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
