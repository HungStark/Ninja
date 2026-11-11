import assert from 'node:assert/strict';
import * as T from 'three';
import {DarkDomain} from '../src/dark-domain.js';
const element={innerHTML:'',style:{setProperty(){}},classList:{toggle(){},remove(){}}};
globalThis.document={getElementById:()=>element,querySelector:()=>element,body:element};
for(const reduced of [false,true]){
  const scene=new T.Scene(),fog=new T.FogExp2('#43536a',.009),background=new T.Color('#43536a');scene.fog=fog;scene.background=background;
  const sun=new T.DirectionalLight('#dbc4a9',.7),ambient=new T.HemisphereLight('#aebfd8','#4b535c',.38),disabled=new T.PointLight('#fff',2),terrain=new T.Group(),hidden=new T.Group(),sky=new T.Mesh(new T.SphereGeometry(100),new T.MeshBasicMaterial({color:'#43536a',side:T.BackSide}));disabled.visible=hidden.visible=false;
  const material=new T.MeshToonMaterial({color:'#89a67d'}),rock=new T.Mesh(new T.BoxGeometry(),material),originalVertices=rock.geometry.attributes.position.array.slice(),originalColor=material.color.clone();terrain.add(rock);
  const glow=new T.MeshStandardMaterial({emissive:'#ffdc9e',emissiveIntensity:.4});terrain.add(new T.Mesh(new T.SphereGeometry(.3),glow));
  const environment=[sun,ambient,disabled,terrain,hidden,sky];scene.add(...environment);const original=environment.map(o=>o.visible),domain=new DarkDomain({scene,environment,sky},reduced);
  const checkScene=()=>{assert.deepEqual(environment.map(o=>o.visible),original);assert.equal(scene.fog,fog);assert.equal(scene.background,background);assert.equal(sun.intensity,.7);assert.equal(ambient.intensity,.38);assert.deepEqual(rock.geometry.attributes.position.array,originalVertices);assert.ok(material.color.equals(originalColor));};
  const compile=m=>{const shader={uniforms:{},vertexShader:T.ShaderLib.toon.vertexShader,fragmentShader:T.ShaderLib.toon.fragmentShader};m.onBeforeCompile(shader,{});return shader;};
  const shader=compile(material);assert.ok(shader.uniforms.uDomainCoat);assert.equal(shader.uniforms.uDomainCoat.value,0);assert.ok(!shader.fragmentShader.includes('discard'),'coating does not cut away existing surfaces');assert.equal(sky.material.onBeforeCompile,T.Material.prototype.onBeforeCompile,'sky is not ink-coated');assert.equal(glow.onBeforeCompile,T.Material.prototype.onBeforeCompile,'luminous fixtures keep their glow');
  assert.equal(domain.begin('player',30),true);domain.advance(reduced?.5:1.5,1.5);assert.equal(domain.intro.state().spreading,true);checkScene();domain.advance(1.5,3);assert.equal(domain.usable,true);assert.equal(domain.life,30);assert.equal(shader.uniforms.uDomainCoat.value,1);assert.equal(domain.floor.visible,false,'no flat ink plane covers the landscape');checkScene();
  // Materials in a lazily-created indoor arena must receive the same coating.
  const arena=new T.Group(),indoorMaterial=new T.MeshStandardMaterial({color:'#99815c'});arena.add(new T.Mesh(new T.BoxGeometry(),indoorMaterial));environment.push(arena);scene.add(arena);domain.intro.setActive(true);const indoorShader=compile(indoorMaterial);assert.equal(indoorShader.uniforms.uDomainCoat.value,1);environment.pop();arena.removeFromParent();
  domain.updateSubmergeView(-3,-1);assert.equal(domain.floor.visible,true,'the underwater ink veil is available while diving');domain.updateSubmergeView(-3,80);assert.equal(domain.floor.visible,false,'the tactical camera never gets a flat replacement floor');
  domain.advance(30.01,33.01);assert.equal(domain.active,false);assert.equal(shader.uniforms.uDomainCoat.value,0);checkScene();domain.sustain('enemy');assert.equal(domain.usable,true);assert.equal(domain.permanent,true);assert.equal(shader.uniforms.uDomainCoat.value,1);checkScene();domain.reset();assert.equal(shader.uniforms.uDomainCoat.value,0);assert.equal(domain.active,false);checkScene();
}
console.log('PASS: ink coats existing geometry without hiding terrain, sky or lights; normal/reduced-motion spread, lazy indoor surfaces, underwater veil, expiry/permanent domains and reset preserve/restore the scene.');
