const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');

(async()=>{
  const {REGIONS,STARTER_SPELLS}=await import('../src/adventure-world.js');
  const {village,canTravel}=await import('../src/adventure-data.js');
  const output='test-results/world-journey';await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  let page,checkpoint='initialization';
  try{
    page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const url=pathToFileURL(path.join(process.cwd(),'index.html')).href+'?test=1&adventure=1';
    const state=()=>page.evaluate(()=>__AN_HOA__.adventure()),combat=()=>page.evaluate(()=>__AN_HOA__.state());
    const advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),click=id=>page.locator('#'+id).click();
    const dialog=text=>page.locator('#dialogActions button').filter({hasText:text}).click();
    const ready=async()=>{await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));};
    const snapshot=name=>page.screenshot({path:`${output}/${name}.png`});
    const mark=text=>{checkpoint=text;console.log('CHECK: '+text);};
    const walk=async(kind,id)=>{await page.evaluate(({kind,id})=>__AN_HOA__.explore.interact(kind,id),{kind,id});await advance(35);};
    const travel=async id=>{
      const before=(await state()).save.village;assert.ok(village(before).links.includes(id),`existing gate ${before} -> ${id}`);
      await page.evaluate(id=>__AN_HOA__.explore.travel(id),id);await advance(35);
      assert.equal((await state()).save.village,id,`walk through unlocked gate ${before} -> ${id}`);
      assert.equal((await state()).phase,'explore');
    };
    const goTo=async target=>{
      const save=(await state()).save;if(save.village===target)return;
      const queue=[[save.village]],seen=new Set([save.village]);let route;
      while(queue.length){const p=queue.shift(),at=p[p.length-1];if(at===target){route=p;break;}
        for(const id of village(at).links)if(!seen.has(id)&&canTravel({...save,village:at},id).allowed){seen.add(id);queue.push([...p,id]);}}
      assert.ok(route,`campaign route ${save.village} -> ${target}`);for(const id of route.slice(1))await travel(id);
    };
    const learn=async id=>{
      mark('peaceful lesson in '+id);const r=REGIONS[id],before=(await state()).save;
      await walk('mentor',r.mentor.npcId);assert.equal((await state()).phase,'dialog');
      await dialog('Xin nhận lời chỉ giáo');assert.equal((await state()).save.lessons[id],1);
      for(const zone of r.mentor.zoneIds){await walk('landmark',zone);assert.equal((await state()).phase,'dialog');assert.ok((await state()).save.discoveries.includes(`${id}:${zone}`));await dialog('Tiếp tục khám phá');}
      await walk('mentor',r.mentor.npcId);await dialog('Lĩnh hội');
      const after=(await state()).save;assert.equal(after.mentors[id],true);assert.ok(after.learnedSpells.some(spell=>spell.startsWith(id+'-')));
      assert.equal(after.wins,before.wins,'mentor lesson must not require a fight');assert.deepEqual((await combat()).learnedSpells,after.learnedSpells);
      const count=after.learnedSpells.length,gold=after.gold;await walk('mentor',r.mentor.npcId);await dialog('Cảm tạ chỉ giáo');
      assert.equal((await state()).save.learnedSpells.length,count);assert.equal((await state()).save.gold,gold);
    };
    const prepareBoss=async id=>{
      await walk('boss',REGIONS[id].boss.id);assert.equal((await state()).encounter.kind,'boss');await dialog('Chuẩn bị');assert.equal((await state()).phase,'loadout');
    };
    const winBoss=async(id,checkAI=false)=>{
      mark('major boss in '+id);const r=REGIONS[id],before=(await state()).save;
      await prepareBoss(id);await click('startButton');let fight=await combat();
      assert.equal((await state()).phase,'combat');assert.equal(fight.enemyHealth,r.boss.hp);assert.equal(fight.enemyMaxHealth,r.boss.hp);
      assert.equal(fight.enemyLoadout.length,['water','fire','lightning'].includes(id)?3:5);assert.equal(fight.boss.name,r.boss.name);assert.ok(fight.boss.damageMultiplier<=.8);
      assert.equal(await page.locator('#enemyHealth').textContent(),`${r.boss.hp} / ${r.boss.hp}`);
      if(checkAI){await snapshot('water-boss-combat');await page.evaluate(()=>{__AN_HOA__.setAIEnabled(true);__AN_HOA__.setHealth('enemy',__AN_HOA__.state().enemyMaxHealth/2);});await advance(6);
        fight=await combat();assert.equal(fight.boss.phase,'enraged');assert.ok(fight.aiCasts>0,'major enemy must actually cast');}
      await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));if(checkAI)await advance(4);
      await page.evaluate(()=>__AN_HOA__.setHealth('enemy',1));await page.keyboard.press('Space');await advance(2);
      assert.equal((await combat()).won,true);assert.equal((await combat()).enemyHealth,0);await click('nextButton');
      if((await state()).phase==='dialog'){
        const title=await page.locator('#dialogTitle').textContent();assert.match(title,/Hòa bình|Cùng trở/);
        if(title.includes('Cùng trở'))await dialog('Dẫn đoàn về Vô Danh');
        else{await snapshot('campaign-finale');await dialog('Tiếp tục khám phá');}
      }
      const after=(await state()).save;assert.equal(after.bosses[id],true);assert.equal(after.gold,before.gold+r.boss.rewardGold);
      await page.evaluate(()=>__AN_HOA__.explore.offerBattle('boss'));assert.equal((await state()).phase,'explore');assert.equal((await state()).encounter,null);
      assert.equal((await state()).save.gold,after.gold,'major enemy rewards cannot be farmed');
      // Forced one-hit finishes skip practice XP; supply that practice separately
      // and explicitly study the books instead of bypassing the learning rules.
      await page.evaluate(id=>__AN_HOA__.explore.gainExperience(id,420),id);await click('openProgression');
      for(const book of (await state()).save.progression.books)await page.locator(`[data-book="${book}"]`).click();await click('closeProgression');
    };
    await page.goto(url);await ready();await page.locator('#heroName').fill('Người Tìm Gió');await page.locator('#heroForm button[type=submit]').click();await advance(.2);
    let s=await state();assert.equal(s.phase,'explore');assert.equal(s.save.learnedSpells.length,1);assert.deepEqual(s.save.learnedSpells,STARTER_SPELLS);
    assert.deepEqual((await combat()).learnedSpells,STARTER_SPELLS);assert.equal(await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).style,STARTER_SPELLS[0]),'waterweapon');

    mark('single starter buff and shuriken');
    await page.evaluate(()=>__AN_HOA__.explore.offerBattle('random'));await dialog('Chuẩn bị');await click('startButton');
    assert.deepEqual((await combat()).equipped,STARTER_SPELLS);await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    const buffSequence=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,STARTER_SPELLS[0]);
    for(const key of buffSequence)await page.keyboard.press(key);await page.keyboard.press('Space');await advance(1.1);
    assert.ok((await combat()).elemental.player.waterWeaponTime>0);await page.keyboard.press('Space');await advance(2);
    assert.equal((await combat()).enemyHealth,50,'the initial water buff makes a useful 10-damage shuriken');
    await page.keyboard.press('Escape');await click('changeLoadout');assert.equal((await state()).phase,'explore');
    await page.evaluate(()=>__AN_HOA__.explore.travel('fire'));await advance(35);
    assert.equal((await state()).save.village,'nameless','the opening story requires Water before Fire');
    if((await state()).phase==='dialog')await page.keyboard.press('Escape');
    await goTo('water');await learn('water');await snapshot('water-lesson');
    const waterLearned=[...(await state()).save.learnedSpells];assert.equal((await state()).save.wins,0);

    mark('journal pause and phone layout');
    await page.evaluate(()=>__AN_HOA__.explore.moveTo([0,7]));await advance(.25);await click('openJournal');
    assert.equal((await state()).phase,'journal');const pausedAt=(await state()).position;await advance(3);assert.deepEqual((await state()).position,pausedAt);
    assert.equal(await page.locator('[data-zone]').count(),4);assert.equal(await page.locator('[data-person]').count(),3);
    await page.setViewportSize({width:390,height:844});await advance(.1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    const closeBox=await page.locator('#closeJournal').boundingBox();assert.ok(closeBox&&closeBox.x>=0&&closeBox.y>=0&&closeBox.x+closeBox.width<=390&&closeBox.y+closeBox.height<=844);
    await snapshot('journal-mobile');await click('closeJournal');await page.setViewportSize({width:1440,height:960});await advance(.1);
    await page.reload();await ready();await click('continueJourney');s=await state();assert.equal(s.save.hero.name,'Người Tìm Gió');assert.deepEqual(s.save.learnedSpells,waterLearned);
    assert.equal(s.save.mentors.water,true);assert.deepEqual((await combat()).learnedSpells,waterLearned);

    mark('learned equipment, locked equipment, and defeat recovery');
    await prepareBoss('water');await page.locator('[data-kind="all"]').click();
    assert.equal(await page.locator('[data-equip="fire-lance"]').isDisabled(),true);assert.equal(await page.locator(`[data-equip="water-lance"]`).isDisabled(),false);
    await page.locator('[data-element="fire"]').click();await click('selectElementLoadout');assert.deepEqual((await combat()).loadout,[],'bulk selection cannot unlock Fire techniques');
    await page.locator('[data-element="all"]').click();await page.locator(`[data-equip="water-lance"]`).click();await click('startButton');
    assert.deepEqual((await combat()).equipped,['water-lance'],'mentor reward can actually be equipped');
    await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',1);__AN_HOA__.launchEnemy('fire-volley',[0,1.72,6],[0,0,1]);});
    await advance(2);assert.equal((await combat()).won,true);assert.equal((await combat()).health,0);await click('nextButton');s=await state();
    assert.equal(s.save.village,'nameless');assert.deepEqual(s.position,[0,7]);assert.ok(!s.save.bosses.water);assert.deepEqual(s.save.learnedSpells,waterLearned);
    await goTo('water');await winBoss('water',true);await click('openJournal');assert.equal(await page.locator('#journalBoss').isDisabled(),true);await click('closeJournal');
    await walk('landmark','falls');await dialog('Tiếp tục khám phá');await snapshot('water');
    await page.reload();await ready();await click('continueJourney');assert.equal((await state()).save.bosses.water,true);

    for(const id of ['fire','lightning']){await goTo(id);await learn(id);await winBoss(id);if(id==='fire'){await walk('landmark','crater');await dialog('Tiếp tục khám phá');await snapshot(id);}}
    mark('three leaders sign the peace treaty');
    await goTo('nameless');assert.equal((await state()).save.campaign.treatySigned,false);
    await walk('treaty');await dialog('Ký hiệp ước hòa bình');assert.equal((await state()).save.campaign.treatySigned,true);await snapshot('peace-treaty');

    const landmarks={earth:'stone-arch',wind:'sky-ruins',light:'sun-temple',ice:'crystal-cave',wood:'elder-tree'};
    for(const id of ['earth','wind','light','ice','wood']){
      await goTo(id);mark('deliver the treaty in '+id);await walk('envoy');await dialog('Trao hiệp ước hòa bình');assert.ok((await state()).save.campaign.deliveries.includes(id));
      await learn(id);await winBoss(id);await walk('landmark',landmarks[id]);await dialog('Tiếp tục khám phá');await snapshot(id);
    }
    mark('the final mastermind in Dark');
    await goTo('dark');await learn('dark');await winBoss('dark');await walk('landmark','moon-temple');await dialog('Tiếp tục khám phá');await snapshot('dark');
    s=await state();assert.equal(s.save.campaign.treatySigned,true);assert.equal(new Set(s.save.campaign.deliveries).size,5);
    for(const id of ['water','fire','lightning','earth','wind','light','ice','wood','dark'])assert.equal(s.save.bosses[id],true,`${id} leader completed`);
    assert.equal(s.save.learnedSpells.length,45);assert.equal((await combat()).learnedSpells.length,45);assert.deepEqual(errors,[]);
    await page.reload();await ready();await click('continueJourney');s=await state();assert.equal(s.save.bosses.dark,true);assert.equal(s.save.campaign.deliveries.length,5);assert.equal(s.save.learnedSpells.length,45);
    console.log('PASS: one usable water starter, opening gate restriction, peaceful lessons, equipment locks, boss combat/enrage/defeat/rewards, save/reload, treaty and five deliveries, all nine campaign leaders, finale, journal mobile layout and distinct region captures.');
  }catch(error){if(page){await page.screenshot({path:`test-results/world-journey/failure.png`}).catch(()=>{});await fs.writeFile(`${output}/failure.json`,JSON.stringify({checkpoint,message:error.message,state:await page.evaluate(()=>globalThis.__AN_HOA__?.adventure()).catch(()=>null)},null,2));}error.message=checkpoint+': '+error.message;throw error;}
  finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
