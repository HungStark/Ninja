import * as T from 'three';
import {scaleBuildingUVs} from './adventure-materials.js';

export function detailVillageHouse(c,g,{w,d,h,stilt,index}){
 if(!c.surfaces)return;
 const {box,cyl,mesh,M,surfaces:s,id}=c,detail=new T.Group();detail.name=id+'-house-craft';detail.userData.noCollision=true;g.add(detail);
 const wood=s.wood,stone=s.stone,trim=M(id==='water'?'#d1c7a2':id==='lightning'?'#b59968':'#d9c5a0'),metal=M('#514c48'),front=d/2;
 for(let floor=0;floor<Math.round(h/2.7);floor++)for(const side of [-1,1]){
  const y=stilt+1.65+floor*2.5,x=side*w*.31;
  box(detail,wood,x,y-.51,front+.2,.94,.13,.34);box(detail,trim,x,y+.52,front+.18,.91,.11,.2);
  for(const hand of [-1,1]){const shutter=box(detail,wood,x+hand*.47,y,front+.22,.2,.78,.065);shutter.rotation.y=hand*.22;for(let k=0;k<4;k++)box(detail,trim,x+hand*.47,y-.26+k*.17,front+.27,.17,.025,.025);}
 }
 for(const side of [-1,1]){box(detail,wood,side*(w/2+.045),stilt+1.6,0,.09,1.2,1.15);box(detail,M('#a8b6aa'),side*(w/2+.1),stilt+1.6,0,.035,.86,.87);for(let k=-1;k<=1;k++)box(detail,wood,side*(w/2+.13),stilt+1.6,k*.3,.04,.94,.035);}
 box(detail,trim,0,stilt+2.24,front+.16,1.25,.2,.1);box(detail,M(c.v.color),0,stilt+2.24,front+.22,.3,.14,.025);
 for(let k=0;k<5;k++)box(detail,trim,-.32+k*.16,stilt+1,front+.11,.018,1.8,.025);
 cyl(detail,metal,.25,stilt+1.05,front+.2,.055,.09,7).rotation.x=Math.PI/2;
 if(id==='water'){
  for(let k=0;k<Math.ceil((w+1)*3);k++)box(detail,wood,-(w+1)/2+k/3,stilt+.145,0,.018,.025,d+1);
  for(const side of [-1,1]){box(detail,wood,side*(w/2+.045),stilt+.48,0,.1,.85,d);for(let k=0;k<7;k++)box(detail,trim,side*(w/2+.1),stilt+.22+k*.09,0,.018,.016,d-.12);for(const z of [-d*.42,d*.42])for(let k=0;k<3;k++){const tie=mesh(new T.TorusGeometry(.17,.022,4,12),M('#b4a17a'),detail,side*w*.42,.28+k*.09,z);tie.rotation.x=Math.PI/2;}}
  for(let k=0;k<6;k++){box(detail,M('#6a766b'),-w*.42+k*.19,stilt+.95,front+.3,.018,1.3,.018);box(detail,M('#6a766b'),-w*.42+.48,stilt+.3+k*.24,front+.3,1.06,.018,.018);}
  for(let k=0;k<5;k++){const fish=mesh(new T.OctahedronGeometry(.16),M('#b4c2b4'),detail,w*.38,stilt+1.4-k*.2,front+.24);fish.scale.set(1,.55,.3);}
  box(detail,wood,-w*.34,stilt+.5,front+.48,.6,.7,.65);
 }else if(id==='fire'){
  for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<2;col++)box(detail,row%2?stone:M('#8a7762'),side*(w/2-.12)-side*col*.29,.18+row*.28,front+.07,.28,.25,.15);
  for(let row=0;row<2;row++)for(let k=0;k<5;k++){const x=-w*.35+k*.29+(row%2)*.13;if(Math.abs(x)<.93)continue;box(detail,M(row%2?'#a47d5c':'#b48e69'),x,.38+row*.19,front+.08,.27,.17,.08);}
  const top=h+.06+(w/2+.55)*Math.tan(.44);for(let k=0;k<Math.ceil(d/.4);k++){const cap=cyl(detail,M('#aa6242'),0,top+.13,-d/2+k*.4,.17,.38,7);cap.rotation.x=Math.PI/2;}
  if(index%3===0){box(detail,stone,-w*.28,h+.7,-d*.2,.65,2.3,.65);box(detail,M('#3c3531'),-w*.28,h+1.88,-d*.2,.5,.06,.5);}
  for(let k=0;k<4;k++)box(detail,M('#8f4e36'),w*.4,.3+k*.1,front+.55,.55,.08,.55);
 }else if(id==='lightning'){
  for(let k=0;k<6;k++){const a=k*Math.PI/3;box(detail,stone,Math.sin(a)*w*.56,h/2,Math.cos(a)*w*.56,.18,h,.18);}
  for(const y of [.22,2.75,h-.15])cyl(detail,trim,0,y,0,w*.605,.1,6);
  for(let k=0;k<3;k++){const insulator=mesh(new T.TorusGeometry(.24,.055,5,12),M('#c8c5b8'),detail,0,h+.8+k*.26,0);insulator.rotation.x=Math.PI/2;}
  cyl(detail,trim,w*.46,h/2,-d*.35,.07,h+.5,7);box(detail,stone,0,.12,front+.48,1.65,.24,1.3);box(detail,wood,0,2.43,front+.5,1.8,.12,1.4);
 }else if(id==='wind'){
  for(const side of [-1,1]){const brace=box(detail,wood,side*w*.37,h*.48,front+.14,.12,h*.85,.12);brace.rotation.z=-side*.21;}
  for(const y of [.35,h-.15])box(detail,wood,0,y,front+.09,w,.14,.14);
  for(let k=0;k<3;k++){const band=mesh(new T.TorusGeometry(w*.65*Math.sqrt(1-((k+1)/4)**2),.035,4,28),trim,detail,0,h+(k+1)*w*.65*.8/4,0);band.rotation.x=Math.PI/2;band.scale.y=d/w;}
  for(let k=0;k<3;k++)cyl(detail,M(k%2?'#b39c64':'#9f8753'),w*.35,.24,front+.38+k*.17,.23,.44,8);
 }
 if(index%4===1){const cloth=[id==='water'?'#7faaa0':id==='fire'?'#a95236':id==='lightning'?'#8a7c9c':'#bdab75','#d4c49b'];for(let k=0;k<5;k++){const awning=box(detail,M(cloth[k%2]),(k-2)*w/5,stilt+2.35,front+.66,w/5+.02,.055,1.35);awning.rotation.x=.12;box(detail,M(cloth[k%2]),(k-2)*w/5,stilt+2.18,front+1.32,w/5,.28,.04);}}
 scaleBuildingUVs(g);
}
