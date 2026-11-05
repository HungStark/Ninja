import * as T from 'three';

// A short boarding step is the entire visible voyage. The map loader handles the sea crossing.
export const BOARDING_SECONDS=.85;
export function buildVillageHarbor({land,box,cyl,mesh,M,heightAt},dock){
  const root=new T.Group();root.name='village-harbor-'+dock.id;root.userData.noCollision=true;
  root.position.set(dock.x,heightAt(dock.x,dock.z),dock.z);
  root.rotation.y=Math.atan2(dock.x,dock.z);land.add(root);
  const wood=M('#92704b'),dark=M('#4e3c2b'),water=M('#236783');
  const pool=mesh(new T.CircleGeometry(7,32),water,root,0,.04,4.7);pool.rotation.x=-Math.PI/2;
  for(let i=0;i<12;i++)box(root,wood,0,.13,i*.48-2,3.6,.18,.43);
  for(const x of [-1.8,1.8])for(const z of [-1.7,1.7,3.2])cyl(root,dark,x,.45,z,.13,1.5,8);
  const boat=new T.Group();boat.name='inter-village-boat';boat.position.set(0,.28,5.2);root.add(boat);
  const hull=mesh(new T.CylinderGeometry(1.5,1,4,6),dark,boat,0,-.35,0);hull.rotation.x=Math.PI/2;hull.scale.y=.43;
  box(boat,wood,0,0,0,2.4,.16,3.6);
  for(const x of [-1.2,1.2])box(boat,dark,x,.4,0,.16,.75,3.6);
  cyl(boat,dark,0,2,.25,.08,4,8);box(boat,M('#eee1b1'),.8,2.7,.25,1.5,1.65,.06);
  root.updateMatrixWorld(true);const board=root.localToWorld(new T.Vector3(0,.38,4.5));
  dock.board=[board.x,board.y,board.z];return root;
}
