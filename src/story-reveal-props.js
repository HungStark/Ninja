import * as T from 'three';
import {buildGuardianBeast} from './guardian-beasts.js';
import {disposeSceneResources} from './scene-disposal.js';

function part(parent,geometry,material,x=0,y=0,z=0){
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  mesh.castShadow=true;
  parent.add(mesh);
  return mesh;
}

const metal=color=>new T.MeshStandardMaterial({color,roughness:.52,metalness:.55});
const glow=(color,intensity)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.38});

export function buildChakraDevice(){
  const device=new T.Group();
  device.name='water-chakra-device';
  const frame=metal('#263b43'),trim=metal('#93724a'),conduit=glow('#44abc2',.38),crystal=glow('#ab67f3',.85);
  part(device,new T.BoxGeometry(2.55,.22,1.24),frame,0,.11,0);
  part(device,new T.CylinderGeometry(.57,.7,.32,8),trim,0,.35,0);
  part(device,new T.OctahedronGeometry(.7),crystal,0,1.28,0).scale.set(.73,1.29,.73);
  for(const angle of [0,Math.PI/2]){
    const ring=part(device,new T.TorusGeometry(.83,.075,8,32),trim,0,1.23,0);
    ring.rotation.y=angle;
  }
  for(const side of [-1,1]){
    part(device,new T.CylinderGeometry(.18,.26,1.06,8),frame,side, .76,0);
    part(device,new T.CylinderGeometry(.13,.15,.36,8),conduit,side,1.31,0);
    const pipe=new T.CatmullRomCurve3([[side,.94,0],[side,.78,.53],[side*.65,.4,.53],[side*.25,.42,.08]].map(point=>new T.Vector3(...point)));
    part(device,new T.TubeGeometry(pipe,12,.052,6),conduit);
  }
  return device;
}

export function stageIceCapture(harbor){
  const boat=new T.Group();
  boat.name='ice-capture-boat';
  boat.userData.storyInsertOffset=[1,0,.36];
  const start=harbor.moored+12;
  boat.position.set(1.35,harbor.deckY,start);
  boat.visible=false;
  // The harbor owns the shared hull resources. The captive and its seal belong to this shot.
  for(const child of harbor.boat.children){
    if(child!==harbor.skipper.root)boat.add(child.clone());
  }
  const captive=new T.Group();
  captive.position.z=2.7;
  boat.add(captive);
  const tiger=buildGuardianBeast({id:'ice',M:metal,mesh:(geometry,material,parent,x,y,z)=>part(parent,geometry,material,x,y,z)});
  tiger.name='captive-ice-tiger';
  tiger.scale.set(.62,.53,.62);
  const bounds=new T.Box3().setFromObject(tiger);
  tiger.position.y=-bounds.min.y+.04;
  captive.add(tiger);
  const seal=glow('#b65fff',1.2);
  for(const [z,tilt] of [[-.73,.22],[.2,-.22]]){
    const loop=part(captive,new T.TorusGeometry(1,.045,6,36),seal,0,1.09,z);
    loop.name='ice-capture-seal';
    loop.scale.set(.91,1.12,1);
    loop.rotation.x=tilt;
  }
  harbor.root.add(boat);

  let age=0;
  return {boat,
    depart(){boat.visible=true;const wake=boat.getObjectByName('passenger-boat-wake');if(wake)wake.visible=true;},
    update(dt){
      if(!boat.visible)return;
      age+=dt;
      boat.position.z=start+Math.min(age*1.6,8);
      boat.position.y=harbor.deckY+Math.sin(age*2.1)*.07;
      boat.rotation.z=Math.sin(age*1.6)*.018;
      seal.emissiveIntensity=1.05+.35*Math.sin(age*4.3);
    },
    dispose(){disposeSceneResources(captive);boat.removeFromParent();}
  };
}
