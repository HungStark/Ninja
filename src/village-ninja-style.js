import * as T from 'three';
import {toon} from './materials.js';

export const VILLAGE_NINJA_STYLES=Object.freeze({
  nameless:{coat:'#626d56',accent:'#cfb980',skin:'#c69873',hair:'#312923',hairStyle:'short',motif:'knot'},
  water:{coat:'#315c74',accent:'#99d9dc',skin:'#be947c',hair:'#183e54',hairStyle:'sidepart',motif:'wave'},
  fire:{coat:'#873f35',accent:'#edb066',skin:'#bb805d',hair:'#382323',hairStyle:'spikes',motif:'flame'},
  lightning:{coat:'#555477',accent:'#dfca77',skin:'#bc9475',hair:'#d9c79e',hairStyle:'sweep',motif:'bolt'},
  earth:{coat:'#6e563d',accent:'#d4b77c',skin:'#a97950',hair:'#3a2c22',hairStyle:'closecrop',motif:'ridge'},
  wind:{coat:'#567166',accent:'#d7d3a1',skin:'#d1a27b',hair:'#8a7650',hairStyle:'topknot',motif:'spiral'},
  light:{coat:'#b8b28f',accent:'#e7c975',skin:'#c6a07f',hair:'#d3bc78',hairStyle:'crest',motif:'sun'},
  ice:{coat:'#6e8492',accent:'#dbecec',skin:'#d2b59f',hair:'#cbd8dc',hairStyle:'icecrop',motif:'snowflake'},
  wood:{coat:'#445d3e',accent:'#aab97c',skin:'#b38d68',hair:'#263b2a',hairStyle:'ponytail',motif:'leaf'},
  dark:{coat:'#4e405f',accent:'#c1a0c6',skin:'#a88a79',hair:'#202332',hairStyle:'asymmetric',motif:'moon'}
});
const hairCache=new Map(),badgeCache=new Map();

function hairGeometry(style,headJoint){
  const key=style+':'+headJoint;if(hairCache.has(key))return hairCache.get(key);
  const vertices=[],normals=[];
  const triangle=(a,b,c)=>{const n=new T.Vector3().subVectors(new T.Vector3(...b),new T.Vector3(...a)).cross(new T.Vector3().subVectors(new T.Vector3(...c),new T.Vector3(...a))).normalize();vertices.push(...a,...b,...c);for(let i=0;i<3;i++)normals.push(n.x,n.y,n.z);};
  const patch=(points,faces)=>{for(const face of faces)triangle(...face.map(i=>points[i]));};
  const rings=[],sides=12,cy=1.641,ry=style==='closecrop'?.139:.16;
  for(let r=1;r<=4;r++)for(let j=0;j<sides;j++){const a=j*Math.PI*2/sides,phi=(1.23+1.12*(1-Math.cos(a))/2)*r/4;rings.push([Math.sin(phi)*Math.sin(a)*.121,cy+Math.cos(phi)*ry,-.022+Math.sin(phi)*Math.cos(a)*.135]);}
  for(let j=0;j<sides;j++)triangle([0,cy+ry,-.022],rings[j],rings[(j+1)%sides]);
  for(let r=0;r<3;r++)for(let j=0;j<sides;j++){const a=r*sides+j,b=r*sides+(j+1)%sides;triangle(rings[a],rings[a+sides],rings[b]);triangle(rings[b],rings[a+sides],rings[b+sides]);}
  const lock=(rows)=>{
    const ps=[],faces=[];for(const [x,y,z,w,d]of rows)ps.push([x-w,y,z],[x,y,z+d],[x+w,y,z],[x,y,z-d]);
    for(let r=0;r<rows.length-1;r++)for(let j=0;j<4;j++){const a=r*4+j,b=r*4+(j+1)%4;faces.push([a,a+4,b],[b,a+4,b+4]);}faces.push([0,1,2],[0,2,3]);const e=ps.length-4;faces.push([e,e+2,e+1],[e,e+3,e+2]);patch(ps,faces);
  };
  if(style!=='closecrop')for(let j=0;j<(style==='sidepart'?3:5);j++){
    const x=(j-2)*.035,shift=style==='sidepart'?.032:style==='asymmetric'?-.04:0,tip=style==='asymmetric'?1.605+j*.012:1.635+(j%2)*.014;
    lock([[x,1.735,.054,.03,.016],[x+shift,1.685,.097,.029,.017],[x+shift-.009,tip,.080,.002,.003]]);
  }
  if(['spikes','sweep','crest','icecrop'].includes(style)){
    const count=style==='spikes'?7:style==='crest'?3:5;
    for(let j=0;j<count;j++){
      const x=(j-(count-1)/2)*.035,shift=style==='sweep'?.065:style==='crest'?.025:0,top=style==='spikes'?1.846+(j%2)*.04:style==='crest'?1.86-Math.abs(j-(count-1)/2)*.016:1.82+(j%2)*.02;
      lock([[x,1.755,-.006,.038,.032],[x+shift*.4,1.792,-.025,.031,.027],[x+shift,top,-.045,.002,.002]]);
    }
  }
  if(['topknot','ponytail'].includes(style)){
    lock([[0,1.742,-.115,.045,.04],[0,1.805,-.17,.05,.04],[0,1.844,-.155,.024,.024]]);
    if(style==='ponytail')lock([[0,1.774,-.164,.04,.035],[.02,1.60,-.23,.04,.035],[.04,1.43,-.245,.002,.003]]);
  }
  const count=vertices.length/3,joints=new Uint16Array(count*4),weights=new Float32Array(count*4);for(let i=0;i<count;i++){joints[i*4]=headJoint;weights[i*4]=1;}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(count*2),2));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));hairCache.set(key,g);return g;
}

