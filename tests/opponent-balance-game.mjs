import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {villageEventEncounter} from '../src/village-events.js';
import {promiseMother,chooseStarter} from '../src/journey-story.js';
import {REGIONS} from '../src/adventure-world.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<.02,`${a} != ${b}`);
export async function runOpponentGameChecks(browser,bundle,out){
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
 await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle}));
 let checkpoint='practice';
 try{
  await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  await page.evaluate(()=>{document.getElementById('clearLoadout').click();document.querySelector('[data-equip="wind-orb"]').click();document.getElementById('startButton').click();document.getElementById('practiceOpponentConfirm').click();document.querySelector('[name=practiceView][value=first-person]').checked=true;document.getElementById('practiceViewConfirm').click();__AN_HOA__.setAIEnabled(false);});await advance(.01);
  let s=await state();assert.equal(s.enemyMaxHealth,850);assert.equal(s.enemyAI.mana,45);assert.equal(s.enemyChakra,45);assert.equal(s.enemyAI.infiniteMana,false);assert.equal(s.enemyAI.sealDelay,.15);assert.equal(s.enemyAI.baseDamagePercent,60);assert.deepEqual(s.enemyLoadout,['fire-volley']);
  checkpoint='unchanged incoming damage';await page.evaluate(()=>{__AN_HOA__.setHealth('enemy',10000);__AN_HOA__.setHealth('player',10000);__AN_HOA__.aimAt(__AN_HOA__.state().enemyPosition);});
  const wind=await page.evaluate(()=>SealGameCore.spells.find(s=>s.id==='wind-orb'));for(const key of wind.sequence)await page.keyboard.press(key);await page.keyboard.press('Space');await advance(3.5);s=await state();close(10000-s.enemyHealth,wind.damage);
  checkpoint='direct base damage percent';const health=s.health;await page.evaluate(()=>{const p=__AN_HOA__.state().playerPosition;__AN_HOA__.launchEnemy('wind-orb',[p[0],p[1],p[2]-2],[0,0,1]);});await advance(1);s=await state();close(health-s.health,wind.damage*.6);await page.screenshot({path:out+'/practice-runtime.png'});
  console.log('CHECK: edited practice HP, mana, loadout, seal time, base damage percent and original incoming damage passed.');
 }catch(error){await page.screenshot({path:out+'/practice-failure.png'}).catch(()=>{});await fs.writeFile(out+'/practice-failure.json',JSON.stringify({checkpoint,message:error.message,errors,body:await page.locator('body').innerText().catch(()=>''),state:await state().catch(()=>null)},null,2));error.message=checkpoint+': '+error.message;throw error;}finally{await page.close();}
 const guardianPage=await browser.newPage({viewport:{width:1280,height:800}});guardianPage.on('pageerror',e=>errors.push(e.message));await guardianPage.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle}));
 const seed=campaignFixtures()['fire:report'];seed.position=[0,5];seed.story.guardianOrders.push('fire');seed.story.defeatedGuards.push('fire-guardian-sentry-1','fire-guardian-sentry-2');seed.interior={id:'fire-council-hall',layoutRevision:3,returnPosition:[0,7],returnSurface:null,returnElevation:0};
 await guardianPage.addInitScript(seed=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(seed)),seed);
 try{
  await guardianPage.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await guardianPage.waitForFunction(()=>document.body.dataset.ready==='true');await guardianPage.locator('#continueJourney').click();await guardianPage.waitForFunction(()=>__AN_HOA__.adventure().phase==='explore'&&!__AN_HOA__.adventure().loading);
  await guardianPage.evaluate(()=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.audio.configure({readDialogue:false});__AN_HOA__.explore.offerBattle('boss');__AN_HOA__.advance(.01);});
  for(let i=0;i<25;i++){const d=await guardianPage.evaluate(()=>__AN_HOA__.adventure().dialogue);if(d.complete)break;await guardianPage.locator('#dialogNext').click();}
  await guardianPage.locator('#dialogActions button').filter({hasText:'Chuẩn bị giao chiến'}).click();await guardianPage.locator('#startButton').click();await guardianPage.waitForFunction(()=>__AN_HOA__.state().started);await guardianPage.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.advance(2.1);});
  let s=await guardianPage.evaluate(()=>__AN_HOA__.state());assert.equal(s.boss.phaseNumber,1);assert.equal(s.enemyMaxHealth,713);assert.deepEqual(s.guardianPhases.phaseHealth,[713,1237]);assert.equal(s.enemyAI.mana,60);assert.equal(s.enemyAI.infiniteMana,false);assert.equal(s.enemyAI.sealDelay,.18);assert.deepEqual(s.enemyLoadout,['water-lance']);assert.ok(s.enemySpells[0].cost>0);
  await guardianPage.evaluate(()=>{__AN_HOA__.setHealth('enemy',0);__AN_HOA__.advance(3.3);});s=await guardianPage.evaluate(()=>__AN_HOA__.state());assert.equal(s.boss.phaseNumber,2);assert.equal(s.enemyMaxHealth,1237);assert.equal(s.enemyHealth,1237);assert.equal(s.enemyAI.baseDamagePercent,80);assert.equal(s.enemyLoadout.length,5);
  close(s.boss.damageMultiplier,.8);
  await guardianPage.evaluate(()=>{__AN_HOA__.setHealth('player',10000);const p=__AN_HOA__.state().playerPosition;__AN_HOA__.launchEnemy('wind-orb',[p[0],p[1],p[2]-2],[0,0,1]);__AN_HOA__.advance(1);});
  const windDamage=await guardianPage.evaluate(()=>SealGameCore.spells.find(s=>s.id==='wind-orb').damage);s=await guardianPage.evaluate(()=>__AN_HOA__.state());close(10000-s.health,windDamage*.8);
  await guardianPage.screenshot({path:out+'/guardian-phase2-runtime.png'});assert.deepEqual(errors,[]);
  console.log('CHECK: edited guardian HP and finite mana / seals / ninja arsenal in phase 1, exact phase 2 HP and direct phase base damage percent passed.');
 }catch(error){await guardianPage.screenshot({path:out+'/runtime-failure.png'}).catch(()=>{});throw error;}finally{await guardianPage.close();}
 const storyPage=await browser.newPage({viewport:{width:1280,height:800}}),storySeed=campaignFixtures()['fire:4'];storySeed.position=[0,7];
 await storyPage.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle}));storyPage.on('pageerror',e=>errors.push(e.message));
 await storyPage.addInitScript(seed=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(seed)),storySeed);
 try{
  await storyPage.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await storyPage.waitForFunction(()=>document.body.dataset.ready==='true');await storyPage.locator('#continueJourney').click();await storyPage.waitForFunction(()=>!__AN_HOA__.adventure().loading);
  await storyPage.evaluate(details=>{__AN_HOA__.audio.configure({readDialogue:false});__AN_HOA__.explore.setRandom(false);__AN_HOA__.explore.offerBattle('village-event',details);},villageEventEncounter('fire',4,storySeed));
  for(let i=0;i<40;i++){const d=await storyPage.evaluate(()=>__AN_HOA__.adventure().dialogue);if(!d.active||d.complete)break;await storyPage.locator('#dialogNext').click();}
  await storyPage.locator('#dialogActions button').filter({hasText:'Chuẩn bị giao chiến'}).click();await storyPage.locator('#startButton').click();await storyPage.waitForFunction(()=>__AN_HOA__.state().started);
  const state=await storyPage.evaluate(()=>__AN_HOA__.state());assert.equal(state.enemyMaxHealth,907);assert.equal(state.enemyAI.mana,140);assert.equal(state.squad.length,2);assert.deepEqual(errors,[]);
  await storyPage.screenshot({path:out+'/story-general-runtime.png'});console.log('CHECK: new story opponent settings apply to the real general encounter and preserve its squad.');
 }finally{await storyPage.close();}
}
