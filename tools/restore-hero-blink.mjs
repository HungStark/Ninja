// Restore just the authored blink shape to the optimized hero, without other expressions.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const read=async path=>{const b=await fs.readFile(path),n=b.readUInt32LE(12);return {json:JSON.parse(b.subarray(20,20+n)),bin:b.subarray(28+n)};};
const source=await read('assets/hero-ninja.glb'),target=await read('assets/hero-ninja-simple.glb');
const face=source.json.meshes.find(m=>m.extras?.targetNames?.includes('Fcl_EYE_Close'));
const dest=target.json.meshes.find(m=>m.name===face.name);
if(dest.extras?.targetNames?.includes('Fcl_EYE_Close'))process.exit(0);
const parts=[target.bin];let length=target.bin.length;
function copyView(index){const view=structuredClone(source.json.bufferViews[index]),data=source.bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength),pad=(4-length%4)%4;parts.push(Buffer.alloc(pad),data);length+=pad;view.buffer=0;view.byteOffset=length;length+=data.length;return target.json.bufferViews.push(view)-1;}
function copyAccessor(index){const a=structuredClone(source.json.accessors[index]);if(a.bufferView!==undefined)a.bufferView=copyView(a.bufferView);if(a.sparse){a.sparse.indices.bufferView=copyView(a.sparse.indices.bufferView);a.sparse.values.bufferView=copyView(a.sparse.values.bufferView);}return target.json.accessors.push(a)-1;}
const blink=face.extras.targetNames.indexOf('Fcl_EYE_Close');
for(let i=0;i<dest.primitives.length;i++){
 const p=dest.primitives[i],s=face.primitives[i];
 assert.equal(target.json.accessors[p.attributes.POSITION].count,source.json.accessors[s.attributes.POSITION].count,'hero face topology must match');
 p.targets=[Object.fromEntries(Object.entries(s.targets[blink]).map(([key,index])=>[key,copyAccessor(index)]))];
}
dest.extras={...dest.extras,targetNames:['Fcl_EYE_Close']};dest.weights=[0];
target.json.buffers[0].byteLength=length;
const json=Buffer.from(JSON.stringify(target.json)),jp=Buffer.alloc((4-json.length%4)%4,32),bin=Buffer.concat([...parts,Buffer.alloc((4-length%4)%4)]),header=Buffer.alloc(20),bh=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+jp.length+bin.length,8);header.writeUInt32LE(json.length+jp.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
await fs.writeFile('assets/hero-ninja-simple.glb',Buffer.concat([header,json,jp,bh,bin]));
console.log('Restored the hero blink shape.');
