const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
  const {newJourney}=await import('../src/adventure-data.js'),{createAdventureScene}=await import('../src/adventure-scene.js'),{promiseMother}=await import('../src/journey-story.js');
  global.innerWidth=915;global.innerHeight=412;const world=createAdventureScene(),cases=[];
  for(const kind of ['lore','npc']){
    const save=newJourney();if(kind==='npc')promiseMother(save);world.load(save.village,save);
    const item=world.interactives.find(i=>i.kind===kind&&(kind!=='lore'||i.id==='nameless-resident-war-cemetery')),height=item.y??world.heightAt(item.x,item.z),nav=world.navigationBlocked(item.platform);
    for(let k=0;k<32;k++){const a=k*Math.PI/16,x=item.x+Math.cos(a)*1.1,z=item.z+Math.sin(a)*1.1;if(!nav(x,z)&&Math.abs(world.heightAt(x,z)-height)<.5){save.position=[x,z];save.elevation=height;break;}}
    cases.push({save,kind,id:item.id});
  }
  const out='test-results/mobile-dialogue';await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{const s=sessionStorage.getItem('dialogue-fixture');if(s){localStorage.setItem('anhoa-adventure-v1',s);sessionStorage.removeItem('dialogue-fixture');}});
  const url='file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1',client=await page.context().newCDPSession(page);
  const touch=async(type,points=[])=>{await client.send('Input.dispatchTouchEvent',{type,touchPoints:points});await page.waitForTimeout(35);};
  const layout=()=>page.evaluate(()=>{const ids=['dialogTitle','dialogBody','dialogConversationControls','dialogActions'],card=document.querySelector('.journey-dialog-card'),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};return {card:rect(card),parts:Object.fromEntries(ids.map(id=>[id,rect(document.getElementById(id))])),cardScroll:card.scrollTop,modalScroll:document.getElementById('journeyDialog').scrollTop,buttons:[...document.querySelectorAll('#dialogActions button,#dialogConversationControls button')].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>{const r=rect(e),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {...r,label:e.textContent,hit:e===hit||e.contains(hit)};})};});
  let checkpoint='load';
  try{
    await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');
    for(const fixture of cases){
      await page.evaluate(s=>sessionStorage.setItem('dialogue-fixture',JSON.stringify(s)),fixture.save);await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').tap();await page.evaluate(()=>__AN_HOA__.audio.configure({readDialogue:false}));await page.evaluate(({kind,id})=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.explore.interact(kind,id);__AN_HOA__.advance(.01);},fixture);assert.equal(await page.locator('#journeyDialog').isVisible(),true);await page.waitForTimeout(240);const voice=await page.evaluate(()=>__AN_HOA__.audio.state());assert.ok(voice.stats.dialogueLines>0);assert.ok(voice.stats.syllables>0,'dialogue has offline character voice without TTS');
      for(const [width,height,safe] of [[915,412,false],[568,320,false],[480,270,false],[667,375,true]]){
        checkpoint=fixture.kind+' '+width+'x'+height;await page.setViewportSize({width,height});await page.evaluate(safe=>{for(const side of ['top','bottom','left','right'])document.documentElement.style.setProperty('--safe-'+side,safe?(side==='top'?'8px':side==='bottom'?'12px':'24px'):'0px');document.getElementById('dialogBody').textContent='Một lời nhắn ngắn.';},safe);
        const short=await layout();await page.locator('#dialogBody').evaluate(el=>{el.textContent='Lời kể dài về hành trình, những người đang chờ và lời hứa hòa bình. '.repeat(200);el.scrollTop=0;});const long=await layout();
        assert.deepEqual(long.card,short.card,'card keeps fixed dimensions');assert.deepEqual(long.parts.dialogActions,short.parts.dialogActions,'choices do not move with content');assert.deepEqual(long.parts.dialogConversationControls,short.parts.dialogConversationControls,'next and skip stay fixed');assert.ok(long.parts.dialogBody.height>=24,JSON.stringify(long));
        assert.ok(long.card.x>=0&&long.card.y>=0&&long.card.right<=width&&long.card.bottom<=height);assert.ok(long.buttons.every(b=>b.hit&&b.height>=32&&b.y>=0&&b.bottom<=height&&b.x>=0&&b.right<=width),JSON.stringify(long.buttons));
        const r=long.parts.dialogBody,start={x:r.x+r.width*.5,y:r.y+r.height*.75,id:1};await touch('touchStart',[start]);for(let i=1;i<=8;i++)await touch('touchMove',[{...start,y:start.y-Math.min(100,r.height*.55)*i/8}]);await touch('touchEnd');assert.ok(await page.locator('#dialogBody').evaluate(el=>el.scrollTop>5),'only the content receives the native swipe');const scrolled=await layout();assert.equal(scrolled.cardScroll,0);assert.equal(scrolled.modalScroll,0);assert.deepEqual(scrolled.parts.dialogActions,long.parts.dialogActions);assert.ok(scrolled.buttons.every(b=>b.hit));
        await page.screenshot({path:out+'/'+fixture.kind+'-'+width+(safe?'-safe':'')+'.png'});
      }
      await page.locator('#dialogActions button').first().tap();assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().phase),'explore','choice stays usable after scrolling');
    }
    checkpoint='ordinary menu';await page.locator('#journeyMenu').tap();await page.evaluate(()=>__AN_HOA__.advance(.01));const menu=await layout();assert.ok(menu.buttons.every(b=>b.hit));assert.equal(await page.locator('#dialogConversationControls').isVisible(),false);await page.locator('#dialogActions button').first().tap();assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().phase),'explore');assert.deepEqual(errors,[]);
    console.log('PASS: fixed mobile dialogue frame, long text scrolls independently, every choice/next/skip remains visible and usable, three/four-choice conversations, ordinary menus and safe areas at 480–915px.');
  }catch(error){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});error.message=checkpoint+': '+error.message;throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
