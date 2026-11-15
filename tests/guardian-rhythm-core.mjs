import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import {createGuardianArsenalCombat} from '../src/guardian-arsenal-combat.js';
import {createGuardianBossCombat as createLegacy} from '../src/guardian-legacy-combat.js';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {GUARDIAN_ARSENAL_DESIGNS as designs} from '../src/guardian-arsenal-data.js';
import {guardianIsEnraged,guardianRest,guardianRecovery} from '../src/guardian-rhythm.js';
import {guardianPhaseHealth} from '../src/guardian-arts.js';
import {guardianSkillStats} from '../src/guardian-balance.js';
import {clampGuardianMovement} from '../src/practice-overhead.js';
import {opponentDocument} from '../tools/opponent-balance-data.mjs';
import {villageEventEncounter} from '../src/village-events.js';
import {storyBossProfile} from '../src/island-occupation.js';
import {configureOpponent} from '../src/opponent-balance.js';

const dt=1/60,boss=[0,2,-21],home=[0,0,-21],player=[0,1.7,7];
const options={aiEnabled:false,bounds:{minX:-15,maxX:15,minZ:-25,maxZ:11},attackBounds:{minX:-14,maxX:14,minZ:0,maxZ:10},constrainBossMovement:(from,to,mode)=>clampGuardianMovement(mode==='walk'?home:from,to,mode,3)};
const impact=shot=>({damage:shot.damage});
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-6,`${label}: ${a} != ${b}`);
assert.equal(guardianIsEnraged({hp:300,maxHp:1000}),false,'exactly 30% is not enraged');
assert.equal(guardianIsEnraged({hp:299,maxHp:1000}),true);

const g=createGuardianArsenalCombat(new T.Scene());
let normalAttacks=0,enragedAttacks=0,checkedGaps=0,checkedCombos=0,patrolFrames=0;
try{
 for(const id of Object.keys(designs))for(const enraged of [false,true]){
  g.reset(id);const hp=enraged?299:320,f={hp,maxHp:1000},directions=new Set();let previous=g.state(),restStart=null,gaps=0,patrol=0;
  for(let frame=1;frame<=60*60;frame++){
   f.hp=hp;const time=frame*dt,p=[Math.sin(time*.7)*8,1.7,7];
   g.update(dt,f,p,boss,impact,{...options,aiEnabled:true});const s=g.state();
   assert.equal(s.enraged,enraged,id+' rage state');
   if(previous.action&&!s.action){close(s.recovery,guardianRecovery(enraged,s.recoveryKind==='rest'),id+' recovery after skill');if(s.recoveryKind==='combo-gap')assert.equal(s.returning,null,id+' continues combo without retreat');restStart=s.returning?null:{time,kind:s.recoveryKind};}
   if(previous.returning&&!s.returning){assert.equal(s.action,null,id+' finishes returning before attacking');close(s.recovery,guardianRest(enraged),id+' rest starts after return');restStart={time,kind:'rest'};}
   if(s.attacks>previous.attacks&&restStart!==null){assert.ok(time-restStart.time>=guardianRecovery(enraged,restStart.kind==='rest')-dt-1e-6,id+' mandatory recovery');gaps++;restStart=null;}
   if(!s.action&&!s.returning&&s.recoveryKind==='rest'&&s.recovery>0&&s.moving){assert.ok(s.bossPosition[2]<-2,id+' patrol stays in home court');if(Math.abs(s.moveVelocity[0])>.1)directions.add(Math.sign(s.moveVelocity[0]));patrol++;}
   previous=s;
  }
  assert.ok(gaps>=5,id+' multiple recovery intervals checked');assert.ok(patrol>5,id+' moves during rest');assert.equal(directions.size,2,id+' patrols in both directions');checkedGaps+=gaps;patrolFrames+=patrol;
  const groups=Map.groupBy(previous.history,h=>h.combo),completed=[...groups.values()].slice(0,-1);
  for(const combo of completed){assert.ok(combo.length===2||combo.length===3||combo.length===1&&designs[id].skills.find(s=>s.type===combo[0].type).role==='ultimate',id+' combo has 2–3 skills (ultimate is a standalone attack)');if(combo.length>1)checkedCombos++;}
  if(enraged)enragedAttacks+=previous.attacks;else normalAttacks+=previous.attacks;
 }
 assert.ok(enragedAttacks>normalAttacks,'rage increases aggregate casting frequency at the same skill-unlock stage');

 // Shorten pending recovery immediately when health crosses the threshold.
 g.reset('water');const f={hp:320,maxHp:1000};g.update(dt,f,player,boss,impact,options);g.trigger(0,player,boss,f);
 for(let i=0;i<600&&g.state().action;i++)g.update(dt,f,player,boss,impact,options);
 for(let i=0;i<120&&g.state().returning;i++)g.update(dt,f,player,boss,impact,options);
 close(g.state().recovery,1.4,'normal pending rest');f.hp=299;g.update(dt,f,player,boss,impact,options);close(g.state().recovery,.6,'rage converts remaining rest');

 // Rage changes cooldown and recovery, preserving the actual warning/attack timeline.
 const snapshots=[];
 for(const enraged of [false,true]){
  g.reset('water');const actor={hp:enraged?299:320,maxHp:1000};g.update(dt,actor,player,boss,impact,options);g.trigger(4,player,boss,actor);
  const start=g.state();close(start.skillCooldowns[4],start.action.commitment+guardianSkillStats('dragon-prison').cooldown*(enraged?.65:1),'per-skill cooldown');
  for(let i=0;i<48;i++)g.update(dt,actor,player,boss,impact,options);
  const s=g.state();snapshots.push({action:s.action,hazards:s.hazards,projectiles:s.entities.filter(e=>e.kind==='projectile')});
 }
 assert.deepEqual(snapshots[0],snapshots[1],'rage preserves prison warning and straight-projectile timing');
 const beforeTinyStep=g.state();g.update(Number.EPSILON,{hp:299,maxHp:1000},player,boss,impact,options);assert.deepEqual(g.state(),beforeTinyStep,'floating-point remainder must not reset movement or flip patrol direction');
}finally{g.dispose();}

