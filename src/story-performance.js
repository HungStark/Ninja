import * as T from 'three';

const gestures={
  speak:{nod:.09,lean:.02,reach:.25},
  ask:{nod:-.16,lean:.04,reach:.34},
  warn:{nod:.08,lean:.09,reach:.62},
  reassure:{nod:.17,lean:.055,reach:.42},
  reflect:{nod:.28,lean:.07,reach:.04}
};

function delivery(line){
  if(Object.hasOwn(gestures,line.cue?.gesture))return gestures[line.cue.gesture];
  if(line.speaker.thought)return gestures.reflect;
  if(/\?/.test(line.text))return gestures.ask;
  if(/!|\b(?:stop|attack|listen)\b|cẩn thận|dừng lại/i.test(line.text))return gestures.warn;
  if(/yên tâm|bình an|trị thương|cảm ơn|\b(?:thanks|wounded|safe)\b/i.test(line.text))return gestures.reassure;
  return gestures.speak;
}

export function createStoryPerformance({hero,resolveActor,walkPoint}){
  let scene=null;

  function begin(speakers,cast){
    const roots=new Set([hero.root,...speakers.map(speaker=>resolveActor(speaker.id)).filter(Boolean)]);
    const models=new Map(cast.map(model=>[model.root,model]));
    const actors=[...roots].map(root=>({root,model:models.get(root),position:root.position.clone(),rotation:root.rotation.clone()}));
    scene={actors,partner:actors.find(actor=>actor.root!==hero.root)?.root,age:0,step:null};
  }

  function line(line,duration,target){
    if(!scene)return;
    const root=line.speaker.thought?hero.root:resolveActor(line.speaker.id)||hero.root;
    const attention=target||(root===hero.root?scene.lastNpc||scene.partner:hero.root);
    if(root!==hero.root)scene.lastNpc=root;
    Object.assign(scene,{speaker:root,attention,age:0,duration,gesture:delivery(line),thought:line.speaker.thought,kneel:line.cue?.kneel});
    if(!line.cue?.step||!attention||root.parent===hero.root||root.userData.storyPose&&root.userData.storyPose!=='standing')return;
    const from=root.getWorldPosition(new T.Vector3());
    const toward=attention.getWorldPosition(new T.Vector3()).sub(from).setY(0);
    const distance=Math.min(line.cue.step,Math.max(0,toward.length()-1.9));
    if(distance<.15)return;
    toward.setLength(distance);
    for(const fraction of [.25,.5,.75,1]){
      const point=from.clone().addScaledVector(toward,fraction);
      if(!walkPoint(point,from.y))return;
    }
    scene.step={root,from,toward,age:0};
  }

  function update(dt,time){
    if(!scene)return;
    scene.age+=dt;
    const {speaker,attention,actors,duration,gesture}=scene;
    if(!speaker)return;
    const step=scene.step;
    let velocity=null;
    if(step){
      step.age+=dt;
      const t=T.MathUtils.clamp((step.age-.18)/.74,0,1),progress=t*t*(3-2*t);
      const point=step.from.clone().addScaledVector(step.toward,progress);
      if(walkPoint(point,step.from.y)){
        step.root.position.copy(step.root.parent.worldToLocal(point));
        if(t>0&&t<1)velocity=step.toward.clone().multiplyScalar(6*t*(1-t)/.74);
      }
      if(t===1)scene.step=null;
    }
    const rise=Math.min(1,scene.age/.22),settle=T.MathUtils.clamp((duration-scene.age)/.3,0,1);
    const accent=Math.sin(Math.PI*T.MathUtils.clamp((scene.age-.16)/Math.min(1.9,duration*.8),0,1));
    for(const {root,model} of actors){
      if(!root.parent)continue;
      const talking=root===speaker,focus=talking?attention:speaker;
      const locked=root.parent===hero.root||root.userData.storyPose==='unconscious'||root.userData.storyPose==='carried';
      if(focus&&focus!==root&&!locked){
        const target=root.parent.worldToLocal(focus.getWorldPosition(new T.Vector3()));
        const delta=target.sub(root.position);
        const angle=Math.atan2(delta.x,delta.z)-root.rotation.y;
        if(delta.x*delta.x+delta.z*delta.z>.25)root.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*(1-Math.exp(-dt*5));
      }
      const nod=talking?gesture.nod*accent:Math.sin(Math.PI*T.MathUtils.clamp((scene.age-.58)/.72,0,1))*.115;
      const acting=locked?null:{nod,lean:talking?gesture.lean*rise*settle:0,reach:talking?gesture.reach*accent:0,
        kneel:root===hero.root&&scene.kneel?Math.min(1,scene.age/.85,Math.max(0,(duration-scene.age)/.65)):0,
        mouth:talking&&!scene.thought?rise*settle*(.05+.27*Math.abs(Math.sin(scene.age*13.1)*Math.cos(scene.age*7.7))):0};
      root.userData.storyActing=acting;
      const walking=step?.root===root&&!!velocity;
      model?.update(time,walking,walking?velocity:null,dt);
    }
  }

  function end(){
    if(!scene)return;
    for(const {root,position,rotation,model} of scene.actors){
      root.position.copy(position);
      root.rotation.copy(rotation);
      delete root.userData.storyActing;
      model?.update(0,false,null,0);
    }
    scene=null;
  }

  return {begin,line,lookAt(target){line({speaker:{id:'hero',thought:true},text:''},1.5,target);},update,end};
}
