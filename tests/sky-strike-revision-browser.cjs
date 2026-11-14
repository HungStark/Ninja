const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/sky-strike-revision';await fs.mkdir(out,{recursive:true});
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'timing-inspect',setup(b){b.onLoad({filter:/[/\\]src[/\\]main\.js$/},async({path})=>({loader:'js',contents:(await fs.readFile(path,'utf8')).replace('if(testMode)window.__AN_HOA__.setAIEnabled=enabled=>',`if(testMode)window.__skyTiming={cast(id,owner){const target=owner==='player'?enemyPos():playerPos();practiceOverhead.aimAt(target);const pos=owner==='player'?playerPos():enemyPos();launch(spells.find(s=>s.id===id),owner,pos,vnorm(vsub(target,pos)));},clear(){shots.length=0;fields.length=0;lightArts.reset();natureArts.reset(walls);earthArts.reset(walls);waterBubbles.reset();effects.reset();walls.length=0;for(const f of [player,enemy]){f.hp=100000;f.burns=[];f.staticCharges=[];f.shield=0;f.shieldTime=0;f.invulnerableTime=0;f.lightControlTime=0;}},ally(){campaignAlly.reset(true,{hp:300,maxHp:300});const before=enemy.hp;let calls=0;for(let i=0;i<200;i++)campaignAlly.update(.1,i*.1,combatEnemies(),player,playerPos(),(actor,n)=>{calls++;actor.fighter.receive(n,true,false,'weapon');},true);return {calls,before,after:enemy.hp,state:campaignAlly.state()};}};if(testMode)window.__AN_HOA__.setAIEnabled=enabled=>`)}));}}]});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4398'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='load';
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Test server exited: '+code)));});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const mobile of [false,true]){
   page=await browser.newPage({viewport:mobile?{width:915,height:412}:{width:1280,height:800},hasTouch:mobile});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.stack));
   await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));await page.goto('http://127.0.0.1:4398/?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value=overhead]').check();await page.locator('#practiceViewConfirm').click();await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
   const advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),state=()=>page.evaluate(()=>__AN_HOA__.state());
   const sizes=await page.evaluate(()=>['fire-lance','lightning-volley','dark-volley'].map(id=>{const s=SealGameCore.spells.find(s=>s.id===id);return id==='dark-volley'?s.fallTime:s.size;}));assert.deepEqual(sizes,[.72,.9,.7]);
   for(const owner of ['player','enemy'])for(const id of ['fire-meteor','lightning-thunder','light-volley']){
    checkpoint=(mobile?'mobile':'desktop')+' '+owner+' '+id;console.log('CHECK '+checkpoint);
    await page.evaluate(({id,owner})=>{__skyTiming.clear();__skyTiming.cast(id,owner);},{id,owner});
    const health=s=>owner==='player'?s.enemyHealth:s.health,before=health(await state());await advance(.99);assert.equal(health(await state()),before,'No ground damage before 1s');
    await advance(.01);assert.ok(health(await state())<before,'Ground damage at exactly 1s');
   }
   checkpoint='mirror landing and pause';await page.evaluate(()=>{__skyTiming.clear();__skyTiming.cast('light-lance','enemy');});await advance(.99);assert.equal((await state()).lightArt.domes[0].phase,'assembling');await advance(.01);assert.equal((await state()).lightArt.domes[0].phase,'active');
   await page.evaluate(()=>{__skyTiming.clear();__skyTiming.cast('fire-meteor','enemy');});await advance(.4);await page.keyboard.press('Escape');const before=(await state()).health;await advance(2);assert.equal((await state()).health,before);await page.locator('#resumeButton').evaluate(el=>el.click());await advance(.59);assert.equal((await state()).health,before);await advance(.01);assert.ok((await state()).health<before);
   checkpoint='non-attacking companion';const ally=await page.evaluate(()=>{__skyTiming.clear();return __skyTiming.ally();});assert.equal(ally.calls,0);assert.equal(ally.after,ally.before);assert.equal(ally.state.hits,0);assert.ok(ally.state.active);assert.deepEqual(errors,[]);
   await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'.png'});await page.close();
  }
  console.log('PASS: original dragon/bird sizes, all three sky strikes hit at exactly 1s for both sides, 1s mirror assembly, pause, unchanged elephant timing, zero companion damage on desktop/touch.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:e.message,state:await page?.evaluate(()=>__AN_HOA__?.state()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
