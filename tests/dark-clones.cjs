const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
  await fs.mkdir('test-results/dark-clones',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
    const seal=async id=>{await page.keyboard.press('Backspace');for(const key of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(key);};
    const cast=async id=>{const s=await state(),spell=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id),id);await advance(Math.max(0,s.cooldown+.001,(s.cooldowns[id]||0)+.001,(spell.cost-s.chakra)/s.chakraRegen+.001));await seal(id);assert.equal(await page.locator('#castButton').isDisabled(),false,id);await page.keyboard.press('Space');};
    const enemy=(id,pos,dir)=>page.evaluate(({id,pos,dir})=>__AN_HOA__.launchEnemy(id,pos,dir),{id,pos,dir});
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const clones=async()=> (await state()).darkDomain.clones;
    const identity=list=>list.map(c=>({id:c.id,owner:c.owner,form:c.form,damage:c.damage}));
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await click('soundButton');await click('clearLoadout');
    for(const id of ['dark-orb','dark-lance','dark-domain','light-orb','water-tsunami'])await page.evaluate(id=>document.querySelector(`[data-equip="${id}"]`).click(),id);
    assert.match(await page.locator('[data-equip="dark-orb"]').innerText(),/HỒI 2s/);await click('startButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    // The special 2-second cooldown applies to summons and upgrades, while rank C stays unchanged.
    await seal('dark-orb');await page.keyboard.press('Space');assert.equal((await state()).cooldowns['dark-orb'],2);await advance(1.99);await seal('dark-orb');assert.equal(await page.locator('#castButton').isDisabled(),true);await advance(.01);assert.equal(await page.locator('#castButton').isDisabled(),false);await page.keyboard.press('Space');assert.equal((await clones()).length,2);
    await cast('dark-orb');await cast('dark-orb');assert.equal((await state()).cooldowns['dark-orb'],2);assert.equal((await clones()).filter(c=>c.form==='bull').length,1);
    await reset();await cast('dark-orb');await advance(.5);let before=await clones(),dog=before[0];
    await enemy('wind-orb',[dog.position[0],.72,dog.position[2]-3],[0,0,1]);await advance(.18);assert.deepEqual(identity(await clones()),identity(before));let s=await state();assert.equal(s.shots,1);assert.ok(s.projectiles[0].position[2]>dog.position[2]);assert.equal(s.projectiles[0].velocity[2],29);await advance(.5);assert.equal((await state()).health,964,'Projectiles pass through clones and still hurt the caster');
    for(const [id,seconds] of [['light-orb',.2],['fire-meteor',3.6],['lightning-thunder',2.1],['light-volley',2.5]]){
      const [x,,z]=dog.position;await enemy(id,[x,1.72,z],[0,-1,0]);await advance(seconds);assert.deepEqual(identity(await clones()),identity(before),id+' cannot destroy a clone');assert.equal((await clones())[0].mode,'idle');
    }
    // Swept dogs/bulls of both owners remain real summons and land behind the wave's opponent.
    for(const waveOwner of ['player','enemy']){
      await reset();for(let i=0;i<3;i++)await cast('dark-orb');await cast('dark-orb');for(let i=0;i<4;i++)await enemy('dark-orb');await advance(.5);
      before=await clones();const original=identity(before);
      await cast('light-orb');await advance(.2);assert.deepEqual(identity(await clones()),original,'Player laser cannot destroy enemy bulls either');
      if(waveOwner==='player')await cast('water-tsunami');else await enemy('water-tsunami');
      await advance(2.5);s=await state();assert.ok(s.darkDomain.clones.some(c=>c.mode==='carried'));assert.deepEqual(identity(s.darkDomain.clones),original);
      await page.keyboard.press('Escape');const frozen=await clones();await advance(2);assert.deepEqual(await clones(),frozen,'Pause freezes carried clones');await page.keyboard.press('Enter');
      await advance(4);s=await state();assert.deepEqual(identity(s.darkDomain.clones),original);
      const opponent=waveOwner==='player'?s.enemyPosition:s.position,direction=waveOwner==='player'?-1:1;
      for(const c of s.darkDomain.clones){assert.equal(c.mode,'idle');assert.ok((c.position[2]-opponent[2])*direction>=3.99,`clone ${c.id} behind ${waveOwner}'s opponent`);assert.deepEqual(c.position,c.home);}
      await page.screenshot({path:`test-results/dark-clones/${waveOwner}-wave-formation.png`});
      // A fresh order still spends summons outside the domain; immunity does not change this lifecycle.
      if(waveOwner==='player')await cast('dark-lance');else await enemy('dark-lance');await advance(3);
      assert.equal((await clones()).filter(c=>c.owner===waveOwner).length,0);
    }
    // A domain clone returns to its displaced home after spending its own attack.
    await reset();await cast('dark-domain');await advance(2.5);await cast('dark-orb');await advance(.5);dog=(await clones())[0];
    await enemy('water-tsunami',[0,1.72,dog.position[2]-3],[0,0,1]);await advance(2);assert.equal((await clones())[0].mode,'carried');await seal('dark-lance');assert.equal(await page.locator('#castButton').isDisabled(),true);
    await advance(2);before=await clones();assert.equal(before[0].mode,'idle');assert.ok(before[0].home[2]>10.9);await cast('dark-lance');await advance(4);s=await state();assert.equal(s.enemyHealth,962);assert.equal(s.darkDomain.clones.length,1);assert.equal(s.darkDomain.clones[0].mode,'idle');assert.deepEqual(s.darkDomain.clones[0].position,before[0].home);
    // Clones outside the wave's width retain their positions.
    await reset();await enemy('dark-orb',[20,1.72,-5],[0,0,1]);await advance(.5);before=await clones();await cast('water-tsunami');await advance(6);assert.deepEqual((await clones()).map(c=>c.position),before.map(c=>c.position));
    assert.deepEqual(errors,[]);console.log('PASS: 2s summon/upgrade cooldown, projectile/laser/AoE immunity, unchanged projectile damage, both wave owners carry intact dog/bull formations behind the opponent, pause, relocated homes, fresh attack orders and outside-wave isolation.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
