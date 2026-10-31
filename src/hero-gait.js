const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

// Solve the ankle path with two leg segments instead of rotating a rigid leg.
// The planted half of each step stays level; the returning foot clears ground.
export function sampleHeroGait(phase,weight,sprint,forward,side){
  const drop=weight*(.05+sprint*.10+.008*(1-Math.cos(phase*2)));
  const span=.30+sprint*.20;
  const legs=[0,Math.PI].map(offset=>{
    const p=phase+offset,swing=Math.sin(p),lift=Math.pow(Math.max(0,Math.cos(p)),1.25)*weight*(.14+sprint*.13);
    const z=swing*span*weight*forward,x=swing*span*weight*side*.64,y=-(1-drop)+lift;
    const distance=clamp(Math.hypot(y,z,x),.08,1);
    const knee=2*Math.acos(distance);
    const hip=-Math.atan2(z,-y)-knee*.5;
    return {hip,knee,ankle:-hip-knee,side:Math.atan2(x,-y),lift};
  });
  return {drop,legs};
}
