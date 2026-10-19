import * as T from 'three';
export const DETAILED_VILLAGES=new Set(['water','fire','lightning','wind']);
function tile(kind,tint,seed){
 const size=256,data=new Uint8Array(size*size*4),base=new T.Color(tint),pixel=new T.Color(),hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7+seed*73.4)*43758.5453;return n-Math.floor(n);};
 const grid=Array.from({length:64},(_,i)=>hash(i%8,Math.floor(i/8))),soft=(x,y)=>{const a=Math.floor(x),b=Math.floor(y),fx=x-a,fy=y-b,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),h=(i,j)=>grid[((j%8+8)%8)*8+(i%8+8)%8];return (h(a,b)*(1-u)+h(a+1,b)*u)*(1-v)+(h(a,b+1)*(1-u)+h(a+1,b+1)*u)*v;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const n=hash(x,y),cloud=soft(x/32,y/32)*.7+soft(x/16,y/16)*.3;let shade=.88+cloud*.17+(n-.5)*.08;
  if(kind==='wood'){shade+=Math.sin(x*.61+Math.sin(y*.075)*.8)*.045;if(x%32===0)shade*=.5;}
  if(kind==='tiles'||kind==='stone'){const row=Math.floor(y/32),xx=(x+row%2*32)%64;if(xx<2||y%32<2)shade*=.62;else if(xx<4||y%32<4)shade*=1.1;}
  if(kind==='metal'&&x%32<2)shade*=.62;
  if(kind==='ground'||kind==='earth'){if(hash(Math.floor(x/4),Math.floor(y/4))>.94&&x%4>0&&y%4>0)shade*=.8;}
  pixel.copy(base).multiplyScalar(shade).convertLinearToSRGB();const i=(y*size+x)*4;data[i]=Math.min(255,pixel.r*255);data[i+1]=Math.min(255,pixel.g*255);data[i+2]=Math.min(255,pixel.b*255);data[i+3]=255;
 }
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;return texture;
}
export function createVillageSurfaces(id){
 if(!DETAILED_VILLAGES.has(id))return null;
 const palette={water:['#aabfba','#75634b','#436d79','#9b9d8c','#929e92'],fire:['#c6aa86','#5a4335','#843f2e','#66615b','#927a62'],lightning:['#aaa5b7','#514a5b','#61657b','#777985','#878796'],wind:['#d6c6a1','#7b694b','#567e6c','#99917b','#9e9e7a']}[id],seed=['water','fire','lightning','wind'].indexOf(id)+1;
 const material=(kind,color)=>{const map=tile(kind,color,seed),m=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.025,roughness:kind==='metal'?.6:.95,metalness:kind==='metal'?.15:0,flatShading:true});m.name=id+'-'+kind;return m;};
 const ground=new T.MeshStandardMaterial({map:tile('ground','#eeeeee',seed),vertexColors:true,roughness:1});ground.name=id+'-ground';const wall=material('plaster',palette[0]),wallVariants=[wall,...['#eee6d5','#c8cfcc'].map(color=>{const m=wall.clone();m.color.set(color);return m;})];return {wall,wallVariants,wood:material('wood',palette[1]),roof:material(id==='lightning'?'metal':'tiles',palette[2]),stone:material('stone',palette[3]),path:material(id==='wind'?'earth':'stone',palette[4]),ground};
}
export function scaleBuildingUVs(root){root.traverse(o=>{if(!o.isMesh||!o.material.map||!o.geometry.attributes.uv)return;const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;if(g.type==='BoxGeometry')for(let k=0;k<p.count;k++)uv.setXY(k,(Math.abs(n.getX(k))>.5?p.getZ(k):p.getX(k))*.75,(Math.abs(n.getY(k))>.5?p.getZ(k):p.getY(k))*.75);else if(g.type==='CylinderGeometry')for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*g.parameters.radiusBottom*Math.PI,uv.getY(k)*g.parameters.height*.5);uv.needsUpdate=true;});}
