import assert from 'node:assert/strict';
import * as T from 'three';
import { createHands } from '../src/hands.js';

const hands=await createHands(),hand=hands.hands[0];
const skin=hand.wrapper.getObjectByName('hand_skin');
const geometry=new T.Mesh(skin.geometry,new T.MeshBasicMaterial({side:T.DoubleSide}));
geometry.updateMatrixWorld(true);
const ray=new T.Raycaster();
function surface(x,y,front=true){
  ray.set(new T.Vector3(x,y,front?1:-1),new T.Vector3(0,0,front?-1:1));
  const hits=ray.intersectObject(geometry);
  assert.ok(hits.length,'Hand must have a surface on both sides');
  return hits[0].point.z;
}
const section=(x,y)=>surface(x,y)-surface(x,y,false);
const center=section(0,-.015),thenar=section(-.035,-.015);
assert.ok(center>.05,'Palm must retain real depth rather than two shallow sheets');
assert.ok(thenar>center+.006,'Thumb muscle pad must form a distinct 3D mass');
assert.ok(surface(0,-.015)-surface(.036,-.015)>.003,'Dorsal palm must arch across its width');
const y=.088+.192*.46,depth=section(-.015,y);
const centerZ=(surface(-.015,y)+surface(-.015,y,false))/2;
function middleSide(sign){
  ray.set(new T.Vector3(sign,y,centerZ),new T.Vector3(-sign,0,0));
  return ray.intersectObject(geometry).find(h=>Math.abs(h.point.x+.015)<.022).point.x;
}
const width=middleSide(1)-middleSide(-1);
assert.ok(depth/width>.8&&depth/width<1.2,'Finger must have a full rounded cross-section');
let maximumNailGap=0;
hand.wrapper.traverse(o=>{
  if(!o.isMesh||!o.name.endsWith('_nail'))return;
  const p=o.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const gap=p.getZ(i)-surface(p.getX(i),p.getY(i));
    maximumNailGap=Math.max(maximumNailGap,Math.abs(gap));
    assert.ok(Math.abs(gap)<.0005,'Nail must hug the curved fingertip, without a raised plate');
  }
});
for(let i=0;i<40;i++)hands.update(1/60,0,-1,false,false,0,false);
for(const h of hands.hands){
  assert.deepEqual(h.wrapper.position.toArray(),[h.side*.33,-.39,-.76],'FPS framing stays fixed');
  const expected=new T.Quaternion().setFromEuler(new T.Euler(.10,h.side*.10,h.side*.47));
  assert.ok(h.wrapper.quaternion.angleTo(expected)<1e-7,'FPS wrist angle stays fixed');
}
console.log('PASS: volumetric palm, thenar pad, dorsal arch, rounded phalanx cross-section, close-fitting thin nails and preserved FPS framing.',JSON.stringify({center,thenar,fingerDepth:depth,fingerWidth:width,maximumNailGap}));
