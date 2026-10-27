// Compare the active part of an effect, excluding silence and quiet tails.
// Analysis gently discounts very low bass and weights the audible upper band.
export const SPELL_LOUDNESS_TARGET=.1;
export const SPELL_PEAK_CEILING=.9;
export function measureSoundLoudness(channels,sampleRate){
 const frames=channels[0]?.length||0,block=Math.max(1,Math.round(sampleRate*.1)),power=new Float64Array(Math.ceil(frames/block));
 const bass=1-Math.exp(-2*Math.PI*60/sampleRate),mid=1-Math.exp(-2*Math.PI*1500/sampleRate);let peak=0;
 for(const data of channels){let low=0,body=0;for(let i=0;i<frames;i++){const x=Number.isFinite(data[i])?data[i]:0;peak=Math.max(peak,Math.abs(x));low+=bass*(x-low);body+=mid*(x-body);const weighted=x-.75*low+.5*(x-body);power[Math.floor(i/block)]+=weighted*weighted;}}
 const blocks=Array.from(power,(sum,i)=>sum/(Math.min(block,frames-i*block)*Math.max(1,channels.length))),max=Math.max(0,...blocks),active=blocks.filter(p=>p>Math.max(1e-12,max*.1));
 return {activeRms:active.length?Math.sqrt(active.reduce((sum,p)=>sum+p,0)/active.length):0,peak};
}
export function normalizeSound(channels,sampleRate){
 const before=measureSoundLoudness(channels,sampleRate);let after=before,totalGain=1;
 if(!before.activeRms)for(const data of channels)for(let i=0;i<data.length;i++)if(!Number.isFinite(data[i]))data[i]=0;
 if(before.activeRms>1e-7)for(let pass=0;pass<3;pass++){
  const gain=Math.max(.05,Math.min(pass?1.5:12,SPELL_LOUDNESS_TARGET/after.activeRms));totalGain*=gain;
  for(const data of channels)for(let i=0;i<data.length;i++){
   const v=(Number.isFinite(data[i])?data[i]:0)*gain,a=Math.abs(v),knee=.72;
   data[i]=a<=knee?v:Math.sign(v)*(knee+(SPELL_PEAK_CEILING-knee)*(1-Math.exp(-(a-knee)/(SPELL_PEAK_CEILING-knee))));
  }
  after=measureSoundLoudness(channels,sampleRate);
  if(!after.activeRms||Math.abs(20*Math.log10(after.activeRms/SPELL_LOUDNESS_TARGET))<.25)break;
 }
 return {before:before.activeRms,after:after.activeRms,peak:after.peak,gain:totalGain};
}
export function normalizeSoundBuffer(buffer){
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i)),attack=Math.min(buffer.length,Math.round(buffer.sampleRate*.015));
 // Include the playback fade in the measurement: a short impact must not lose
 // most of its loudness to another fade after it has already been balanced.
 for(const data of channels)for(let i=0;i<attack;i++)data[i]*=i/attack;
 return normalizeSound(channels,buffer.sampleRate);
}
const effectsWorklet=`
class BalancedEffects extends AudioWorkletProcessor {
 constructor(options){super();this.target=options.processorOptions.target;this.low=[];this.body=[];this.energy=0;this.gain=1;this.meter=0;this.bass=1-Math.exp(-2*Math.PI*60/sampleRate);this.mid=1-Math.exp(-2*Math.PI*1500/sampleRate);this.smoothing=1-Math.exp(-1/(sampleRate*.1));this.gainAttack=1-Math.exp(-1/(sampleRate*.002));this.gainRelease=1-Math.exp(-1/(sampleRate*.08));}
 process(inputs,outputs){
  const input=inputs[0],output=outputs[0];if(!output?.length)return true;
  for(let i=0;i<output[0].length;i++){
   let power=0;
   for(let ch=0;ch<output.length;ch++){
    const x=input?.length?(input[Math.min(ch,input.length-1)][i]||0):0;
    this.low[ch]=(this.low[ch]||0)+this.bass*(x-(this.low[ch]||0));this.body[ch]=(this.body[ch]||0)+this.mid*(x-(this.body[ch]||0));
    const weighted=x-.75*this.low[ch]+.5*(x-this.body[ch]);power+=weighted*weighted;output[ch][i]=x;
   }
   power/=output.length;this.energy+=(power-this.energy)*this.smoothing;
   const target=Math.min(1,this.target/Math.sqrt(Math.max(1e-12,this.energy)));
   this.gain+=(target-this.gain)*(target<this.gain?this.gainAttack:this.gainRelease);
   for(const channel of output)channel[i]*=this.gain;
  }
  this.meter+=output[0].length;if(this.meter>=sampleRate*.1){this.meter=0;this.port.postMessage(20*Math.log10(Math.max(1e-6,this.gain)));}return true;
 }
}
registerProcessor('balanced-effects-v1',BalancedEffects);`;
export function createPeakLimiter(context){
 const limiter=context.createWaveShaper(),curve=new Float32Array(4097);
 for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1,a=Math.abs(x);curve[i]=a<=.72?x:Math.sign(x)*(.72+.18*(1-Math.exp(-(a-.72)/.18)));}
 limiter.curve=curve;limiter.oversample='2x';return limiter;
}
export function createEffectsMixer(context,input,destination){
 const limiter=createPeakLimiter(context),volume=context.createGain();input.connect(limiter).connect(volume).connect(destination);
 const mixer={volume,reduction:0,processor:null,ready:Promise.resolve(false)};
 if(context.audioWorklet&&globalThis.AudioWorkletNode){
  const url='data:text/javascript;base64,'+btoa(effectsWorklet);
  mixer.ready=context.audioWorklet.addModule(url).then(()=>{
   if(context.state==='closed')return false;
   const processor=new AudioWorkletNode(context,'balanced-effects-v1',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{target:SPELL_LOUDNESS_TARGET*1.1}});
   processor.port.onmessage=event=>{mixer.reduction=event.data;};input.disconnect(limiter);input.connect(processor).connect(limiter);mixer.processor=processor;return true;
  }).catch(error=>{mixer.error=String(error);return false;});
 }
 return mixer;
}
