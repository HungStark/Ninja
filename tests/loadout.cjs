const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 await fs.mkdir('test-results/loadout',{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const click=id=>page.evaluate(id=>document.getElementById(id).click(),id),state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
  const filter=v=>page.locator(`[data-kind="${v}"]`).click(),element=v=>page.locator(`[data-element="${v}"]`).click();
  const ready=async()=>{await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.waitForFunction(()=>document.querySelector('.scroll-book').classList.contains('is-open'));};
  await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');await ready();await click('soundButton');
  assert.equal((await state()).learnedSpells.length,45);assert.equal(await page.locator('#loadoutBalance').count(),0);assert.equal(await page.getByRole('button',{name:'B\u1ecf h\u1ebft',exact:true}).count(),1);
  for(const text of await page.locator('#spellCatalog .spell-title small').allTextContents()){assert.doesNotMatch(text,/C\u1ea4P|\d+\s*\u1ea4N/u);assert.match(text,/H\u1ed2I CHI\u00caU/);}
  assert.ok(await page.locator('#spellCatalog .spell-sequence kbd').count()>0);
  await click('clearLoadout');assert.equal(await page.locator('#startButton').isDisabled(),true);await filter('learned');assert.equal(await page.locator('[data-equip]').count(),45);await filter('unlearned');assert.equal(await page.locator('[data-equip]').count(),0);assert.equal(await page.locator('.catalog-empty').count(),1);
  for(const id of await page.evaluate(()=>SealGameCore.elements.map(e=>e.id))){
   await element(id);assert.equal(await page.locator('#selectElementLoadout').isVisible(),true);await click('selectElementLoadout');const expected=await page.evaluate(id=>SealGameCore.spells.filter(s=>s.element===id).map(s=>s.id),id);assert.deepEqual((await state()).loadout,expected);assert.equal((await state()).learnedSpells.length,45);assert.equal(await page.locator('[data-equip]').count(),5);
  }
  await element('all');assert.equal(await page.locator('#selectElementLoadout').isVisible(),false);await click('clearLoadout');const defenses=['water-barrier','fire-reflect','lightning-reflect','earth-barrier','ice-barrier'];
  for(const id of defenses)await page.locator(`[data-equip="${id}"]`).click();assert.equal(await page.locator('#startButton').isDisabled(),false);await page.locator('[data-equip="wind-orb"]').click();assert.deepEqual((await state()).loadout,defenses);
  await click('startButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));assert.deepEqual((await state()).equipped,defenses);await page.keyboard.press('Space');await advance(1);assert.equal((await state()).enemyHealth,196);
  await page.keyboard.press('Escape');await click('changeLoadout');await page.reload();await ready();assert.deepEqual((await state()).loadout,defenses);assert.equal(await page.locator('#startButton').isDisabled(),false);assert.equal((await state()).learnedSpells.length,45);
  await page.evaluate(()=>localStorage.setItem('anhoa-learned-spells-v1',JSON.stringify(['fire-volley','water-barrier','fire-volley','unknown'])));await page.reload();await ready();assert.deepEqual((await state()).learnedSpells,['fire-volley','water-barrier']);await filter('learned');assert.equal(await page.locator('[data-equip]').count(),2);await filter('unlearned');assert.equal(await page.locator('[data-equip]').count(),43);await click('clearLoadout');assert.equal((await state()).learnedSpells.length,2);
  await page.evaluate(()=>localStorage.removeItem('anhoa-learned-spells-v1'));await page.reload();await ready();await element('water');await click('selectElementLoadout');await page.screenshot({path:'test-results/loadout/collection-desktop.png'});
  for(const viewport of [{width:390,height:844},{width:390,height:600},{width:320,height:568},{width:900,height:500}]){
   await page.setViewportSize(viewport);await advance(0);const b=await page.locator('#startButton').boundingBox();assert.ok(b.y>=0&&b.y+b.height<=viewport.height);assert.equal(await page.locator('#clearLoadout').isVisible(),true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`test-results/loadout/collection-${viewport.width}x${viewport.height}.png`});
  }
  assert.deepEqual(errors,[]);console.log('PASS: all-defense entry/persistence, 1-5 spell limit, independent learning, all nine bulk replacements, clear-all, metadata, mobile layout and no browser errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
