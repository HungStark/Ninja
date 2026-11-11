const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t;
const rest=[{pitch:.06,spread:0,flex:.16},{pitch:.06,spread:0,flex:.16}];
const arm=(pitch,spread,flex)=>({pitch,spread,flex});
export function createHeroCombatMotion(){
  let action=null,last=null,sealElapsed=0,sealBlend=0;
  return {
    play(kind,style=''){if(kind==='seal'){action=null;sealElapsed=0;return;}action={kind,style,age:0,duration:kind==='throw'?.24:kind==='dash'?.25:.42};},
    reset(){action=last=null;sealElapsed=sealBlend=0;},
    update(dt,{pose=-1,ready=false,reducedMotion=false}={}){
      if(action){action.age+=dt;if(action.age>=action.duration)action=null;}
      const sealing=pose>=0||ready;
      if(sealing){sealElapsed+=dt;sealBlend=Math.min(1,sealBlend+dt/.1);}else sealElapsed=sealBlend=0;
      if(!action&&!sealing){last=null;return null;}
      let arms,lean=0,twist=0,drop=0,legs=null,hands=null,phase='seal',weight=1;
      if(action?.kind==='throw'){
        const keys=[
          {t:0,a:arm(.22,-.12,1.15),twist:-.1,phase:'draw'},
          {t:.045,a:arm(-.45,-.3,1.55),twist:-.18,phase:'draw'},
          {t:.08,a:arm(-1.9,-.45,1.3),twist:-.3,phase:'windup'},
          {t:.125,a:arm(-1.45,.22,.12),twist:.3,phase:'release'},
          {t:.24,a:rest[1],twist:0,phase:'recover'}
        ];
        const end=keys.findIndex(k=>k.t>=action.age),b=keys[Math.max(1,end)],a=keys[Math.max(0,end-1)],t=clamp((action.age-a.t)/(b.t-a.t));
        arms=[arm(-.3,.12,.5),arm(mix(a.a.pitch,b.a.pitch,t),mix(a.a.spread,b.a.spread,t),mix(a.a.flex,b.a.flex,t))];
        twist=mix(a.twist,b.twist,t);lean=.08;phase=b.phase;weight=1-clamp((action.age-.16)/.08);
      }else if(action?.kind==='dash'){
        weight=1-clamp((action.age-.13)/.12);arms=[arm(1.05,.13,.12),arm(1.12,-.13,.12)];lean=.6;drop=.17;
        legs=[{hip:-.6,knee:.65,ankle:-.25},{hip:.55,knee:.9,ankle:-.4}];phase=action.age<.13?'dash':'recover';
      }else if(action){
        const summon=['snowstorm','snowball','blizzard','earthgravity','meteor','thunder','jacob','woodseed','domain','shadowclone'].includes(action.style);
        const thrust=['volley','lance','lightray','icebind','bamboostab','windslash','shuriken'].includes(action.style);
        const release=clamp(action.age/.1),finish=1-clamp((action.age-.2)/.22);weight=finish;
        const pitch=summon?-1.9:thrust?-1.45:-1.1,flex=mix(1.2,.2,release);
        arms=[arm(thrust?-.65:pitch,.18,thrust?.85:flex),arm(pitch,-.18,flex)];
        lean=summon?-.08:.16;drop=summon?.03:.1;twist=thrust?.16:0;phase=action.age<.1?'gather':'release';
      }else{
        const t=clamp((sealElapsed-.12)/.18),close=t*t*(3-2*t),gap=mix(.42,.14,close),reach=mix(.62,.48,close);
        hands=[[gap,1.94,reach],[-gap,1.94,reach]];
        arms=[arm(-.55,.15,.7),arm(-.55,-.15,.7)];drop=.04;weight=sealBlend;phase=sealElapsed<.12?'reach':sealElapsed<.3?'close':'seal';
      }
      if(reducedMotion){lean*=.3;twist*=.3;drop*=.3;}
      last={kind:action?.kind||'seal',style:action?.style||'',age:action?.age??sealElapsed,phase,weight,arms,lean,twist,drop,legs,hands};return last;
    },
    state:()=>last&&{...last,arms:last.arms.map(a=>({...a}))}
  };
}
