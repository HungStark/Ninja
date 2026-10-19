const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960}}),output='test-results/ime-journal',errors=[];await fs.mkdir(output,{recursive:true});page.on('pageerror',e=>errors.push(e.stack));let checkpoint='load';
 const state=()=>page.evaluate(()=>__AN_HOA__.adventure()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
 const key=(type,code,value='Process',keyCode=229,extra={})=>page.evaluate(({type,code,value,keyCode,extra})=>{const e=new KeyboardEvent(type,{bubbles:true,cancelable:true,code,key:value,keyCode,isComposing:keyCode===229,...extra});document.activeElement.dispatchEvent(e);return e.defaultPrevented;},{type,code,value,keyCode,extra});
 try{
  await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  checkpoint='Vietnamese form';await page.locator('#heroName').fill('Lữ khách miền Thủy');await key('keydown','KeyW','ư');assert.equal(await page.locator('#heroName').inputValue(),'Lữ khách miền Thủy');await page.locator('#heroForm button[type=submit]').click();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));assert.equal((await state()).input.focused,true);
  checkpoint='IME replacement while physically holding W';await key('keydown','KeyW');let previous=(await state()).position;
  for(let i=0;i<10;i++){
    await key('keydown','Backspace','Backspace',8);await key('keyup','Backspace','Backspace',8);
    await key('keydown','','a',231);await key('keyup','','a',231);
    await key('keydown','KeyA','a',231);await key('keyup','KeyA','a',231);
    await key('keydown','','a',65);await key('keyup','','a',65);
    await page.evaluate(()=>{const c=document.getElementById('world');for(const type of ['compositionstart','compositionupdate','compositionend'])c.dispatchEvent(new CompositionEvent(type,{bubbles:true,data:'ă'}));});
    await key('keydown','KeyW',i%2?'ư':'Process',229,{repeat:true});await advance(.04);const s=await state();assert.deepEqual(s.input.held,['w']);assert.equal(s.sprinting,false,'IME repeat/replacement must not count as a second forward tap');assert.ok(s.position[1]<previous[1]-.17,'forward travel stays continuous');assert.ok(Math.abs(s.position[0]-previous[0])<.00001,'no phantom A');previous=s.position;
  }
  await key('keyup','KeyW','ư');const stopped=(await state()).position;await advance(.3);assert.deepEqual((await state()).position,stopped);
  checkpoint='real A, missing-code release and ambiguous release';await key('keydown','KeyW');await key('keydown','KeyA','a',65);await advance(.1);assert.ok((await state()).position[0]<stopped[0]);await key('keyup','','Unidentified',65);assert.deepEqual((await state()).input.held,['w']);const x=(await state()).position[0];await advance(.1);assert.equal((await state()).position[0],x);await key('keyup','','Process');assert.deepEqual((await state()).input.held,[]);previous=(await state()).position;await advance(.15);assert.deepEqual((await state()).position,previous);
  checkpoint='focus loss clears movement';await key('keydown','KeyA','a',65);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.deepEqual((await state()).input.held,[]);assert.deepEqual((await state()).momentum,{x:0,z:0});
  checkpoint='journal placement and B shortcut';assert.equal(await page.locator('.journey-left-rail #openJournal').count(),0);assert.deepEqual(await page.locator('.journey-top nav button').evaluateAll(nodes=>nodes.map(n=>n.id)),['openJournal','openAtlas','journeyMenu']);assert.equal(await page.locator('#openJournal kbd').textContent(),'B');
  await key('keydown','KeyB','b',231);assert.equal((await state()).phase,'explore');await key('keydown','KeyJ','j',74);assert.equal((await state()).phase,'explore');await key('keydown','KeyB');assert.equal((await state()).phase,'journal');assert.equal(await page.locator('#journalScreen').isVisible(),true);await key('keydown','KeyB');assert.equal((await state()).phase,'explore');assert.equal((await state()).input.focused,true);
  await page.locator('#openJournal').click();assert.equal((await state()).phase,'journal');await page.locator('#closeJournal').click();assert.equal((await state()).input.focused,true);
  for(const viewport of [{width:1918,height:825},{width:1440,height:960},{width:800,height:700},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.waitForFunction(()=>document.getElementById('world').width===innerWidth);await advance(.016);const journal=await page.locator('#openJournal').boundingBox(),atlas=await page.locator('#openAtlas').boundingBox();assert.ok(journal.x+journal.width<=atlas.x+.1);assert.ok(Math.abs(journal.y-atlas.y)<1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:output+'/hud-'+viewport.width+'.png'});
  }
  assert.deepEqual(errors,[]);console.log('PASS: continuous physical W through replacement/composition sequences, no phantom A, real strafe and missing keyup recovery, focus cleanup, Vietnamese text entry, journal left of map and B toggle at four viewport sizes.');
 }catch(e){await page.screenshot({path:output+'/failure.png'}).catch(()=>{});await fs.writeFile(output+'/failure.json',JSON.stringify({checkpoint,message:e.message,state:await state().catch(()=>null)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
