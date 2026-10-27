const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const out='test-results/sound-loudness';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.normalizedBuffers=[];const seen=new WeakSet(),connect=AudioBufferSourceNode.prototype.connect;AudioBufferSourceNode.prototype.connect=function(target,...args){if(target instanceof GainNode&&this.buffer&&!seen.has(this.buffer)){seen.add(this.buffer);normalizedBuffers.push(this.buffer);}return connect.call(this,target,...args);};});
 try{
  await page.goto('file:///'+path.join(process.cwd(),'android-apk/www/index.html').replaceAll('\\','/')+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});await page.locator('#startButton').click();await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.audio.configure({music:0,voice:0,effects:1});});
  await page.waitForFunction(()=>{const l=__AN_HOA__.audio.spellSounds.loudness;return Object.keys(l.profiles).length>=33&&l.processorReady;},null,{timeout:30000});
  await page.evaluate(async()=>{for(const type of [...Object.keys(__AN_HOA__.audio.spellSounds.loudness.profiles),'explosion','meteor-fall','tsunami-roar'])await __AN_HOA__.audio.previewEffect(type);__AN_HOA__.audio.stopEffectPreview();});
  const helpers=Buffer.from(await fs.readFile('src/sound-loudness.js','utf8')).toString('base64');
  const report=await page.evaluate(async data=>{
   const {createEffectsMixer,createPeakLimiter,measureSoundLoudness}=await import('data:text/javascript;base64,'+data),buffers=[...normalizedBuffers],levels=[],outputs=[];
   const render=async(buffer,voices=1)=>{
    const ctx=new OfflineAudioContext(buffer.numberOfChannels,buffer.length,buffer.sampleRate),input=ctx.createGain(),output=ctx.createGain();
    output.gain.value=.72;output.connect(createPeakLimiter(ctx)).connect(ctx.destination);
    const mixer=createEffectsMixer(ctx,input,output);mixer.volume.gain.value=.75;if(!await mixer.ready)throw Error('Offline mixer did not initialize');
    for(let i=0;i<voices;i++){const source=ctx.createBufferSource();source.buffer=buffer;source.connect(input);source.start();}
    return ctx.startRendering();
   };
   for(const buffer of buffers){
    const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),m=measureSoundLoudness(channels,buffer.sampleRate);levels.push({duration:buffer.duration,...m});
    const result=await render(buffer),output=measureSoundLoudness(Array.from({length:result.numberOfChannels},(_,i)=>result.getChannelData(i)),result.sampleRate);outputs.push({duration:buffer.duration,...output});
   }
   const fixture=new AudioBuffer({numberOfChannels:1,length:44100,sampleRate:44100}),samples=fixture.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=.1*Math.sin(i*2*Math.PI*440/44100)+.04*Math.sin(i*2*Math.PI*731/44100);
   const rms=buffer=>{const d=buffer.getChannelData(0).subarray(8820,35280);return Math.sqrt(d.reduce((s,x)=>s+x*x,0)/d.length);},single=rms(await render(fixture)),stacked=rms(await render(fixture,8));
   const spread=list=>20*Math.log10(Math.max(...list.map(v=>v.activeRms))/Math.min(...list.map(v=>v.activeRms)));
   return {count:buffers.length,inputSpreadDb:spread(levels),outputSpreadDb:spread(outputs),maxPeak:Math.max(...outputs.map(v=>v.peak)),single,stacked,stackedRiseDb:20*Math.log10(stacked/single),levels,outputs};
  },helpers);
  await fs.writeFile(out+'/measurements.json',JSON.stringify(report,null,2));
  assert.equal(report.count,32,'14 recordings, 15 procedural cues and 3 synthesized effects');assert.ok(report.inputSpreadDb<.6,'source spread: '+report.inputSpreadDb);assert.ok(report.outputSpreadDb<3,'output spread: '+report.outputSpreadDb);assert.ok(report.maxPeak<1,'real mixed output does not clip');assert.ok(report.stackedRiseDb<3,'eight overlapping voices remain close to a single effect');assert.deepEqual(errors,[]);
  console.log('PASS: all 32 sounds measured after decode/render, '+report.inputSpreadDb.toFixed(2)+' dB source spread, '+report.outputSpreadDb.toFixed(2)+' dB output spread, '+report.stackedRiseDb.toFixed(2)+' dB rise for eight voices, offline worklet and bounded peaks.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
