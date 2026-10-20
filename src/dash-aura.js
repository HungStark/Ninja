import * as T from 'three';

// Eight lightweight wisps rise from the feet; no full-screen overlay or camera shake.
export function createDashAura(scene){
  const root=new T.Group();root.name='dash-boost-wind';root.visible=false;scene.add(root);
  const wisps=[];let clock=0;
  for(let i=0;i<8;i++){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(9*2*3),3));
    const indices=[];for(let j=0;j<8;j++){const a=j*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}geometry.setIndex(indices);
    const material=new T.MeshBasicMaterial({color:'#c6e8df',transparent:true,opacity:0,depthWrite:false,toneMapped:false,side:T.DoubleSide});
    const line=new T.Mesh(geometry,material);line.frustumCulled=false;root.add(line);wisps.push(line);
  }
  return {
    update(dt,position,active,reducedMotion=false){
      root.visible=active;if(!active)return;clock+=dt;root.position.fromArray(position);
      wisps.forEach((line,i)=>{const rise=(clock*(reducedMotion?.32:.7)+i/8)%1,angle=i*Math.PI/4+clock*.3,a=line.geometry.attributes.position;
        for(let j=0;j<9;j++){const t=j/8,r=.95+t*.15,theta=angle+t*.55,width=Math.sin(t*Math.PI)*.018;for(let side=0;side<2;side++){const offset=(side?1:-1)*width;a.setXYZ(j*2+side,Math.cos(theta)*r-Math.sin(theta)*offset,.08+rise*1.4+t*.45,Math.sin(theta)*r+Math.cos(theta)*offset);}}
        a.needsUpdate=true;line.material.opacity=Math.sin(rise*Math.PI)*.3;
      });
    },
    clear(){root.visible=false;clock=0;},
    state:()=>({visible:root.visible,wisps:wisps.length})
  };
}
