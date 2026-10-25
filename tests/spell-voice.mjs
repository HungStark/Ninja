import assert from 'node:assert/strict';
import '../game-core.js';
import {characterVoice,spellVoice} from '../src/character-voice.js';
import {createSpeechOutput} from '../src/speech-output.js';
import {createGameAudio} from '../src/game-audio.js';
for(const gender of ['male','female'])for(const spell of SealGameCore.spells){
 const parts=spellVoice(spell.name,gender),words=spell.name.split(/\s+/),base=characterVoice({id:'hero'},gender);
 assert.equal(parts.map(p=>p.text).join(' ').replace(/\.$/,''),spell.name);
 if(words.length===2){assert.equal(parts.length,1);assert.ok(parts[0].rate<1);assert.ok(parts[0].pitch<base.pitch);assert.equal(parts[0].pauseBefore,undefined);}
 else{assert.equal(parts.length,2);assert.equal(parts[0].text,words.slice(0,2).join(' '));assert.ok(parts[0].rate>parts[1].rate);assert.ok(parts[1].pitch<parts[0].pitch);assert.equal(parts[1].pauseBefore,.18);}
}
assert.deepEqual(spellVoice(''),[]);
const original={setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,now:Date.now};let now=0,serial=0;const timers=new Map();
globalThis.setTimeout=(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:now+ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);Date.now=()=>now;
function tick(ms){const until=now+ms;for(;;){const next=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=until;}
try{
 for(const backend of ['android','browser','bundled']){
  const env=new EventTarget(),requests=[];let callbacks,starts=0,ends=0;
  const event=(type,id)=>env.dispatchEvent(new CustomEvent('anhoa:native-speech',{detail:{type,id}}));
  if(backend==='android')env.AnHoaSpeech={getStatus:()=>({state:'ready'}),speak(text,id,rate,pitch,volume){requests.push({text,id,rate,pitch,volume});event('start',id);},stop(){},pause(){},resume(){}};
  if(backend==='browser'){env.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};env.speechSynthesis={getVoices:()=>[{lang:'vi-VN',name:'Nam Minh',localService:true}],speak(u){requests.push(u);u.onstart();},cancel(){},pause(){},resume(){},addEventListener(){},removeEventListener(){}};}
  const output=createSpeechOutput({environment:env,onStart:()=>starts++,onEnd:()=>ends++,getOutput:backend==='bundled'?()=>({}):undefined,bundledFactory:options=>{callbacks=options;return {speak(text,o){requests.push({text,...o});options.onStart();},stop(){},pause(){},resume(){},destroy(){}};}});
  const finish=()=>backend==='android'?event('done',requests.at(-1).id):backend==='browser'?requests.at(-1).onend():callbacks.onEnd();
  const parts=spellVoice('Hỏa Vũ Liên Châu');output.speak('Hỏa Vũ Liên Châu',{segments:parts,volume:.6});assert.equal(requests[0].text,'Hỏa Vũ');finish();assert.equal(ends,0);assert.equal(output.speaking,true);tick(179);assert.equal(requests.length,1);tick(1);assert.equal(requests[1].text,'Liên Châu.');assert.ok(requests[1].pitch<requests[0].pitch);assert.ok(requests[1].rate<requests[0].rate);assert.equal(requests[1].volume,.6);finish();assert.equal(starts,1);assert.equal(ends,1);assert.equal(output.speaking,false);
  output.speak('Hỏa Vũ Liên Châu',{segments:parts});finish();tick(70);output.pause();tick(1000);const count=requests.length;output.resume();tick(109);assert.equal(requests.length,count);tick(1);assert.equal(requests.length,count+1,'Resumes only the remaining pause');finish();
  output.speak('Hỏa Vũ Liên Châu',{segments:parts});finish();output.stop();const stopped=requests.length;tick(1000);assert.equal(requests.length,stopped,'Stop cancels delayed second phrase');
  output.speak('Hỏa Vũ Liên Châu',{segments:parts});finish();output.speak('Tuyết táng',{segments:spellVoice('Tuyết táng')});const snow=requests.at(-1);assert.equal(snow.text,'Tuyết táng.');assert.ok(snow.rate<1&&snow.pitch<.9);const single=requests.length;tick(1000);assert.equal(requests.length,single,'New cast cancels the old ending');finish();output.destroy();
 }
 const env=new EventTarget(),calls=[];let fallbackCallbacks;
 env.AnHoaSpeech={getStatus:()=>({state:'ready'}),speak:(...args)=>calls.push(args),stop(){}};
 const fallback=createSpeechOutput({environment:env,getOutput:()=>({}),bundledFactory:o=>{fallbackCallbacks=o;return {speak:(text,options)=>calls.push({text,options}),stop(){},destroy(){}};}});
 const nativeEvent=(type,id)=>env.dispatchEvent(new CustomEvent('anhoa:native-speech',{detail:{type,id}}));fallback.speak('Hỏa Vũ Liên Châu',{segments:spellVoice('Hỏa Vũ Liên Châu')});const firstId=calls[0][1];nativeEvent('done',firstId);tick(180);nativeEvent('done',firstId);assert.equal(fallback.speaking,true);nativeEvent('error',calls[1][1]);assert.equal(calls.at(-1).text,'Liên Châu.');assert.equal(calls.at(-1).options.rate,.82);assert.equal(calls.at(-1).options.pitch,.9*.72);fallbackCallbacks.onEnd();assert.equal(fallback.speaking,false);fallback.destroy();
 const requests=[];globalThis.AnHoaSpeech={getStatus:()=>({state:'ready'}),speak:(...args)=>requests.push(args),stop(){}};
 const audio=createGameAudio({storage:{getItem:()=>null}});audio.speakSpell({name:'Hỏa Vũ Liên Châu'});assert.equal(requests.at(-1)[0],'Hỏa Vũ');audio.speakSpell({name:'Tuyết táng'});assert.equal(requests.at(-1)[0],'Tuyết táng.');assert.equal(requests.at(-1)[2],.78);assert.equal(requests.at(-1)[3],.9*.72);audio.destroy();delete globalThis.AnHoaSpeech;
 assert.equal(timers.size,0);
 console.log('PASS: all spell names preserve their words, fast opening, 180ms gap, lower/slower ending; Tuyết táng is low/slow from the start; browser/native/offline playback, single completion, pause/resume, stop/recast, stale events, fallback and game-audio integration.');
}finally{globalThis.setTimeout=original.setTimeout;globalThis.clearTimeout=original.clearTimeout;Date.now=original.now;delete globalThis.AnHoaSpeech;}
