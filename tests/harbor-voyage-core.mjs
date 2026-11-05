import assert from 'node:assert/strict';
import * as T from 'three';
import {buildVillageHarbor,planHarbor,harborGroundHeight,harborDistance,harborDeckAt,createHarborPassage,HARBOR_TIMING} from '../src/village-harbor.js';

const mesh=(g,m,p,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;};
const box=(p,m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);
const cyl=(p,m,x,y,z,r,h,n)=>mesh(new T.CylinderGeometry(r,r,h,n),m,p,x,y,z);
for(const [x,z] of [[118,0],[-118,0],[65,120],[-80,-119]]){
 const land=new T.Group(),dock={id:'wood',x,z},plan=planHarbor(dock,140,2),h=buildVillageHarbor({id:'earth',land,mesh,box,cyl,M:color=>new T.MeshStandardMaterial({color}),solidMesh:()=>{}},dock,plan),hero=new T.Group();
 hero.position.set(x,plan.deckY,z);land.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(h.water);assert.ok(Math.max(...bounds.getSize(new T.Vector3()).toArray())>300,'water reaches past the terrain and continues towards the horizon');
 const deck=new T.Box3().setFromObject(h.boat.getObjectByName('passenger-boat-deck'));
 assert.ok(deck.getSize(new T.Vector3()).length()>11,'a passenger boat fits the hero and skipper');
 assert.ok(h.skipper.root.parent===h.boat);assert.ok(h.skipper.root.userData.villager.job==='boatman');
 for(let along=9;along<=plan.edge+15;along+=2){const p=h.point(0,along);assert.ok(harborDistance(plan,p.x,p.z)<0);assert.ok(harborGroundHeight([plan],p.x,p.z,2)<plan.waterY-1,'continuous submerged seabed to the map edge');assert.equal(harborDeckAt(plan,p.x,p.z),false);}
 assert.equal(harborDeckAt(plan,x,z),true);
 const outgoing=createHarborPassage(h,hero),before=h.boat.getWorldPosition(new T.Vector3());
 assert.equal(outgoing.advance(.4).stage,'boarding');assert.equal(h.boat.getWorldPosition(new T.Vector3()).distanceTo(before),0,'boat waits for the hero to board');
 assert.equal(outgoing.advance(.5).stage,'outbound');const a=outgoing.state();assert.equal(a.complete,false);
 const b=outgoing.advance(1);assert.ok(new T.Vector3(...b.boat).distanceTo(new T.Vector3(...a.boat))>3,'boat visibly leaves its berth');
 const heroOffset=new T.Vector3(...b.passenger).sub(new T.Vector3(...b.boat)),crewOffset=new T.Vector3(...b.skipper).sub(new T.Vector3(...b.boat));
 const c=outgoing.advance(.4);assert.ok(heroOffset.distanceTo(new T.Vector3(...c.passenger).sub(new T.Vector3(...c.boat)))<.02);assert.ok(crewOffset.distanceTo(new T.Vector3(...c.skipper).sub(new T.Vector3(...c.boat)))<.02,'skipper rides with the boat');
 const departed=outgoing.advance(10);assert.equal(departed.complete,true);assert.ok(Math.max(Math.abs(departed.boat[0]),Math.abs(departed.boat[2]))>140,'loading begins only after the boat reaches the map edge');
 const incoming=createHarborPassage(h,hero,{incoming:true}),atEdge=incoming.state();assert.equal(atEdge.stage,'inbound');assert.ok(Math.max(Math.abs(atEdge.boat[0]),Math.abs(atEdge.boat[2]))>140);
 assert.equal(incoming.advance(HARBOR_TIMING.inbound-.1).complete,false);assert.equal(incoming.advance(.2).stage,'disembark');assert.equal(incoming.state().complete,false,'controls remain locked during disembarking');
 const landed=incoming.advance(2);assert.equal(landed.complete,true);assert.ok(hero.position.distanceTo(h.point(0,0))<1e-8,'hero finishes on the pier');assert.ok(landed.passenger.every(Number.isFinite));
 const coarse=createHarborPassage(h,hero,{incoming:true});coarse.advance(100);assert.ok(hero.position.distanceTo(h.point(0,0))<1e-8,'large steps do not skip final placement');
 h.skipper.dispose();
}
console.log('PASS: open sea and submerged channels in four directions, larger boats and skipper attachment, boarding/outbound/inbound/disembark stages, map-edge departure, synchronized passengers and safe final pier placement.');
