const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/guardian-bosses';await fs.mkdir(out,{recursive:true});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4358'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});page=await browser.newPage({viewport:{width:1100,height:700}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
  await page.goto('http://127.0.0.1:4358/index.html?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  async function begin(id){await page.locator('#startButton').click();await page.locator('[data-practice-type=guardian]').click();await page.locator('[data-practice-guardian='+id+']').click();assert.equal(await page.locator('#practiceGuardianSelected li').count(),3);await page.locator('#practiceOpponentConfirm').click();await page.evaluate(()=>{__AN_HOA__.setAIEnabled(true);__AN_HOA__.setHealth('player',10000);});}
  async function back(){await page.keyboard.press('Escape');await page.locator('#changeLoadout').click();}
  console.log('CHECK: actual Water Prison, attacks, pause and escape');
  await begin('water');await page.evaluate(()=>__AN_HOA__.guardianArt(1));await advance(1.4);let s=await state();assert.ok(s.guardianPhases.prison);assert.ok((await page.locator('#shieldStatus').textContent()).includes('8'));
  await page.keyboard.press('Escape');const frozen=(await state()).guardianPhases;await advance(2);assert.deepEqual((await state()).guardianPhases,frozen);await page.keyboard.press('Enter');
  await page.screenshot({path:out+'/water-prison-game.png'});
  await page.keyboard.press('Space');assert.ok((await state()).guardianPhases.prison.hp<8,'normal attack damages the bubble while trapped');
  for(let i=0;i<10&&(await state()).guardianPhases.prison;i++){await advance(.6);await page.keyboard.press('Space');}assert.equal((await state()).guardianPhases.prison,null);await back();
  console.log('CHECK: real projectiles destroy healing sources');
  await begin('wood');await page.evaluate(()=>__AN_HOA__.guardianArt(1));await advance(.2);await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));s=await state();const spirit=s.guardianPhases.entities.find(e=>e.kind==='spirit');assert.ok(spirit);
  const before=s.enemyHealth;for(let i=0;i<10&&(await state()).guardianPhases.entities.some(e=>e.id===spirit.id);i++){await page.evaluate(p=>__AN_HOA__.aimAt(p),spirit.position);await page.keyboard.press('Space');await advance(1);}
  s=await state();assert.ok(!s.guardianPhases.entities.some(e=>e.id===spirit.id),'shuriken collision destroys the selected spirit');assert.equal(s.enemyHealth,before,'the destructible intercepts the attack');await page.screenshot({path:out+'/wood-spirits-game.png'});await back();
  console.log('CHECK: real projectiles break crystals and create shelter');
  await begin('ice');await page.evaluate(()=>__AN_HOA__.guardianArt(1));await advance(.2);s=await state();const crystal=s.guardianPhases.entities.find(e=>e.kind==='crystal'&&Math.abs(e.position[0])<1);assert.ok(crystal);
  for(let i=0;i<10&&!(await state()).guardianPhases.shelters.length;i++){await page.evaluate(p=>__AN_HOA__.aimAt(p),crystal.position);await page.keyboard.press('Space');await advance(.6);}assert.ok((await state()).guardianPhases.shelters.length);await page.screenshot({path:out+'/ice-shelter-game.png'});assert.deepEqual(errors,[]);
  console.log('PASS: in-game three-skill descriptions, pause, actionable Water Prison, real shuriken/destructible collision, healing-source removal and crystal shelters.');
 }catch(e){await page?.screenshot({path:out+'/integration-failure.png'}).catch(()=>{});await fs.writeFile(out+'/integration-failure.json',JSON.stringify({message:e.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
