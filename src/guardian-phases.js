import * as T from 'three';

export const GUARDIAN_SIGNATURES={
  water:{name:'Thủy triều phân lưu',color:'#69d5ee',pattern:'flanks',damage:28},
  fire:{name:'Nứt nham thạch',color:'#ff8744',pattern:'line',damage:34},
  lightning:{name:'Lôi vũ truy kích',color:'#c5a0ff',pattern:'trail',damage:32},
  wind:{name:'Phong nhãn kép',color:'#9fe9ce',pattern:'flanks',damage:36},
  earth:{name:'Thạch trụ địa chấn',color:'#d9ae69',pattern:'cross',damage:42},
  light:{name:'Nhật quang phán quyết',color:'#fff2bd',pattern:'line',damage:40},
  ice:{name:'Băng nứt liên hoàn',color:'#b4e8ff',pattern:'trail',damage:40},
  wood:{name:'Rễ cổ thụ săn đuổi',color:'#97cc70',pattern:'cross',damage:38},
  dark:{name:'Nguyệt thực hư không',color:'#b78ae8',pattern:'flanks',damage:48},
  nameless:{name:'Vọng âm cổ thạch',color:'#dfc58c',pattern:'line',damage:28}
};
export function guardianPhase(hp,maxHp,count=2){const ratio=hp/Math.max(1,maxHp);return count>=3?(ratio<=.32?3:ratio<=.68?2:1):(ratio<=.55?2:1);}
export function signaturePoints(pattern,p,phase){
  if(pattern==='flanks')return [-1,1].map(side=>[p[0]+side*(phase===3?1.7:2.5),.06,p[2]]);
  if(pattern==='cross')return [[p[0],.06,p[2]],...(phase===3?[-1,1].map(s=>[p[0]+s*3,.06,p[2]+s*1.5]):[])];
  if(pattern==='line')return Array.from({length:phase===3?3:2},(_,i)=>[p[0]+(i-(phase===3?1:.5))*2.8,.06,p[2]+(i%2?1.2:-1.2)]);
  return [[p[0],.06,p[2]],...(phase===3?[[p[0]+2,.06,p[2]+1]]:[])];
}
export function createGuardianPhases(scene){
  let encounter=null,phase=1,timer=6,clock=0,attacks=0;const hazards=[];
  const ring=new T.RingGeometry(.83,1,32),column=new T.CylinderGeometry(.8,1.05,1,7,1,true);
  function remove(h){h.root.removeFromParent();h.material.dispose();hazards.splice(hazards.indexOf(h),1);}
  function reset(config=null){for(const h of [...hazards])remove(h);encounter=config;phase=1;timer=5;clock=attacks=0;}
  return {reset,
    update(dt,hp,maxHp,player,onPhase,impact){if(!encounter||hp<=0)return;clock+=dt;
      const next=guardianPhase(hp,maxHp,encounter.phases);if(next>phase){phase=next;timer=1.8;onPhase(phase);}
      const signature=GUARDIAN_SIGNATURES[encounter.village]||GUARDIAN_SIGNATURES.nameless;
      if(phase>1&&hp>0){timer-=dt;if(timer<=0){timer=phase===3?5.8:8;attacks++;for(const p of signaturePoints(signature.pattern,player,phase)){
        const material=new T.MeshBasicMaterial({color:signature.color,transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}),root=new T.Group(),marker=new T.Mesh(ring,material);marker.rotation.x=-Math.PI/2;root.add(marker);root.position.fromArray(p);scene.add(root);
        hazards.push({root,material,p,age:0,warning:phase===3?1.25:1.5,radius:phase===3?1.15:1.25,hit:false,column:null});
      }}}
      for(const h of [...hazards]){h.age+=dt;if(!h.hit){h.root.scale.setScalar(h.radius);h.material.opacity=.3+(Math.sin(h.age*13)+1)*.22;
        if(h.age>=h.warning){h.hit=true;const mesh=new T.Mesh(column,h.material);mesh.position.y=2;mesh.scale.y=4;h.root.add(mesh);h.column=mesh;h.material.opacity=.62;
          if(Math.hypot(player[0]-h.p[0],player[2]-h.p[2])<=h.radius)impact({owner:'enemy',element:encounter.element,style:'guardian-signature',damage:signature.damage*(phase===3?1.2:1),unreflectable:true,v:[0,-1,0],color:signature.color},player);
        }
      }else{const t=(h.age-h.warning)/.65;h.material.opacity=.6*(1-t);if(h.column)h.column.scale.y=4*(1-t*.6);if(t>=1)remove(h);}}
    },
    state:()=>({phase,maxPhase:encounter?.phases||1,signature:encounter?(GUARDIAN_SIGNATURES[encounter.village]?.name||''):null,attacks,hazards:hazards.map(h=>({position:[...h.p],remaining:Math.max(0,h.warning-h.age),radius:h.radius,hit:h.hit}))})
  };
}
