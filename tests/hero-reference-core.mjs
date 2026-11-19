import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function read(path){const b=await fs.readFile(path),n=b.readUInt32LE(12);assert.equal(b.readUInt32LE(8),b.length);return {json:JSON.parse(b.subarray(20,20+n)),bin:b.subarray(28+n),bytes:b.length};}
function values(asset,index){
 const a=asset.json.accessors[index],v=asset.json.bufferViews[a.bufferView],counts={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},size={5121:1,5123:2,5125:4,5126:4},read={5121:'readUInt8',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'},width=counts[a.type];
 const result=Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,j)=>v?asset.bin[read[a.componentType]]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||width*size[a.componentType])+j*size[a.componentType]):0));
 if(a.sparse){const s=a.sparse,iv=asset.json.bufferViews[s.indices.bufferView],vv=asset.json.bufferViews[s.values.bufferView];for(let i=0;i<s.count;i++){const index=asset.bin[read[s.indices.componentType]]((iv.byteOffset||0)+(s.indices.byteOffset||0)+i*size[s.indices.componentType]);result[index]=Array.from({length:width},(_,j)=>asset.bin[read[a.componentType]]((vv.byteOffset||0)+(s.values.byteOffset||0)+(i*width+j)*size[a.componentType]));}}
 return result;
}
const source=await read('assets/hero-ninja-simple.glb'),hero=await read('assets/hero-ninja-reference.glb');
assert.ok(hero.bytes<5*1024*1024,'hero stays under 5 MiB with embedded textures');
assert.deepEqual(hero.json.skins,source.json.skins,'same bone ordering and bind accessors');
for(const skin of source.json.skins){
 assert.deepEqual(values(hero,skin.inverseBindMatrices),values(source,skin.inverseBindMatrices));
 for(const i of skin.joints)assert.deepEqual(hero.json.nodes[i],source.json.nodes[i],'every bone keeps its transform and child hierarchy');
}
for(const old of source.json.meshes.filter(m=>m.extras?.targetNames?.includes('Fcl_EYE_Close'))){
 const current=hero.json.meshes.find(m=>m.name===old.name);assert.deepEqual(current.extras.targetNames,old.extras.targetNames);
 for(const p of current.primitives){const q=old.primitives.find(p2=>p2.material===p.material);assert.ok(q);assert.deepEqual(values(hero,p.attributes.POSITION),values(source,q.attributes.POSITION));for(let i=0;i<(p.targets?.length||0);i++)for(const key of Object.keys(p.targets[i]))assert.deepEqual(values(hero,p.targets[i][key]),values(source,q.targets[i][key]),'eyelid deformation stays intact');}
}
const active=new Set();const visit=i=>{const n=hero.json.nodes[i];if(n.mesh!==undefined)active.add(n.mesh);for(const c of n.children||[])visit(c);};for(const i of hero.json.scenes[hero.json.scene||0].nodes)visit(i);
let triangles=0;
for(const i of active)for(const p of hero.json.meshes[i].primitives){
 const positions=values(hero,p.attributes.POSITION),indices=values(hero,p.indices),weights=values(hero,p.attributes.WEIGHTS_0),joints=values(hero,p.attributes.JOINTS_0);
 assert.ok(positions.every(p=>p.every(Number.isFinite)));assert.ok(indices.every(([i])=>i>=0&&i<positions.length));assert.ok(weights.every(w=>Math.abs(w.reduce((a,b)=>a+b,0)-1)<.002));assert.ok(joints.every(row=>row.every(j=>j<hero.json.skins[0].joints.length)));triangles+=indices.length/3;
}
assert.ok(triangles<28000,'single hero geometry budget');
for(const part of ['Hair','PonytailTie','Mask','Collar','Harness','Belt','HipPanels','Gloves','Boots','MapleArms','MapleSleeves','MapleCape','MapleShoulderMetal','MapleBracerMetal','MapleGreavesMetal','FoxCharm'])assert.ok([...active].some(i=>hero.json.meshes[i].name==='HeroReference'+part),part);
assert.equal(hero.json.extras.heroReference.style,'maple-reference-sheet');
const cape=hero.json.meshes.find(m=>m.name==='HeroReferenceMapleCape');
assert.deepEqual(cape.extras.targetNames,['MapleFlutter']);
const cloth=cape.primitives[0];
assert.ok(values(hero,cloth.targets[0].POSITION).some(row=>row.some(v=>Math.abs(v)>.01)),'cape has a deformation target');
const uv=values(hero,cloth.attributes.TEXCOORD_0);
assert.ok(uv.every(pair=>pair.every(v=>v>=0&&v<=1))&&uv.some(([u,v])=>u===1&&v===1));
const pbr=hero.json.materials[cloth.material];
for(const map of [pbr.pbrMetallicRoughness.baseColorTexture,pbr.pbrMetallicRoughness.metallicRoughnessTexture,pbr.normalTexture,pbr.occlusionTexture,pbr.emissiveTexture]){
 const embedded=hero.json.images[hero.json.textures[map.index].source];
 assert.equal(embedded.mimeType,'image/png');
 const view=hero.json.bufferViews[embedded.bufferView];
 assert.equal(hero.bin.toString('ascii',view.byteOffset+1,view.byteOffset+4),'PNG');
}
assert.ok(hero.json.extras.heroReference.integratedMask);
assert.ok(hero.json.scenes[hero.json.scene||0].extras.heroReference.integratedMask,'GLTFLoader scene exposes the integrated-mask flag');
console.log('PASS: reference GLB keeps rig, bind matrices, native face and blink; valid skinned geometry, embedded textures and mobile geometry/file budgets. '+triangles+' triangles.');
