import {sampleHeroGait} from './hero-gait.js';

// A small resting gap keeps hands outside the coat without returning to A-pose.
export const REST_ARM_OPEN=.11;

// One gait/cadence/transition sampler for the hero and village ninja rigs.
export function createCharacterMotion(){
  let localX=0,localZ=0,stride=0,sprintBlend=0;
  return {update(time,moving,velocity,dt,sprinting,yaw=0,airborne=false){
    const vx=moving?(velocity?.x??Math.sin(yaw)*4.6):0,vz=moving?(velocity?.z??Math.cos(yaw)*4.6):0,blend=1-Math.exp(-dt*14);
    localX+=(Math.cos(yaw)*vx-Math.sin(yaw)*vz-localX)*blend;localZ+=(Math.sin(yaw)*vx+Math.cos(yaw)*vz-localZ)*blend;
    const speed=Math.hypot(localX,localZ),weight=speed<.005?0:Math.min(1,speed/3),side=speed>.001?localX/speed:0,forward=speed>.001?localZ/speed:0;
    sprintBlend+=((sprinting&&moving&&forward>.25?weight:0)-sprintBlend)*(1-Math.exp(-dt*12));
    if(!airborne)stride+=speed*dt*(2.4+Math.abs(side)*.3)*(1+sprintBlend*.08);
    const arms=[-1,1].map((sideSign,i)=>{
      const swing=Math.sin(stride+i*Math.PI)*weight;
      return {pitch:(.06+swing*forward*.3)*(1-sprintBlend)+(1.02+Math.sin(stride*2)*.025)*sprintBlend,spread:-swing*side*.2*(1-sprintBlend)+sideSign*.12*sprintBlend,flex:(.16+weight*(.26+Math.max(0,-swing)*.15))*(1-sprintBlend)+.10*sprintBlend};
    });
    return {localX,localZ,stride,sprintBlend,speed,weight,side,forward,arms,sprintLean:sprintBlend*.42,gait:sampleHeroGait(stride,weight,sprintBlend,forward,side)};
  }};
}
