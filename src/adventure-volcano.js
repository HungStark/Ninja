import * as T from 'three';

export function buildVolcano(c,g){
  g.name='volcano';
  const sides=40,profile=[[16,-.9],[13.6,3],[11.1,7.5],[8.6,12.4],[6.5,16.8],[5.9,19.1]],outer=[],positions=[],colors=[];
  const basalt=new T.Color('#15191d'),ash=new T.Color('#303235');
  for(let row=0;row<profile.length;row++){
    const [r,y]=profile[row],ring=[];
    for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,rough=Math.sin(a*5+.7)*.25+Math.sin(a*9+row*.5)*.12,ragged=row===profile.length-1?Math.sin(a*7)*.42+Math.cos(a*11)*.23:Math.sin(a*4+row)*.15;ring.push(new T.Vector3(Math.sin(a)*(r+rough),y+ragged,Math.cos(a)*(r+rough)));}
    outer.push(ring);
  }
  const triangle=(a,b,d,tint=.3)=>{for(const p of [a,b,d]){positions.push(p.x,p.y,p.z);const shade=basalt.clone().lerp(ash,tint);colors.push(shade.r,shade.g,shade.b);}};
  const join=(a,b,inside=false)=>{for(let j=0;j<sides;j++){const k=(j+1)%sides,tint=.08+(Math.sin(j*3.7)+1)*.16;triangle(a[j],a[k],b[j],inside?.04:tint);triangle(a[k],b[k],b[j],inside?.08:tint+.05);}};
  for(let row=0;row<outer.length-1;row++)join(outer[row],outer[row+1]);
  // The rim is part of the rock mesh, enclosing a deep, open bowl.
  const lip=outer.at(-1),inner=lip.map((p,j)=>{const a=j/sides*Math.PI*2;return new T.Vector3(Math.sin(a)*(4.85+Math.sin(a*5)*.13),p.y-.38,Math.cos(a)*(4.85+Math.sin(a*5)*.13));}),pit=inner.map((p,j)=>{const a=j/sides*Math.PI*2;return new T.Vector3(Math.sin(a)*3.55,14.1+Math.sin(a*3)*.12,Math.cos(a)*3.55);});
  join(lip,inner,true);join(inner,pit,true);
  for(let j=0;j<sides;j++){const k=(j+1)%sides;triangle(pit[j],pit[k],new T.Vector3(0,14.05,0),.02);triangle(outer[0][k],outer[0][j],new T.Vector3(0,-1.1,0),.1);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const rock=c.mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}),g);rock.name='volcanic-basalt';c.solidGeometry?.(rock,{name:'volcanic-basalt'});

  // Interpolate the actual triangular slope so every lava ribbon lies against
  // the mountain, including bends and forks, instead of floating straight bars.
  const slopePoint=(t,angle,lift)=>{
    const f=Math.max(0,Math.min(.999999,t))*(profile.length-1),row=Math.floor(f),u=f-row,a=((angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/Math.PI/2*sides,col=Math.floor(a),v=a-col,k=(col+1)%sides,A=outer[row][col],B=outer[row][k],C=outer[row+1][col],D=outer[row+1][k];let p,normal;
    if(u+v<=1){p=A.clone().addScaledVector(C.clone().sub(A),u).addScaledVector(B.clone().sub(A),v);normal=B.clone().sub(A).cross(C.clone().sub(A));}
    else{p=D.clone().addScaledVector(B.clone().sub(D),1-u).addScaledVector(C.clone().sub(D),1-v);normal=D.clone().sub(B).cross(C.clone().sub(B));}
    return p.addScaledVector(normal.normalize(),lift);
  };
  const scar=new T.MeshStandardMaterial({color:'#341b15',roughness:1}),lava=new T.MeshStandardMaterial({color:'#b42b0b',emissive:'#ff3206',emissiveIntensity:.8,roughness:.82}),hot=new T.MeshStandardMaterial({color:'#ff8c20',emissive:'#ff5a08',emissiveIntensity:1.1,roughness:.65});
  const ribbon=(angle,from,to,width,seed,material,lift,fork=0)=>{
    const p=[],indices=[],steps=42;
    for(let j=0;j<=steps;j++){const q=j/steps,t=from+(to-from)*q,bend=Math.sin(t*9+seed)*.055+Math.sin(t*23+seed)*.018,center=angle+bend+fork*q*q,r=16+(5.9-16)*t,w=width*(.6+Math.sin(q*13+seed)*.14+q*.4);for(const side of [-1,1])p.push(...slopePoint(t,center+side*w/(2*r),lift).toArray());if(j<steps){const n=j*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(indices);geo.computeVertexNormals();const flow=c.mesh(geo,material,g);flow.name=material===scar?'lava-scorch':'lava-flow';flow.userData.noCollision=true;
  };
  [.17,.94,1.68,2.75,3.65,4.53,5.66].forEach((angle,i)=>{
    const end=.03+(i%3)*.11,width=.38+(i%3)*.13;
    ribbon(angle,1,end,width*2.8,i,scar,.025);ribbon(angle,1,end,width,i,lava,.075);ribbon(angle,1,end+.06,width*.34,i,hot,.095);
    if(i%2===0)for(const side of [-1,1]){const from=.59,end=.05+(i%2)*.1;for(const [material,mult,lift] of [[scar,2.5,.028],[lava,1,.077],[hot,.25,.098]])ribbon(angle,from,end,width*.48*mult,i,material,lift,side*(.17+i*.013));}
  });
  const pool=c.mesh(new T.CircleGeometry(3.65,40),new T.MeshStandardMaterial({color:'#c3310a',emissive:'#ff4106',emissiveIntensity:1.05,roughness:.8,side:T.DoubleSide}),g,0,14.27,0);pool.rotation.x=-Math.PI/2;pool.name='crater-lava-pool';pool.userData.noCollision=true;
  for(let k=0;k<9;k++){const a=k*2.4,r=.5+k%3*.8,crust=c.mesh(new T.DodecahedronGeometry(.35+k%3*.16,0),c.M('#2b2520'),g,Math.sin(a)*r,14.29,Math.cos(a)*r);crust.scale.set(1,.08,.65);crust.userData.noCollision=true;}
  const glow=new T.PointLight('#ff4c13',5,17,1.5);glow.position.set(0,16.3,0);g.add(glow);
  g.userData.craterRadius=4.85;g.userData.craterDepth=4.8;
  return g;
}
