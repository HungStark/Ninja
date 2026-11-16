// Lightweight fallback: short beeps through the game's existing voice bus.
export function createSpeechBeeps({getOutput,onStart,onEnd,onError}){
  let current=null,timer=null;
  function clear(){clearTimeout(timer);timer=null;}
  function silence(){for(const source of current?.sources||[])try{source.stop();}catch{}if(current)current.sources=[];}
  function stop(){clear();silence();current=null;}
  function play(){
    const a=current;if(!a||a.paused)return;
    try{
      const output=getOutput?.(),ctx=output?.context;if(!ctx||!output.destination)throw Error('Không phát được âm báo.');
      if(!a.started){a.started=true;onStart();}
      if(a.remaining<=0){current=null;onEnd();return;}
      const oscillator=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
      oscillator.type='sine';oscillator.frequency.value=(a.remaining%2?660:880)*a.pitch;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.06*a.volume,now+.006);gain.gain.setValueAtTime(.06*a.volume,now+.045);gain.gain.linearRampToValueAtTime(0,now+.065);
      oscillator.connect(gain).connect(output.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(now);oscillator.stop(now+.07);a.sources=[oscillator];a.remaining--;
      timer=setTimeout(play,110/a.rate);
    }catch(error){stop();onError(error.message);}
  }
  return {speak(text,{volume=1,rate=1,pitch=1}={}){stop();const a=current={volume,rate,pitch,remaining:Math.max(2,Math.min(80,Math.ceil(text.replace(/\s/g,'').length/3))),sources:[],paused:false,started:false};queueMicrotask(()=>{if(current===a)play();});},stop,pause(){if(!current)return;current.paused=true;clear();silence();},resume(){if(!current?.paused)return;current.paused=false;play();},destroy:stop,state:()=>({playing:!!current,paused:!!current?.paused})};
}
