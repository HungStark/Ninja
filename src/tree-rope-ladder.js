import * as T from 'three';
import {WOOD_SACRED_TREE} from './sacred-tree.js';

export function buildTreeRopeLadder(c,route,parent){
  const root=new T.Group();root.name='tree-house-rope-ladder';root.userData.noCollision=true;parent.add(root);
  const x=WOOD_SACRED_TREE.ladderX,z=WOOD_SACRED_TREE.ladderZ,bottom=route.fromY+.2,top=route.toY+.8,height=top-bottom;
  const rope=c.M('#dfd3b4'),twist=c.M('#a99c82'),red=c.M('#ba382a');
  for(const side of [-1,1]){
    const line=c.cyl(root,rope,x+side*.65,bottom+height/2,z,.065,height,8);line.name='ladder-rope';
    const points=Array.from({length:241},(_,i)=>{const t=i/240,a=t*height*Math.PI*5;return new T.Vector3(x+side*.65+Math.cos(a)*.057,bottom+t*height,z+Math.sin(a)*.057);});
    c.mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),240,.012,4,false),twist,root).name='ladder-rope-braid';
  }
  const heights=[];for(let y=bottom+.3;y<route.toY-.12;y+=.45)heights.push(y);
  const rungs=new T.InstancedMesh(new T.CylinderGeometry(.07,.07,1.48,8),red,heights.length),knots=new T.InstancedMesh(new T.TorusGeometry(.08,.018,5,10),rope,heights.length*2),dummy=new T.Object3D();
  rungs.name='red-ladder-rungs';knots.name='ladder-knots';rungs.castShadow=rungs.receiveShadow=true;root.add(rungs,knots);
  heights.forEach((y,i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,0,Math.PI/2);dummy.updateMatrix();rungs.setMatrixAt(i,dummy.matrix);for(const [j,side]of [-1,1].entries()){dummy.position.set(x+side*.65,y,z);dummy.rotation.set(0,Math.PI/2,0);dummy.updateMatrix();knots.setMatrixAt(i*2+j,dummy.matrix);}});
  root.traverse(o=>{o.userData.noCollision=true;});
  route.ladderPath=[new T.Vector3(...[route.from[0],route.fromY,route.from[1]]),new T.Vector3(x,route.fromY,z+.55),new T.Vector3(x,route.toY,z+.55),new T.Vector3(route.to[0],route.toY,route.to[1])];
  route.ladderDistances=[0];for(let i=1;i<route.ladderPath.length;i++)route.ladderDistances.push(route.ladderDistances.at(-1)+route.ladderPath[i].distanceTo(route.ladderPath[i-1]));
  route.ladderLength=route.ladderDistances.at(-1);
  c.reserveLane({a:[x,5],b:[x,10],width:3});
  return root;
}
