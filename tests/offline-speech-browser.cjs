const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve('android-apk/www'),errors=[];
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://test').pathname);if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:640,height:360},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.spellVoiceRequests=[];const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{postMessage(data,...rest){if(typeof data.text==='string')window.spellVoiceRequests.push({text:data.text,rate:data.rate,pitch:data.pitch});return super.postMessage(data,...rest);}};window.AnHoaSpeech={getStatus:()=>JSON.stringify({state:'missing-voice',message:'No Vietnamese voice'}),stop(){}};});
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?test=1&adventure=1`);await page.waitForFunction(()=>document.body.dataset.ready==='true');
  assert.equal(await page.evaluate(()=>__AN_HOA__.audio.settings().music),.75);
  await page.locator('#homeAudioSettings').tap();await page.locator('#audioHeroVoice').selectOption('female');assert.equal(await page.evaluate(()=>__AN_HOA__.audio.settings().heroVoice),'female');await page.locator('#audio-music').fill('0');await page.locator('#audio-effects').fill('0');await page.locator('#audioVoicePreview').tap();
  await page.waitForFunction(()=>__AN_HOA__.audio.state().speech.playback?.playing,{},{timeout:20000});
  let a=await page.evaluate(()=>__AN_HOA__.audio.state());assert.equal(a.speech.backend,'bundled');assert.ok(a.speech.playback.samples>22050,'at least a second of real speech');
  await page.waitForFunction(()=>__AN_HOA__.audio.state().rms>.001); // music/effects are zero: only synthesized speech reaches output.
  await page.evaluate(()=>__AN_HOA__.audio.finishTyping());assert.equal(await page.evaluate(()=>__AN_HOA__.audio.state().speaking),true);
  await page.evaluate(()=>__AN_HOA__.audio.pauseVoice(true));assert.equal(await page.evaluate(()=>__AN_HOA__.audio.state().speech.playback.playing),false);
  await page.evaluate(()=>__AN_HOA__.audio.pauseVoice(false));await page.waitForFunction(()=>__AN_HOA__.audio.state().speech.playback.playing);
  await page.locator('#closeAudioSettings').tap();assert.equal(await page.evaluate(()=>__AN_HOA__.audio.state().speaking),false);
  const variants=await page.evaluate(async()=>{
   const worker=new Worker('vendor/espeak-ng/worker.js',{type:'module'}),buffers=[];
   for(const gender of ['male','female']){const pcm=await new Promise((resolve,reject)=>{worker.onmessage=({data})=>data.error?reject(Error(data.error)):resolve(data.pcm);worker.onerror=reject;worker.postMessage({id:gender,text:'Xin chào. Tôi là người giữ ấn của làng.',gender,rate:1,pitch:1});});buffers.push(pcm);}
   worker.terminate();return {samples:buffers.map(b=>b.length),different:buffers[0].length!==buffers[1].length||buffers[0].some((n,i)=>n!==buffers[1][i])};
  });assert.ok(variants.samples.every(n=>n>22050));assert.ok(variants.different,'male and female variants produce different real PCM at the same pitch');
  await page.evaluate(()=>{window.spellVoiceRequests=[];__AN_HOA__.audio.speakSpell({name:'Hỏa Vũ Liên Châu'});});
  await page.waitForFunction(()=>window.spellVoiceRequests.length===1&&__AN_HOA__.audio.state().speech.playback.playing,null,{timeout:20000});
  const cadence=await page.evaluate(()=>window.spellVoiceRequests);assert.deepEqual(cadence.map(p=>p.text),['Hỏa Vũ Liên Châu.']);assert.equal(cadence[0].rate,1.5);assert.equal(cadence[0].pitch,1.18);await page.waitForFunction(()=>!__AN_HOA__.audio.state().speaking);assert.equal(await page.evaluate(()=>window.spellVoiceRequests.length),1);
  await page.evaluate(()=>{window.spellVoiceRequests=[];__AN_HOA__.audio.speakSpell({name:'Tuyết táng'});});await page.waitForFunction(()=>__AN_HOA__.audio.state().speech.playback.playing,null,{timeout:20000});const snowVoice=await page.evaluate(()=>window.spellVoiceRequests);assert.equal(snowVoice.length,1);assert.equal(snowVoice[0].text,'Tuyết táng.');assert.equal(snowVoice[0].rate,.78*1.5);assert.equal(snowVoice[0].pitch,1.18);await page.waitForFunction(()=>!__AN_HOA__.audio.state().speaking);assert.equal(await page.evaluate(()=>window.spellVoiceRequests.length),1);
  await page.evaluate(()=>__AN_HOA__.audio.dialogueLine({speaker:{id:'hero'},text:'Đây là lời thoại tiếng Việt không cần kết nối mạng.'}));await page.waitForFunction(()=>__AN_HOA__.audio.state().speech.playback.playing);
  await page.evaluate(()=>__AN_HOA__.audio.configure({muted:true}));await page.waitForTimeout(450);a=await page.evaluate(()=>__AN_HOA__.audio.state());assert.equal(a.speaking,false);assert.ok(a.rms<1e-5);
  await page.evaluate(()=>{__AN_HOA__.audio.configure({muted:false,music:.25,effects:.6,voice:.55});__AN_HOA__.audio.visibility(true);});assert.equal(await page.evaluate(()=>__AN_HOA__.audio.state().context),'suspended');await page.evaluate(()=>__AN_HOA__.audio.visibility(false));await page.waitForFunction(()=>__AN_HOA__.audio.state().context==='running');
  await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');a=await page.evaluate(()=>__AN_HOA__.audio.state());assert.equal(a.settings.music,.25);assert.equal(a.settings.effects,.6);assert.equal(a.musicBoost,2);
  await page.locator('#homeAudioSettings').tap();await page.setViewportSize({width:480,height:270});await page.locator('#audioVoicePreview').scrollIntoViewIfNeeded();assert.ok(await page.locator('#audioVoicePreview').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync('test-results/audio',{recursive:true});await page.screenshot({path:'test-results/audio/offline-compact.png'});assert.deepEqual(errors,[]);
  console.log('PASS: packaged Vietnamese synthesis without system voice; real 1.5x spell cadence and natural-pitch Snow Burial; real PCM reaches output with music/effects off; typing end, pause/resume, close/mute/background, saved volumes, compact UI.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
