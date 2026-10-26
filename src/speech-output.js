import {gameLanguage} from './language.js';
import {createBundledSpeech} from './bundled-speech.js';
let speechInstance=0;
export function createSpeechOutput({environment=globalThis,onStart=()=>{},onEnd=()=>{},onError=()=>{},onStatus=()=>{},getOutput,bundledFactory}={}){
 const env=environment,prefix='anhoa-'+(++speechInstance)+'-',native=()=>env.AnHoaSpeech,synth=()=>env.speechSynthesis;
 let active=null,serial=0,timer=null,closed=false,waitExpired=false,lastError='',nativeFailed=false,bundledError='';
 const clearTimer=()=>{clearTimeout(timer);timer=null;};
 const voice=(gender,language='vi')=>{try{const voices=(synth()?.getVoices()||[]).filter(v=>(language==='en'?/^en(?:-|$)/i:/^vi(?:-|$)/i).test(v.lang)),female=/female|woman|\bnữ\b|hoai\s*my|hoài\s*my|zira|jenny|aria|sonia|samantha|victoria|hazel/i,male=/\bmale\b|\bman\b|nam\s*minh|david|guy|ryan|george|alex|mark/i;const matches=gender?voices.filter(v=>gender==='female'?female.test(v.name):male.test(v.name)&&!female.test(v.name)):voices;return matches.find(v=>v.localService)||matches[0]||voices.find(v=>v.localService)||voices[0];}catch{return null;}};
 function preferredStatus(language=active?.language||gameLanguage()){
  if(native()&&language==='en')return {backend:'android',state:'missing-voice',message:'English dialogue uses the bundled offline voice.',lastError};
  if(native()){try{const value=native().getStatus(),s=typeof value==='string'?JSON.parse(value):value;return {...s,backend:'android',message:gameLanguage()==='en'?({ready:'Voice is ready.',initializing:'Preparing voice…','missing-voice':'No system voice is available.',unavailable:'Android voice is unavailable.'}[s.state]||'Voice status unavailable.'):s.message,lastError};}catch{return {backend:'android',state:'unavailable',message:'Không kết nối được giọng đọc Android.',lastError};}}
  const v=voice(undefined,language);return {backend:synth()?'browser':'none',state:v?'ready':synth()&&!waitExpired&&!(synth().getVoices()?.length)?'initializing':'missing-voice',message:v?'Giọng tiếng Việt đã sẵn sàng.':'Chưa tìm thấy giọng đọc tiếng Việt trên thiết bị.',lastError};
 }
 function status(language=active?.language||gameLanguage()){const s=preferredStatus(language);if(getOutput&&(nativeFailed||!['ready','initializing'].includes(s.state)))return {...s,backend:'bundled',state:bundledError?'unavailable':'ready',message:bundledError||'Giọng Việt cài sẵn · dùng được ngoại tuyến.',playback:bundled.state?.(),lastError};return s;}
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
 function start(id){if(!active||active.id!==id)return;clearTimer();lastError='';if(!active.started){active.started=true;onStart();}onStatus();}
 function end(id){
  if(!active||active.id!==id)return;clearTimer();const a=active,part=a.parts[a.part+1];
  if(!part){active=null;onEnd();onStatus();return;}
  active={...a,id:prefix+(++serial),part:a.part+1,text:part.text,rate:part.rate??a.baseRate,pitch:part.pitch??a.basePitch,utterance:null,pending:true,gapRemaining:Math.max(0,part.pauseBefore||0),gapStarted:null};
  schedulePart();
 }
 function watch(id){clearTimer();timer=setTimeout(()=>{if(active?.id!==id)return;fallback(id,'Giọng hệ thống chưa sẵn sàng.');},4000);}
 function browserSpeak(){
  const a=active;if(!a||a.backend!=='browser'||a.paused||a.pending)return;
  const v=voice(a.gender,a.language);if(!v){clearTimer();timer=setTimeout(()=>{if(active?.id!==a.id)return;waitExpired=true;fallback(a.id,'Thiết bị chưa có giọng đọc tiếng Việt.');},1500);return;}
  try{const u=new env.SpeechSynthesisUtterance(a.text);a.utterance=u;u.voice=v;u.lang=a.language==='en'?'en-US':'vi-VN';u.rate=a.rate;u.pitch=a.pitch;u.volume=a.volume;u.onstart=()=>{if(a.backend==='browser')start(a.id);};u.onend=()=>{if(a.backend==='browser')end(a.id);};u.onerror=()=>{if(a.backend==='browser')fallback(a.id,'Giọng đọc gặp lỗi. Hãy thử giọng tiếng Việt khác.');};watch(a.id);synth().resume();synth().speak(u);}catch{fallback(a.id,'Chưa phát được giọng tiếng Việt.');}
 }
 function dispatchPart(){
  const a=active;if(!a||a.paused)return;
  if(a.backend==='bundled')bundled.speak(a.text,a);
  else if(a.backend==='android'){try{watch(a.id);native().speak(a.text,a.id,a.rate,a.pitch,a.volume);}catch{fallback(a.id,'Không kết nối được giọng đọc Android.');}}
  else browserSpeak();
 }
 function schedulePart(){
  const a=active;if(!a?.pending||a.paused)return;
  clearTimer();
  if(a.gapRemaining>0){a.gapStarted=Date.now();timer=setTimeout(()=>{if(active!==a||a.paused)return;timer=null;a.pending=false;a.gapRemaining=0;a.gapStarted=null;dispatchPart();},a.gapRemaining*1000);}
  else{a.pending=false;dispatchPart();}
 }
 const handleNative=e=>{if(closed)return;const d=e.detail||{};if(d.type==='status'){if(d.state==='ready')nativeFailed=false;onStatus();return;}if(!active||active.backend!=='android'||d.id!==active.id)return;if(d.type==='start')start(d.id);else if(d.type==='done')end(d.id);else if(d.type==='error')fallback(d.id,d.message||'Giọng đọc Android gặp lỗi.');};
 const voicesChanged=()=>{waitExpired=false;if(active?.backend==='browser'&&!active.utterance)browserSpeak();onStatus();};
 env.addEventListener?.('anhoa:native-speech',handleNative);synth()?.addEventListener?.('voiceschanged',voicesChanged);
 return {
  speak(text,{volume=1,rate=1,pitch=1,gender='male',language='vi',segments}={}){
   stop();bundledError='';if(closed||!text?.trim()||volume<=0)return false;
   const backend=getOutput&&status(language).backend==='bundled'?'bundled':native()?'android':synth()&&env.SpeechSynthesisUtterance?'browser':getOutput?'bundled':null;if(!backend)return false;
   const parts=segments?.filter(p=>typeof p.text==='string'&&p.text.trim())||[{text}];if(!parts.length)return false;
   const first=parts[0];active={id:prefix+(++serial),backend,text:first.text,volume,rate:first.rate??rate,pitch:first.pitch??pitch,baseRate:rate,basePitch:pitch,gender,language,parts,part:0,paused:false,started:false,pending:false};lastError='';dispatchPart();
   return true;
  },
  stop,
  pause(){if(!active||active.paused)return;active.paused=true;if(active.pending){if(active.gapStarted!==null)active.gapRemaining=Math.max(0,active.gapRemaining-(Date.now()-active.gapStarted)/1000);active.gapStarted=null;clearTimer();return;}clearTimer();try{if(active.backend==='bundled')bundled.pause();else if(active.backend==='android')native().pause();else synth().pause();}catch{}},
  resume(){if(!active?.paused)return;active.paused=false;if(active.pending){schedulePart();return;}try{if(active.backend==='bundled')bundled.resume();else if(active.backend==='android'){watch(active.id);native().resume();}else if(active.utterance)synth().resume();else browserSpeak();}catch{}},
  install(){try{if(native()){native().installVoiceData();return true;}}catch{}return false;},
  openSettings(){try{if(native()){native().openVoiceSettings();return true;}}catch{}return false;},
  status,
  get speaking(){return !!active;},
  destroy(){stop();bundled.destroy();closed=true;env.removeEventListener?.('anhoa:native-speech',handleNative);synth()?.removeEventListener?.('voiceschanged',voicesChanged);}
 };
}
