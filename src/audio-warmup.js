// Prepare one unused effect per idle period, never a whole bank at first input.
// Playback requests still use their direct path and share the same cached promises.
export function createAudioWarmup({prepare,canRun=()=>true,environment=globalThis,gap=200}){
  const queue=[],known=new Set();let timer=null,idle=null,active=null,completed=0,paused=true,closed=false;
  function cancel(){
    if(timer!==null)environment.clearTimeout(timer);
    if(idle!==null)environment.cancelIdleCallback?.(idle);
    timer=idle=null;
  }
  function schedule(){
    if(closed||paused||active||timer!==null||idle!==null||!queue.length)return;
    timer=environment.setTimeout(()=>{
      timer=null;
      if(closed||paused)return;
      if(!canRun()){schedule();return;}
      if(environment.requestIdleCallback)idle=environment.requestIdleCallback(run,{timeout:1000});
      else run();
    },gap);
  }
  async function run(){
    idle=null;if(closed||paused)return;
    if(!canRun()){schedule();return;}
    active=queue.shift();
    try{await prepare(active);}catch{}finally{active=null;completed++;schedule();}
  }
  return {
    start(types){if(closed)return;for(const type of types)if(!known.has(type)){known.add(type);queue.push(type);}paused=false;schedule();},
    pause(){paused=true;cancel();},
    state:()=>({queued:queue.length,active,completed,paused}),
    destroy(){closed=true;paused=true;cancel();queue.length=0;known.clear();}
  };
}
