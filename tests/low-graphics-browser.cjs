const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');

(async()=>{
 const root=path.resolve('android-apk/www'),out='test-results/low-graphics';await fs.mkdir(out,{recursive:true});
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204).end();return;}
  const file=path.resolve(root,'.'+new URL(req.url,'http://test').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}
  try{const data=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(data);}catch{res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const reports=[];
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:{width:mobile?915:1100,height:mobile?412:700},hasTouch:mobile,isMobile:mobile}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   if(!mobile)await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>delete document.documentElement.dataset.android,{once:true}));
   const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
   const quality=async name=>{for(let i=0;i<3&&(await state()).quality!==name;i++)await page.evaluate(()=>document.getElementById('qualityButton').click());await advance(.001);assert.equal((await state()).quality,name);};
   await page.goto(`http://127.0.0.1:${server.address().port}/index.html?test=1&mode=duel`);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
   assert.equal((await state()).quality,'Thấp','smoothness is the default on desktop and mobile');
   assert.equal((await state()).graphics.antialias,false,'no hidden default-framebuffer MSAA cost');
   await page.evaluate(()=>{document.getElementById('startButton').click();document.getElementById('practiceOpponentConfirm').click();document.getElementById('practiceViewConfirm').click();__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',100000);__AN_HOA__.setHealth('enemy',100000);__AN_HOA__.audio.configure({muted:true});});
   await quality('Cân bằng');const balanced=(await state()).graphics;assert.equal(balanced.shadowMap,true);assert.equal(balanced.circularShadows,0);assert.equal(balanced.groundCoverMeshes,0);assert.equal(balanced.renderPath,'postprocessing');assert.ok(balanced.postprocessWidth>1);
   await quality('Thấp');let s=await state();assert.equal(s.graphics.shadowMap,false);assert.equal(s.graphics.circularShadows,2);assert.equal(s.graphics.groundCoverMeshes,0);assert.equal(s.graphics.particleLimit,180);
   assert.equal(s.graphics.renderPath,'direct');assert.equal(s.graphics.postprocessWidth,1);assert.equal(s.graphics.postprocessHeight,1);
   const mutations=await page.evaluate(()=>{const observer=new MutationObserver(()=>{});observer.observe(document.getElementById('comboSlots'),{childList:true,subtree:true});__AN_HOA__.advance(.2);const count=observer.takeRecords().length;observer.disconnect();return count;});
   assert.equal(mutations,0,'unchanged seal slots are not rebuilt every simulation frame');
   await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-low.png`});
   const volley=async()=>{await page.evaluate(()=>{for(let i=0;i<8;i++)__AN_HOA__.launchEnemy('fire-volley');});await advance(.65);return state();};
   const low=await volley();assert.ok(low.graphics.particles>0);assert.ok(low.graphics.particles<=180);assert.ok(low.graphics.renderedParticles<=180);assert.ok(low.graphics.smoke<=48);
   await advance(3);await quality('Cân bằng');const regular=await volley();assert.ok(regular.graphics.particles>low.graphics.particles,'low generates fewer particles for the same attacks');assert.equal(regular.graphics.shadowMap,true);assert.equal(regular.graphics.circularShadows,0);
   await quality('Thấp');assert.ok((await state()).graphics.particles<=180,'switching quality trims existing particles');
   await page.evaluate(()=>__AN_HOA__.launchEnemy('wood-reflect'));await advance(4);s=await state();assert.ok(s.natureArt.trees.length>0,'Wood garden gameplay still exists');
   await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-wood-low.png`});
   await page.evaluate(()=>__AN_HOA__.launchEnemy('ice-reflect'));await advance(1);assert.equal((await state()).graphics.shadowMap,false);
   await quality('Cao');assert.equal((await state()).graphics.shadowMap,true);assert.equal((await state()).graphics.groundCoverMeshes,0);await quality('Thấp');assert.equal((await state()).graphics.circularShadows,2);
   await page.setViewportSize({width:1920,height:1080});await page.waitForFunction(()=>{const c=document.getElementById('world');return c.width===1280&&c.height===720;});await advance(.01);s=await state();assert.ok(s.graphics.bufferWidth*s.graphics.bufferHeight<=1280*720,'low 3D buffer stays within 720p at a large viewport');assert.equal(s.graphics.postprocessWidth,1);
   reports.push({mobile,balanced,low:low.graphics,regular:regular.graphics,largeViewport:s.graphics});
   const {newJourney}=await import('../src/adventure-data.js'),save=newJourney();save.story.stage='infiltrate';save.story.guardianRestored=true;
   await page.addInitScript(save=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(save)),save);
   await page.goto(`http://127.0.0.1:${server.address().port}/index.html?test=1&adventure=1`);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.locator('#continueJourney').click();await advance(.1);
   const village=await page.evaluate(()=>__AN_HOA__.adventure());assert.equal(village.phase,'explore');assert.equal(village.presentation.quality,2);assert.equal((await state()).graphics.renderPath,'direct');
   await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-exploration-low.png`});
   await quality('Cao');assert.equal((await page.evaluate(()=>__AN_HOA__.adventure())).presentation.quality,0);await quality('Thấp');assert.equal((await page.evaluate(()=>__AN_HOA__.adventure())).presentation.quality,2);
   assert.deepEqual(errors,[]);await page.close();
  }
  await fs.writeFile(out+'/report.json',JSON.stringify(reports,null,2));console.log('PASS: desktop/mobile bare combat terrain, low circular shadows, no shadow maps, fewer generated particles, bounded smoke, quality restoration, Wood garden and Ice spell compatibility.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
