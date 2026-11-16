const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/ninja-warning-size-timing';await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});let page;const errors=[];
 try{
  page=await browser.newPage({viewport:{width:1400,height:900}});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('index.html')).href+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value="overhead"]').check();await page.locator('#practiceViewConfirm').click();
  await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);for(let i=0;i<3&&!/Thấp|Low/.test(__AN_HOA__.state().quality);i++)document.getElementById('qualityButton').click();__AN_HOA__.setHealth('enemy',100000);__AN_HOA__.setHealth('player',100000);__AN_HOA__.advance(.01);});
  const report=await page.evaluate(()=>{
   const api=__AN_HOA__,native=new Set(['meteor','thunder','jacob','earthgravity','earthquake','earthcraterspikes']),preflight=new Set(['staged','forming','emerging','gathering','blooming']),report=[];
   for(const spell of SealGameCore.spells){
    api.combatTest.resetArts();api.setHealth('enemy',100000);api.setHealth('player',100000);api.combatTest.position('player',[0,0,7]);api.combatTest.position('primary',[0,0,-18]);api.combatTest.prepare(spell.id,'enemy');api.combatTest.launch(spell.id,'enemy');
    let warning=api.state().ninjaWarnings.find(w=>w.spellId===spell.id);if(!warning?.visible||warning.fired)throw Error('Missing pre-launch warning '+spell.id);
    api.advance(.64);warning=api.state().ninjaWarnings.find(w=>w.spellId===spell.id);if(!warning?.visible||warning.fired)throw Error('Early launch '+spell.id);
    api.advance(.02);let state=api.state();warning=state.ninjaWarnings.find(w=>w.spellId===spell.id);if(!warning?.fired)throw Error('Did not cast '+spell.id);
    if(native.has(spell.style)){if(!warning.visible)throw Error('Changed existing ground marker '+spell.id);report.push({id:spell.id,preserved:true,shapes:warning.shapes});continue;}
    let frames=0,formed=false;
    while(warning.visible){
     const shots=state.projectiles.filter(p=>p.owner==='enemy');if(!shots.length||shots.some(p=>!preflight.has(p.phase)))throw Error('Warning remains during flight '+spell.id);formed=true;
     if(++frames>100)throw Error('Warning never cleared '+spell.id);api.advance(1/60);state=api.state();warning=state.ninjaWarnings.find(w=>w.spellId===spell.id);if(!warning)throw Error('Warning expired before projectile release '+spell.id);
    }
    const shots=state.projectiles.filter(p=>p.owner==='enemy');if(shots.length&&shots.every(p=>preflight.has(p.phase)))throw Error('Warning vanished before flight '+spell.id);
    report.push({id:spell.id,formed,clearedAt:warning.age,shapes:warning.shapes});
   }
   return report;
  });assert.equal(report.length,45);assert.equal(report.filter(r=>r.preserved).length,6);assert.ok(report.find(r=>r.id==='fire-volley').formed);assert.ok(report.find(r=>r.id==='water-tsunami').formed);
  await page.evaluate(()=>{__AN_HOA__.combatTest.resetArts();__AN_HOA__.combatTest.launch('fire-volley','enemy');__AN_HOA__.advance(.9);});await page.screenshot({path:out+'/fire-forming-warning.png'});
  await page.evaluate(()=>__AN_HOA__.advance(.3));assert.equal(await page.evaluate(()=>__AN_HOA__.state().ninjaWarnings.find(w=>w.spellId==='fire-volley').visible),false);await page.screenshot({path:out+'/fire-flying-no-warning.png'});
  await page.evaluate(()=>{__AN_HOA__.combatTest.resetArts();__AN_HOA__.combatTest.launch('lightning-thunder','enemy');__AN_HOA__.advance(.8);});assert.equal(await page.evaluate(()=>__AN_HOA__.state().ninjaWarnings.find(w=>w.spellId==='lightning-thunder').visible),true);await page.screenshot({path:out+'/thunder-marker-preserved.png'});
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS: actual local index.html, all 45 ninja warnings; thin player-sized paths stay through formation and vanish on first flight, six existing ground-warning types preserved.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({error:e.message,errors,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
