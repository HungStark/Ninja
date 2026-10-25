const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const {newJourney,SAVE_KEY}=await import('../src/adventure-data.js');
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const out='test-results/journey-home',errors=[];await fs.mkdir(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>errors.push(e.stack));
 const url='file:///'+path.join(process.cwd(),'dist/index.html').replaceAll('\\','/')+'?test=1&adventure=1';
 const ready=async()=>{await page.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await page.locator('#heroCreation').evaluate(e=>e.open),false,'creation defaults collapsed');assert.equal(await page.locator('#heroForm button[type=submit]').isVisible(),true);await page.locator('.hero-creation-toggle').click();};
 const saved=()=>page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);
 try{
  await page.addInitScript(key=>{const seed=sessionStorage.getItem('home-test-save');if(seed){localStorage.setItem(key,seed);sessionStorage.removeItem('home-test-save');}},SAVE_KEY);
  await page.goto(url);await ready();await page.evaluate(key=>localStorage.removeItem(key),SAVE_KEY);await page.reload();await ready();
  assert.equal(await page.locator('#continueJourney').isVisible(),false);
  const home=await page.locator('#journeyHome').innerText();for(const text of ['Người giữ ấn','Một lữ khách. Chín con đường.','Lập lời hứa với mẹ','10 miền đất','Một thuật khởi đầu','Hiệp ước hòa bình'])assert.ok(!home.includes(text),text+' removed');
  for(const selector of ['.journey-intro h1','#heroName'])assert.match(await page.locator(selector).evaluate(e=>getComputedStyle(e).fontFamily),/Segoe UI|Arial/);
  await page.locator('#heroName').fill('Nguyễn Thùy Dương');await page.locator('[data-coat="#693f40"]').click();
  await page.locator('.hero-creation-toggle').click();assert.equal(await page.locator('#heroName').isVisible(),false);
  await page.keyboard.press('Enter');assert.equal(await page.locator('#heroName').isVisible(),true);assert.equal(await page.locator('#heroName').inputValue(),'Nguyễn Thùy Dương');assert.equal(await page.locator('[data-coat="#693f40"]').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:out+'/desktop.png'});
  await page.locator('#heroName').fill('');await page.locator('.hero-creation-toggle').click();await page.locator('#heroForm button[type=submit]').click();assert.equal(await page.locator('#heroName').isVisible(),true,'invalid name reopens creation');assert.equal(await page.evaluate(()=>document.body.dataset.journey),'home');await page.locator('#heroName').fill('Nguyễn Thùy Dương');await page.locator('.hero-creation-toggle').click();
  for(const selector of ['.hero-origin','#heroForm button[type=submit]','.journey-save-note'])assert.equal(await page.locator(selector).isVisible(),true,selector+' stays visible when creation is collapsed');
  await page.screenshot({path:out+'/desktop-collapsed.png'});
  await page.locator('#heroForm button[type=submit]').click();assert.equal(await page.locator('#newJourneyDialog').evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>document.body.dataset.journey),'explore');assert.equal(JSON.parse(await saved()).hero.name,'Nguyễn Thùy Dương');
  const old=newJourney('Tiến trình cũ');old.gold=735;old.wins=4;old.learnedSpells=['water-boat'];
  await page.evaluate(save=>sessionStorage.setItem('home-test-save',JSON.stringify(save)),old);await page.reload();await ready();const before=await saved();
  await page.locator('#heroName').fill('Nhân vật mới');await page.locator('#heroForm button[type=submit]').click();
  assert.equal(await page.locator('#newJourneyDialog').evaluate(e=>e.open),true);assert.equal(await saved(),before);assert.equal(await page.evaluate(()=>document.body.dataset.journey),'home');assert.equal(await page.evaluate(()=>document.activeElement.id),'cancelNewJourney');
  // Native modal traps focus, makes the home screen inert, and Escape cancels.
  for(let i=0;i<4;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.getElementById('newJourneyDialog').contains(document.activeElement)||document.activeElement===document.body),true);}
  await page.screenshot({path:out+'/confirm.png'});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.getElementById('newJourneyDialog').open);assert.equal(await page.locator('#newJourneyDialog').evaluate(e=>e.open),false);assert.equal(await saved(),before);
  await page.locator('#heroForm button[type=submit]').click();await page.locator('#cancelNewJourney').click();assert.equal(await saved(),before);assert.equal(await page.locator('#heroName').inputValue(),'Nhân vật mới');
  await page.locator('#continueJourney').click();assert.equal(await page.evaluate(()=>document.body.dataset.journey),'explore');const continued=JSON.parse(await saved());assert.equal(continued.hero.name,old.hero.name);assert.equal(continued.gold,735);assert.equal(continued.wins,4);
  await page.reload();await ready();await page.locator('#heroName').fill('Trần Huyền Ánh');await page.locator('#heroForm button[type=submit]').click();await page.locator('#confirmNewJourney').click();assert.equal(await page.evaluate(()=>document.body.dataset.journey),'explore');const reset=JSON.parse(await saved());assert.equal(reset.hero.name,'Trần Huyền Ánh');assert.equal(reset.gold,0);assert.equal(reset.wins,0);assert.deepEqual(reset.learnedSpells,[]);
  // A journey started in this session also needs confirmation on returning home.
  await page.locator('#journeyMenu').click();await page.getByRole('button',{name:'Về màn hình chính',exact:true}).click();assert.equal(await page.locator('#heroCreation').evaluate(e=>e.open),false,'returning home collapses creation');await page.locator('#heroForm button[type=submit]').click();assert.equal(await page.locator('#newJourneyDialog').evaluate(e=>e.open),true);await page.locator('#cancelNewJourney').click();
  const mobile=await browser.newPage({viewport:{width:915,height:412},hasTouch:true});mobile.on('pageerror',e=>errors.push(e.stack));
  await mobile.addInitScript(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key:SAVE_KEY,save:old});await mobile.goto(url);await mobile.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await mobile.locator('#heroCreation').evaluate(e=>e.open),false,'mobile creation defaults collapsed');await mobile.locator('.hero-creation-toggle').tap();assert.equal(await mobile.locator('body').evaluate(e=>e.classList.contains('android-ui')),true);await mobile.screenshot({path:out+'/mobile.png'});
  await mobile.locator('.hero-creation-toggle').tap();assert.equal(await mobile.locator('#heroName').isVisible(),false);for(const selector of ['.hero-origin','#heroForm button[type=submit]','.journey-save-note'])assert.equal(await mobile.locator(selector).isVisible(),true);await mobile.screenshot({path:out+'/mobile-collapsed.png'});await mobile.locator('#heroForm button[type=submit]').tap();
  for(const id of ['cancelNewJourney','confirmNewJourney']){const b=await mobile.locator('#'+id).boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=915&&b.y+b.height<=412,id+' fits mobile viewport');}
  await mobile.screenshot({path:out+'/mobile-confirm.png'});await mobile.locator('#cancelNewJourney').tap();assert.equal(await mobile.evaluate(key=>JSON.parse(localStorage.getItem(key)).gold,SAVE_KEY),735);await mobile.close();
  assert.deepEqual(errors,[]);console.log('PASS: Vietnamese font, removed home copy, keyboard/touch collapsible creation, new/continue flows, cancel/Escape preserve save, explicit confirmation resets save, mobile dialog fits.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
