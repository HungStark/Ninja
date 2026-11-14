import * as T from 'three';import {createAdventureScene} from '../src/adventure-scene.js';import {newJourney} from '../src/adventure-data.js';
window.run=async()=>{
 const r=new T.WebGLRenderer({antialias:true});r.setSize(915,412);r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;document.body.append(r.domElement);
 const gl=r.getContext(),buffers=new Set(),textures=new Set(),createBuffer=gl.createBuffer.bind(gl),deleteBuffer=gl.deleteBuffer.bind(gl),createTexture=gl.createTexture.bind(gl),deleteTexture=gl.deleteTexture.bind(gl);
 gl.createBuffer=()=>{const value=createBuffer();buffers.add(value);return value;};gl.deleteBuffer=value=>{buffers.delete(value);deleteBuffer(value);};gl.createTexture=()=>{const value=createTexture();textures.add(value);return value;};gl.deleteTexture=value=>{textures.delete(value);deleteTexture(value);};
 const w=createAdventureScene(),save=newJourney();save.story.stage='infiltrate';save.story.guardianRestored=true;w.setQuality(1);
 const cycles=[];
 for(const id of ['fire','water','fire','water','fire','water']){
  save.village=id;w.load(id,save);await w.charactersReady();for(let i=0;i<3;i++){w.update(1/60,false);r.render(w.scene,w.camera);}gl.finish();
  const frames=[],updates=[];for(let i=0;i<12;i++){const t=performance.now();w.update(1/60,false);updates.push(performance.now()-t);r.render(w.scene,w.camera);gl.finish();frames.push(performance.now()-t);}
  frames.sort((a,b)=>a-b);const meshes=[];w.scene.traverseVisible(o=>{if(o.isMesh)meshes.push({name:o.name,triangles:(o.geometry.index?.count||o.geometry.attributes.position.count)/3,instances:o.isInstancedMesh?o.count:1,material:o.material.uuid,range:o.geometry.boundingSphere?.radius});});
  cycles.push({id,meanFrameMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95FrameMs:frames.at(-1),meanUpdateMs:updates.reduce((a,b)=>a+b,0)/updates.length,calls:r.info.render.calls,triangles:r.info.render.triangles,geometries:r.info.memory.geometries,textures:r.info.memory.textures,liveBuffers:buffers.size,liveTextures:textures.size,largest:meshes.sort((a,b)=>b.triangles*b.instances-a.triangles*a.instances).slice(0,8)});
  if(cycles.length===1){r.render(w.scene,w.camera);const p=new Uint8Array(915*412*4);gl.readPixels(0,0,915,412,gl.RGBA,gl.UNSIGNED_BYTE,p);let s='';for(let i=0;i<p.length;i+=32768)s+=String.fromCharCode(...p.subarray(i,i+32768));window.firstPixels=btoa(s);window.firstImage=r.domElement.toDataURL();}
 }return cycles;
};
