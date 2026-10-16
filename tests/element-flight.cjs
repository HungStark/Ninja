const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1000,height:720}}),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const click=id=>page.evaluate(id=>document.getElementById(id).click(),id),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),state=()=>page.evaluate(()=>__AN_HOA__.state());
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const playerCast=async id=>{for(const key of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(key);await page.keyboard.press('Space');};
    const equip=async ids=>{if((await state()).started){await page.keyboard.press('Escape');await click('changeLoadout');}await click('clearLoadout');for(const id of ids)await page.evaluate(id=>document.querySelector(`[data-equip="${id}"]`).click(),id);await click('startButton');};
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    const peak=await page.evaluate(()=>__AN_HOA__.flightProfile.peakSpeedRatio);
    const benchmarks=await page.evaluate(()=>Object.fromEntries(SealGameCore.spells.filter(s=>['wind-orb','wind-volley'].includes(s.id)).map(s=>[s.id,s.speed])));
    const cases=[['fire-volley',.51,'wind-orb'],['fire-lance',1.11,'wind-volley'],['fire-meteor',.01,'wind-volley'],['water-lance',.01,'wind-orb'],['water-tsunami',1.81,'wind-volley'],['water-volley',1.21,'wind-volley'],['wind-orb',.01,'wind-orb'],['wind-volley',.01,'wind-volley'],['lightning-lance',.01],['lightning-volley',1.11]];
    const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-5,`${label}: ${a} != ${b}`);
    for(const group of [cases.slice(0,5),cases.slice(5)]){
      await equip(group.map(c=>c[0]));
      for(const [id,warmup,benchmark] of group)for(const owner of ['player','enemy']){
        await reset();
        if(owner==='player')await playerCast(id);else await page.evaluate(id=>__AN_HOA__.launchEnemy(id),id);
        await advance(warmup);let s=await state(),shot=s.projectiles.find(p=>p.owner===owner);assert.ok(shot,id+' is in flight');
        const speed=Math.hypot(...shot.velocity);if(benchmark)close(speed,benchmarks[benchmark],id+' cruise benchmark');
        close(shot.speedRatio,.2,id+' slow launch');let position=shot.position;
        await advance(.05);shot=(await state()).projectiles.find(p=>p.owner===owner);
        close(Math.hypot(...shot.position.map((n,i)=>n-position[i]))/.05,speed*.2,id+' actual slow motion');
        await advance(2/(speed*.2)-shot.motionTime);shot=(await state()).projectiles.find(p=>p.owner===owner);close(shot.motionDistance,2,id+' launch distance');close(shot.speedRatio,.2,id+' no early burst');
        await advance(.06);shot=(await state()).projectiles.find(p=>p.owner===owner);assert.ok(shot.speedRatio>.2&&shot.speedRatio<peak,id+' rapid acceleration');
        await advance(.06);shot=(await state()).projectiles.find(p=>p.owner===owner);close(shot.speedRatio,peak,id+' full speed');position=shot.position;assert.ok((await state()).flightBurst.triggered>=1,id+' burst VFX triggered');assert.ok((await state()).flightBurst.wakes>=1,id+' slipstream follows projectile');
        await advance(.1);shot=(await state()).projectiles.find(p=>p.owner===owner);assert.ok(shot,id+' remains in flight');close(Math.hypot(...shot.position.map((n,i)=>n-position[i]))/.1,speed*peak,id+' actual burst speed');
        if(id==='fire-meteor'){await advance(1.3);shot=(await state()).projectiles.find(p=>p.style==='meteor');assert.ok(shot);assert.equal(shot.phase,'falling');close(shot.speedRatio,peak,'Meteor does not slow at camera transitions');await advance(2);assert.equal((await state()).projectiles.filter(p=>p.style==='meteor').length,0,'Meteor completes its accelerated trajectory');}
      }
    }
    // Boat speed is the length of its 3D velocity, including a downward-angled throw.
    await reset();await page.evaluate(()=>__AN_HOA__.launchEnemy('water-volley',[0,8,-12],[0,-.2,Math.sqrt(.96)]));await advance(1.21);let angled=(await state()).projectiles[0];assert.ok(Math.abs(angled.velocity[1])>.1);close(angled.speedRatio,.2,'Angled boat slow launch');
    await page.keyboard.press('Escape');const frozen=(await state()).projectiles;await advance(1);assert.deepEqual((await state()).projectiles,frozen);await page.keyboard.press('Enter');await advance(.7);angled=(await state()).projectiles[0];close(angled.speedRatio,peak,'Angled boat accelerates');
    // Nature projectiles share the release-based profile after their own gathering/leaf animation.
    await reset();await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-reflect'));await advance(3.1);await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-lance'));await advance(.76);close((await state()).projectiles[0].speedRatio,.2,'Ice crystal release');await advance(.7);close((await state()).projectiles[0].speedRatio,peak,'Ice crystal burst');
    await reset();await page.evaluate(()=>__AN_HOA__.launchEnemy('wood-reflect'));await advance(3.1);await page.evaluate(()=>__AN_HOA__.launchEnemy('wood-volley'));await advance(.6);assert.ok((await state()).projectiles.some(p=>p.phase==='flying'&&p.speedRatio===.2),'Bamboo leaves launch slowly after blooming');
    // Reflections retain the launch clock; swept walls still stop slow and fast projectiles.
    await equip(['wind-orb','light-reflect','fire-reflect']);await playerCast('light-reflect');await page.evaluate(()=>__AN_HOA__.launchEnemy('wind-orb',[0,1.72,0],[0,0,1]));await advance(.8);let reflected=(await state()).projectiles.find(p=>p.reflected);assert.ok(reflected);close(reflected.speedRatio,peak,'Reflection does not restart the slow launch');const before=reflected.position;await advance(.1);reflected=(await state()).projectiles.find(p=>p.reflected);close(Math.hypot(...reflected.position.map((n,i)=>n-before[i]))/.1,29*peak,'Reflected burst motion');
    for(const z of [-5,1.5]){await reset();await playerCast('fire-reflect');await page.evaluate(z=>__AN_HOA__.launchEnemy('wind-orb',[0,1.72,z],[0,0,1]),z);await advance(1);const s=await state();assert.equal(s.shots,0,'Wall stops a swept projectile');close(s.walls[0].hp,84,'Speed does not change damage');}
    assert.deepEqual(errors,[]);console.log('PASS: exact 2m slow launch then rapid burst for Hỏa/Thủy/Phong/Lôi, both owners, separate release clocks, meteor camera/impact, angled boat, pause, ice/leaves, reflections and slow/fast swept wall collisions.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
