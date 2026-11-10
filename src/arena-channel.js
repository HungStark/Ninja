import * as T from 'three';
import {PRACTICE_ARENA,PRACTICE_DIVIDERS} from './practice-overhead.js';

export function inArenaChannel(x,z,margin=0){return x>PRACTICE_ARENA.minX-margin&&x<PRACTICE_ARENA.maxX+margin&&z>PRACTICE_DIVIDERS[0]-margin&&z<PRACTICE_DIVIDERS[1]+margin;}

export function carveArenaChannel(geometry,offsetZ=-20){
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i)+offsetZ;
    if(!inArenaChannel(x,z))continue;
    const edge=Math.min(x-PRACTICE_ARENA.minX,PRACTICE_ARENA.maxX-x,z-PRACTICE_DIVIDERS[0],PRACTICE_DIVIDERS[1]-z),t=T.MathUtils.clamp(edge/.65,0,1);
    p.setY(i,p.getY(i)-1.3*t*t*(3-2*t));
  }
  p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

export function createArenaChannel(scene){
  const root=new T.Group();root.name='arena-water-channel';scene.add(root);
  const width=PRACTICE_ARENA.maxX-PRACTICE_ARENA.minX,length=PRACTICE_DIVIDERS[1]-PRACTICE_DIVIDERS[0],center=(PRACTICE_DIVIDERS[0]+PRACTICE_DIVIDERS[1])/2;
  const water=new T.Mesh(new T.PlaneGeometry(width-.2,length-.24,48,28),new T.ShaderMaterial({
    uniforms:{time:{value:0}},
    vertexShader:'uniform float time;varying vec2 waterUv;varying vec2 worldXZ;void main(){waterUv=uv;vec3 p=position;p.z+=sin(p.x*.55+time)*sin(p.y*1.5-time*.8)*.018;vec4 world=modelMatrix*vec4(p,1.);worldXZ=world.xz;gl_Position=projectionMatrix*viewMatrix*world;}',
    fragmentShader:`uniform float time;varying vec2 waterUv;varying vec2 worldXZ;
      void main(){
        float shore=min(waterUv.y,1.-waterUv.y);
        float ripple=sin(worldXZ.y*6.2+sin(worldXZ.x*.65-time*.7)*.8+time*1.1);
        float small=sin(worldXZ.x*2.1+worldXZ.y*3.7-time*1.6)*sin(worldXZ.y*9.+time*.6);
        vec3 color=mix(vec3(.075,.24,.30),vec3(.13,.43,.49),smoothstep(0.,.19,shore));
        color+=vec3(.025,.055,.055)*ripple;
        float crest=smoothstep(.93,.995,ripple)*smoothstep(.05,.6,small)*.34;
        float foam=(1.-smoothstep(.005,.023,shore))*(.55+.2*sin(worldXZ.x*2.8-time*1.7));
        gl_FragColor=vec4(mix(color,vec3(.63,.84,.81),max(crest,foam)),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));
  water.name='arena-channel-water';water.rotation.x=-Math.PI/2;water.position.set(0,-.12,center);water.receiveShadow=false;root.add(water);
  const bankMaterial=new T.MeshStandardMaterial({color:'#64796f',roughness:1,flatShading:true});
  for(const z of PRACTICE_DIVIDERS){
    const bank=new T.Mesh(new T.BoxGeometry(width+.2,1.4,.34),bankMaterial);bank.name='arena-channel-bank';bank.position.set(0,-.65,z);bank.receiveShadow=bank.castShadow=true;root.add(bank);
    const cap=new T.Mesh(new T.BoxGeometry(width+.45,.12,.56),new T.MeshStandardMaterial({color:'#879484',roughness:1}));cap.position.set(0,.025,z);cap.receiveShadow=true;root.add(cap);
  }
  for(const x of [PRACTICE_ARENA.minX,PRACTICE_ARENA.maxX]){
    const end=new T.Mesh(new T.BoxGeometry(.45,1.35,length),bankMaterial);end.position.set(x,-.7,center);root.add(end);
  }
  return {root,water,update:time=>{water.material.uniforms.time.value=time;}};
}
