const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');

(async()=>{
  const {newJourney}=await import('../src/adventure-data.js');
  const {REGIONS}=await import('../src/adventure-world.js');
  const {createAdventureScene}=await import('../src/adventure-scene.js');
  global.innerWidth=1280;global.innerHeight=800;
  const native=createAdventureScene(),zone=REGIONS.water.zones.find(z=>z.id==='floating-market');
  const fresh=(id,position)=>Object.assign(newJourney(),{village:id,position});
  native.load('water',fresh('water',[0,7]));let edge;
  for(let k=0;k<64&&!edge;k++){
    const angle=k*Math.PI/32,point=offset=>[zone.x+Math.cos(angle)*(zone.radius+offset),zone.z+Math.sin(angle)*(zone.radius+offset)];
    const outside=point(.8),inside=point(-.8);
    if(Array.from({length:17},(_,i)=>point(.8-i*.1)).some(p=>native.blocked(...p)))continue;
    if(native.interactives.some(i=>i.kind!=='landmark'&&Math.hypot(i.x-inside[0],i.z-inside[1])<4))continue;
    edge={outside,inside};
  }
  assert.ok(edge,'there is a clear path across the territory boundary');
  const output='test-results/landmark-introductions';await fs.mkdir(output,{recursive:true});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4358'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('server exited '+code)));});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route('**/favicon.ico',route=>route.fulfill({status:204,body:''}));
    await page.addInitScript(()=>{
      const fixture=sessionStorage.getItem('landmark-fixture');
      if(fixture){localStorage.setItem('anhoa-adventure-v1',fixture);sessionStorage.removeItem('landmark-fixture');}
    });
    await page.goto('http://127.0.0.1:4358/?test=1&adventure=1');
    const ready=()=>page.waitForFunction(()=>document.body.dataset.ready==='true');await ready();
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure());
    const advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    const shown=()=>page.locator('#landmarkIntro').isVisible();
    const fixture=async save=>{
      await page.evaluate(s=>sessionStorage.setItem('landmark-fixture',JSON.stringify(s)),save);
      await page.reload();await ready();await page.locator('#continueJourney').click();
      await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await advance(.01);
      assert.equal((await state()).save.village,save.village);
      assert.ok(Math.hypot((await state()).position[0]-save.position[0],(await state()).position[1]-save.position[1])<.1,'fixture stands at its intended position');
    };
    const move=point=>page.evaluate(point=>__AN_HOA__.explore.moveTo(point),point);
    const noticeText=()=>page.locator('#landmarkIntro').textContent();

    await fixture(fresh('water',edge.outside));assert.equal(await shown(),false);
    console.log('CHECK: crossing the Water landmark boundary');
    assert.ok(!(await state()).save.discoveries.includes('water:'+zone.id));
    await move(edge.inside);
    for(let i=0;i<120&&!await shown();i++)await advance(1/60);
    assert.equal(await shown(),true);assert.ok((await noticeText()).includes(zone.name));assert.ok((await noticeText()).includes(zone.description));
    let s=await state();assert.equal(s.phase,'explore');assert.ok(Math.hypot(s.position[0]-zone.x,s.position[1]-zone.z)>zone.radius-2,'introduction starts at the territory edge, away from the landmark point');
    assert.ok(s.save.discoveries.includes('water:'+zone.id));
    assert.ok(await page.evaluate(id=>JSON.parse(localStorage.getItem('anhoa-adventure-v1')).discoveries.includes(id),'water:'+zone.id));
    assert.equal(await page.locator('#nearbyAction').isVisible(),false);
    await page.screenshot({path:output+'/water-introduction.png'});
    await advance(6.8);assert.equal(await shown(),true);await advance(.25);assert.equal(await shown(),false);
    console.log('CHECK: seven-second expiry and saved first visits');
    await page.keyboard.press('e');assert.equal((await state()).phase,'explore','E does not open a landmark dialog');
    await move(edge.outside);await advance(.5);await move(edge.inside);await advance(.5);assert.equal(await shown(),false,'re-entry does not repeat the introduction');
    await page.reload();await ready();await page.locator('#continueJourney').click();await advance(.1);assert.equal(await shown(),false,'saved visits stay discovered after reload');
    await page.keyboard.press('b');assert.equal(await page.locator('[data-zone="'+zone.id+'"]').evaluate(e=>e.classList.contains('found')),true);await page.keyboard.press('b');

    // The old landmark point also remains passive while normal E actions still work.
    await page.evaluate(()=>__AN_HOA__.explore.interact('landmark','floating-market'));await advance(15);assert.equal((await state()).phase,'explore');
    assert.ok(!(await page.locator('#nearbyAction').textContent()).includes('Tìm hiểu'));
    await fixture(fresh('water',[0,7]));await page.keyboard.press('e');assert.equal((await state()).phase,'checkpoint');

    // Cave territories share XZ coordinates with the outdoors; only the matching map discovers them.
    const cave=REGIONS.earth.zones.find(z=>z.id==='cave-crystals');
    console.log('CHECK: interior territories and overlapping introductions');
    native.load('earth',fresh('earth',[0,7]));let cavePoint;
    for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1],[2,1]])if(!native.blocked(cave.x+dx,cave.z+dz)){cavePoint=[cave.x+dx,cave.z+dz];break;}
    assert.ok(cavePoint);await fixture(fresh('earth',cavePoint));assert.ok(!(await state()).save.discoveries.includes('earth:cave-crystals'));
    const interior=fresh('earth',[12,-40]);interior.interior={id:'earth-cave',returnPosition:[0,-10],returnSurface:null,returnElevation:0};interior.elevation=0;
    await fixture(interior);s=await state();assert.ok(s.save.discoveries.includes('earth:cave-crystals'));assert.ok(s.save.discoveries.includes('earth:great-cave'));
    assert.ok((await noticeText()).includes(REGIONS.earth.zones.find(z=>z.id==='great-cave').name));
    await advance(.5);await page.locator('.landmark-intro-close').click();
    assert.equal(await shown(),true);assert.ok((await noticeText()).includes(cave.name),'closing the current introduction shows the next queued territory');
    await advance(6.8);assert.equal(await shown(),true,'the next introduction receives its full seven seconds');
    await advance(.25);assert.equal(await shown(),false);

    await page.setViewportSize({width:432,height:800});await fixture(fresh('water',edge.inside));
    const bounds=await page.locator('#landmarkIntro').boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.x+bounds.width<=432.5&&bounds.y>=0&&bounds.y+bounds.height<=800,'mobile introduction fits the viewport');
    await page.screenshot({path:output+'/water-mobile.png'});
    await page.keyboard.press('b');await page.keyboard.press('b');await advance(.01);
    await page.locator('.landmark-intro-close').click();assert.equal(await shown(),false,'mobile close button dismisses the introduction immediately');
    await advance(.1);assert.equal(await shown(),false,'a dismissed introduction stays closed');
    assert.equal((await state()).input.focused,true,'movement focus returns to the game');
    assert.ok((await state()).save.discoveries.includes('water:'+zone.id),'closing preserves the discovery');
    await page.keyboard.press('b');await page.locator('[data-journal-group="zones"] > summary').click();await page.locator('[data-zone="floating-market"]').click();await advance(.01);
    assert.equal(await page.locator('#waypointHint').isVisible(),true);
    assert.ok(!(await page.locator('#waypointHint').textContent()).includes('WASD'),'waypoint omits keyboard movement instructions');
    const compact=await page.locator('#waypointHint').boundingBox();assert.ok(compact.width<=130&&compact.height<=55,'portrait waypoint uses a compact card');
    await page.screenshot({path:output+'/waypoint-mobile.png'});

    const phone=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});
    phone.on('pageerror',e=>errors.push(e.stack));phone.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await phone.route('**/favicon.ico',route=>route.fulfill({status:204,body:''}));
    await phone.addInitScript(save=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(save)),fresh('water',edge.inside));
    await phone.goto('http://127.0.0.1:4358/?test=1&adventure=1');await phone.waitForFunction(()=>document.body.dataset.ready==='true');await phone.locator('#continueJourney').click();
    await phone.evaluate(()=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.advance(.01);});
    if(await phone.locator('.landmark-intro-close').isVisible())await phone.locator('.landmark-intro-close').click();
    await phone.locator('#openJournal').click();await phone.locator('[data-journal-group="zones"] > summary').click();await phone.locator('[data-zone="floating-market"]').click();await phone.evaluate(()=>__AN_HOA__.advance(4.6));
    assert.ok(await phone.locator('body').evaluate(e=>e.classList.contains('android-ui')));
    assert.ok(!(await phone.locator('#waypointHint').textContent()).includes('WASD'));
    const phoneBox=await phone.locator('#waypointHint').boundingBox();assert.ok(phoneBox&&phoneBox.width<=230&&phoneBox.height<=50,'Android waypoint shrinks to its contents');
    await phone.screenshot({path:output+'/waypoint-android.png'});await phone.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: territory-edge introductions, seven-second expiry, saved first visits, normal E interactions, interior separation, queued territories, immediate dismissal and mobile close controls.');
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
