// Numeric combat parameters shared by adventure, practice and the local editor.
// Art names, the three-skill loadouts and Nameless are deliberately separate.
export const GUARDIAN_SKILL_DEFAULTS={
  'fox-homing':{duration:5.8,cooldown:1.7,damage:16,count:5,windup:.7,interval:.55,speed:7.5,homing:1.1,life:4.8,radius:.45},
  'fox-illusions':{duration:7,cooldown:1.7,damage:18,count:4,windup:1.3,interval:1.2,speed:8,homing:.8,life:4,cloneHp:1},
  'fox-nine-pillars':{duration:6.8,cooldown:1.7,damage:26,count:9,warning:1.3,interval:.48,radius:1.05},
  'dragon-pressure':{duration:4.5,cooldown:1.7,damagePerSecond:20,windup:1.35,beamDuration:2.45,tickInterval:.18,radius:1},
  'dragon-prison':{duration:6,cooldown:1.7,damage:6,windup:1.3,radius:1.3,hp:8,life:4.5,tickInterval:1},
  'dragon-tsunami':{duration:6,cooldown:1.7,damage:42,windup:1.6,speed:7,life:7,gapWidth:2.6},
  'wolf-zigzag':{duration:3.6,cooldown:1.7,damage:27,windup:.9,rushDuration:1.15,returnDuration:.7,radius:1.2},
  'wolf-marks':{duration:4.8,cooldown:1.7,damage:23,count:3,interval:.85,warning:1.25,radius:1.25},
  'wolf-tempest':{duration:7,cooldown:1.7,damage:32,boltDamage:17,windup:2,rushDuration:1.15,returnDuration:.7,radius:1.2,count:8,boltStart:.35,interval:.65,warning:1.05,boltRadius:1.15},
  'eagle-crescents':{duration:4.8,cooldown:1.7,damage:16,count:4,windup:.7,interval:.7,speed:12,radius:.65,life:5},
  'eagle-dive':{duration:5.5,cooldown:1.7,damage:29,windup:1.3,rushDuration:.6,radius:1.7,exposedDuration:3,returnStart:4.3,returnDuration:1.2},
  'eagle-tornadoes':{duration:7,cooldown:1.7,damage:14,count:3,windup:1.2,life:7,tickInterval:.65,radius:1.15,orbitSpeed:.9,travelAmplitude:4.8},
  'turtle-quake':{duration:5,cooldown:1.7,damage:21,count:3,windup:.6,interval:1.2,speed:8,life:4,radius:.65},
  'turtle-rebound':{duration:4.5,cooldown:1.7,damageReduction:.85,reflection:.35},
  'turtle-mountains':{duration:5.8,cooldown:1.7,damage:32,count:5,warning:1.3,interval:.48,radius:1.15},
  'gold-feathers':{duration:6,cooldown:1.7,damage:5,count:10,windup:.15,interval:.45,feathersPerLane:5,warning:.9,radius:.43},
  'gold-hunt':{duration:5.5,cooldown:1.7,damage:37,windup:1.3,rushDuration:.6,radius:1.7,exposedDuration:3,returnStart:4.3,returnDuration:1.2},
  'gold-wingblades':{duration:5,cooldown:1.7,damage:36,windup:1.4,speed:12,life:5,radius:1,sideOffset:2.5},
  'shadow-ambush':{duration:4,cooldown:1.7,damage:32,warningStart:.8,reappearAt:1.5,retreatAt:2.5,strikeAt:2.05,radius:1.6,exposedDuration:1.5},
  'shadow-pack':{duration:6.5,cooldown:1.7,damage:18,count:4,windup:.3,interval:.8,warning:.6,speed:4.8,life:7,radius:.9},
  'shadow-night':{duration:8,cooldown:1.7,damage:18,count:10,windup:.5,interval:.55,warning:.8,speed:4.8,life:7,radius:.9},
  'stag-vines':{duration:4.8,cooldown:1.7,damage:15,controlDuration:1.5,count:3,interval:.85,warning:1.2,radius:1.1},
  'stag-spirits':{duration:6.5,cooldown:1.7,hp:12,count:3,life:16,healRate:.006,damage:12,rootCount:3,windup:1.3,interval:1.3,warning:1,radius:.85},
  'stag-forest':{duration:8,cooldown:1.7,hp:8,count:6,life:18,healRate:.002,damage:14,waveCount:5,windup:1,interval:1.1,warning:.8,radius:.8},
  'tiger-claws':{duration:4.5,cooldown:1.7,damage:20,count:3,windup:.2,interval:1.05,warning:.85,radius:1.25},
  'tiger-crystals':{duration:6.5,cooldown:1.7,damage:28,hp:6,count:3,life:7,detonateAfter:4.2,radius:2.7,shelterRadius:1.8,shelterDuration:12},
  'tiger-blizzard':{duration:8,cooldown:1.7,damage:15,tickInterval:.7,windup:3,freezeAt:5,controlDuration:2.3,hp:6,count:3,life:8,fixedShelterRadius:1.25,fixedShelterDuration:9,shelterRadius:1.8,shelterDuration:12}
};
export const GUARDIAN_PASSIVE_DEFAULTS={
  fire:{healthThreshold:.1,tailCap:9,damagePerTail:.075},
  water:{tideMin:.25,tideAmplitude:.4,tideFrequency:.45,slowPerLevel:.3},
  lightning:{stackCount:3,stackDuration:6,controlDuration:1.4},
  wind:{airborneReduction:.45,vulnerability:1.5},
  earth:{shellReduction:.7,headMultiplier:1.15,legMultiplier:1,toppleThreshold:.045,toppleDuration:4,toppleMultiplier:1.8},
  light:{damageReduction:.2,reflection:.18,vulnerability:1.6},
  dark:{hideCycle:8,hideDuration:2.3,lampRadius:2.1},
  wood:{hp:10,life:90,healRate:.003,healRadius:4},
  ice:{stackCount:3,stackDuration:6,controlDuration:2}
};
export const guardianBalanceOverrides=/* guardian-balance:start */{}/* guardian-balance:end */;
export function guardianSkillStats(type){return {...GUARDIAN_SKILL_DEFAULTS[type],...guardianBalanceOverrides[type]};}
export function guardianPassiveStats(village){return {...GUARDIAN_PASSIVE_DEFAULTS[village],...guardianBalanceOverrides['passive:'+village]};}
