import * as T from 'three';
import {PRACTICE_DIVIDERS} from './practice-overhead.js';

const riverHalfWidth=29,waterY=-.12;
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export function arenaChannelBanks(x){
  const bend=Math.max(0,Math.abs(x)-16)*.045*Math.sin(x*.21);
  return [PRACTICE_DIVIDERS[0]+.42+Math.sin(x*.47)*.15+Math.sin(x*1.31)*.08+bend,PRACTICE_DIVIDERS[1]-.42-Math.sin(x*.43+2)*.15-Math.sin(x*1.12+3)*.08+bend];
}
export function inArenaChannel(x,z,margin=0){const [far,near]=arenaChannelBanks(x);return x>-riverHalfWidth-margin&&x<riverHalfWidth+margin&&z>far-margin&&z<near+margin;}

export function carveArenaChannel(geometry,offsetZ=-20){
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i)+offsetZ;
    if(!inArenaChannel(x,z))continue;
    const [far,near]=arenaChannelBanks(x),edge=Math.min(x+riverHalfWidth,riverHalfWidth-x,z-far,near-z),t=T.MathUtils.clamp(edge/.9,0,1);
    p.setY(i,p.getY(i)-(1.25+.13*Math.sin(x*.37+z*.23))*t*t*(3-2*t));
  }
  p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

function riverNormals(){
  const size=128,data=new Uint8Array(size*size*4),tau=Math.PI*2;
  const height=(u,v)=>Math.sin(u*tau*3+Math.sin(v*tau*2)*.8)*.42+Math.sin(v*tau*5+Math.sin(u*tau)*.7)*.25+Math.sin((u+v)*tau*7)*.12;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,dx=(height(u+1/size,v)-height(u-1/size,v))*2.4,dy=(height(u,v+1/size)-height(u,v-1/size))*2.4,n=new T.Vector3(-dx,-dy,1).normalize(),i=(y*size+x)*4;
    data[i]=(n.x*.5+.5)*255;data[i+1]=(n.y*.5+.5)*255;data[i+2]=(n.z*.5+.5)*255;data[i+3]=255;
  }
  const map=new T.DataTexture(data,size,size,T.RGBAFormat);map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(8,2);map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
}

export function createArenaChannel(scene){
  const root=new T.Group();root.name='arena-water-channel';scene.add(root);
  const vertices=[],uvs=[],indices=[],across=16,segments=116;
  for(let i=0;i<=segments;i++){
    const x=-riverHalfWidth+i*riverHalfWidth*2/segments,[far,near]=arenaChannelBanks(x);
    for(let j=0;j<=across;j++){const t=j/across;vertices.push(x,waterY,far+(near-far)*t);uvs.push(i/segments,t);}
    if(i<segments)for(let j=0;j<across;j++){const a=i*(across+1)+j,b=a+across+1;indices.push(a,a+1,b,a+1,b+1,b);}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  // Same lit, translucent teal and surface response as Làng Thủy's river/canal
  // in adventure-scene.js and adventure-biomes.js, with small moving normals.
  const normalMap=riverNormals(),material=new T.MeshStandardMaterial({color:'#5f9eaf',metalness:.22,roughness:.22,transparent:true,opacity:.87,normalMap,normalScale:new T.Vector2(.22,.18)});
  const water=new T.Mesh(geometry,material);water.name='arena-channel-water';water.userData.snowSurface='water';water.receiveShadow=true;water.castShadow=false;root.add(water);
  const bankMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true});
  for(const side of [0,1]){
    const p=[],colors=[],ix=[],palette=['#76745c','#56685b','#425b56'];
    for(let i=0;i<=segments;i++){
      const x=-riverHalfWidth+i*riverHalfWidth*2/segments,edge=arenaChannelBanks(x)[side],sign=side===0?1:-1;
      for(let j=0;j<3;j++){
        const z=edge+sign*[-.65,.04,.85][j],y=[-.045,waterY-.015,-.83][j];p.push(x,y,z);
        const color=new T.Color(palette[j]).multiplyScalar(.9+noise(i*7+side*31)*.17);colors.push(color.r,color.g,color.b);
      }
      if(i<segments){const a=i*3,b=a+3;for(let j=0;j<2;j++){if(side===0)ix.push(a+j,a+j+1,b+j,a+j+1,b+j+1,b+j);else ix.push(a+j,b+j,a+j+1,a+j+1,b+j,b+j+1);}}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();
    const bank=new T.Mesh(g,bankMaterial);bank.name='arena-channel-bank';bank.receiveShadow=true;root.add(bank);
  }
  const stones=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#8a9180',roughness:1,flatShading:true}),132),dummy=new T.Object3D();stones.name='arena-river-gravel';
  for(let i=0;i<stones.count;i++){
    const x=-28+noise(i+18)*56,side=i%2,edge=arenaChannelBanks(x)[side],z=edge+(side===0?-1:1)*(.08+noise(i+42)*.47),s=.12+noise(i+91)*.38;
    dummy.position.set(x,-.06+s*.18,z);dummy.rotation.set(noise(i+7)*.3,noise(i+51)*6,noise(i+33)*.25);dummy.scale.set(s*(1+noise(i+25)),s*.42,s*.85);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);
  }
  stones.receiveShadow=true;root.add(stones);
  const reeds=new T.InstancedMesh(new T.CylinderGeometry(.018,.035,1,4),new T.MeshStandardMaterial({color:'#7c8d64',roughness:1}),72);reeds.name='arena-river-reeds';
  for(let i=0;i<reeds.count;i++){
    const cluster=Math.floor(i/9),side=cluster%2,x=-25+cluster*7+noise(i+137)*.9,edge=arenaChannelBanks(x)[side],z=edge+(side===0?-1:1)*(.1+noise(i+203)*.25),h=.42+noise(i+101)*.62;
    dummy.position.set(x,h*.5-.08,z);dummy.rotation.set((noise(i+29)-.5)*.3,noise(i+61)*6,(noise(i+85)-.5)*.35);dummy.scale.set(1,h,1);dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);
  }
  reeds.castShadow=true;reeds.receiveShadow=true;root.add(reeds);
  const shimmerMaterial=new T.MeshBasicMaterial({color:'#b4d7d1',transparent:true,opacity:.17,depthWrite:false}),shimmers=[];
  for(let i=0;i<30;i++){
    const x=-28+noise(i+341)*56,[far,near]=arenaChannelBanks(x),z=far+.7+noise(i+227)*(near-far-1.4),line=new T.Mesh(new T.PlaneGeometry(.3+noise(i+91)*.7,.025+noise(i+53)*.025),shimmerMaterial);
    line.position.set(x,waterY+.047,z);line.rotation.set(-Math.PI/2,0,(noise(i+16)-.5)*.65);root.add(line);shimmers.push({line,x,phase:noise(i+8)*6});
  }
  const positions=geometry.attributes.position;
  return {root,water,update(time){
    normalMap.offset.set(time*.012,time*.005);material.opacity=.84+Math.sin(time*.65)*.018;
    for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,waterY+Math.sin(x*.67+z*.91-time*.8)*.017+Math.sin(x*1.37-z*.7+time*.55)*.009);}
    positions.needsUpdate=true;shimmerMaterial.opacity=.13+Math.sin(time*.7)*.035;
    for(const s of shimmers){s.line.position.x=s.x+Math.sin(time*.4+s.phase)*.13;s.line.scale.x=.85+Math.sin(time*.6+s.phase)*.16;}
  }};
}
