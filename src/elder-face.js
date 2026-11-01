import * as T from 'three';

export function elderFaceStyle(profile){
  if(profile.age!=='elder')return null;
  const seed=Array.from((profile.village||'')+':'+profile.id).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,23),variant=seed%3;
  return {variant,wrinkles:.82+variant*.12,eyeClose:.06+variant*.0125,eyeSorrow:.18+variant*.015,cheekInset:.035+variant*.007};
}

// GLTF primitives can share all position attributes; only their indexed vertices
// describe the actual face/eye surface. Never edit the cached source geometry.
function surfaceBounds(mesh){
  const bounds=new T.Box3(),p=mesh.geometry.attributes.position,index=mesh.geometry.index,point=new T.Vector3();
  for(let i=0;i<(index?.count||p.count);i++)bounds.expandByPoint(point.fromBufferAttribute(p,index?index.getX(i):i));
  return bounds;
}

const vertexCommon=`
uniform vec4 npcAgeFrame;
uniform float npcAgeCheek;
varying vec3 vNpcAgePosition;
`;
const cheekShape=`
  vec2 ageP=vec2(abs(transformed.x),transformed.y-npcAgeFrame.y)/npcAgeFrame.x;
  float ageCheek=(1.0-smoothstep(.10,.40,abs(ageP.x-.52)))*(1.0-smoothstep(.05,.34,abs(ageP.y+.38)));
  float ageFront=smoothstep(.01,.045,transformed.z);
  transformed.x*=1.0-npcAgeCheek*ageCheek*ageFront;
  transformed.z-=npcAgeFrame.x*.012*ageCheek*ageFront;
  vNpcAgePosition=transformed;
`;
const fragmentCommon=`
uniform vec4 npcAgeFrame;
uniform float npcAgeStrength;
varying vec3 vNpcAgePosition;
float npcAgeLine(vec2 p,vec2 a,vec2 b,float width){
  vec2 ab=b-a;float t=clamp(dot(p-a,ab)/dot(ab,ab),0.0,1.0);
  float d=length(p-a-ab*t),aa=max(fwidth(d),.001);
  return 1.0-smoothstep(width-aa,width+aa,d);
}
`;
const wrinkles=`
  vec2 ageFace=vec2(abs(vNpcAgePosition.x),vNpcAgePosition.y-npcAgeFrame.y)/npcAgeFrame.x;
  float ageEye=npcAgeFrame.z/npcAgeFrame.x;
  vec2 eyeCorner=vec2(ageEye+.235,.015);
  float crow=npcAgeLine(ageFace,eyeCorner,eyeCorner+vec2(.13,.055),.006);
  crow=max(crow,npcAgeLine(ageFace,eyeCorner+vec2(.01,-.025),eyeCorner+vec2(.15,-.065),.006));
  float eyeT=(ageFace.x-ageEye)/.23;
  float bagD=abs(ageFace.y-(-.205+.075*eyeT*eyeT));
  float bagAA=max(fwidth(bagD),.001);
  float underEye=(1.0-smoothstep(.006-bagAA,.006+bagAA,bagD))*(1.0-smoothstep(.16,.25,abs(ageFace.x-ageEye)));
  float fold=npcAgeLine(ageFace,vec2(.19,-.31),vec2(.29,-.46),.007);
  fold=max(fold,npcAgeLine(ageFace,vec2(.29,-.46),vec2(.33,-.60),.006));
  float forehead=npcAgeLine(ageFace,vec2(.08,.47),vec2(.36,.455),.005);
  forehead=max(forehead,npcAgeLine(ageFace,vec2(.10,.57),vec2(.33,.555),.004));
  float ageFront=smoothstep(.025,.05,vNpcAgePosition.z);
  // Warm, low-contrast creases fade with pixel size instead of turning into
  // thick dark marks when the character is far from the camera.
  float ageDetail=1.0-smoothstep(.018,.07,fwidth(ageFace.x));
  float ageMark=max(max(crow*.85,underEye*.75),max(fold*.7,forehead*.55));
  diffuseColor.rgb*=1.0-ageMark*npcAgeStrength*.19*ageFront*ageDetail;
`;

export function applyElderFace(model,profile){
  const style=elderFaceStyle(profile);if(!style)return null;
  const surfaces=[];let skin,eye;
  model.traverse(o=>{if(!o.isMesh)return;const names=(Array.isArray(o.material)?o.material:[o.material]).map(m=>m.name).join(' ');
    if(/Face_00_SKIN/i.test(names))skin=o;
    if(/EyeWhite/i.test(names))eye=o;
    if(/Face_|FaceMouth|FaceBrow|FaceEye|EyeIris|EyeWhite|EyeHighlight/i.test(names))surfaces.push(o);
  });
  if(!skin||!eye)return null;
  const faceBounds=surfaceBounds(skin),eyeBounds=surfaceBounds(eye),halfWidth=(faceBounds.max.x-faceBounds.min.x)/2;
  const p=eye.geometry.attributes.position,index=eye.geometry.index;let inner=Infinity,outer=0;
  for(let i=0;i<(index?.count||p.count);i++){const x=p.getX(index?index.getX(i):i);if(x>0){inner=Math.min(inner,x);outer=Math.max(outer,x);}}
  const frame=new T.Vector4(halfWidth,(eyeBounds.min.y+eyeBounds.max.y)/2,(inner+outer)/2,0),expressions=[];
  for(const mesh of surfaces){
    if(mesh.morphTargetDictionary&&mesh.morphTargetInfluences){
      const dict=mesh.morphTargetDictionary,values=mesh.morphTargetInfluences;
      for(const name of ['Fcl_EYE_Spread','Fcl_EYE_Surprised'])if(dict[name]!==undefined)values[dict[name]]=Math.min(values[dict[name]],.025);
      expressions.push({values,close:dict.Fcl_EYE_Close,sorrow:dict.Fcl_EYE_Sorrow});
    }
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
      const isSkin=/Face_00_SKIN/i.test(material.name),compile=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
      material.onBeforeCompile=shader=>{
        compile.call(material,shader);
        shader.uniforms.npcAgeFrame={value:frame};shader.uniforms.npcAgeCheek={value:style.cheekInset};shader.uniforms.npcAgeStrength={value:style.wrinkles};
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+vertexCommon).replace('#include <morphtarget_vertex>','#include <morphtarget_vertex>\n'+cheekShape);
        if(isSkin)shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+fragmentCommon).replace('#include <color_fragment>','#include <color_fragment>\n'+wrinkles);
      };
      material.customProgramCacheKey=()=>key()+':elder-face-v1:'+isSkin;material.needsUpdate=true;
    }
  }
  function update(blink=0){for(const {values,close,sorrow}of expressions){if(close!==undefined)values[close]=style.eyeClose+(1-style.eyeClose)*blink;if(sorrow!==undefined)values[sorrow]=style.eyeSorrow*(1-blink);}}
  update();return {style,update};
}
