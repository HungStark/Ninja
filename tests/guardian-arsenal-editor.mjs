import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {createBalanceServer} from '../tools/balance-server.mjs';
const before=await fs.readFile('src/guardian-balance.js','utf8'),server=createBalanceServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 const origin='http://127.0.0.1:'+server.address().port,document=await(await fetch(origin+'/guardians/api')).json();assert.equal(document.rows.length,89);assert.equal(document.rows.filter(r=>r.kind==='skill').length,80);
 browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/guardians');await page.waitForSelector('#rows tr');assert.equal(await page.locator('#rows tr').count(),89);await page.selectOption('#element','water');assert.equal(await page.locator('#rows tr:visible').count(),9);await page.selectOption('#rowKind','skill');assert.equal(await page.locator('#rows tr:visible').count(),8);await page.selectOption('#element','all');await page.fill('#search','Lôi Nha Phản Kích');assert.equal(await page.locator('#rows tr:visible').count(),1);assert.deepEqual(errors,[]);
 assert.equal(await fs.readFile('src/guardian-balance.js','utf8'),before);console.log('PASS: editor exposes 80 skills and nine passives with filtering, boss counterattacks and no source mutation.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
