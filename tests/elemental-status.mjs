import assert from 'node:assert/strict';
import '../game-core.js';
import {aimMagneticShots} from '../src/elemental-combat.js';
const {Fighter,GameRules,spells,shuriken,projectileTimeStep}=SealGameCore,spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [id,damage] of [['water-lance',14.4],['water-volley',108],['water-tsunami',36]])close(spell(id).damage,damage);
assert.equal(spell('water-volley').controlDuration,1);assert.equal(spell('lightning-reflect').slowFactor,.15);
close(projectileTimeStep([0,2,0],[0,0,20],.1,'enemy',[{owner:'player',p:[0,0,0],radius:9,height:8,life:10,slowFactor:spell('lightning-reflect').slowFactor}]).travelTime,.015);
for(const element of ['fire','lightning']){
  const f=new Fighter();for(const r of [{damage:0},{damage:0,immune:true},{damage:0,reflected:true}])f.applyElementHit(element,r,'lance');assert.equal(f.burns.length+f.staticStacks,0);
}
const f=new Fighter();f.applyElementHit('fire',{damage:9.6},'volley');f.tick(4);f.applyElementHit('fire',{damage:9.6},'volley');assert.deepEqual(f.burns,[6,10]);f.tick(6);assert.deepEqual(f.burns,[4]);f.tick(4);assert.equal(f.burns.length,0);assert.equal(f.hp,200,'Unactivated burn has no extra damage');
for(let n=1;n<=5;n++){
  const victim=new Fighter();for(let i=0;i<n;i++)victim.applyElementHit('fire',{damage:1},'volley');
  const ignition=victim.ignite();assert.deepEqual(ignition,{stacks:n,damage:[10,20,30,45,60][n-1]});assert.equal(victim.burns.length,0);assert.equal(victim.ignitionLevel,n);
  const result=victim.receive(ignition.damage,true);victim.applyElementHit('fire',result,'ignite');assert.equal(victim.burns.length,0,'Activation cannot restack itself');assert.equal(victim.hp,200-ignition.damage);assert.equal(victim.ignite(),null);
}
for(let i=0;i<5;i++)f.applyElementHit('fire',{damage:1},'volley');f.tick(3);f.applyElementHit('fire',{damage:1},'dragon');assert.deepEqual(f.burns,[7,7,7,7,10]);f.tick(7);assert.deepEqual(f.burns,[3]);
for(let n=1;n<=3;n++){
  const victim=new Fighter();for(let i=0;i<n;i++)victim.applyElementHit('lightning',{damage:1},'lance');victim.tick(9);assert.equal(victim.staticStacks,n,'Charges remain valid for ten seconds');
  const {stun,magnetic}=victim.discharge();assert.equal(stun,[.5,1,2][n-1]);assert.equal(magnetic,[3,5,7][n-1]);assert.equal(victim.staticStacks,0);assert.equal(victim.controlSource,'Điện giật');assert.equal(victim.magneticActive,false);
  victim.tick(stun/2);close(victim.magneticTime,magnetic);victim.tick(stun/2);assert.equal(victim.controlTime,0);assert.equal(victim.magneticActive,true);victim.tick(magnetic);assert.equal(victim.magneticActive,false);
}
const charges=new Fighter();charges.applyElementHit('lightning',{damage:1},'lance');charges.tick(4);charges.applyElementHit('lightning',{damage:1},'lance');assert.deepEqual(charges.staticCharges,[6,10]);charges.tick(6);assert.equal(charges.staticStacks,1);close(charges.discharge().stun,.5);
for(let i=0;i<3;i++)charges.applyElementHit('lightning',{damage:1},'bird');charges.tick(5);charges.applyElementHit('lightning',{damage:1},'lance');assert.deepEqual(charges.staticCharges,[5,5,10]);charges.tick(5);assert.deepEqual(charges.staticCharges,[5]);charges.tick(5);assert.equal(charges.staticStacks,0);assert.equal(charges.discharge(),null);
for(let i=0;i<7;i++)f.applyElementHit('lightning',{damage:1},'bird');assert.equal(f.staticStacks,3);f.invulnerableTime=3;assert.equal(f.discharge(),null);assert.equal(f.ignite(),null);assert.equal(f.staticStacks,3);assert.equal(f.burns.length,1);
const weaponUser=new Fighter();weaponUser.waterWeaponTime=10;const empowered=weaponUser.waterWeapon(shuriken);assert.equal(empowered.damage,10);assert.equal(empowered.speed,72);weaponUser.tick(10);assert.equal(weaponUser.waterWeapon(shuriken).damage,4);assert.equal(weaponUser.waterWeapon(shuriken).speed,36);assert.equal(empowered.damage,10,'Flying weapon keeps its cast-time properties');
const overlap=new Fighter();overlap.waterControlTime=3;overlap.boatControlTime=1;overlap.lightningControlTime=.5;overlap.tick(1);assert.equal(overlap.controlTime,2,'Boat/electric stun does not shorten a prison');
for(const [id,reason,context] of [['fire-barrier','burn',{burnStacks:1}],['lightning-barrier','static',{staticStacks:1}]]){
  const rules=new GameRules([id,'wind-orb']);spell(id).sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast().reason,reason);assert.equal(rules.chakra,100);assert.equal(rules.cast(context).ok,true);
}
const victim=new Fighter();victim.magneticTime=3;
const actors=[{owner:'player',fighter:new Fighter(),pos:[0,1.72,7]},{owner:'enemy',fighter:victim,pos:[2,1.72,-16]}],shot={owner:'player',element:'lightning',style:'lance',p:[0,1.72,0],v:[0,0,-38],motionTime:.7};
aimMagneticShots([shot],actors);close(Math.hypot(...shot.v),38);assert.ok(shot.v[0]>0);assert.equal(shot.motionTime,.7);
actors[1].pos[0]=-3;aimMagneticShots([shot],actors);assert.ok(shot.v[0]<0,'Homing follows lateral dodge');
victim.magneticTime=0;const old=[...shot.v];actors[1].pos[0]=4;aimMagneticShots([shot],actors);assert.deepEqual(shot.v,old,'Expiry stops tracking');
victim.magneticTime=3;const fire={...shot,element:'fire'},weapon={...shot,element:'weapon'};aimMagneticShots([fire,weapon],actors);assert.deepEqual(fire.v,old);assert.deepEqual(weapon.v,old);
shot.owner='enemy';aimMagneticShots([shot],actors);assert.deepEqual(shot.v,old,'Reflected lightning follows the new victim only if magnetized');
console.log('PASS: water balance/buff/expiry, 15% field, individual capped burn timers, all ignition/discharge tiers, immunity, cast gating, overlapping control, delayed magnetism and live homing.');
