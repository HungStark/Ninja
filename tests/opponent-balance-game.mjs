import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import {newJourney} from '../src/adventure-data.js';
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
  await page.evaluate(()=>{document.getElementById('clearLoadout').click();document.querySelector('[data-equip="wind-orb"]').click();document.getElementById('startButton').click();document.getElementById('practiceOpponentConfirm').click();__AN_HOA__.setAIEnabled(false);});await advance(.01);
  let s=await state();assert.equal(s.enemyMaxHealth,850);assert.equal(s.enemyAI.mana,45);assert.equal(s.enemyChakra,45);assert.equal(s.enemyAI.infiniteMana,false);assert.equal(s.enemyAI.sealDelay,.15);assert.equal(s.enemyAI.damageReduction,.25);assert.deepEqual(s.enemyLoadout,['fire-volley']);
  await page.evaluate(()=>__AN_HOA__.setAIEnabled(true));await advance(2.2);assert.equal((await state()).enemySequence.length,1);await advance(.1);assert.equal((await state()).enemySequence.length,1);await advance(.08);assert.equal((await state()).enemySequence.length,2);await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
  checkpoint='damage reduction';await page.evaluate(()=>{__AN_HOA__.setHealth('enemy',10000);__AN_HOA__.setHealth('player',10000);__AN_HOA__.aimAt(__AN_HOA__.state().enemyPosition);});
  const wind=await page.evaluate(()=>SealGameCore.spells.find(s=>s.id==='wind-orb'));for(const key of wind.sequence)await page.keyboard.press(key);await page.keyboard.press('Space');await advance(3.5);s=await state();close(10000-s.enemyHealth,wind.damage*.75);
  checkpoint='outgoing boost';const health=s.health;await page.evaluate(()=>{const p=__AN_HOA__.state().playerPosition;__AN_HOA__.launchEnemy('wind-orb',[p[0],p[1],p[2]-2],[0,0,1]);});await advance(1);s=await state();close(health-s.health,wind.damage*2);await page.screenshot({path:out+'/practice-runtime.png'});
  console.log('CHECK: edited practice HP, mana, loadout, seal time, outgoing and incoming damage passed.');
 }catch(error){await page.screenshot({path:out+'/practice-failure.png'}).catch(()=>{});await fs.writeFile(out+'/practice-failure.json',JSON.stringify({checkpoint,message:error.message,errors,body:await page.locator('body').innerText().catch(()=>''),state:await state().catch(()=>null)},null,2));error.message=checkpoint+': '+error.message;throw error;}finally{await page.close();}
 const guardianPage=await browser.newPage({viewport:{width:1280,height:800}});guardianPage.on('pageerror',e=>errors.push(e.message));await guardianPage.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle}));
 const seed=newJourney();promiseMother(seed);chooseStarter(seed,'fire-volley');seed.village='fire';seed.position=[0,7];seed.story.stage='infiltrate';seed.story.guardianRestored=true;seed.story.peaceSeals=Object.keys(REGIONS);seed.story.villageEvents.fire=4;seed.campaign.treatySigned=true;
 await guardianPage.addInitScript(seed=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(seed)),seed);
 try{
  await guardianPage.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await guardianPage.waitForFunction(()=>document.body.dataset.ready==='true');await guardianPage.locator('#continueJourney').click();await guardianPage.waitForFunction(()=>__AN_HOA__.adventure().phase==='explore'&&!__AN_HOA__.adventure().loading);
  await guardianPage.evaluate(()=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.audio.configure({readDialogue:false});__AN_HOA__.explore.offerBattle('boss');__AN_HOA__.advance(.01);});
  for(let i=0;i<25;i++){const d=await guardianPage.evaluate(()=>__AN_HOA__.adventure().dialogue);if(d.complete)break;await guardianPage.locator('#dialogNext').click();}
  await guardianPage.locator('#dialogActions button').filter({hasText:'Chuẩn bị giao chiến'}).click();await guardianPage.locator('#startButton').click();await guardianPage.waitForFunction(()=>__AN_HOA__.state().started);await guardianPage.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.advance(2.1);});
  let s=await guardianPage.evaluate(()=>__AN_HOA__.state());assert.equal(s.boss.phaseNumber,1);assert.equal(s.enemyMaxHealth,713);assert.deepEqual(s.guardianPhases.phaseHealth,[713,1237]);assert.equal(s.enemyAI.mana,60);assert.equal(s.enemyAI.infiniteMana,false);assert.equal(s.enemyAI.sealDelay,.18);assert.deepEqual(s.enemyLoadout,['water-lance']);assert.ok(s.enemySpells[0].cost>0);
  await guardianPage.evaluate(()=>{__AN_HOA__.setHealth('enemy',0);__AN_HOA__.advance(3.3);});s=await guardianPage.evaluate(()=>__AN_HOA__.state());assert.equal(s.boss.phaseNumber,2);assert.equal(s.enemyMaxHealth,1237);assert.equal(s.enemyHealth,1237);assert.equal(s.enemyAI.damageReduction,.25);assert.equal(s.enemyLoadout.length,5);
  const encounter=await guardianPage.evaluate(()=>__AN_HOA__.adventure().encounter);close(s.boss.damageMultiplier,(encounter.damageMultiplier+.1)*1.5);await guardianPage.screenshot({path:out+'/guardian-phase2-runtime.png'});assert.deepEqual(errors,[]);
  console.log('CHECK: edited guardian HP and finite mana / seals / ninja arsenal in phase 1, exact phase 2 HP and outgoing / incoming modifiers passed.');
 }catch(error){await guardianPage.screenshot({path:out+'/runtime-failure.png'}).catch(()=>{});throw error;}finally{await guardianPage.close();}
}
