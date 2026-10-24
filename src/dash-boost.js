export const STEP_DISTANCE=.2,STEP_DURATION=.2,DASH_DISTANCE=3,DASH_DURATION=.2,BOOST_DURATION=3,DASH_COOLDOWN=6;
export function createDashBoost(){
  let ready=0,cooldown=0,dashing=0,uses=0;
  return {
    arm(blocked=false){if(blocked||ready>0||cooldown>0||dashing>0)return false;ready=BOOST_DURATION;return true;},
    consume(){if(ready<=0||cooldown>0||dashing>0)return false;ready=0;cooldown=DASH_COOLDOWN;dashing=DASH_DURATION;uses++;return true;},
    tick(dt){const left=t=>t-dt>1e-8?t-dt:0;ready=left(ready);cooldown=left(cooldown);dashing=left(dashing);},
    cancelDash(){dashing=0;},
    reset(){ready=cooldown=dashing=uses=0;},
    state:()=>({ready,cooldown,dashing,uses})
  };
}
