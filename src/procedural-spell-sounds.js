export const PROCEDURAL_CUE_DURATIONS={'energy-charge':1.6,'energy-fire':1.3,'guardian-roar':.95,'meteor-summon':.85,'static-charge':.95,'lightning-crack':.36,'water-surge':1.1,'water-splash':.4,'wood-creak':.6,'wood-snap':.6,'ice-crack':.45,'light-chime':.76,'shadow-rumble':.75,'shadow-hit':.75,'flame-burst':.4};
// The same score can be rendered to PCM for loudness matching or scheduled live
// on a browser without offline rendering support.
export function scheduleProceduralCue(type,fx,hiss){
 if(type==='energy-charge'){for(let i=0;i<9;i++)fx(110+i*55,.3,.025+i*.006,'triangle',150+i*80,i*.15);hiss(1.5,.12,250,'bandpass',2400);}
 else if(type==='energy-fire'){hiss(1.25,.3,3800,'bandpass',1100);fx(65,1.2,.19,'sawtooth',37);fx(230,.45,.065,'triangle',70);}
 else if(type==='guardian-roar'){for(let i=0;i<5;i++){fx(76+i*23,.75,.045,'sawtooth',38+i*13,i*.035);hiss(.25,.06,260+i*110,'bandpass',120,i*.1);}hiss(.85,.15,560,'lowpass',90);}
 else if(type==='meteor-summon'){hiss(.8,.14,170,'lowpass',600);fx(48,.8,.1,'sine',85);}
 else if(type==='static-charge'||type==='lightning-crack'){for(let i=0;i<4;i++){hiss(.05,.13,5200,'highpass',1700,i*.07);fx(1800-i*230,.1,.035,'sawtooth',140,i*.06);}if(type==='static-charge')fx(110,.8,.06,'sawtooth',330);}
 else if(type==='water-surge'||type==='water-splash')hiss(type==='water-surge'?1:.35,.24,1200,'bandpass',290);
 else if(type==='wood-creak'||type==='wood-snap'){fx(160,.55,.07,'sawtooth',65);for(let i=0;i<4;i++)hiss(.06,.1,1500-i*270,'bandpass',250,i*.065);}
 else if(type==='ice-crack'){hiss(.09,.14,5200,'highpass',1600);for(let i=0;i<5;i++)fx(1200+i*530,.3,.025,'sine',1100+i*390,i*.025);}
 else if(type==='light-chime'){for(let i=0;i<4;i++)fx(660*2**(i/3),.6,.035,'sine',690*2**(i/3),i*.04);}
 else if(type==='shadow-rumble'||type==='shadow-hit'){fx(58,.7,.15,'sine',27);hiss(.55,.14,350,'lowpass',65);}
 else if(type==='flame-burst'){hiss(.35,.2,2400,'lowpass',160);fx(95,.3,.09,'triangle',38);}
}
export async function renderProceduralCue(type,environment=globalThis){
 const Offline=environment.OfflineAudioContext||environment.webkitOfflineAudioContext,duration=PROCEDURAL_CUE_DURATIONS[type];if(!Offline||!duration)return null;
 const rate=22050,ctx=new Offline(1,Math.ceil((duration+.03)*rate),rate),noise=ctx.createBuffer(1,rate,rate),data=noise.getChannelData(0);let seed=7919;
 for(let i=0;i<data.length;i++){seed=seed*16807%2147483647;data[i]=seed/1073741824-1;}
 const envelope=(time,length,volume,attack)=>{const gain=ctx.createGain();gain.gain.setValueAtTime(.00001,time);gain.gain.linearRampToValueAtTime(volume,time+Math.min(attack,length*.2));gain.gain.exponentialRampToValueAtTime(.00001,time+length);gain.connect(ctx.destination);return gain;};
 const fx=(hz,length,volume,wave='sine',end=hz,delay=0)=>{const source=ctx.createOscillator();source.type=wave;source.frequency.setValueAtTime(hz,delay);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),delay+length);source.connect(envelope(delay,length,volume,.012));source.start(delay);source.stop(delay+length+.02);};
 const hiss=(length,volume,cutoff,type='lowpass',end=cutoff,delay=0)=>{const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=noise;source.loop=true;filter.type=type;filter.frequency.setValueAtTime(cutoff,delay);filter.frequency.exponentialRampToValueAtTime(Math.max(30,end),delay+length);filter.Q.value=.7;source.connect(filter).connect(envelope(delay,length,volume,.008));source.start(delay);source.stop(delay+length+.02);};
 scheduleProceduralCue(type,fx,hiss);return ctx.startRendering();
}
