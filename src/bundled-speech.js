// The voice engine runs separately in a worker; only PCM crosses the boundary.
export function createBundledSpeech({getOutput,onStart,onEnd,onError,workerFactory}={}){
  let worker=null,job=null,source=null,offset=0,startedAt=0,serial=0,timeout=null;
  function halt(){if(source){source.onended=null;try{source.stop();source.disconnect();}catch{}source=null;}}
  function stop(){job=null;clearTimeout(timeout);timeout=null;halt();offset=0;}
  function fail(id){if(job?.id!==id)return;stop();onError('Không phát được giọng Việt cài sẵn.');}
  function play(){
    if(!job?.buffer||job.paused)return;
    const output=getOutput();if(!output?.context||output.context.state!=='running'){fail(job.id);return;}
    const {context,destination}=output,id=job.id;
    try{
      source=context.createBufferSource();source.buffer=job.buffer;source.connect(destination);
      source.onended=()=>{if(job?.id!==id)return;stop();onEnd();};
      startedAt=context.currentTime;source.start(0,offset);onStart();
    }catch{fail(id);}
  }
  function ensureWorker(){
    if(worker)return;
    worker=workerFactory?workerFactory():new Worker('vendor/espeak-ng/worker.js',{type:'module',name:'anhoa-vietnamese-voice'});
    worker.onmessage=({data})=>{
      if(job?.id!==data.id)return;
      clearTimeout(timeout);timeout=null;
      if(data.error){fail(data.id);return;}
      try{const {context}=getOutput()||{};if(!context)throw new Error('Audio locked');
        job.buffer=context.createBuffer(1,data.pcm.length,data.sampleRate);job.buffer.copyToChannel(data.pcm,0);play();
      }catch{fail(data.id);}
    };
    worker.onerror=e=>{e.preventDefault?.();worker?.terminate();worker=null;if(job)fail(job.id);};
  }
  return {
    speak(text,options={}){
      stop();const id=++serial;job={id,paused:false,buffer:null};
      try{ensureWorker();timeout=setTimeout(()=>fail(id),20000);worker.postMessage({id,text,rate:options.rate,pitch:options.pitch,gender:options.gender});}
      catch{queueMicrotask(()=>fail(id));}
    },
    stop,
    state:()=>({loading:!!job&&!job.buffer,playing:!!source,paused:!!job?.paused,samples:job?.buffer?.length||0,sampleRate:job?.buffer?.sampleRate||0}),
    pause(){if(!job||job.paused)return;job.paused=true;if(source){offset+=Math.max(0,getOutput().context.currentTime-startedAt);halt();}},
    resume(){if(!job||!job.paused)return;job.paused=false;play();},
    destroy(){stop();worker?.terminate();worker=null;}
  };
}
