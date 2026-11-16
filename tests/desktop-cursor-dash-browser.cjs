const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/desktop-cursor-dash';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});
 let page,checkpoint='load';const errors=[],report=[];
 const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
 const position=async()=>{await advance(.5);await page.evaluate(()=>{__AN_HOA__.combatTest.position('player',[0,0,5.5]);__AN_HOA__.combatTest.position('primary',[0,0,-10]);__AN_HOA__.advance(.01);});};
 async function start(view){
  page=await browser.newPage({viewport:{width:1400,height:900}});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('anhoa-combat-controls-v1',JSON.stringify({aimAssist:true,movement:'arrows'})));
  await page.goto(pathToFileURL(path.resolve('index.html')).href+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value="'+view+'"]').check();await page.locator('#practiceViewConfirm').click();
  await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',100000);__AN_HOA__.setHealth('enemy',100000);for(let i=0;i<3&&!/Thấp|Low/.test(__AN_HOA__.state().quality);i++)document.getElementById('qualityButton').click();__AN_HOA__.advance(.01);});
 }
 try{
  await start('overhead');assert.equal((await state()).combatControls.effectiveMovement,'mouse','old arrow preference must migrate');
  checkpoint='settings';assert.equal(await page.locator('#combatMovementMode').count(),0);assert.equal(await page.locator('#combatSettings').count(),0);
  for(const aimAssist of [true,false]){
   await page.locator('#beginnerAimAssist').setChecked(aimAssist);
   for(const point of [[8,0,5.5],[-8,0,5.5],[8,0,9],[-8,0,2]]){
    checkpoint='dash '+JSON.stringify({aimAssist,point});await position();
    const screen=await page.evaluate(p=>__AN_HOA__.screenPoint(p),point);await page.mouse.move(screen.x,screen.y);await advance(.1);
    const before=await state(),from=before.position,cursor=before.practiceOverhead.movementCursor;
    assert.ok(Math.hypot(cursor[0]-point[0],cursor[2]-point[2])<.15,'cursor projected onto ground within one screen pixel');
    if(aimAssist)assert.ok(Math.abs(before.practiceOverhead.cursor[2]+10)<.01,'spell aim stays locked on opponent');
    await page.keyboard.press('g');const launched=await state(),goal=launched.practiceOverhead.moveTarget;
    assert.ok(goal,'G must start a dash');assert.equal(launched.chakra,before.chakra-5);assert.equal(launched.dashBoost.cooldown,.5);
    const dx=cursor[0]-from[0],dz=cursor[2]-from[2],length=Math.hypot(dx,dz);
    assert.ok(Math.abs(goal[0]-from[0]-dx/length*5)<.02&&Math.abs(goal[2]-from[2]-dz/length*5)<.02,'dash goal follows mouse, independent of auto aim');
    await advance(.14);const after=await state();assert.ok(Math.hypot(after.position[0]-goal[0],after.position[2]-goal[2])<.02,'character reaches the cursor-directed goal');
    report.push({aimAssist,cursor,from,to:after.position});
   }
  }
  checkpoint='mouse-only walking';await position();let before=(await state()).position;await page.keyboard.down('ArrowRight');await advance(.4);await page.keyboard.up('ArrowRight');assert.deepEqual((await state()).position,before);
  const screen=await page.evaluate(()=>__AN_HOA__.screenPoint([6,0,5.5]));await page.mouse.click(screen.x,screen.y,{button:'right'});await advance(.4);let after=(await state()).position;assert.ok(Math.abs(after[0]-before[0]-1.5)<.02,'right click walks at existing speed');
  await page.close();await start('first-person');checkpoint='first-person unchanged';assert.equal((await state()).combatControls.effectiveMovement,'arrows');await position();before=(await state()).position;await page.keyboard.down('ArrowRight');await advance(.4);await page.keyboard.up('ArrowRight');after=(await state()).position;assert.ok(Math.abs(Math.hypot(after[0]-before[0],after[2]-before[2])-1.5)<.02);
  await position();before=(await state()).position;await page.keyboard.down('ArrowRight');await page.keyboard.press('g');await page.keyboard.up('ArrowRight');await advance(.14);after=(await state()).position;assert.ok(Math.abs(Math.hypot(after[0]-before[0],after[2]-before[2])-5)<.02,'first-person directional dash still works');
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS: actual local index.html, eight cursor-directed third-person dashes with aim assist on/off, saved arrows migrate to mouse, no movement selector, third-person arrows ignored, right-click walking and first-person arrows/dash preserved.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,error:e.message,errors,state:await state().catch(()=>null)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
