// SPDX-License-Identifier: GPL-3.0-or-later
// Separate eSpeak-NG worker. Sources and license are shipped in this directory.
import initialize from './package/espeak-ng.js';
let enginePromise;
async function engine(){
  if(!enginePromise)enginePromise=initialize().then(m=>new m.eSpeakNGWorker());
  return enginePromise;
}
self.onmessage=async({data})=>{
  const {id,text,rate=1,pitch=1,gender='male',language='vi'}=data;
  try{
    const e=await engine();
    e.set_voice((language==='en'?'en-us':'vi')+(gender==='female'?'+f3':'+m3'));e.set_rate(Math.round(175*rate));e.set_pitch(Math.round(50*pitch));e.set_volume(100);
    const chunks=[];let length=0;
    // Text, not SSML: dialogue cannot inject synthesizer commands.
    const plain=String(text).replace(/[<>\[\]]/g,' ');
    e.synthesize(plain,samples=>{if(samples.length){chunks.push(samples);length+=samples.length;}return false;});
    if(!length)throw new Error('Empty speech');
    const pcm=new Float32Array(length);let offset=0;
    for(const chunk of chunks){for(let i=0;i<chunk.length;i++)pcm[offset+i]=chunk[i]/32768;offset+=chunk.length;}
    self.postMessage({id,sampleRate:e.get_samplerate(),pcm},[pcm.buffer]);
  }catch(error){self.postMessage({id,error:String(error.message||error)});}
};
