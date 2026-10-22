const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
  const {newJourney}=await import('../src/adventure-data.js'),{createAdventureScene}=await import('../src/adventure-scene.js'),{promiseMother,villageSidequests,acceptSidequest}=await import('../src/journey-story.js');
  global.innerWidth=1440;global.innerHeight=960;
  const world=createAdventureScene(),save=newJourney();world.load(save.village,save);
  world.moveHero(.3,.2);const standing=world.hero.root.position.toArray();promiseMother(save);
  world.load(save.village,save,{preserveHero:true});assert.deepEqual(world.hero.root.position.toArray(),standing,'progress refresh preserves actual position instead of stale save');
  world.jump();world.update(.1,.1,true);const airborne=world.hero.root.position.toArray(),physics=world.physicsState();
  world.load(save.village,save,{preserveHero:true});assert.deepEqual(world.hero.root.position.toArray(),airborne);assert.equal(world.physicsState().grounded,physics.grounded);assert.equal(world.physicsState().verticalSpeed,physics.verticalSpeed);
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url='file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1',state=()=>page.evaluate(()=>__AN_HOA__.adventure());
  await page.addInitScript(()=>{const save=sessionStorage.getItem('position-fixture');if(save){localStorage.setItem('anhoa-adventure-v1',save);sessionStorage.removeItem('position-fixture');}});
  async function fixture(save,kind,id){
    world.load(save.village,save);const item=world.interactives.find(i=>i.kind===kind&&(!id||i.id===id)),nav=world.navigationBlocked(item.platform);assert.ok(item);
    const itemHeight=item.y??world.heightAt(item.x,item.z);
    let near;for(let k=0;k<32;k++){const a=k*Math.PI/16,x=item.x+Math.cos(a)*1.1,z=item.z+Math.sin(a)*1.1;if(!nav(x,z)&&Math.abs(world.heightAt(x,z)-itemHeight)<.5){near=[x,z];break;}}
    assert.ok(near,'clear approach to '+kind);save.position=near;save.elevation=itemHeight;save.surface=item.platform||null;
    await page.evaluate(s=>sessionStorage.setItem('position-fixture',JSON.stringify(s)),save);await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));
    await page.keyboard.down('d');await page.evaluate(()=>__AN_HOA__.advance(.025));await page.keyboard.up('d');
    const before=await state();await page.evaluate(([kind,id])=>__AN_HOA__.explore.interact(kind,id),[kind,id]);return before;
  }
  function unchanged(before,after){assert.deepEqual(after.position,before.position);assert.equal(after.height,before.height);assert.equal(after.camera.yaw,before.camera.yaw);}
  try{
    await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');
    let s=newJourney(),before=await fixture(s,'lore','nameless-resident-war-cemetery');assert.equal((await state()).phase,'dialog');
    if(await page.locator('#dialogSkip').isVisible())await page.locator('#dialogSkip').click();await page.locator('#dialogActions button').filter({hasText:'Con hứa'}).click();unchanged(before,await state());assert.equal((await state()).save.story.stage,'chief');
    s=newJourney();promiseMother(s);before=await fixture(s,'npc');if(await page.locator('#dialogSkip').isVisible())await page.locator('#dialogSkip').click();await page.locator('#dialogActions button').filter({hasText:'Học Thủy bộc cầu'}).click();unchanged(before,await state());
    s=newJourney();const q=villageSidequests('nameless').find(q=>q.type==='retrieve');acceptSidequest(s,q);before=await fixture(s,'sidequest-target',q.id);unchanged(before,await state());assert.equal((await state()).save.story.sidequests[q.id],2);
    await page.evaluate(()=>__AN_HOA__.advance(.5));unchanged(before,await state());
    s=(await state()).save;before=await fixture(s,'lore',q.giver);if(await page.locator('#dialogSkip').isVisible())await page.locator('#dialogSkip').click();await page.locator('#dialogActions button').filter({hasText:'Nhận thưởng việc riêng'}).click();await page.locator('#dialogActions button').filter({hasText:'Nhận thưởng'}).click();unchanged(before,await state());assert.equal((await state()).save.story.sidequests[q.id],3);
    assert.deepEqual(errors,[]);console.log('PASS: story refresh preserves standing/airborne physics, mother promise, starter learning, item collection and reward keep exact position, height and heading.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
