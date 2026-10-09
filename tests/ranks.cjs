const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
  const state=()=>page.evaluate(()=>window.__AN_HOA__.state()),advance=s=>page.evaluate(s=>window.__AN_HOA__.advance(s),s),click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
  const seal=async keys=>{for(const key of keys)await page.keyboard.press(key);};
  const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
  for(const [style,rank,count] of [['orb','D',2],['barrier','C',3],['lance','B',4],['reflect','A',5],['volley','S',6]]){
   const card=page.locator('[data-equip="fire-'+style+'"]');assert.equal(await card.locator('kbd').count(),count);assert.ok((await card.textContent()).includes('CẤP '+rank+' · '+count+' ẤN'));
  }
  await click('clearLoadout');for(const id of ['fire-orb','fire-lance','fire-volley','earth-barrier','ice-reflect'])await page.evaluate(id=>document.querySelector('[data-equip="'+id+'"]').click(),id);
  await page.screenshot({path:'test-results/rank-scroll.png'});await click('startButton');
  const s=await state();assert.equal(s.enemyPosition[0],s.gatePosition[0]);assert.equal(s.enemyPosition[2],s.gatePosition[2]);assert.equal(s.position[2]-s.enemyPosition[2],31);
  await page.screenshot({path:'test-results/opponent-under-gate.png'});
  // A short spell can be extended into a long one without an automatic cast or losing the selected formula.
  await page.keyboard.press('3');assert.equal(await page.locator('#comboSlots .combo-slot').count(),6);
  await seal(['q','w']);assert.equal((await state()).casts,0);assert.equal((await state()).chakra,100);assert.equal(await page.locator('#castButton').isEnabled(),true);assert.ok((await page.locator('#comboLabel').textContent()).includes('2 / 6 ẤN'));
  await seal(['c','v','z']);assert.equal(await page.locator('#castButton').isDisabled(),true);await page.keyboard.press('Space');assert.equal((await state()).casts,0);
  await page.screenshot({path:'test-results/rank-six-incomplete.png'});await seal(['x']);assert.equal(await page.locator('#castButton').isEnabled(),true);
  await page.screenshot({path:'test-results/rank-six-ready.png'});await page.keyboard.press('Space');assert.equal((await state()).casts,1);assert.equal((await state()).chakra,44);assert.equal((await state()).shots,3);
  await advance(1.8);assert.equal((await state()).enemyHealth,155,'Strong central projectile reaches opponent under gate');
  await reset();await seal(['q']);assert.equal(await page.locator('#castButton').isDisabled(),true);await seal(['w']);await page.keyboard.press('Space');assert.equal((await state()).casts,1);
  await advance(.9);assert.equal((await state()).enemyHealth,220,'Far opponent cannot be hit before travel time');await advance(.8);assert.equal((await state()).enemyHealth,177);
  await reset();await advance(2.3);assert.ok((await page.locator('#enemyAction').textContent()).includes('1/2'));await advance(.5);assert.ok((await page.locator('#enemyAction').textContent()).includes('2/2'));assert.equal((await state()).aiCasts,0);await advance(.4);assert.equal((await state()).aiCasts,1);
  let observedSix=false;for(let i=0;i<100;i++){await advance(.1);if((await page.locator('#enemyAction').textContent()).includes('/6')){observedSix=true;break;}}
  assert.equal(observedSix,true,'AI uses the same six-seal formula as the player');
  await page.screenshot({path:'test-results/enemy-ranked-seals.png'});assert.deepEqual(errors,[]);
  console.log('PASS ranks/range: opponent at gate, 31m duel; D-S cards with 2-6 seals; chosen long formula preserved at short prefix; no premature/automatic casts; higher damage/cost; travel time and far impacts; AI two- and six-seal casting.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
