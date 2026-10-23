const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
  const output='test-results/locomotion';await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  let page,checkpoint='load';
  try{
    page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const {newJourney}=await import('../src/adventure-data.js'),save=newJourney();save.position=[0,7];
    await page.addInitScript(s=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(s)),save);
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await page.locator('#continueJourney').click();await advance(.3);await page.locator('#campaignToggle').click();
    await page.mouse.move(800,450);await page.mouse.wheel(0,575);await advance(.3);
    const move=async(keys,forward,side,name)=>{
      checkpoint=name;const before=await state(),duration=.5;for(const key of keys)await page.keyboard.down(key);await advance(.25);await page.screenshot({path:`${output}/${name}.png`});await advance(.25);for(const key of keys)await page.keyboard.up(key);const after=await state(),yaw=before.camera.yaw,dx=after.position[0]-before.position[0],dz=after.position[1]-before.position[1],speed=4.6*(forward<0?.75:1),length=Math.hypot(forward,side);
      assert.ok(Math.abs(Math.hypot(dx,dz)-speed*duration)<.015,`${name} travel distance`);
      assert.ok(Math.abs((-Math.sin(yaw)*dx-Math.cos(yaw)*dz)/(speed*duration)-forward/length)<.015,`${name} forward component`);
      assert.ok(Math.abs((Math.cos(yaw)*dx-Math.sin(yaw)*dz)/(speed*duration)-side/length)<.015,`${name} strafe component`);
      assert.ok(Math.abs(after.camera.yaw-yaw)<1e-6);assert.ok(Math.abs(Math.atan2(Math.sin(after.camera.heroYaw-yaw-Math.PI),Math.cos(after.camera.heroYaw-yaw-Math.PI)))<1e-6,'moving sideways/backward preserves facing');
      const motion=after.locomotion;assert.ok(motion.speed>speed*.95);if(forward)assert.equal(Math.sign(motion.forward),Math.sign(forward));else assert.ok(Math.abs(motion.forward)<.02);if(side)assert.equal(Math.sign(motion.side),-Math.sign(side));else assert.ok(Math.abs(motion.side)<.02);
      for(const leg of motion.legs){assert.ok(leg.knee>=0&&leg.knee<.7);assert.ok(Math.abs(leg.hip[0]+leg.knee+leg.ankle)<1e-6,'feet counter-rotate instead of pointing into the ground');}
      if(!forward)assert.ok(motion.legs.some(l=>Math.abs(l.hip[1])>.06),'a strafe steps sideways instead of reusing a forward swing');
      await advance(.6);const stopped=(await state()).locomotion;assert.ok(stopped.speed<.005,'release eases into idle');assert.ok(stopped.legs.every(l=>Math.hypot(...l.hip)<.002&&l.knee<.002));return Math.hypot(dx,dz);
    };
    const forward=await move(['w'],1,0,'forward'),back=await move(['s'],-1,0,'backward');assert.ok(Math.abs(back/forward-.75)<.01);
    await move(['a'],0,-1,'left');await move(['d'],0,1,'right');await move(['s','d'],-1,1,'backward-diagonal');await move(['w','a'],1,-1,'forward-diagonal');
    checkpoint='opposite keys cancel';const idle=(await state()).position;for(const key of ['w','s','a','d'])await page.keyboard.down(key);await advance(.3);for(const key of ['w','s','a','d'])await page.keyboard.up(key);assert.deepEqual((await state()).position,idle);assert.ok((await state()).locomotion.speed<.005);
    await page.mouse.move(800,450);await page.mouse.down({button:'right'});await page.mouse.move(920,450);await page.mouse.up({button:'right'});await advance(.1);
    await move(['ArrowDown'],-1,0,'rotated-backward');await move(['ArrowRight'],0,1,'rotated-right');
    assert.deepEqual(errors,[]);console.log('PASS: directional steps and bent knees, grounded foot angles, 25% slower backsteps/diagonals, normalized diagonal speed, stable heading, rotated-camera movement, opposite-key cancellation and smooth idle.');
  }catch(e){if(page){await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});await fs.writeFile(`${output}/failure.json`,JSON.stringify({checkpoint,message:e.message,state:await page.evaluate(()=>__AN_HOA__?.adventure()).catch(()=>null)},null,2));}e.message=checkpoint+': '+e.message;throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
