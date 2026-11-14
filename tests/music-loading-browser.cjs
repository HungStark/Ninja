const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/music-loading';await fs.mkdir(out,{recursive:true});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4432'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:915,height:412}}),errors=[];
  page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__audioEvents=[];window.__holdMusicDecode=true;
   const decode=BaseAudioContext.prototype.decodeAudioData;
   BaseAudioContext.prototype.decodeAudioData=function(bytes,...args){
    const head=new Uint8Array(bytes,0,Math.min(4,bytes.byteLength)),music=String.fromCharCode(...head)==='RIFF';
    __audioEvents.push({type:'decode',music,offline:this instanceof OfflineAudioContext,time:this.currentTime,wall:performance.now()});
    const result=decode.call(this,bytes,...args);
    return music&&__holdMusicDecode?result.then(buffer=>new Promise(resolve=>window.__releaseMusicDecode=()=>{__holdMusicDecode=false;resolve(buffer);})):result;
   };
   const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...args){
    if(this.loop&&this.buffer?.duration>30)__audioEvents.push({type:'music-start',time:this.context.currentTime,wall:performance.now()});
    return start.apply(this,args);
   };
  });
  let releaseNetwork,requested=false;const networkGate=new Promise(resolve=>releaseNetwork=resolve);
  await page.route('**/assets/music/nameless.wav',async route=>{requested=true;await networkGate;await route.continue();});
  await page.goto('http://127.0.0.1:4432/index.html?test=1&adventure=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__AN_HOA__?.audio);
  assert.equal(requested,true);assert.equal(await page.locator('#loading').isVisible(),true);assert.notEqual(await page.evaluate(()=>document.body.dataset.ready),'true');
  assert.equal(await page.evaluate(()=>__AN_HOA__.audio.state().context),'locked','preloading never opens audible output');
  releaseNetwork();await page.waitForFunction(()=>!!window.__releaseMusicDecode);
  assert.equal(await page.locator('#loading').isVisible(),true,'download completion alone cannot dismiss loading before decoding');
  await page.screenshot({path:out+'/waiting-for-music-decode.png'});
  await page.evaluate(()=>__releaseMusicDecode());await page.waitForFunction(()=>document.body.dataset.ready==='true');
  assert.equal(await page.locator('#loading').isVisible(),false);
  let state=await page.evaluate(()=>__AN_HOA__.audio.state());assert.equal(state.musicPreload.cached,1);assert.equal(state.context,'locked');
  await page.locator('#homeAudioSettings').click();await page.waitForFunction(()=>__AN_HOA__.audio.state().musicPlayback?.playing);
  await page.waitForFunction(()=>__AN_HOA__.audio.state().rms>1e-6);
  await page.waitForFunction(()=>__audioEvents.some(e=>e.type==='decode'&&!e.music));
  const events=await page.evaluate(()=>__audioEvents),musicStart=events.find(e=>e.type==='music-start'),effect=events.find(e=>e.type==='decode'&&!e.music);
  assert.equal(events.filter(e=>e.type==='decode'&&e.music).length,1,'first playback does not fetch/decode the preloaded track again');
  assert.ok(effect.time-musicStart.time>=.99,'effect warmup waits for a full second of music playback');
  const queued=await page.evaluate(()=>__AN_HOA__.audio.state().effectWarmup.queued);
  await page.evaluate(()=>{for(let i=0;i<12;i++)__AN_HOA__.audio.unlock();});
  assert.ok((await page.evaluate(()=>__AN_HOA__.audio.state().effectWarmup.queued))<=queued,'repeated taps cannot duplicate warmup');
  await page.evaluate(()=>__AN_HOA__.audio.configure({muted:true}));
  assert.equal((await page.evaluate(()=>__AN_HOA__.audio.state().effectWarmup.paused)),true);
  await fs.writeFile(out+'/startup.json',JSON.stringify({events,state:await page.evaluate(()=>__AN_HOA__.audio.state())},null,2));
  assert.deepEqual(errors,[]);await page.close();

  const failure=await browser.newPage();await failure.route('**/assets/music/nameless.wav',r=>r.fulfill({status:503,body:'Unavailable'}));
  await failure.goto('http://127.0.0.1:4432/index.html?test=1&adventure=1',{waitUntil:'domcontentloaded',timeout:90000});await failure.waitForSelector('#errorScreen:not(.hidden)',{timeout:90000});
  assert.match(await failure.locator('#errorScreen').textContent(),/nhạc nền/);assert.notEqual(await failure.evaluate(()=>document.body.dataset.ready),'true');
  await failure.close();
  const muted=await browser.newPage();let musicRequests=0;muted.on('request',r=>{if(r.url().includes('/assets/music/'))musicRequests++;});
  await muted.addInitScript(()=>localStorage.setItem('anhoa-audio-v1',JSON.stringify({muted:true})));
  await muted.goto('http://127.0.0.1:4432/index.html?test=1&adventure=1',{waitUntil:'domcontentloaded',timeout:90000});await muted.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
  assert.equal(musicRequests,0,'muted music cannot delay loading');await muted.close();
  console.log('PASS: loading waits for music download AND decode, preload stays silent, first playback reuses decoded music, staggered effect warmup, mute and recoverable startup errors.');
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
