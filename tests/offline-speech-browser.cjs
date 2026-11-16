const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const out='test-results/system-speech';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']}),errors=[],requests=[];let page;
 try{
  page=await browser.newPage({viewport:{width:640,height:360},hasTouch:true});page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.addInitScript(()=>{window.voiceState='missing-voice';window.nativeRequests=[];window.AnHoaSpeech={getStatus:()=>JSON.stringify({state:window.voiceState}),stop(){},pause(){},resume(){},speak(text,id,rate,pitch,volume){window.nativeRequests.push({text,id,rate,pitch,volume});window.dispatchEvent(new CustomEvent('anhoa:native-speech',{detail:{type:'start',id}}));}};});
  await page.goto('file:///'+path.resolve('android-apk/www/index.html').replaceAll('\\','/')+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  await page.locator('#homeAudioSettings').tap();await page.locator('#audio-music').fill('0');await page.locator('#audio-effects').fill('0');await page.locator('#audioVoicePreview').tap();
  await page.waitForFunction(()=>__AN_HOA__.audio.state().speech.playback?.playing);let s=await page.evaluate(()=>__AN_HOA__.audio.state());assert.equal(s.speech.backend,'beep');assert.match(s.speech.message,/bíp bíp/);await page.waitForFunction(()=>__AN_HOA__.audio.state().rms>.001);
  await page.evaluate(()=>__AN_HOA__.audio.finishTyping());assert.equal(await page.evaluate(()=>__AN_HOA__.audio.speaking),true,'beeps finish independently of typing');
  await page.evaluate(()=>__AN_HOA__.audio.pauseVoice(true));assert.equal(await page.evaluate(()=>__AN_HOA__.audio.state().speech.playback.paused),true);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__AN_HOA__.audio.speaking),true);await page.evaluate(()=>__AN_HOA__.audio.pauseVoice(false));
  await page.evaluate(()=>__AN_HOA__.audio.configure({muted:true}));assert.equal(await page.evaluate(()=>__AN_HOA__.audio.speaking),false);
  await page.evaluate(()=>{__AN_HOA__.audio.configure({muted:false});window.voiceState='ready';});await page.locator('#audioVoicePreview').tap();
  assert.equal(await page.evaluate(()=>__AN_HOA__.audio.speechStatus().backend),'android');const native=await page.evaluate(()=>window.nativeRequests);assert.equal(native.length,1);assert.ok(native[0].text.length>10);assert.equal(native[0].volume,.9);
  await page.evaluate(()=>__AN_HOA__.audio.stopDialogue());assert.equal(await page.evaluate(()=>__AN_HOA__.audio.speaking),false);
  assert.equal(requests.some(url=>/espeak|vendor\/.*speech/i.test(url)),false);assert.deepEqual(errors,[]);assert.equal(await fs.stat('android-apk/www/vendor/espeak-ng').then(()=>true,()=>false),false);
  await page.screenshot({path:out+'/settings.png'});console.log('PASS: device TTS is preferred, missing voices produce audible beeps, pause/resume/mute/cancel work, and no added speech engine is packaged or loaded.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
