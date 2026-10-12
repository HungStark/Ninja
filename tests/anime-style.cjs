const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
  await fs.mkdir('test-results/anime',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const advance=t=>page.evaluate(t=>window.__AN_HOA__.advance(t),t),state=()=>page.evaluate(()=>window.__AN_HOA__.state());
    const click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');
    await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
    await click('soundButton');await click('startButton');await page.evaluate(()=>window.__AN_HOA__.setAIEnabled(false));
    await page.addStyleTag({content:'header,.panel,.center-status,.score{visibility:hidden!important}'});
    const screenshot=name=>page.screenshot({path:`test-results/anime/${name}.png`});
    await advance(.4);await screenshot('idle');
    await page.screenshot({path:'test-results/anime/hands-detail.png',clip:{x:300,y:480,width:850,height:420}});
    const palmPixel=await page.evaluate(()=>{
      window.__AN_HOA__.advance(0);
      const gl=document.getElementById('world').getContext('webgl2'),pixel=new Uint8Array(4);
      gl.readPixels(Math.floor(gl.drawingBufferWidth*425/1440),Math.floor(gl.drawingBufferHeight*(1-710/900)),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      return [...pixel];
    });
    assert.ok(palmPixel[0]>160 && palmPixel[0]>palmPixel[1]+20 && palmPixel[1]>palmPixel[2]+12,'Lit cel hand retains a warm skin palette: '+palmPixel);
    if(process.argv.includes('--preview')){
      assert.deepEqual(errors,[]);console.log('PASS preview: final hand design and painted environment render without shader errors.');return;
    }
    for(const key of 'qwerasdfzxcv'){
      await page.keyboard.press('Backspace');await page.keyboard.press(key);await advance(.4);
      assert.equal((await state()).bones,16);await screenshot('seal-'+key);
    }
    for(const [element,id] of [['fire','fire-orb'],['water','water-lance']]){
      await page.keyboard.press('Backspace');
      for(const key of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(key);
      await advance(.4);assert.equal((await state())[element==='fire'?'handFlames':'handWater'],true);await screenshot(element+'-ready');
    }
    await page.keyboard.press('Backspace');await page.keyboard.press('e');await page.keyboard.press('r');await page.keyboard.press('c');await page.keyboard.press('v');await page.keyboard.press('z');await page.keyboard.press('x');await advance(.4);
    assert.equal((await state()).handLightning,true);await screenshot('lightning-ready');
    await page.keyboard.press('Space');await advance(1.4);assert.equal((await state()).cameraView,'bird-overhead');assert.equal((await state()).handsVisible,false);await screenshot('bird-camera');
    await advance(1.5);assert.equal((await state()).cameraView,'first-person');assert.equal((await state()).enemyHealth,898);
    await page.keyboard.press('Escape');await click('resetButton');
    const qualities=[];
    for(let i=0;i<3;i++){
      await advance(.1);const s=await state();qualities.push({quality:s.quality,triangles:s.triangles});await screenshot('quality-'+i);await click('qualityButton');
    }
    await page.setViewportSize({width:900,height:650});await advance(.1);await screenshot('compact');
    await page.setViewportSize({width:390,height:844});await advance(.1);await screenshot('mobile');
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await click('startButton');await page.keyboard.press('e');await advance(.3);await screenshot('reduced-motion');
    assert.deepEqual(errors,[]);
    await fs.writeFile('test-results/anime/verification.json',JSON.stringify({passed:true,qualities,errors},null,2));
    console.log('PASS anime: twelve skinned hand poses, readiness lightning, flight camera, all graphics tiers, viewport changes and reduced motion; no shader/browser errors.',JSON.stringify(qualities));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
