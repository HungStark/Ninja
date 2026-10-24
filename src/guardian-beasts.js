import * as T from 'three';
export const GUARDIAN_FORMS={fire:{name:'Cửu Viêm Hồ',shape:'nine-tailed-fox'},water:{name:'Thủy Long',shape:'serpent-dragon'},lightning:{name:'Lôi Thần Lang',shape:'thunder-wolf'},wind:{name:'Phong Ưng',shape:'wind-eagle'},earth:{name:'Sơn Quy',shape:'mountain-tortoise'},wood:{name:'Thanh Lộc',shape:'forest-stag'},ice:{name:'Băng Hổ',shape:'ice-tiger'},light:{name:'Kim Ưng',shape:'golden-eagle'},dark:{name:'U Minh Lang',shape:'shadow-wolf'},nameless:{name:'Vô Danh Thú',shape:'faceless-spirit'}};

// One authored low-poly model is shared by exploration, transformations and the Dark aura.
export function buildGuardianBeast(c){
 const {id,mesh}=c,root=new T.Group(),materials=new Map(),mat=(color,glow=0)=>{const key=color+glow;if(!materials.has(key))materials.set(key,c.M(color,glow));return materials.get(key);};root.name='guardian-'+GUARDIAN_FORMS[id].shape;root.userData.guardian={...GUARDIAN_FORMS[id],village:id};
 const ell=(name,p,s,color)=>{const m=mesh(new T.IcosahedronGeometry(1,1),mat(color),root,...p);m.name=name;m.scale.fromArray(s);return m;};
 const rod=(name,a,b,r,color,r2=r*.75)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=mesh(new T.CylinderGeometry(r2,r,d.length(),7),mat(color),root,...av.add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.name=name;return m;};
 const spike=(name,p,s,color,lean=0)=>{const m=mesh(new T.ConeGeometry(1,1,5),mat(color),root,...p);m.scale.fromArray(s);m.rotation.z=lean;m.name=name;return m;};
 const tube=(name,points,r,color)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),geo=new T.TubeGeometry(curve,12,r,6,false);if(name.startsWith('fire-tail')||name==='spirit-tail'){const pos=geo.attributes.position;for(let i=0;i<=12;i++){const center=curve.getPointAt(i/12),factor=.2+Math.sin(Math.PI*i/12)*1.15;for(let j=0;j<=6;j++){const at=i*7+j,v=new T.Vector3().fromBufferAttribute(pos,at).sub(center).multiplyScalar(factor).add(center);pos.setXYZ(at,v.x,v.y,v.z);}}geo.computeVertexNormals();}const m=mesh(geo,mat(color),root);m.name=name;return m;};
 const eye=(x,y,z,color)=>{const m=ell('guardian-eye',[x,y,z],[.21,.075,.09],color);m.rotation.z=-Math.sign(x)*.2;return m;};
 const tuft=(p,s,color,lean=0)=>{const m=mesh(new T.ConeGeometry(1,1,4),mat(color),root,...p);m.name='fur-tuft';m.scale.fromArray(s);m.rotation.z=Math.PI+lean;return m;};
 const white='#e3e6dd',gold='#c9a456';
 function paws(color,slender=false){for(const side of [-1,1])for(const z of [-1.4,1.15]){const x=side*(slender?.8:1),knee=z<0?z-.25:z+.15;rod('beast-leg',[x,2.4,z],[x,1,knee],slender?.2:.4,color);rod('beast-shin',[x,1,knee],[x,.3,z+.12],slender?.15:.3,color);ell('beast-paw',[x,.24,z+.35],[slender?.26:.48,.24,.62],color);for(let k=0;k<3;k++)ell('claw',[x+(k-1)*.16,.16,z+.88],[.065,.08,.17],slender?'#424437':'#c7d1cd');}}
 function wolf(color,mane,{fox=false,tiger=false,faceless=false}={}){
  ell('beast-torso',[0,2.45,-.3],[1.13,1.22,2.25],color);ell('beast-chest',[0,2.8,1],[1.22,1.45,1.12],mane);paws(color);ell('raised-neck',[0,3.6,1.38],[.88,1.22,.83],mane);
  if(faceless){ell('faceless-orb',[0,4.65,2.02],[.79,.83,.68],'#101118');const rim=mesh(new T.TorusGeometry(.8,.045,5,30),mat(gold),root,0,4.65,2.06);rim.name='faceless-gold-rim';}
  else{ell('animal-head',[0,4.45,1.95],[.9,.69,1.03],color);ell('animal-muzzle',[0,4.12,2.8],[fox?.43:.57,.3,tiger?.46:.84],mane);ell('animal-nose',[0,4.2,tiger?3.21:3.43],[.17,.105,.12],'#252731');for(const side of [-1,1]){eye(side*.62,4.63,2.54,id==='ice'?'#6fd9fa':id==='dark'?'#b063e7':'#e6ba62');const brow=ell('fierce-brow',[side*.61,4.79,2.51],[.29,.085,.14],color);brow.rotation.z=-side*.28;if(tiger)ell('round-tiger-ear',[side*.75,5.04,1.75],[.34,.36,.2],white);else spike('pointed-ear',[side*.73,5.18,1.72],[.4,.9,.3],color,-side*.2);}}
  for(let k=0;k<5;k++)tuft([(k-2)*.3,2.7-Math.abs(k-2)*.08,2],[.35,1.3,.27],mane,(k-2)*.13);
  for(const side of [-1,1])for(let k=0;k<5;k++)tuft([side*(.65+k*.12),3.6-k*.27,1.7-k*.13],[.37,.7,.32],mane,-side*.65);
  if(!fox)tube('beast-tail',[[0,2,-2.1],[1,2,-3.1],[2,3,-3.4],[2.5,3.7,-2.6]],.28,color);
 }
 function bird(color,light=false){
  ell('eagle-body',[0,2.6,0],[1.13,1.7,1.05],white);ell('eagle-back',[0,3.1,-.6],[1.1,1.25,.65],color);ell('eagle-neck',[0,4.1,.35],[.65,1.25,.65],white);ell('eagle-head',[0,5.2,.65],[.71,.7,.8],white);
  const beak=spike('hooked-beak',[0,4.94,1.54],[.3,.85,.37],gold);beak.rotation.x=Math.PI/2+.4;for(const side of [-1,1]){eye(side*.49,5.35,1.15,light?'#b99147':'#73c6c0');rod('eagle-talon-leg',[side*.58,1.5,0],[side*.7,.32,.35],.17,gold);for(let k=0;k<3;k++)rod('eagle-talon',[side*.7,.3,.35],[side*.7+(k-1)*.3,.12,1.15],.09,gold);
   const wing=new T.BufferGeometry();wing.setAttribute('position',new T.Float32BufferAttribute([side*.8,3.5,-.25,side*3.2,4.7,-.4,side*5.7,5.9,-.8,side*4.6,2.9,-.35,side*1.6,2.6,-.1],3));wing.setIndex([0,1,4,1,3,4,1,2,3]);wing.computeVertexNormals();const wingMesh=mesh(wing,mat(color),root);wingMesh.material.side=T.DoubleSide;wingMesh.name='broad-eagle-wing';
   rod('wing-arm',[side*.8,3.5,-.2],[side*3.2,4.7,-.4],.38,color);rod('wing-tip',[side*3.2,4.7,-.4],[side*5.7,5.9,-.8],.22,color);
   for(let k=0;k<9;k++){const feather=ell('flight-feather',[side*(1.45+k*.47),3.6+k*.16,-.15-k*.06],[.36,1.65-k*.07,.18],k%3===0?white:color);feather.rotation.z=-side*(.6+k*.055);const edge=ell('feather-tip',[side*(2.3+k*.42),2.45+k*.22,-.05-k*.06],[.25,.85,.13],light?'#e9d7a1':white);edge.rotation.z=-side*.92;}
   for(let k=0;k<3;k++)tuft([side*.5,5.7+k*.2,.25-k*.25],[.18,.65,.18],color,-side*.35);
  }
  for(let k=0;k<3;k++)tube('ribbon-tail',[[0,1.5,-.75],[(k-1)*.8,1.2,-2.1],[(k-1)*1.4,1.8,-3.6],[(k-1)*1.6,.65,-4.5]],.15,light?gold:color);
  if(light){const halo=mesh(new T.TorusGeometry(1.35,.055,6,40),mat('#ead494',.35),root,0,5.8,-.5);halo.name='solar-halo';for(let k=0;k<10;k++){const a=k*Math.PI/5;ell('halo-star',[Math.sin(a)*1.35,5.8+Math.cos(a)*1.35,-.5],[.07,.17,.06],gold);}}
 }
 if(id==='fire'){
  wolf('#b7482e',white,{fox:true});for(let k=0;k<9;k++){const a=(k-4)*.32,side=Math.sin(a),height=3.9+(k%3)*.55;const points=[[0,1.9,-1.8],[side*1.4,2.4,-3],[side*4,height,-3.2+Math.abs(side)],[side*5,height+.8,-1.7+Math.abs(side)]];tube('fire-tail-'+(k+1),points,.6,k%2?'#da5b2d':'#ef8b35');const tip=points.at(-1);tuft([tip[0],tip[1]+.35,tip[2]],[.28,.7,.25],'#f5c566',-side*.6);}
  for(const s of [-1,1]){rod('fox-black-antler',[s*.55,5,1.45],[s*1.15,6,1],.14,'#3a2e28');rod('fox-antler-branch',[s*.95,5.6,1.2],[s*1.7,5.9,.9],.09,'#3a2e28');}
 }else if(id==='water'){
  const points=[[-2,.45,-2],[1,.7,-2.5],[2,1.8,-1.6],[-1,3,-1.5],[-1.5,4.5,-.6],[0,5.8,.8],[0,6.4,1.8]];tube('serpentine-dragon',points,.78,'#397da3');tube('dragon-white-underbelly',points.map(p=>[p[0],p[1]-.13,p[2]+.48]),.46,white);for(let k=0;k<13;k++){const p=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))).getPoint(k/12);ell('white-belly-scale',[p.x,p.y-.14,p.z+.55],[.67,.5,.28],white);}
  ell('dragon-skull',[0,6.5,2],[.95,.83,1.1],'#5d9fbd');ell('dragon-jaw',[0,6.17,2.9],[.65,.35,1],white);ell('dragon-open-mouth',[0,6.2,3.56],[.5,.19,.3],'#28343e');for(const s of [-1,1]){eye(s*.7,6.73,2.68,'#edd17d');rod('dragon-antler',[s*.64,7,1.5],[s*1.4,8.2,.9],.14,white);rod('dragon-antler-tip',[s*1.2,7.9,1],[s*1.7,8.3,1.5],.09,white);tube('dragon-whisker',[[s*.6,6.25,3],[s*1.6,6.1,3.25],[s*2.1,6.4,3]],.055,'#b4d5df');for(let k=0;k<3;k++)spike('dragon-tooth',[s*.4,6.08,3.25-k*.25],[.08,.25,.08],white);}
  for(let k=0;k<7;k++){const p=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))).getPoint(.12+k*.12);spike('dragon-dorsal-fin',[p.x,p.y+.35,p.z-.65],[.3,.9,.25],'#214f7d',.35);}
 }else if(id==='wind'||id==='light'){bird(id==='wind'?'#4caba1':'#d5b569',id==='light');
 }else if(id==='earth'){
  const shell=ell('mountain-shell',[0,2,-.3],[3.05,1.85,3.45],'#777760');for(let k=0;k<13;k++){const a=k*2.4,r=1.1+(k%3)*.6;ell('stone-shell-scute',[Math.sin(a)*r,3.1+Math.sqrt(Math.max(0,1-r*r/9))*.8,Math.cos(a)*r-.3],[.8,.35,.85],k%2?'#8a8567':'#697658');}
  for(const s of [-1,1])for(const z of [-2,1.9]){ell('tortoise-leg',[s*2.35,.8,z],[.83,.88,1], '#8c8773');for(let k=0;k<3;k++)ell('tortoise-claw',[s*2.35+(k-1)*.29,.18,z+.75],[.15,.17,.4], '#c5bd9d');}
  ell('tortoise-neck',[0,1.6,2.8],[1,.8,1.1],'#96927a');ell('tortoise-head',[0,1.9,3.65],[1.05,.72,.92],'#8d8d76');for(const s of [-1,1])eye(s*.76,2.15,4.1,'#daca73');ell('tortoise-beak',[0,1.65,4.4],[.64,.33,.42],'#b4ad8c');
  rod('shell-tree-trunk',[-.6,3.6,-.7],[-.6,5.7,-.7],.32,'#5c5437');for(const s of [-1,1])rod('shell-tree-branch',[-.6,5,-.7],[s*1.1,5.7,-.8],.17,'#5c5437');for(let k=0;k<4;k++)ell('shell-tree-crown',[-.6+Math.sin(k*2)*1.2,5.9+(k%2)*.4,-.7+Math.cos(k*2)*.8],[1.5,.72,1.2],'#627744');
 }else if(id==='wood'){
  ell('deer-body',[0,2.7,-.4],[.85,1,1.8],white);ell('deer-moss-back',[0,3,-.8],[.89,.86,1.6],'#68855a');paws(white,true);rod('deer-neck',[0,2.9,1],[0,4.7,1.65],.49,white);ell('deer-head',[0,5.1,1.85],[.63,.68,.85],white);ell('deer-muzzle',[0,4.83,2.5],[.38,.29,.58],white);
  for(const s of [-1,1]){eye(s*.46,5.2,2.38,'#93b761');ell('deer-ear',[s*.8,5.35,1.9],[.65,.22,.25],white);let previous=[s*.4,5.65,1.4];for(let k=0;k<4;k++){const end=[s*(.8+k*.55),6+k*.5,1.2-k*.2];rod('branching-antler',previous,end,.15-k*.022,'#7b623b');rod('antler-fork',end,[end[0]-s*.2,end[1]+.85,end[2]-.45],.085,'#7b623b');ell('antler-leaves',[end[0]+s*.2,end[1]+.2,end[2]],[.45,.14,.3],'#6e984e');previous=end;}}
  for(let k=0;k<9;k++)ell('living-vine-leaf',[Math.sin(k*2)*.9,2.8-k*.15,Math.cos(k*2)*1.5-.4],[.35,.17,.52],'#517741');
 }else{
  const ice=id==='ice',dark=id==='dark',nameless=id==='nameless';wolf(ice?'#dce8e9':dark?'#292333':nameless?'#e3e5db':'#60537b',ice?'#f0f0e7':dark?'#6d478d':nameless?white:'#e4e2df',{tiger:ice,faceless:nameless});
  if(ice)for(const s of [-1,1])for(let k=0;k<5;k++){const stripe=ell('tiger-stripe',[s*1.04,2.9,-1.7+k*.65],[.06,.5,.17],'#628eb0');stripe.rotation.z=s*.45;}
  if(!nameless)for(let k=0;k<7;k++)spike(ice?'ice-back-crystal':'elemental-mane-spike',[(k%2?1:-1)*.35,3.9,-1.8+k*.4],[.26,1.1+(k%3)*.2,.25],ice?'#74bde0':dark?'#a16bce':'#d8b66a',k%2?.3:-.3);
  if(id==='lightning')for(const s of [-1,1]){rod('thunder-horn',[s*.45,5.03,1.6],[s*.85,6.55,1.1],.18,'#ddc06d');tube('electric-bolt',[[s*1.1,3,-1],[s*2,3.9,-1.5],[s*1.6,4,-2],[s*2.7,5,-2]],.06,'#c1a4f0');}
  if(dark)for(const s of [-1,1])for(let k=0;k<3;k++)tube('shadow-wisp',[[s,3,-1],[s*(2+k*.4),3.5,-2],[s*(1.7+k*.5),5,-2.5],[s*(2.6+k*.3),5.8,-2]],.12,'#61407e');
  if(nameless){const halo=mesh(new T.TorusGeometry(2.8,.09,6,40),mat('#bda665'),root,0,6.7,0);halo.rotation.x=1.13;halo.name='floating-stone-halo';for(let k=0;k<7;k++){const a=k*Math.PI*2/7;ell('halo-stone',[Math.sin(a)*2.8,6.7+Math.cos(a)*1.2,Math.cos(a)*2.5],[.35,.2,.26],k%2?'#4c4c47':'#bca56a');}for(const s of [-1,1]){tube('spirit-tail',[[s*.5,1.8,-1.8],[s*2,2.6,-3],[s*2.8,4.3,-2.7],[s*2.4,5,-1.6]],.32,white);rod('spirit-horn',[s*.55,5,1.5],[s*1.15,6,1.1],.14,'#4b4740');}}
 }
 return root;
}
