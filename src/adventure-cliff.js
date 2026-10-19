import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {carveMountainStairs} from './adventure-carved-stairs.js';

export function buildFireCliff(c,route){
  const root=new T.Group();root.name='fire-rock-cliff';c.land.add(root);
  const count=12,cx=88,cz=-96,base=Math.min(...[-1,1].flatMap(x=>[-1,1].map(z=>c.heightAt(cx+x*21,cz+z*22))))-3;
  const profile=[[25,26,base],[20,22,8],[16,18,18],[12,14,27],[9,10.5,36]],rings=profile.map(([rx,rz,y])=>Array.from({length:count},(_,k)=>{const a=k/count*Math.PI*2,jag=Math.sin(a*3+.35)*.65+Math.cos(a*7)*.22;return new T.Vector3(cx+Math.sin(a)*(rx+jag),y,cz+Math.cos(a)*(rz+jag)+Math.max(0,Math.cos(a))**3*4);}));
  const positions=[],colors=[],dark=new T.Color('#535751'),light=new T.Color('#858477');
  const triangle=(a,b,d,tint)=>{const color=dark.clone().lerp(light,tint);for(const p of [a,b,d]){positions.push(...p.toArray());colors.push(color.r,color.g,color.b);}};
  for(let row=0;row<rings.length-1;row++)for(let k=0;k<count;k++){const j=(k+1)%count,t=.12+(Math.sin(k*3.1+row)*.5+.5)*.48;triangle(rings[row][k],rings[row][j],rings[row+1][k],t);triangle(rings[row][j],rings[row+1][j],rings[row+1][k],t*.85);}
  for(let k=0;k<count;k++)triangle(new T.Vector3(cx,36,cz),rings.at(-1)[k],rings.at(-1)[(k+1)%count],.4);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const mountain=c.mesh(geo,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,side:T.DoubleSide,shadowSide:T.BackSide}),root);mountain.name='fire-cliff-mass';const solid=c.solidGeometry(mountain,{name:'fire-cliff-mass'});
  const sample=solid.topAt,original=mountain.geometry;
  mountain.geometry=carveMountainStairs(original,sample,route);original.dispose();
  solid.topAt=(x,z)=>{const y=route.carved.heightAt(x,z);return Number.isFinite(y)?y:sample(x,z);};
  solid.bottomAt=()=>base;
  solid.stepableAt=(x,z)=>Number.isFinite(route.carved.heightAt(x,z));
  root.userData.carved=true;root.userData.stepCount=route.carved.stepCount;
  // A broken crown above the rear edge breaks up the old flat, conical summit.
  // It stays behind the lotus clearing and never caps the playable landing.
  const crown=c.mesh(new T.IcosahedronGeometry(1,0),c.M('#858773'),root,82.5,42,-102.5);crown.scale.set(5.2,7.1,4.1);crown.rotation.set(.12,.35,-.16);c.solidGeometry(crown,{name:'fire-cliff-crown'});
  for(const [x,y,z,sx,sy,sz] of [[75,22,-99,4.5,12,5],[101,23,-100,4,13,5],[90,35,-107,4.5,11,4]]){const spur=c.mesh(new T.IcosahedronGeometry(1,0),c.M('#666b62'),root,x,y,z);spur.scale.set(sx,sy,sz);spur.rotation.y=x*.13;spur.name='fire-cliff-fractured-spur';c.solidGeometry(spur,{name:spur.name});}
  for(let k=0;k<6;k++){const a=.8+k*.85,x=cx+Math.sin(a)*23,z=cz+Math.cos(a)*24;if(c.clearCorridor(x,z,3))continue;const rock=c.mesh(new T.IcosahedronGeometry(2.5+k%3*.4,0),c.M('#666b62'),root,x,c.heightAt(x,z)+1.2,z);rock.scale.set(1,1.1,1);c.solidGeometry(rock,{name:'fire-cliff-base-rock'});}
  // One vertex-coloured draw for the whole static cliff, including its ledges.
  // Collision shapes above stay independent from this render-only mesh.
  root.updateWorldMatrix(true,true);const parts=[];
  for(const object of [...root.children]){const g=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();g.applyMatrix4(object.matrixWorld);g.deleteAttribute('uv');if(!g.attributes.color){const color=object.material.color,values=new Float32Array(g.attributes.position.count*3);for(let k=0;k<values.length;k+=3){values[k]=color.r;values[k+1]=color.g;values[k+2]=color.b;}g.setAttribute('color',new T.BufferAttribute(values,3));}parts.push(g);root.remove(object);object.geometry.dispose();}
  const combined=c.mesh(mergeGeometries(parts,false),mountain.material,root);combined.name='fire-cliff-lowpoly';combined.userData.noCollision=true;for(const part of parts)part.dispose();
  root.userData.renderTriangles=combined.geometry.attributes.position.count/3;
  return root;
}