// First-person beasts use the same mandatory recovery duration.
const legacy=createLegacy(new T.Scene());
try{for(const id of Object.keys(designs))for(const enraged of [false,true]){
 legacy.reset(id);const f={hp:enraged?299:320,maxHp:1000};legacy.update(dt,f,player,boss,impact,options);legacy.trigger(0,player,boss,f);
 for(let i=0;i<1200&&legacy.state().action;i++){f.hp=enraged?299:320;legacy.update(dt,f,player,boss,impact,options);}
 assert.equal(legacy.state().action,null,id+' legacy completes');close(legacy.state().recovery,guardianRest(enraged),id+' legacy recovery');
}
 for(const id of Object.keys(designs))for(const enraged of [false,true]){
  legacy.reset(id);const f={hp:enraged?299:320,maxHp:1000};let previous=legacy.state(),short=0,rest=0;
  for(let i=0;i<60*40;i++){f.hp=enraged?299:320;legacy.update(dt,f,player,boss,impact,options);const s=legacy.state();if(previous.action&&!s.action){close(s.recovery,guardianRecovery(enraged,s.recoveryKind==='rest'),id+' legacy automatic combo recovery');if(s.recoveryKind==='rest')rest++;else short++;}previous=s;}
  assert.ok(short>=2&&rest>=1,id+' legacy chains three skills then rests');
 }
}finally{legacy.dispose();}

const nameless=createGuardianPhases(new T.Scene());
try{for(const enraged of [false,true]){
 const f={hp:1000,maxHp:1000};nameless.reset({village:'nameless',element:'earth',hp:1000,beastOnly:true},f);f.hp=f.maxHp*(enraged?.299:.32);
 nameless.update(dt,f,player,boss,impact,options);nameless.trigger(0,player,boss,f);
 for(let i=0;i<1200&&nameless.state().action;i++)nameless.update(dt,f,player,boss,impact,options);
 close(nameless.state().recovery,guardianRest(enraged),'Nameless recovery');
}}finally{nameless.dispose();}

const [source,core]=await Promise.all(['src/opponent-balance.js','game-core.js'].map(p=>fs.readFile(p,'utf8'))),doc=opponentDocument(source,core);
for(const row of doc.rows.filter(r=>r.phase===2&&(r.category==='guardian'||r.id.startsWith('story:')))){
 const first=doc.rows.find(r=>r.id===row.id.replace(/:2$/,':1'));assert.equal(row.values.hp,first.values.hp*2,row.id+' phase 2 has double phase 1 HP');
}
const rescue=storyBossProfile(villageEventEncounter('wind',3)),wind=doc.rows.find(r=>r.id==='guardian:wind:2');assert.equal(rescue.phaseHealth[1],wind.values.hp,'Wind rescue inherits raised stage-2 HP');
assert.deepEqual(guardianPhaseHealth(1000,'dark'),[300,600,350],'Dark phase 3 retains its original HP');
assert.deepEqual(guardianPhaseHealth(1000,'water',[{hp:777}]),[777,1554],'default beast HP follows effective phase-1 override');
const raw={kind:'boss',village:'water',hp:1000,spellIds:[]},configured=configureOpponent(raw,{});
assert.deepEqual(configureOpponent(configured,{}).phaseHealth,configured.phaseHealth,'reconfiguring an encounter does not compound HP');
console.log(`PASS: ${checkedGaps} recovery intervals, ${checkedCombos} complete combos, ${patrolFrames} home-court patrol frames across nine arsenals; normal/rage casts ${normalAttacks}/${enragedAttacks}, strict 30% threshold, cooldown multiplier, unchanged warnings, legacy/Nameless recovery and phase-2 HP ratios.`);
