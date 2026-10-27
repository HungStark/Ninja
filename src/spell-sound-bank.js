// Original offline sound effects. Render once per sound, then reuse the PCM buffer.
export const SPELL_SOUND_DURATIONS={
 'explosion':2.8,'meteor-fall':2.4,
 'tsunami-roar':2.4
};
export const SPELL_SOUND_RATE=22050;
const tau=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
const envelope=(t,d,a=.035,r=.18)=>clamp(t/a)*clamp((d-t)/r);
export function renderSpellSound(type,rate=SPELL_SOUND_RATE){
 const duration=SPELL_SOUND_DURATIONS[type];if(!duration)return null;
 const pcm=new Float32Array(Math.ceil(rate*duration));let seed=type.split('').reduce((n,c)=>n+c.charCodeAt(0),7919),low=0,mid=0,phase=0;
 const random=()=>{seed=(seed*16807)%2147483647;return seed/1073741824-1;};
 for(let i=0;i<pcm.length;i++){
  const t=i/rate,x=t/duration,n=random();low+=.035*(n-low);mid+=.25*(n-mid);const air=mid-low;
  let v=0;
  if(type==='tsunami-roar'){
   const swell=.5+.5*Math.sin(x*Math.PI)**2;
   v=(low*3.6+air*.7+n*.08)*swell+Math.sin(tau*39*t+Math.sin(t*4))*.1;
  }else if(type==='explosion'){
   // One sharp "boom", a descending low body, then a long rumbling tail.
   const strike=Math.exp(-t*22),body=Math.exp(-t*2.8),tail=Math.exp(-t*1.7);
   phase=tau*(36*t+3.6*(1-Math.exp(-t*13)));
   v=n*.55*strike+Math.sin(phase)*.85*body+low*3.8*tail+air*.35*Math.exp(-t*5);
  }else if(type==='meteor-fall'){
   // A smooth rushing "whoooosh", building in weight toward the ground.
   phase+=tau*(105-65*x)/rate;
   v=(air*.8+low*(.8+2.4*x)+Math.sin(phase)*.11)*(.35+.65*x*x);
  }
  const attack=type==='explosion'?.002:.025;
  pcm[i]=v*envelope(t,duration,attack,type==='explosion'?.3:.08);
 }
 let peak=0;for(const v of pcm)peak=Math.max(peak,Math.abs(v));
 if(peak)for(let i=0;i<pcm.length;i++)pcm[i]=Math.tanh(pcm[i]/peak*1.5)*.88;
 return pcm;
}
