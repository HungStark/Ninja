export const SEAL_CYCLE_TIME=.3;
const smooth=t=>t*t*(3-2*t),clamp=t=>Math.max(0,Math.min(1,t));
// One input closes the hands, then opens them again within 0.3 seconds.
export function sealCycle(age,duration=SEAL_CYCLE_TIME){
  const progress=clamp(age/duration),close=smooth(clamp(progress*2)),open=smooth(clamp((progress-.5)*2));
  return {close,open,clasp:close*(1-open),phase:progress<.5?'close':progress<1?'open':'seal'};
}
