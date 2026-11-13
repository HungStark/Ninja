import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {VILLAGE_MUSIC} from '../src/village-music.js';
import {createVillageMusicPlayer} from '../src/village-music-player.js';

const ranges={nameless:[70,85],water:[75,90],fire:[95,110],lightning:[105,120],wind:[85,100],earth:[70,85],wood:[75,95],ice:[60,75],light:[75,90],dark:[65,80]};
const manifest=JSON.parse(fs.readFileSync('assets/music/manifest.json','utf8')),hashes=new Set();
for(const [id,[min,max]] of Object.entries(ranges)){
 const score=VILLAGE_MUSIC[id],info=manifest.find(entry=>entry.id===id),bytes=fs.readFileSync(score.file);
 assert.ok(score.bpm>=min&&score.bpm<=max,id+' BPM follows the brief');assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt16LE(22),2);assert.equal(bytes.readUInt32LE(24),22050);assert.equal(bytes.readUInt16LE(34),16);
 assert.ok(Math.abs(info.seconds-64*60/score.bpm)<1/22050);assert.ok(Math.abs(info.rms-.12)<.001);assert.ok(info.peak<.73);assert.ok(info.loopBoundaryDelta<.09,'no large loop-boundary transient');
 if(!['fire','lightning','earth'].includes(id))assert.ok(!info.instruments.includes('taiko'),id+' has no drums');
 hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
}
assert.equal(hashes.size,10,'ten distinct rendered scores');
assert.ok(manifest.find(t=>t.id==='ice').instruments.includes('piano'));assert.ok(manifest.find(t=>t.id==='wood').instruments.includes('kalimba'));

const requests=new Map(),started=[],sources=[];
const parameter=()=>({setValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
const context={currentTime:0,createGain(){return {gain:parameter(),connect(){return this;},disconnect(){}};},decodeAudioData:async()=>({duration:40}),createBufferSource(){const source={connect(){return this;},disconnect(){},start(){started.push(this);},stop(){this.onended?.();}};sources.push(source);return source;}};
const player=createVillageMusicPlayer({context,destination:{},fetcher:file=>new Promise(resolve=>requests.set(file,()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})))});
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
player.setTrack('water');player.setTrack('fire');await settle();assert.equal(requests.size,2);player.setTrack('fire',false);
for(const resolve of requests.values())resolve();await settle();assert.equal(started.length,0,'late downloads cannot restart muted/combat music');assert.equal(player.state().cached,2);
player.setTrack('fire');await settle();assert.equal(started.length,1);assert.equal(started[0].loop,true);assert.equal(started[0].loopEnd,40);player.setTrack('fire');await settle();assert.equal(started.length,1,'same-scene updates keep the existing loop');
player.setTrack('water');await settle();assert.equal(started.length,2);assert.equal(player.state().cached,2);assert.equal(player.voiceCount,1);
player.setTrack('ice');await settle();requests.get(VILLAGE_MUSIC.ice.file)();await settle();assert.equal(player.state().cached,2,'decoded audio cache stays bounded');assert.equal(player.state().playing,true);
player.destroy();assert.equal(player.state().playing,false);assert.equal(player.voiceCount,0);assert.equal(player.state().cached,0);
console.log('PASS: ten distinct stereo loops, requested BPM ranges and instruments, no quiet-village drums, balanced unclipped audio, loop boundaries, late-load cancellation, looping sources, idempotent updates, bounded cache and cleanup.');
