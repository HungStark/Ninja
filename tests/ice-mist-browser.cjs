const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/ice-mist';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});let page,checkpoint='load';const errors=[];
 const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),enemy=id=>page.evaluate(id=>__AN_HOA__.launchEnemy(id),id);
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
 const cast=async id=>{await page.keyboard.press('Backspace');for(const k of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(k);assert.equal(await page.locator('#castButton').isDisabled(),false,id+' ready');await page.keyboard.press('Space');};
 try{
  for(const mobile of [false,true]){
   checkpoint=mobile?'Android mist':'web mist';page=await browser.newPage({viewport:mobile?{width:915,height:412}:{width:1280,height:800},hasTouch:mobile});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL/.test(m.text()))errors.push(m.text());});
   await page.goto('file:///'+path.join(process.cwd(),mobile?'android-apk/www/index.html':'index.html').replaceAll('\\','/')+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   await page.evaluate(()=>{document.getElementById('clearLoadout').click();for(const id of ['fire-volley','fire-lance','ice-volley','ice-reflect'])document.querySelector('[data-equip="'+id+'"]').click();document.getElementById('startButton').click();document.getElementById('practiceOpponentConfirm').click();__AN_HOA__.setAIEnabled(false);});
   if(mobile)await page.evaluate(()=>__AN_HOA__.aimAt([12,5,-10]));const freeYaw=(await state()).yaw;await enemy('ice-reflect');await advance(3);await enemy('ice-volley');await advance(.5);let s=await state(),fog=s.natureArt.fogs[0];assert.equal(s.enemyVisible,false);assert.equal(fog.decoyVisible,true);assert.deepEqual({...fog.field,height:0},{minX:-16,maxX:16,minZ:-26,maxZ:-7,height:0});assert.ok(fog.field.height>=1.4&&fog.field.height<=1.6);assert.ok(Math.abs(s.enemyPerceivedPosition[0]-s.enemyPosition[0])>4);
   if(mobile){
    checkpoint='Android pin-and-attack chooses illusion';const target=s.enemyPerceivedPosition,origin=s.playerPosition;near(s.yaw,freeYaw);assert.ok(Math.abs(s.yaw-Math.atan2(-(target[0]-origin[0]),-(target[2]-origin[2])))>.1,'aim stays manual until pin-and-attack is pressed');
    const tap=()=>page.locator('[data-spell="0"] .spell-picture').tap();await tap();await tap();const pose=(await state()).handPose;for(let i=0;i<3;i++)await tap();s=await state();assert.deepEqual(s.sequence,['q','w']);assert.deepEqual(s.handPose,pose);assert.equal(s.activePose,1);assert.equal(s.casts,0);const hp=s.enemyHealth;
    await page.locator('#castButton').tap();s=await state();near(s.yaw,Math.atan2(-(target[0]-origin[0]),-(target[2]-origin[2])));assert.equal(s.casts,1);assert.equal(s.projectiles.filter(p=>p.owner==='player').length,3);for(const shot of s.projectiles.filter(p=>p.owner==='player'))near(shot.target[0],target[0]);await advance(2);assert.equal((await state()).enemyHealth,hp,'pin-and-attack fires at the decoy, leaving the real enemy unharmed');
   }else{await page.evaluate(()=>__AN_HOA__.aimAt(__AN_HOA__.state().enemyPerceivedPosition));await advance(.001);}
   await page.screenshot({path:out+'/'+(mobile?'android':'web')+'-enemy-field.png'});
   const held=(await state()).natureArt.fogs,heldYaw=(await state()).yaw;await page.keyboard.press('Escape');await advance(2);assert.deepEqual((await state()).natureArt.fogs,held);await page.locator('#resumeButton').evaluate(b=>b.click());await advance(6);s=await state();assert.equal(s.natureArt.fogs.length,0);assert.equal(s.enemyVisible,true);near(s.yaw,heldYaw);
   checkpoint='player field and expiry';await cast('ice-reflect');await advance(3);await cast('ice-volley');await advance(.6);s=await state();fog=s.natureArt.fogs[0];assert.equal(s.natureArt.hidden.player,true);assert.equal(fog.owner,'player');assert.deepEqual(fog.field,{minX:-16,maxX:16,minZ:-7,maxZ:12,height:1.6});assert.deepEqual(fog.coverPosition,[0,0,0]);
   await page.screenshot({path:out+'/'+(mobile?'android':'web')+'-player-field.png'});await advance(5);assert.equal((await state()).natureArt.hidden.player,false);assert.deepEqual(errors,[]);await page.close();
  }
  await Promise.all(['failure.png','failure.json'].map(name=>fs.unlink(out+'/'+name).catch(e=>{if(e.code!=='ENOENT')throw e;})));
  console.log('PASS: web/Android half-arena low mist, hidden real body and visible displaced illusion, pause/expiry cleanup, Android pin-and-attack and projectiles target the decoy, repeated completed seal taps keep the recipe.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:e.message,errors,state:await state().catch(()=>null)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
