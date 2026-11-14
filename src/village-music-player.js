import {VILLAGE_MUSIC} from './village-music.js';

// Share decoded tracks between loading screens and the live audio player.
// Preloading does not create/resume the audible AudioContext.
export function createVillageMusicCache({decode,fetcher=globalThis.fetch,maxCached=2}){
  const cache=new Map(),pending=new Map();let closed=false;
  function load(file){
    if(closed)return Promise.reject(new Error('Music cache closed'));
    if(cache.has(file)){const buffer=cache.get(file);cache.delete(file);cache.set(file,buffer);return Promise.resolve(buffer);}
    if(pending.has(file))return pending.get(file);
    const promise=Promise.resolve().then(()=>fetcher(file)).then(response=>{
      if(!response.ok)throw Error('Music HTTP '+response.status);
      return response.arrayBuffer();
    }).then(bytes=>decode(bytes)).then(buffer=>{
      if(!closed){cache.set(file,buffer);while(cache.size>maxCached)cache.delete(cache.keys().next().value);}
      return buffer;
    }).finally(()=>pending.delete(file));
    pending.set(file,promise);return promise;
  }
  return {load,state:()=>({cached:cache.size,pending:pending.size}),destroy(){closed=true;cache.clear();}};
}

// Only the current village is loaded. Two decoded tracks allow a crossfade
// without retaining ten long stereo buffers or synthesizing notes during play.
export function createVillageMusicPlayer({context,destination,fetcher=globalThis.fetch,maxCached=2,onChange=()=>{},trackCache}){
  const cache=trackCache||createVillageMusicCache({decode:bytes=>context.decodeAudioData(bytes),fetcher,maxCached}),voices=new Set();
  let target=null,enabled=false,current=null,serial=0,loading=false,error='',closed=false;
  function release(entry){voices.delete(entry);entry.source.onended=null;try{entry.source.disconnect();entry.gain.disconnect();}catch{}}
  function stop(entry,fade=.3){
    if(!entry)return;
    const now=context.currentTime;
    entry.gain.gain.cancelScheduledValues(now);entry.gain.gain.setTargetAtTime(0,now,Math.max(.001,fade/4));
    try{entry.source.stop(now+fade);}catch{release(entry);}
  }
  function setTrack(id,play=true){
    const next=VILLAGE_MUSIC[id]?id:'nameless';
    if(closed||target===next&&enabled===play)return;
    target=next;enabled=play;const request=++serial;error='';loading=false;
    if(!play){stop(current,.12);current=null;onChange();return;}
    loading=true;onChange();
    cache.load(VILLAGE_MUSIC[next].file).then(buffer=>{
      if(closed||request!==serial||!enabled)return;
      stop(current,.4);current=null;
      const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime;
      source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=buffer.duration;
      gain.gain.setValueAtTime(0,now);gain.gain.setTargetAtTime(1,now,.16);
      source.connect(gain).connect(destination);
      const entry={source,gain,id:next,startedAt:now};voices.add(entry);
      source.onended=()=>release(entry);source.start(now);current=entry;loading=false;onChange();
    }).catch(reason=>{
      if(closed||request!==serial)return;
      stop(current,.12);current=null;loading=false;error=String(reason?.message||reason);onChange();
    });
  }
  return {
    setTrack,
    get playing(){return !!current;},
    get voiceCount(){return voices.size;},
    state:()=>({track:target,playingTrack:current?.id||null,playing:!!current,loading,error,...cache.state(),activeVoices:voices.size,duration:current?.source.buffer.duration||0,position:current?(context.currentTime-current.startedAt)%current.source.buffer.duration:0}),
    destroy(){closed=true;serial++;loading=false;current=null;for(const entry of [...voices]){try{entry.source.stop();}catch{}release(entry);}if(!trackCache)cache.destroy();}
  };
}
