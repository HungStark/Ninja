const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/guardian-moba';await fs.mkdir(out,{recursive:true});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4358'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[],checked=[];
  for(const variant of [{url:'index.html',width:1280,height:800,ids:['fire','water','lightning','wind','earth','light','dark','wood','ice']},{url:'index.en.html',width:1280,height:800,ids:['dark']},{url:'android-apk/www/index.html',width:915,height:412,touch:true,ids:['water','wood','ice']}]){
   if(process.argv.includes('--mobile-only')&&!variant.touch)continue;
   if(process.argv.includes('--dark-only')&&variant.touch)continue;
   page=await browser.newPage({viewport:{width:variant.width,height:variant.height},hasTouch:!!variant.touch,isMobile:!!variant.touch});page.on('pageerror',e=>errors.push(e.message));
   await page.goto((variant.touch?pathToFileURL(path.resolve(variant.url)).href:'http://127.0.0.1:4358/'+variant.url)+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
   for(const id of variant.ids){
    if(process.argv.includes('--dark-only')&&id!=='dark')continue;
    await page.locator('#startButton').click();await page.locator('[data-practice-type=guardian]').click();await page.locator('[data-practice-guardian='+id+']').click();assert.equal(await page.locator('#practiceGuardianSelected li').count(),3);await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value=overhead]').check();await page.locator('#practiceViewConfirm').click();
    await page.evaluate(()=>{__AN_HOA__.setAIEnabled(true);__AN_HOA__.setHealth('player',100000);});await advance(.01);assert.equal((await state()).guardianPhases.thirdPerson,true);
    if(variant.touch){assert.equal(await page.locator('#mobileTacticalHUD').isVisible(),true);const pad=await page.locator('#tacticalJoystick').boundingBox(),client=await page.context().newCDPSession(page),before=(await state()).position;await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:pad.x+pad.width/2,y:pad.y+pad.height/2}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:pad.x+pad.width*.8,y:pad.y+pad.height/2}]});await advance(.25);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(Math.hypot((await state()).position[0]-before[0],(await state()).position[2]-before[2])>.1);}
    for(let i=0;i<3;i++){await page.evaluate(i=>__AN_HOA__.guardianArt(i),i);await advance(i===1?1.05:.97);const s=await state();assert.equal(s.cameraView,'practice-overhead');assert.equal(s.guardianPhases.thirdPerson,true);assert.ok(Object.values(s.guardianPhases.offset).every(Number.isFinite));}
    if(id==='dark'){assert.equal(await page.locator('#guardianNightVeil').isVisible(),true);await page.screenshot({path:out+'/dark-'+(variant.touch?'mobile':variant.url.includes('.en')?'en':'vi')+'.png'});}
    if(variant.touch)await page.screenshot({path:out+'/'+id+'-android.png'});
    if(id==='wood'&&!variant.touch){
     await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));let s=await state(),tree=s.guardianPhases.entities.find(e=>e.kind==='tree');assert.ok(tree);const enemyHP=s.enemyHealth;
     const point=await page.evaluate(p=>__AN_HOA__.screenPoint([p[0],1.3,p[2]]),tree.position);await page.mouse.move(point.x,point.y);
     for(let i=0;i<80&&(await state()).guardianPhases.entities.some(e=>e.id===tree.id);i++){await page.keyboard.press('Space');await advance(.8);}
     s=await state();assert.ok(!s.guardianPhases.entities.some(e=>e.id===tree.id),'real player projectiles destroy the ancient tree');assert.equal(s.guardianPhases.stagger,1.5);assert.equal(s.enemyHealth,enemyHP);await page.screenshot({path:out+'/wood-tree-destroyed.png'});
    }
    if(variant.touch){await page.locator('#tacticalSettings').tap();await page.locator('[data-tactical-tab=general]').tap();}else await page.keyboard.press('Escape');const frozen=(await state()).guardianPhases;await advance(2);assert.deepEqual((await state()).guardianPhases,frozen,'pause freezes simulation');await page.locator('#changeLoadout').click();await advance(.01);
    console.log('PASS in-game:',variant.url,id);
    checked.push({url:variant.url,id,touch:!!variant.touch});
   }
   await page.close();page=null;
  }
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/integration'+(process.argv.includes('--mobile-only')?'-mobile':process.argv.includes('--dark-only')?'-dark':'')+'.json',JSON.stringify({checked,skillTriggers:checked.length*3,errors},null,2));console.log('PASS:',checked.length,'third-person encounters,',checked.length*3,'skill triggers; no browser exceptions.');
 }catch(e){await page?.screenshot({path:out+'/integration-failure.png'}).catch(()=>{});await fs.writeFile(out+'/integration-failure.json',JSON.stringify({message:e.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
