import * as T from 'three';

// Curved olive plates, gold piping, spiral seals, blossoms and a red braided tassel.
// Geometry is authored in the same joint space as the ordinary equipment.
function workshop(material){
  const olive=material('#49503a',true),dark=material('#292c23',true),gold=material('#d3a658',true),red=material('#962f24');
  const add=(p,g,m,x=0,y=0,z=0,name='mythic-plate')=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.name=name;p.add(o);return o;};
  const panel=(p,pts,z,depth=.025,m=olive,name)=>{const shape=new T.Shape();pts.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return add(p,new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,bevelSegments:1,steps:1}),m,0,0,z,name);};
  const line=(p,a,b,r=.007,m=gold,name='mythic-gold-inlay')=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),o=add(p,new T.CylinderGeometry(r,r,v.length(),5),m,...av.add(bv).multiplyScalar(.5).toArray(),name);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;};
  const outline=(p,pts,z,r=.008,m=gold)=>pts.forEach((v,i)=>line(p,[...v,z],[...pts[(i+1)%pts.length],z],r,m));
  const spiral=(p,x,y,z,r)=>{let last;for(let i=0;i<23;i++){const a=i/22*Math.PI*3.4,s=r*(.12+.88*i/22),point=[x+Math.cos(a)*s,y+Math.sin(a)*s,z];if(last)line(p,last,point,.006,gold,'mythic-spiral-seal');last=point;}};
  const blossom=(p,x,y,z,s=.018)=>{for(let i=0;i<5;i++){const a=i*Math.PI*2/5,o=add(p,new T.SphereGeometry(s,5,4),gold,x+Math.cos(a)*s,y+Math.sin(a)*s,z,'mythic-blossom');o.scale.set(.65,1,.3);o.rotation.z=a;}add(p,new T.SphereGeometry(s*.35,5,4),dark,x,y,z+.003);};
  const waves=(p,x,y,z,r)=>{for(let j=0;j<3;j++){let last;for(let i=0;i<=10;i++){const a=.15+i/10*Math.PI*.8,point=[x+Math.cos(a)*(r+j*.018),y+Math.sin(a)*(r+j*.018),z];if(last)line(p,last,point,.0045);last=point;}}};
  const tassel=(p,x,y,z,length=.22)=>{for(const side of [-1,1])for(let i=0;i<9;i++){const a=i*.7,b=(i+1)*.7;line(p,[x+Math.cos(a)*.011*side,y-i*.012,z+Math.sin(a)*.009],[x+Math.cos(b)*.011*side,y-(i+1)*.012,z+Math.sin(b)*.009],.008,red,'mythic-red-braid');}add(p,new T.TorusGeometry(.025,.005,5,12),gold,x,y-.12,z,'mythic-tassel-knot');for(let i=0;i<7;i++)line(p,[x+(i-3)*.006,y-.15,z],[x+(i-3)*.01,y-.15-length,z],.004,red,'mythic-red-tassel');};
  return {olive,dark,gold,red,add,panel,line,outline,spiral,blossom,waves,tassel};
}
export function buildMythicArmor(anchors,material){
  const {body,shoulders}=anchors,w=workshop(material),{panel,outline,line,spiral,blossom,waves,tassel,gold,dark}=w;
  const chest=[[-.27,2.05],[-.32,1.94],[-.26,1.5],[0,1.36],[.26,1.5],[.32,1.94],[.27,2.05],[.14,1.99],[-.14,1.99]];
  panel(body,chest,.26,.045);outline(body,chest,.32,.012);panel(body,chest,-.32,.035,dark,'mythic-back-cuirass');outline(body,chest,-.33,.011);spiral(body,0,1.79,-.34,.075);
  for(const side of [-1,1]){line(body,[side*.23,1.97,.33],[side*.19,1.54,.33]);line(body,[side*.045,1.93,.33],[side*.035,1.48,.33]);for(let k=0;k<3;k++)line(body,[side*.075,1.93-k*.085,.34],[side*.18,1.98-k*.085,.34],.011);waves(body,side*.15,1.48,.335,.036);line(body,[side*.22,1.62,.335],[side*.15,1.78,.335],.005);blossom(body,side*.18,1.72,.34,.014);}
  const seal=[[-.08,1.98],[0,2.08],[.08,1.98],[0,1.86]];panel(body,seal,.35,.016,gold,'mythic-star-seal');spiral(body,0,1.97,.383,.047);tassel(body,.29,1.87,.12,.25);
  shoulders.forEach((p,i)=>{const side=i?1:-1;const pts=[[-.18,.04],[-.09,.13],[.12,.095],[.27,.015],[.33,-.12],[.2,-.07],[-.14,-.11]];const shape=pts.map(([x,y])=>[x*side,y]);panel(p,shape,-.15,.3,undefined,'mythic-curved-pauldron');outline(p,shape,.16,.012);outline(p,shape,-.16,.012);for(const z of [-.16,.16]){spiral(p,.12*side,-.005,z,.046);blossom(p,-.03*side,.03,z,.018);}for(let k=0;k<3;k++)line(p,[-.13*side,-.08,.16],[.23*side,-.04-k*.025,.16],.006);});
}
export function buildMythicBracer(root,material){
  const {panel,outline,line,spiral,blossom,waves,tassel,dark}=workshop(material),pts=[[-.09,-.045],[-.12,-.12],[-.085,-.35],[0,-.39],[.085,-.35],[.12,-.12],[.09,-.045]];
  panel(root,pts,.11,.045,undefined,'mythic-bracer-face');outline(root,pts,.163,.009);panel(root,pts,-.1,.035,dark,'mythic-bracer-back');outline(root,pts,-.11,.007);
  spiral(root,0,-.17,.169,.045);waves(root,0,-.34,.169,.034);line(root,[-.065,-.29,.169],[.06,-.23,.169],.004);blossom(root,-.04,-.27,.17,.013);tassel(root,.1,-.08,.04,.075);
  for(const y of [-.08,-.3])for(const side of [-1,1])line(root,[side*.1,y,-.09],[side*.1,y,.11],.012);
}
