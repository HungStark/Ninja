// Every combat value is shared with the local guardian balance editor.
export const GUARDIAN_AI_DEFAULTS={enrageThreshold:.3,enrageCooldown:.82,comboChance:.72,maxRepeatedCombos:2};
export const GUARDIAN_SKILL_DEFAULTS={
 'fox-pillars':{duration:1.8,cooldown:2,damage:22,count:3,maxCount:5,warning:.9,radius:1.15,zoneLife:3,zoneDps:7},
 'fox-homing':{duration:1.5,cooldown:2,damage:18,count:3,windup:.6,interval:.1,speed:8,homing:3,homingTime:3,life:4.5,radius:.4,blastRadius:1.2,growth:1.4},
 'fox-firestorm':{duration:6.2,cooldown:3,damage:18,count:4,windup:.6,interval:1.05,warning:.8,radius:1.05,zoneLife:3,zoneDps:6,fanDamage:24,fanRadius:9},
 'dragon-pressure':{duration:4,cooldown:2,damagePerSecond:16,windup:1,beamDuration:2.5,tickInterval:.2,radius:.75,range:38,pushSpeed:2.5,coneAngle:.6,endRadius:4},
 'dragon-vortices':{duration:3.4,cooldown:2,damage:5,count:3,warning:.7,life:2.5,radius:2.2,pullSpeed:2.6,centerTime:1,controlDuration:.7,growth:1.4,absorbRange:3.5},
 'dragon-tsunami':{duration:6.8,cooldown:3,damage:30,count:3,windup:.9,interval:1.6,speed:9,life:5,radius:1,gapWidth:3,waveWidth:36},
 'wolf-dashes':{duration:3.3,cooldown:2,damage:23,count:3,windup:.7,rushDuration:.22,interval:.9,radius:1,zoneLife:2,zoneDps:5,trailWidth:.7},
 'wolf-bolts':{duration:1.5,cooldown:2,damage:22,count:4,warning:.8,radius:1.25,explosionDamage:22,growth:1.4},
 'wolf-clones':{duration:6.8,cooldown:2.5,damage:18,count:3,windup:.4,hp:18,speed:4,life:6.2,returnAt:5,returnSpeed:16,radius:.65,linkDps:7,slow:.2,linkWidth:.45},
 'eagle-blades':{duration:1.6,cooldown:2,damage:14,count:5,windup:.6,interval:.1,speed:12,life:3.5,radius:.5,range:40,speedBoost:1.4,lifeBoost:1.5},
 'eagle-tornadoes':{duration:1.6,cooldown:2,damage:8,count:3,windup:.8,life:6,tickInterval:.55,radius:1.5,speed:2.2,controlDuration:.6},
 'eagle-dive':{duration:2.7,cooldown:2.5,damage:28,windup:1.2,rushDuration:.35,radius:2.2,count:6,gustDamage:12,gustSpeed:10,gustRadius:.4},
 'turtle-pillars':{duration:1.7,cooldown:2,damage:17,count:4,warning:.85,hp:50,radius:1,life:5,controlDuration:.7},
 'turtle-quake':{duration:3.7,cooldown:2,damage:18,count:3,windup:.5,interval:1,speed:10,radius:.55,warning:.65},
 'turtle-ram':{duration:4.6,cooldown:2.5,damage:25,windup:.8,speed:11,bounces:3,radius:1.8,fanDamage:12,fanRadius:5,armorFraction:.03},
 'gold-feathers':{duration:1.6,cooldown:2,damage:12,count:9,windup:.65,interval:.06,speed:14,life:3.5,radius:.18,fanAngle:1.6,featherLife:5},
 'gold-arcs':{duration:2.1,cooldown:2,damage:22,count:2,windup:.7,interval:.4,speed:11,life:2.5,radius:.7,slow:.3,slowTime:1.5},
 'gold-swords':{duration:4.5,cooldown:2.5,damage:10,count:8,windup:.6,life:3.1,radius:6,endRadius:1,interval:.65,speed:15,finalDamage:32,warning:.8},
 'shadow-dashes':{duration:2.7,cooldown:2,damage:27,count:2,windup:.7,rushDuration:.25,interval:.9,radius:1,cooldownReduction:.6},
 'shadow-clones':{duration:1.2,cooldown:2,damage:24,count:3,windup:.4,hp:15,speed:3,life:4,attackAt:2.3,warning:.65,radius:1,explosionDamage:8},
 'shadow-domain':{duration:6.6,cooldown:2.5,damage:17,windup:.6,life:6,radius:7,slow:.15,count:3,interval:1.6,range:5},
 'stag-vines':{duration:1.8,cooldown:2,damage:16,count:3,warning:.8,radius:1.2,controlDuration:1,life:1.5,growth:1.4},
 'stag-flowers':{duration:3.1,cooldown:2,damage:10,count:4,windup:.5,delay:2,hp:18,seedCount:6,speed:7.5,slow:.2,slowTime:1.5,healFraction:.3,thornDamage:8,thornRadius:2.2},
 'stag-tree':{duration:6.7,cooldown:3,damage:15,windup:.6,hp:90,life:6,healRate:.008,linkMultiplier:.2,rootInterval:2,warning:.65,radius:1.1,controlDuration:1.5},
 'tiger-claws':{duration:2.8,cooldown:2,damage:18,count:3,windup:.55,interval:.8,warning:.4,radius:1.4,range:4,zoneLife:4,slow:.2},
 'tiger-spikes':{duration:2,cooldown:2,damage:19,count:5,warning:1,hp:40,life:4,radius:.8,shardDamage:8,speed:8,shardCount:6},
 'tiger-blizzard':{duration:5.9,cooldown:2.5,damagePerSecond:4,windup:.6,life:5,radius:2,endRadius:8,interval:1,damage:10,speed:10,speedBoost:.35,explosionDamage:22,slow:.5,slowTime:2}
};
export const GUARDIAN_PASSIVE_DEFAULTS={
 fire:{moveSpeed:2.2,engageRange:11,stackCount:5,stackDuration:8,explosionDamage:24,explosionRadius:2.2,zoneLife:3,zoneDps:6,healthThreshold:.25,tailCap:3},
 water:{moveSpeed:2.1,engageRange:12,stackCount:3,stackDuration:6,slow:.25,slowTime:2,puddleInterval:15,puddleLife:8,puddleRadius:2.5,speedBoost:.15},
 lightning:{moveSpeed:3.3,engageRange:4,energyDistance:5,energyCap:5,chainCount:2,chainRange:6,chainDamage:12,markTime:5,markDamage:10},
 wind:{moveSpeed:2.8,engageRange:10,speedPerCast:.1,speedCap:3,windInterval:12,windLife:8,windSpeed:3,windWidth:2,slow:.15},
 earth:{moveSpeed:1.6,engageRange:6,stationaryTime:2,damageReduction:.2,healthThreshold:.15,armorFraction:.06,shardDamage:12,shardCount:8},
 light:{moveSpeed:2.5,engageRange:12,stackCount:4,stackDuration:5,armorReduction:.04,bonusDamage:18,featherLife:5},
 dark:{moveSpeed:3.1,engageRange:3,hideAfter:5,speedBoost:.25,firstHitBonus:.35,markTime:5},
 wood:{moveSpeed:2,engageRange:11,spiritInterval:10,spiritCap:3,hp:30,life:90,healRate:.005,ragePerSpirit:.1,rageCap:3},
 ice:{moveSpeed:2.8,engageRange:3,stackCount:4,stackDuration:6,slowPerStack:.05,controlDuration:1,freezeImmunity:5}
};
export const guardianBalanceOverrides=/* guardian-balance:start */{}/* guardian-balance:end */;
export function guardianSkillStats(type){return {...GUARDIAN_SKILL_DEFAULTS[type],...guardianBalanceOverrides[type]};}
export function guardianPassiveStats(village){return {...GUARDIAN_PASSIVE_DEFAULTS[village],...guardianBalanceOverrides['passive:'+village]};}
