import * as T from 'three';

// A bounded, shared pool: one draw call per white smoke puff, no image textures.
export function createTransformationSmoke(scene){
  const geometry=new T.IcosahedronGeometry(1,1),dummy=new T.Object3D(),slots=[];let bursts=0,audio=null;
  for(let i=0;i<4;i++){
    const material=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false}),mesh=new T.InstancedMesh(geometry,material,14);mesh.name='transformation-white-smoke';mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);slots.push({mesh,material,age:2,p:[0,0,0]});
  }
  function pop(){if(!audio||audio.state!=='running')return;const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.12),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**2;const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=900;gain.gain.value=.055;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};}
  return {unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(Audio){audio??=new Audio();audio.resume();}}catch{}},
    burst(p){const slot=slots.find(s=>s.age>=1.2)||slots.reduce((a,b)=>a.age>b.age?a:b);slot.p=[...p];slot.age=0;slot.mesh.visible=true;bursts++;pop();},
    update(dt){for(const s of slots){if(s.age>=1.2)continue;s.age+=dt;const t=Math.min(1,s.age/1.2),spread=1-Math.exp(-t*7);s.material.opacity=.88*(1-t)**.8;
      for(let i=0;i<14;i++){const a=i*2.399963,r=(.45+(i%4)*.17)*spread;dummy.position.set(s.p[0]+Math.sin(a)*r,s.p[1]+.5+(i%5)*.31+t*.8,s.p[2]+Math.cos(a)*r);dummy.scale.setScalar((.32+(i%3)*.1)*(.45+spread*1.3));dummy.rotation.set(a,a*.4,t);dummy.updateMatrix();s.mesh.setMatrixAt(i,dummy.matrix);}s.mesh.instanceMatrix.needsUpdate=true;s.mesh.visible=t<1;
    }},
    reset(){bursts=0;for(const s of slots){s.age=2;s.mesh.visible=false;}},
    state:()=>({bursts,color:'#ffffff',active:slots.filter(s=>s.age<1.2).map(s=>({age:s.age,position:[...s.p],opacity:s.material.opacity}))})
  };
}
