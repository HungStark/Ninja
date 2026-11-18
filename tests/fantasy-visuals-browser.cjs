const {chromium}=require('playwright'),{build}=require('esbuild'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const {newJourney,VILLAGES}=await import('../src/adventure-data.js');
 const out='test-results/fantasy-visuals';await fs.mkdir(out,{recursive:true});
 // Only expose the existing world for inspecting its rendered materials.
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'inspect-fantasy',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__fantasyWorld=createAdventureScene();'),loader:'js'}));}}]});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']}),errors=[],report=[];
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(60000);
 page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
 const url='file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1';
 let saved;
 await page.addInitScript(()=>{const s=sessionStorage.getItem('fantasy-preview');if(s)localStorage.setItem('anhoa-adventure-v1',s);});
 try{
  await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');
  const selected=VILLAGES.filter(v=>!process.env.FANTASY_VILLAGES||process.env.FANTASY_VILLAGES.split(',').includes(v.id));
  for(const v of selected){
   saved=newJourney();saved.village=v.id;saved.position=[0,7];
   await page.evaluate(s=>sessionStorage.setItem('fantasy-preview',JSON.stringify(s)),saved);await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');
   await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
   await page.evaluate(()=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.advance(.02);});
   assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().phase),'explore');
   for(const quality of [0,2,1]){
    await page.evaluate(q=>{for(let k=0;k<3&&__fantasyWorld.presentationState().quality!==q;k++)document.getElementById('qualityButton').click();__AN_HOA__.advance(.05);},quality);
    const state=await page.evaluate(()=>({village:__AN_HOA__.adventure().save.village,hero:__fantasyWorld.hero.root.userData.characterLoad,lighting:__fantasyWorld.presentationState().lighting,draws:__AN_HOA__.state().graphics.drawCalls}));
    assert.equal(state.village,v.id);assert.equal(state.hero.state,'ready');report.push({id:v.id,quality,...state});
   }
   await page.screenshot({path:`${out}/${v.id}.png`});
   console.log('RENDERED '+v.id);
  }
  // Mobile-sized render, including the normal low-quality material path.
  await page.setViewportSize({width:915,height:412});await page.evaluate(()=>{for(let k=0;k<3&&__fantasyWorld.presentationState().quality!==2;k++)document.getElementById('qualityButton').click();__AN_HOA__.advance(.1);});await page.screenshot({path:`${out}/mobile-low.png`});
  assert.deepEqual(errors,[]);
  const suffix=process.env.FANTASY_VILLAGES?'-'+process.env.FANTASY_VILLAGES.replaceAll(',','-'):'';
  await fs.writeFile(`${out}/report${suffix}.json`,JSON.stringify({passed:true,renderer:'Edge WebGL2 / SwiftShader',errors,report},null,2));
  console.log(`PASS: ${selected.length} villages render at high/low/balanced and mobile size with loaded characters and no page or shader errors.`);
 }catch(e){await fs.writeFile(`${out}/errors.json`,JSON.stringify({error:e.stack,errors},null,2));await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
