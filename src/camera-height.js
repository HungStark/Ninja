// A critically damped camera anchor filters both the eye and look target. The
// character's physical feet still land exactly on each individual stair tread.
export function createCameraHeight(){
  let value=0,velocity=0;
  return {update(target,dt,snap=false){if(snap){value=target;velocity=0;return value;}const w=18,t=Math.max(0,dt),delta=value-target,c=(velocity+w*delta)*t,e=Math.exp(-w*t);value=target+(delta+c)*e;velocity=(velocity-w*c)*e;return value;},get value(){return value;}};
}
