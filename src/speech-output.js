import {createBundledSpeech} from './bundled-speech.js';
let speechInstance=0;
export function createSpeechOutput({environment=globalThis,onStart=()=>{},onEnd=()=>{},onError=()=>{},onStatus=()=>{},getOutput,bundledFactory}={}){
 const env=environment,prefix='anhoa-'+(++speechInstance)+'-',native=()=>env.AnHoaSpeech,synth=()=>env.speechSynthesis;
 let active=null,serial=0,timer=null,closed=false,waitExpired=false,lastError='',nativeFailed=false,bundledError='';
 const clearTimer=()=>{clearTimeout(timer);timer=null;};
 const voice=gender=>{try{const voices=(synth()?.getVoices()||[]).filter(v=>/^vi(?:-|$)/i.test(v.lang)),female=/female|woman|\bnữ\b|hoai\s*my|hoài\s*my/i,male=/\bmale\b|\bman\b|nam\s*minh/i;const matches=gender?voices.filter(v=>gender==='female'?female.test(v.name):male.test(v.name)&&!female.test(v.name)):voices;return matches.find(v=>v.localService)||matches[0]||voices.find(v=>v.localService)||voices[0];}catch{return null;}};
 function preferredStatus(){
  if(native()){try{const value=native().getStatus(),s=typeof value==='string'?JSON.parse(value):value;return {...s,backend:'android',lastError};}catch{return {backend:'android',state:'unavailable',message:'Không kết nối được giọng đọc Android.',lastError};}}
  const v=voice();return {backend:synth()?'browser':'none',state:v?'ready':synth()&&!waitExpired&&!(synth().getVoices()?.length)?'initializing':'missing-voice',message:v?'Giọng tiếng Việt đã sẵn sàng.':'Chưa tìm thấy giọng đọc tiếng Việt trên thiết bị.',lastError};
 }
 function status(){const s=preferredStatus();if(getOutput&&(nativeFailed||!['ready','initializing'].includes(s.state)))return {...s,backend:'bundled',state:bundledError?'unavailable':'ready',message:bundledError||'Giọng Việt cài sẵn · dùng được ngoại tuyến.',playback:bundled.state?.(),lastError};return s;}
 const bundled=(bundledFactory||createBundledSpeech)({getOutput,onStart:()=>{if(active?.backend==='bundled')start(active.id);},onEnd:()=>{if(active?.backend==='bundled')end(active.id);},onError:message=>{if(active?.backend==='bundled'){bundledError=message;error(active.id,message);}}});
 function fallback(id,message){
  if(active?.id!==id)return;
  if(!getOutput||active.backend==='bundled'){error(id,message);return;}
  clearTimer();nativeFailed=true;active.backend='bundled';active.utterance=null;lastError=message;
  try{native()?.stop();synth()?.cancel();}catch{}
  bundled.speak(active.text,active);if(active.paused)bundled.pause();onStatus();
 }
 function stop(){const previous=active;active=null;clearTimer();bundled.stop();try{if(native())native().stop();else if(previous)synth()?.cancel();}catch{}}
 function error(id,message){if(!active||active.id!==id||closed)return;active=null;clearTimer();lastError=message;queueMicrotask(()=>{if(!closed&&!active){onError(message);onStatus();}});}
 function start(id){if(!active||active.id!==id)return;clearTimer();active.started=true;lastError='';onStart();onStatus();}
 function end(id){if(!active||active.id!==id)return;active=null;clearTimer();onEnd();onStatus();}
 function watch(id){clearTimer();timer=setTimeout(()=>{if(active?.id!==id)return;fallback(id,'Giọng hệ thống chưa sẵn sàng.');},4000);}
 function browserSpeak(){
  const a=active;if(!a||a.backend!=='browser'||a.paused)return;
  const v=voice(a.gender);if(!v){clearTimer();timer=setTimeout(()=>{if(active?.id!==a.id)return;waitExpired=true;fallback(a.id,'Thiết bị chưa có giọng đọc tiếng Việt.');},1500);return;}
  try{const u=new env.SpeechSynthesisUtterance(a.text);a.utterance=u;u.voice=v;u.lang='vi-VN';u.rate=a.rate;u.pitch=a.pitch;u.volume=a.volume;u.onstart=()=>{if(a.backend==='browser')start(a.id);};u.onend=()=>{if(a.backend==='browser')end(a.id);};u.onerror=()=>{if(a.backend==='browser')fallback(a.id,'Giọng đọc gặp lỗi. Hãy thử giọng tiếng Việt khác.');};watch(a.id);synth().resume();synth().speak(u);}catch{fallback(a.id,'Chưa phát được giọng tiếng Việt.');}
 }
 const handleNative=e=>{if(closed)return;const d=e.detail||{};if(d.type==='status'){if(d.state==='ready')nativeFailed=false;onStatus();return;}if(!active||active.backend!=='android'||d.id!==active.id)return;if(d.type==='start')start(d.id);else if(d.type==='done')end(d.id);else if(d.type==='error')fallback(d.id,d.message||'Giọng đọc Android gặp lỗi.');};
 const voicesChanged=()=>{waitExpired=false;if(active?.backend==='browser'&&!active.utterance)browserSpeak();onStatus();};
 env.addEventListener?.('anhoa:native-speech',handleNative);synth()?.addEventListener?.('voiceschanged',voicesChanged);
 return {
  speak(text,{volume=1,rate=1,pitch=1,gender='male'}={}){
   stop();bundledError='';if(closed||!text?.trim()||volume<=0)return false;
   const backend=getOutput&&status().backend==='bundled'?'bundled':native()?'android':synth()&&env.SpeechSynthesisUtterance?'browser':getOutput?'bundled':null;if(!backend)return false;
   const a={id:prefix+(++serial),backend,text,volume,rate,pitch,gender,paused:false,started:false};active=a;lastError='';
   if(backend==='bundled')bundled.speak(text,a);
   else if(backend==='android'){try{watch(a.id);native().speak(text,a.id,rate,pitch,volume);}catch{fallback(a.id,'Không kết nối được giọng đọc Android.');}}
   else browserSpeak();
   return true;
  },
  stop,
  pause(){if(!active)return;active.paused=true;clearTimer();try{if(active.backend==='bundled')bundled.pause();else if(active.backend==='android')native().pause();else synth().pause();}catch{}},
  resume(){if(!active)return;active.paused=false;try{if(active.backend==='bundled')bundled.resume();else if(active.backend==='android'){watch(active.id);native().resume();}else if(active.utterance)synth().resume();else browserSpeak();}catch{}},
  install(){try{if(native()){native().installVoiceData();return true;}}catch{}return false;},
  openSettings(){try{if(native()){native().openVoiceSettings();return true;}}catch{}return false;},
  status,
  get speaking(){return !!active;},
  destroy(){stop();bundled.destroy();closed=true;env.removeEventListener?.('anhoa:native-speech',handleNative);synth()?.removeEventListener?.('voiceschanged',voicesChanged);}
 };
}
