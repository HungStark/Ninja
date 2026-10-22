import * as T from 'three';

// One shadow draw for all characters, including on the low graphics preset.
export function createContactShadows(scene,capacity=96){
  const geometry=new T.PlaneGeometry(1,1);geometry.rotateX(-Math.PI/2);
  const strength=new T.InstancedBufferAttribute(new Float32Array(capacity),1);geometry.setAttribute('contactStrength',strength);
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
    uniforms:T.UniformsUtils.merge([T.UniformsLib.fog]),
    vertexShader:`attribute float contactStrength; varying vec2 shadowUv; varying float shadowStrength;
      #include <fog_pars_vertex>
      void main(){shadowUv=uv;shadowStrength=contactStrength;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader:`varying vec2 shadowUv; varying float shadowStrength;
      #include <fog_pars_fragment>
      void main(){float radius=length((shadowUv-.5)*2.);float alpha=pow(max(0.,1.-radius),2.)*.68*shadowStrength;if(alpha<.003)discard;gl_FragColor=vec4(.055,.065,.065,alpha);
      #include <fog_fragment>
      #include <colorspace_fragment>
      }`});
  const mesh=new T.InstancedMesh(geometry,material,capacity),dummy=new T.Object3D(),up=new T.Vector3(0,1,0),normal=new T.Vector3();
  mesh.name='character-contact-shadows';mesh.userData.noCollision=true;mesh.frustumCulled=false;mesh.count=0;scene.add(mesh);
  return {mesh,update(characters,floorAt){let count=0;for(const char of characters){const root=char.root;if(!root?.visible||count>=capacity)continue;
    const p=root.position,y=floorAt(p.x,p.z,p.y+.12),height=Math.max(0,p.y-y);if(!Number.isFinite(y)||height>3)continue;
    const dx=floorAt(p.x+.18,p.z,y+.35)-floorAt(p.x-.18,p.z,y+.35),dz=floorAt(p.x,p.z+.18,y+.35)-floorAt(p.x,p.z-.18,y+.35);
    normal.set(-Math.max(-.4,Math.min(.4,dx))/.36,1,-Math.max(-.4,Math.min(.4,dz))/.36).normalize();
    dummy.position.set(p.x,y+.035,p.z);dummy.quaternion.setFromUnitVectors(up,normal);dummy.scale.set(1.65+height*.22,1,1.3+height*.18);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);strength.setX(count,Math.max(0,1-height/3));count++;
  }mesh.count=count;mesh.instanceMatrix.needsUpdate=true;strength.needsUpdate=true;}};
}

export function villageLighting(id){
  const dark=id==='dark',cold=['lightning','ice'].includes(id),ruins=id==='nameless';
  return {sky:dark?'#a7a4cc':cold?'#c4d9ee':'#e2eaf0',ground:dark?'#30293d':ruins?'#4b4438':'#51554b',ambient:dark?1.05:ruins?1.2:1.35,
    sun:dark?'#c8bcf2':cold?'#e7edff':'#ffe0ae',intensity:dark?1.65:id==='lightning'?2.25:ruins?2.65:3.15,fill:dark?.32:cold?.42:.36};
}
