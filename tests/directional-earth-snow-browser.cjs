const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
  const out='test-results/directional-earth-snow';await fs.mkdir(out,{recursive:true});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4377'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='load';
  const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const profile of [{name:'web',path:'index.html'},{name:'english',path:'index.en.html'},{name:'android',path:'android-apk/www/index.html',mobile:true,firstPerson:true},{name:'first-person',path:'index.html',firstPerson:true}]){
      checkpoint=profile.name+' load';const errors=[];
      page=await browser.newPage({viewport:profile.mobile?{width:915,height:412}:{width:1280,height:800},hasTouch:!!profile.mobile});page.on('pageerror',e=>errors.push(e.message));
      const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
      await page.goto((profile.mobile?'file:///'+process.cwd().replaceAll('\\','/')+'/':'http://127.0.0.1:4377/')+profile.path+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await page.locator('#clearLoadout').click();for(const id of ['earth-barrier','ice-reflect','ice-orb','light-orb'])await page.locator('[data-equip='+id+']').click();
      await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();
      if(!profile.mobile){await page.locator('[name=practiceView][value='+(profile.firstPerson?'first-person':'overhead')+']').check();await page.locator('#practiceViewConfirm').click();}
      await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',10000);__AN_HOA__.setHealth('enemy',10000);});
      const aim=async target=>{if(profile.firstPerson)await page.evaluate(p=>__AN_HOA__.aimAt(p),target);else{const p=await page.evaluate(p=>__AN_HOA__.screenPoint(p),[target[0],0,target[2]]);await page.mouse.move(p.x,p.y);}await advance(0);};
      const ready=async id=>{const s=await state(),spell=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id),id);await advance(Math.max(.001,s.cooldown+.001,(s.cooldowns[id]||0)+.001,(spell.cost-s.chakra)/s.chakraRegen+.001));await page.keyboard.press('Backspace');for(const key of spell.sequence)await page.keyboard.press(key);assert.equal(await page.locator('#castButton').isDisabled(),false);};
      const release=async()=>{if(profile.mobile)await page.locator('#androidAttack').tap();else await page.keyboard.press('Space');await advance(0);};
      checkpoint=profile.name+' wall';let s=await state();await aim(s.enemyPosition);await ready('earth-barrier');await release();await advance(.3);s=await state();
      const panels=s.walls.filter(w=>w.element==='earth'),center=panels[3].position,origin=s.position,axis=[center[0]-origin[0],0,center[2]-origin[2]];
      assert.equal(panels.length,7);for(const i of [0,6])assert.ok((panels[i].position[0]-center[0])*axis[0]+(panels[i].position[2]-center[2])*axis[2]<0);
      await page.screenshot({path:out+'/'+profile.name+'-wall.png'});
      checkpoint=profile.name+' aimed miss';await ready('ice-reflect');await release();await advance(35);s=await state();
      await aim([s.position[0]+14,s.position[1],s.position[2]]);await ready('ice-orb');
      if(!profile.firstPerson){assert.equal((await state()).practiceOverhead.preview.kind,'direction');await page.screenshot({path:out+'/'+profile.name+'-aim.png'});}
      await release();s=await state();const ball=s.natureArt.balls[0],before=s.enemyHealth;
      assert.ok(ball.direction[0]>.99&&Math.abs(ball.direction[2])<.01,'Ball follows the chosen rightward aim');assert.equal(ball.phase,'gathering');
      await aim(s.enemyPosition);await advance(3);s=await state();const rolling=s.natureArt.balls[0];assert.equal(rolling.phase,'rolling');assert.deepEqual(rolling.direction,ball.direction);assert.ok(rolling.position[0]>ball.position[0]);close((rolling.position[0]-ball.position[0])*ball.direction[2]-(rolling.position[2]-ball.position[2])*ball.direction[0],0);close(s.enemyHealth,before);
      await page.screenshot({path:out+'/'+profile.name+'-straight-roll.png'});await advance(60);assert.equal((await state()).natureArt.balls.length,0);
      checkpoint=profile.name+' aimed hit';s=await state();await aim(s.enemyPosition);await ready('ice-orb');const hp=(await state()).enemyHealth;await release();await advance(12);s=await state();assert.equal(s.natureArt.balls.length,0);assert.ok(s.enemyHealth<hp,'Aiming at the opponent deals damage');
      checkpoint=profile.name+' enemy direction';await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-reflect'));await advance(35);await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-orb',undefined,[1,0,0]));s=await state();const enemyBall=s.natureArt.balls.find(b=>b.owner==='enemy');assert.deepEqual(enemyBall.direction,[1,0,0]);await advance(3);s=await state();assert.deepEqual(s.natureArt.balls.find(b=>b.owner==='enemy').direction,[1,0,0]);
      checkpoint=profile.name+' damage feedback';await advance(60);s=await state();await aim(s.enemyPosition);await ready('light-orb');await release();await advance(.09);s=await state();
      if(profile.firstPerson){assert.deepEqual(s.damageFeedback,[]);assert.equal(await page.locator('#hitMarker').evaluate(e=>Number(e.style.opacity)),1);}
      else{
        const enemyHit=s.damageFeedback.find(h=>h.id==='primary');assert.ok(enemyHit?.flashing&&enemyHit.overlayMeshes>0);close(enemyHit.overlayOpacity,.32);
        assert.equal(await page.locator('#hitMarker').evaluate(e=>Number(e.style.opacity)),0);
        await page.evaluate(()=>{const p=__AN_HOA__.state().position;__AN_HOA__.launchEnemy('light-orb',[p[0],p[1],p[2]-4],[0,0,1]);});await advance(.09);s=await state();
        const playerHit=s.damageFeedback.find(h=>h.id==='player');assert.ok(playerHit?.flashing&&playerHit.overlayMeshes>0);assert.equal(s.damageFeedback.length,2);
        await page.screenshot({path:out+'/'+profile.name+'-damage-feedback.png'});await advance(.21);assert.deepEqual((await state()).damageFeedback,[]);
      }
      assert.deepEqual(errors,[]);console.log('PASS: '+profile.name);await page.close();
    }
    console.log('PASS: Vietnamese/English web, Android and first-person; corrected wall curve, aimed straight snowball, miss cleanup, impact, enemy direction; translucent red flash without X for both sides, simultaneous hits, expiry and unchanged first-person marker.');
  }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:e.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}
  finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
