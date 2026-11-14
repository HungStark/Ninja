import authored from './guardian-arsenal.json' with {type:'json'};
import {GUARDIAN_BOSS_DESIGNS as previous} from './guardian-moba-designs.js';

export const GUARDIAN_ARSENAL_DESIGNS=Object.fromEntries(Object.entries(authored).map(([id,boss])=>[id,{...previous[id],...boss,arsenal:true,combo:[],skills:boss.skills.map((s,index)=>({...s,index,stationary:!['pursuit','ranged','setup'].includes(s.role)}))}]));
const defaults={melee:{duration:1.9,cooldown:3.4,damage:23,windup:.55,range:5,radius:1.1,count:3,interval:.45},pursuit:{duration:1.65,cooldown:4,damage:28,windup:.65,range:32,radius:1.1,count:1,interval:.6},ranged:{duration:1.65,cooldown:4.5,damage:19,windup:.65,range:34,radius:.35,count:7,interval:.1},control:{duration:1.1,cooldown:6,damage:16,windup:.7,range:32,radius:1.5,count:3,interval:.6},setup:{duration:1,cooldown:7,damage:13,windup:.6,range:32,radius:1.1,count:3,interval:.5},resource:{duration:1.8,cooldown:10,damage:32,windup:.9,range:34,radius:1.5,count:3,interval:.4},finisher:{duration:2.6,cooldown:8,damage:36,windup:.75,range:32,radius:1.6,count:3,interval:.6},defense:{duration:1.6,cooldown:8,damage:30,windup:.55,range:7,radius:1.4,count:1,interval:.5},ultimate:{duration:6.3,cooldown:28,damage:45,windup:1.05,range:36,radius:1.8,count:5,interval:.85}};
export const GUARDIAN_ARSENAL_STATS=Object.fromEntries(Object.values(GUARDIAN_ARSENAL_DESIGNS).flatMap(b=>b.skills.map(s=>[s.type,{...defaults[s.role]}])));
const overrides={
 'fox-step':{duration:2.5,count:3,interval:.65},'fox-orbit':{duration:.95,count:4},'fox-spiral':{duration:2.5,count:16,interval:.07},'fox-tail-rage':{duration:3.5,count:4,interval:.7},'fox-suns':{duration:7.7,count:9,interval:.55},
 'dragon-wave':{duration:2.7,count:1,radius:.5},'dragon-prison':{duration:1.2,count:1},'dragon-submerge':{duration:2.1,windup:.95},'dragon-absorb':{duration:3.1,windup:1.05},'dragon-sky-ocean':{duration:7.5,count:4,interval:1.15},
 'wolf-claws':{count:3,duration:1.65,interval:.35},'wolf-flash':{duration:1.1,damage:0},'wolf-swap':{duration:1.2},'wolf-hunt':{duration:2.6,count:3,interval:.7},'wolf-zigzag':{duration:2.7,count:3,interval:.7},'wolf-incarnate':{duration:6,count:5,interval:.9},
 'eagle-eight':{duration:2.6,count:2,interval:.95},'eagle-triple':{duration:3.6,count:3,interval:.95},'eagle-tempest':{duration:6.8,count:4,interval:1.1},
 'turtle-stomp':{duration:1.3,range:32},'turtle-spin':{duration:2.2,damage:25},'turtle-rockfall':{duration:1.8,radius:.65,count:6},'turtle-collapse':{duration:2.4},'turtle-labyrinth':{duration:7.2,count:5,interval:.9},
 'gold-double':{count:2,duration:1.55,interval:.45},'gold-pierce':{duration:1.5,damage:42},'gold-greatsword':{duration:6.7,count:3,interval:1.1},
 'shadow-step':{duration:1.1,damage:0},'shadow-claws':{duration:1.7,count:3,interval:.4},'shadow-replay':{duration:1.4},'shadow-stalk':{duration:2.4},'shadow-night':{duration:6.8,count:4,interval:1.1},
 'stag-bloom':{count:4},'stag-transfer':{duration:2.2},'stag-awaken':{duration:1.2,count:2},'stag-worldtree':{duration:7.5,count:4,interval:1.1},
 'tiger-swipes':{count:2,duration:1.45,interval:.45},'tiger-groundspikes':{count:5},'tiger-rampage':{duration:3.4,count:3,interval:.9},'tiger-everwinter':{duration:7.3,count:4,interval:1.05}
};
for(const [id,values]of Object.entries(overrides))Object.assign(GUARDIAN_ARSENAL_STATS[id],values);