function badge(style){
  if(badgeCache.has(style.motif))return badgeCache.get(style.motif);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  c.fillStyle=new T.Color(style.coat).multiplyScalar(.42).getStyle();c.strokeStyle=style.accent;c.lineWidth=8;c.beginPath();c.arc(128,128,116,0,Math.PI*2);c.fill();c.stroke();c.lineWidth=13;c.lineCap=c.lineJoin='round';
  const path=points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
  switch(style.motif){
    case 'wave':for(const y of [85,128,171]){c.beginPath();c.moveTo(55,y);c.bezierCurveTo(90,y-35,105,y+35,138,y);c.bezierCurveTo(165,y-30,180,y+25,202,y-7);c.stroke();}break;
    case 'flame':c.beginPath();c.moveTo(128,45);c.bezierCurveTo(160,95,194,111,180,162);c.bezierCurveTo(159,210,79,205,75,156);c.bezierCurveTo(71,126,107,99,102,83);c.lineTo(126,113);c.bezierCurveTo(146,90,118,69,128,45);c.stroke();break;
    case 'bolt':path([[149,45],[80,139],[128,139],[105,211],[182,111],[138,111],[149,45]]);break;
    case 'ridge':path([[51,171],[104,83],[137,134],[163,97],[209,171],[51,171]]);path([[79,195],[181,195]]);break;
    case 'spiral':c.beginPath();for(let i=0;i<100;i++){const a=i/99*Math.PI*4,r=8+i*.7,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();break;
    case 'sun':c.beginPath();c.arc(128,128,39,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;path([[128+Math.cos(a)*64,128+Math.sin(a)*64],[128+Math.cos(a)*88,128+Math.sin(a)*88]]);}break;
    case 'snowflake':for(let i=0;i<6;i++){const a=i*Math.PI/3,tip=[128+Math.cos(a)*85,128+Math.sin(a)*85],base=[128+Math.cos(a)*55,128+Math.sin(a)*55];path([[128,128],tip]);for(const sign of [-1,1])path([base,[base[0]+Math.cos(a+sign*.9)*25,base[1]+Math.sin(a+sign*.9)*25]]);}break;
    case 'leaf':c.beginPath();c.moveTo(70,186);c.bezierCurveTo(54,76,129,69,190,59);c.bezierCurveTo(195,130,169,207,70,186);c.stroke();path([[76,181],[166,88]]);path([[105,154],[99,112]]);path([[132,126],[165,130]]);break;
    case 'moon':c.beginPath();c.arc(132,128,77,Math.PI*.29,Math.PI*1.71);c.bezierCurveTo(90,100,88,159,179,188);c.stroke();break;
    default:path([[128,53],[201,128],[128,203],[55,128],[128,53]]);path([[87,128],[128,87],[169,128],[128,169],[87,128]]);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;badgeCache.set(style.motif,texture);return texture;
}

export function applyVillageNinjaStyle(model,profile){
  const style=VILLAGE_NINJA_STYLES[profile.village]||VILLAGE_NINJA_STYLES.nameless;
  const materialCache=new Map(),motifIndex=Object.keys(VILLAGE_NINJA_STYLES).indexOf(profile.village);
  function surface(source){
    if(materialCache.has(source))return materialCache.get(source);
    const name=source.name.toLowerCase();let m;
    if(name.includes('villageninjabadge'))m=toon('#ffffff',{map:badge(style),alphaTest:.3,side:T.DoubleSide,rim:0});
    else if(name.includes('skin')){m=source.clone();m.color.set(profile.skin);}
    else if(name.includes('hair'))m=toon(style.hair,{rim:.02,side:T.DoubleSide});
    else if(name.includes('tops')||name.includes('bottoms')||name.includes('shoes')||name.includes('crimson wrap')||name.includes('villageninjamask')){
      const isCoat=name.includes('tops'),color=isCoat?style.coat:name.includes('crimson wrap')?style.accent:name.includes('bottoms')?new T.Color(style.coat).multiplyScalar(.63):'#222a30';
      m=toon(color,{map:source.map,alphaTest:source.alphaTest,side:source.side,rim:.025});
      if(isCoat){
        const compile=m.onBeforeCompile;
        m.onBeforeCompile=shader=>{compile(shader);shader.uniforms.villageAccent={value:new T.Color(style.accent)};shader.uniforms.villagePattern={value:motifIndex};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vUniformPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvUniformPosition=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vUniformPosition;uniform vec3 villageAccent;uniform float villagePattern;').replace('#include <map_fragment>',`#include <map_fragment>
          vec3 vp=vUniformPosition;float hem=1.-smoothstep(.009,.017,abs(vp.y-1.065));float cuff=step(.36,abs(vp.x))*(1.-smoothstep(.009,.018,abs(abs(vp.x)-.46)));
          float chest=step(.11,abs(vp.z))*(1.-step(.17,abs(vp.x)))*step(1.11,vp.y)*(1.-step(1.43,vp.y));
          float repeat=vp.y*57.;
          if(villagePattern<.5)repeat+=abs(sin(vp.x*35.))*2.;
          else if(villagePattern<1.5)repeat+=sin(vp.x*30.)*1.5;
          else if(villagePattern<2.5)repeat+=abs(vp.x)*24.+sin(vp.x*65.);
          else if(villagePattern<3.5)repeat+=floor(vp.x*25.)*.8;
          else if(villagePattern<4.5)repeat+=step(0.,vp.x)*.6;
          else if(villagePattern<5.5)repeat+=sin(vp.x*18.+vp.y*7.)*2.;
          else if(villagePattern<6.5)repeat=length(vec2(vp.x,vp.y-1.28))*80.;
          else if(villagePattern<7.5)repeat+=abs(vp.x)*35.;
          else if(villagePattern<8.5)repeat+=abs(vp.x)*16.;
          else repeat+=cos(vp.x*20.)*2.;
          float motif=(1.-smoothstep(.12,.30,abs(sin(repeat))))*chest*.28;
          diffuseColor.rgb=mix(diffuseColor.rgb,villageAccent,max(max(hem*.85,cuff*.75),motif));`);};
        m.customProgramCacheKey=()=> 'village-ninja-uniform-v1';
      }
    }else m=source.clone();
    m.name=source.name;materialCache.set(source,m);return m;
  }
  model.traverse(o=>{
    if(!o.isMesh)return;
    o.geometry=o.geometry.clone();o.castShadow=o.receiveShadow=true;
    const hair=(Array.isArray(o.material)?o.material:[o.material]).some(m=>m.name.toLowerCase().includes('hair'));
    if(hair){const headJoint=o.skeleton.bones.findIndex(b=>b.name==='J_Bip_C_Head');o.geometry.dispose();o.geometry=hairGeometry(style.hairStyle,headJoint).clone();o.name='NinjaHair-'+style.hairStyle;}
    o.material=Array.isArray(o.material)?o.material.map(surface):surface(o.material);
  });
  model.userData.villageStyle={village:profile.village,coat:style.coat,accent:style.accent,skin:profile.skin,hair:style.hair,hairStyle:style.hairStyle,motif:style.motif};
}
