const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
  await fs.mkdir('test-results/adventure',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const url='file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1';
    const click=id=>page.locator('#'+id).click(),state=()=>page.evaluate(()=>__AN_HOA__.adventure()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    const walk=async(kind)=>{await page.evaluate(k=>__AN_HOA__.explore.interact(k),kind);await advance(15);};
    const dialog=async text=>page.locator('#dialogActions button').filter({hasText:text}).click();
    await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));
    assert.deepEqual(errors,[]);await advance(.5);await page.screenshot({path:'test-results/adventure/home.png'});
    await page.locator('#heroName').fill('Hắc Vũ');await page.locator('[data-coat="#693f40"]').click();await page.locator('#heroForm button[type=submit]').click();await advance(.5);
    let s=await state();assert.equal(s.phase,'explore');assert.equal(s.save.hero.name,'Hắc Vũ');assert.equal(s.save.checkpoint,'nameless');assert.equal(s.save.hero.coat,'#693f40');
    await page.screenshot({path:'test-results/adventure/nameless.png'});
    // Exercise raycasting through an actual canvas click rather than teleporting.
    const point=await page.evaluate(()=>__AN_HOA__.explore.project(5,7));await page.mouse.click(point.left,point.top);await advance(3);s=await state();assert.ok(Math.abs(s.position[0]-5)<.1);assert.ok(Math.abs(s.position[1]-7)<.1);
    await walk('npc');assert.equal((await state()).phase,'dialog');await dialog('Nhận nhiệm vụ');assert.equal((await state()).save.quests.nameless,1);
    await walk('quest');assert.equal((await state()).encounter.kind,'quest');await dialog('Chuẩn bị');assert.equal((await state()).phase,'loadout');
    await click('startButton');assert.equal((await state()).phase,'combat');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await page.evaluate(()=>__AN_HOA__.setHealth('enemy',6));await page.keyboard.press('Space');await advance(2);
    assert.equal(await page.evaluate(()=>__AN_HOA__.state().won),true);assert.equal(await page.evaluate(()=>__AN_HOA__.state().enemyHealth),0);await page.screenshot({path:'test-results/adventure/victory.png'});
    await click('nextButton');s=await state();assert.equal(s.phase,'explore');assert.equal(s.save.quests.nameless,2);assert.equal(s.save.gold,60);await walk('npc');await dialog('Nhận thưởng');assert.equal((await state()).save.quests.nameless,3);assert.equal((await state()).save.gold,100);
    await page.evaluate(()=>__AN_HOA__.explore.offerBattle('random'));await dialog('Chuẩn bị');await page.keyboard.press('Escape');assert.equal((await state()).phase,'explore','Escape cancels preparation without opening another menu');assert.equal((await state()).save.gold,100);
    // Existing completed saves retain their collection and can revisit every map.
    // The full fresh-character campaign is covered by world-journey.cjs.
    await page.evaluate(()=>sessionStorage.setItem('test-migrate-journey','1'));
    await page.addInitScript(()=>{if(!sessionStorage.getItem('test-migrate-journey'))return;sessionStorage.removeItem('test-migrate-journey');const saved=JSON.parse(localStorage.getItem('anhoa-adventure-v1'));saved.bosses=Object.fromEntries(['water','fire','lightning','earth','wind','light','ice','wood'].map(id=>[id,true]));saved.campaign={treatySigned:true,deliveries:['earth','wind','light','ice','wood']};delete saved.learnedSpells;localStorage.setItem('anhoa-adventure-v1',JSON.stringify(saved));});
    await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await click('continueJourney');assert.equal(await page.evaluate(()=>__AN_HOA__.state().learnedSpells.length),45);
    // Every atlas edge must be walkable; activate a second checkpoint first.
    await page.evaluate(()=>__AN_HOA__.explore.travel('fire'));await advance(35);assert.equal((await state()).save.village,'fire');await walk('save');assert.equal((await state()).save.checkpoint,'fire');
    await click('openAtlas');assert.equal(await page.locator('[data-region]').count(),10);await page.screenshot({path:'test-results/adventure/atlas.png'});await click('closeAtlas');
    await page.evaluate(()=>__AN_HOA__.explore.travel('water'));await advance(35);assert.equal((await state()).save.village,'water');await page.screenshot({path:'test-results/adventure/water.png'});
    await page.evaluate(()=>__AN_HOA__.explore.offerBattle('random'));await dialog('Chuẩn bị');await click('startButton');await page.evaluate(()=>{__AN_HOA__.setHealth('player',1);__AN_HOA__.launchEnemy('fire-volley',[0,1.72,6],[0,0,1]);});await advance(2);assert.equal(await page.evaluate(()=>__AN_HOA__.state().won),true);assert.equal(await page.evaluate(()=>__AN_HOA__.state().health),0);await click('nextButton');s=await state();assert.equal(s.save.village,'fire');assert.equal(s.save.checkpoint,'fire');assert.deepEqual(s.position,[0,7]);assert.equal(s.save.gold,100);
    // Persisted character, checkpoint, quest and rewards survive a reload.
    await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await click('continueJourney');s=await state();assert.equal(s.save.hero.name,'Hắc Vũ');assert.equal(s.save.quests.nameless,3);assert.equal(s.save.checkpoint,'fire');
    // Visit all biome maps through their gates, with clear approach paths.
    for(const id of ['earth','ice','wood','dark','light','lightning','nameless','wind']){
      await page.evaluate(id=>__AN_HOA__.explore.travel(id),id);await advance(35);assert.equal((await state()).save.village,id,`gate to ${id}`);await page.screenshot({path:`test-results/adventure/${id}.png`});
    }
    // Random encounters are driven by travel distance, then switch to the same combat.
    await page.evaluate(()=>__AN_HOA__.explore.interact('landmark','windmills'));await advance(35);await dialog('Tiếp tục khám phá');await page.evaluate(()=>{__AN_HOA__.explore.setRandom(true);__AN_HOA__.explore.spawn();});await advance(1);s=await state();assert.ok(s.randomEnemy||s.encounter);await advance(8);assert.equal((await state()).encounter.kind,'random');await dialog('Lùi lại');assert.equal((await state()).phase,'explore');
    // Menus freeze movement and remain usable on a phone viewport.
    await click('openAtlas');const before=(await state()).position;await advance(5);assert.deepEqual((await state()).position,before);await page.setViewportSize({width:390,height:844});await advance(.1);await page.screenshot({path:'test-results/adventure/mobile-atlas.png'});await click('closeAtlas');await advance(.1);await page.screenshot({path:'test-results/adventure/mobile.png'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
    console.log('PASS: character creation, canvas movement, fixed quest/reward, old combat victory and defeat, ten linked biomes, checkpoint respawn, reload, random encounters, atlas pause and mobile layout.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
