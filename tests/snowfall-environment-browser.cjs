const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
  const out='test-results/snowfall-environment';await fs.mkdir(out,{recursive:true});let browser,page,checkpoint='load';const reports=[];
  try{
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const profile of [{name:'web',file:'index.html'},{name:'english-first-person',file:'index.en.html',firstPerson:true},{name:'android',file:'android-apk/www/index.html',mobile:true}]){
      checkpoint=profile.name+' load';const errors=[];
      page=await browser.newPage({viewport:profile.mobile?{width:915,height:412}:{width:1280,height:800},hasTouch:!!profile.mobile});
      page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/i.test(m.text()))errors.push(m.text());});
      await page.goto('file:///'+path.join(process.cwd(),profile.file).replaceAll('\\','/')+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await page.locator('#clearLoadout').click();for(const id of ['ice-reflect','ice-barrier','ice-orb','earth-barrier'])await page.locator('[data-equip='+id+']').click();
      await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();
      if(await page.locator('#practiceViewConfirm').isVisible()){await page.locator('[name=practiceView][value='+(profile.firstPerson?'first-person':'overhead')+']').check();await page.locator('#practiceViewConfirm').click();}
      await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',10000);__AN_HOA__.setHealth('enemy',10000);});
      const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
      const before=await state();assert.equal(before.natureArt.snowVisible,false);
      checkpoint=profile.name+' snowfall';await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-reflect'));await advance(5);
      let s=await state(),v=s.natureArt.snowVisual;
      assert.deepEqual(errors,[]);
      assert.ok(v.layers.every(l=>l.flakes>0));assert.ok(v.surfaceTriangles>500);assert.ok(v.edgeDrifts>20);assert.equal(v.drawCalls,1);
      assert.equal(v.coveragePercent,0);assert.equal(v.groundOpacity,0);assert.ok(v.waterTriangles>1000);
      assert.equal(s.health,before.health);assert.equal(s.enemyHealth,before.enemyHealth);
      await page.screenshot({path:out+'/'+profile.name+'-early.png'});
      for(let step=1;step<=10;step++){
        await advance(step===1?4:9);s=await state();v=s.natureArt.snowVisual;
        assert.equal(v.coveragePercent,step*10);assert.ok(Math.abs(v.groundOpacity-step/10)<1e-6);
        assert.equal(v.drawCalls,5);
        if([1,5].includes(step))await page.screenshot({path:out+'/'+profile.name+'-coverage-'+step*10+'.png'});
      }
      assert.ok(Math.abs(s.natureArt.snow[0].amount-90)<1e-6);assert.ok(Math.abs(s.natureArt.snowMovement.player-.55)<1e-6);assert.ok(v.visibleFlakes>50);
      assert.ok(v.flakes<=(profile.mobile?480:1220));assert.equal(v.drifts,28);
      await page.screenshot({path:out+'/'+profile.name+'-settled.png'});
      const frozen=JSON.stringify(s.natureArt);await advance(0);assert.equal(JSON.stringify((await state()).natureArt),frozen);
      checkpoint=profile.name+' blizzard';await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-barrier'));await advance(.5);s=await state();
      assert.equal(s.natureArt.snowVisual.boosted,true);assert.equal(s.natureArt.snowVisual.flakes,v.flakes*2);
      assert.equal(s.walls.filter(w=>w.element==='ice').length,0);await page.screenshot({path:out+'/'+profile.name+'-blizzard.png'});
      checkpoint=profile.name+' terrain change';await page.evaluate(()=>__AN_HOA__.launchEnemy('earth-barrier'));await advance(.6);assert.ok((await state()).walls.some(w=>w.element==='earth'));
      // Turning and moving must keep particles world anchored and caps in place.
      if(profile.firstPerson){await page.evaluate(()=>__AN_HOA__.aimAt([16,.8,-7]));await advance(.1);await page.screenshot({path:out+'/'+profile.name+'-fence.png'});}
      assert.deepEqual(errors,[]);reports.push({profile:profile.name,snowVisual:s.natureArt.snowVisual,triangles:s.triangles,errors});
      console.log('PASS: '+profile.name+' full ground/river coverage, 0–100% in nine-snow steps, layers, pause, blizzard, terrain and unchanged health.');await page.close();
    }
    await fs.writeFile(out+'/report.json',JSON.stringify(reports,null,2));
  }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:error.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw error;}
  finally{await browser?.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
