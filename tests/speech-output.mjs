import assert from 'node:assert/strict';
import {createSpeechOutput} from '../src/speech-output.js';
const env=new EventTarget(),calls=[];let nativeState='ready',request,callbacks,ended=0,errors=0;
env.AnHoaSpeech={getStatus:()=>JSON.stringify({state:nativeState}),stop:()=>calls.push('stop'),pause:()=>calls.push('pause'),resume:()=>calls.push('resume'),speak:(...args)=>{request=args;calls.push('speak');}};
const fake=opts=>{callbacks=opts;return {speak:(...args)=>calls.push(['bundled',...args]),stop:()=>{},pause:()=>calls.push('bundled-pause'),resume:()=>calls.push('bundled-resume'),destroy:()=>{}};};
const output=createSpeechOutput({environment:env,getOutput:()=>({}),bundledFactory:fake,onEnd:()=>ended++,onError:()=>errors++});
const event=(type,id)=>env.dispatchEvent(new CustomEvent('anhoa:native-speech',{detail:{type,id}}));
output.speak('Xin chào',{rate:.9,pitch:.8,volume:.6});assert.equal(request[0],'Xin chào');assert.deepEqual(request.slice(2),[.9,.8,.6]);const old=request[1];
output.speak('Câu mới');const next=request[1];event('done',old);assert.ok(output.speaking);assert.equal(ended,0);
event('error',next);assert.equal(output.status().backend,'bundled');assert.equal(calls.at(-1)[0],'bundled');assert.equal(calls.at(-1)[1],'Câu mới');
event('done',next);assert.equal(ended,0);output.pause();assert.equal(calls.at(-1),'bundled-pause');output.resume();assert.equal(calls.at(-1),'bundled-resume');callbacks.onEnd();assert.equal(ended,1);
nativeState='missing-voice';output.speak('Đọc không cần giọng hệ thống');assert.equal(calls.at(-1)[0],'bundled');callbacks.onError('Không phát được giọng Việt cài sẵn.');assert.equal(output.status().state,'unavailable');output.speak('Thử lại');assert.equal(output.status().state,'ready');output.stop();event('start',next);assert.equal(output.speaking,false);assert.equal(errors,0);output.destroy();
console.log('PASS: native Vietnamese bridge selection, volume/rate/pitch, stale callbacks, automatic offline fallback, pause/resume, cancellation.');
// The bundled engine remains available when explicitly selected.
for(const language of ['vi','en']){
 const environment=new EventTarget(),requests=[];let hooks,starts=0,ends=0,failures=0;
 for(const key of ['AnHoaSpeech','speechSynthesis','SpeechSynthesisUtterance'])Object.defineProperty(environment,key,{get(){throw Error('System reader accessed: '+key);}});
 const reader=createSpeechOutput({useSystemVoice:false,environment,getOutput:()=>({}),onStart:()=>starts++,onEnd:()=>ends++,onError:()=>failures++,bundledFactory:options=>{hooks=options;return {speak:(text,options)=>requests.push({text,...options}),stop(){},pause(){requests.push('pause');},resume(){requests.push('resume');},destroy(){},state:()=>({playing:true})};}});
 assert.equal(reader.status().backend,'bundled');
 assert.equal(reader.speak('Bundled voice',{language,gender:'female',rate:1.2,pitch:1.1,volume:.6}),true);
 assert.equal(requests[0].language,language);assert.equal(requests[0].rate,1.2);assert.equal(requests[0].gender,'female');assert.equal(requests[0].pitch,1.1);assert.equal(requests[0].volume,.6);
 hooks.onStart();assert.equal(starts,1);reader.pause();assert.equal(requests.at(-1),'pause');reader.resume();assert.equal(requests.at(-1),'resume');hooks.onEnd();assert.equal(ends,1);
 reader.speak('Failed voice',{language});hooks.onError('Bundled unavailable');await Promise.resolve();assert.equal(reader.status().state,'unavailable');assert.equal(failures,1);assert.equal(reader.speaking,false);
 reader.speak('Retry',{language});assert.equal(reader.status().state,'ready');reader.stop();assert.equal(reader.speaking,false);reader.destroy();
}
console.log('PASS: explicit offline reader preserves both languages and voice controls; the default reader uses the device voice with offline fallback.');
