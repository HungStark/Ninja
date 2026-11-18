import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {GUARDIAN_FORMS} from '../src/guardian-beasts.js';

const later=process.argv.includes('--later');
const ids=later?['earth','wood','ice','light','dark']:['nameless','fire','water','lightning','wind'];
const galleryFile=later?'later-preview.html':'preview.html';
const imageFile=later?'last-five-preview.png':'first-five-preview.png';
for(const id of ids)await fs.copyFile(`test-results/reference-guardians/${id}-three-quarter-idle.png`,`assets/guardians/${id}-preview.png`);
const figures=ids.map(id=>`<figure><img src="${id}-preview.png" alt="${GUARDIAN_FORMS[id].name}"><figcaption><strong>${GUARDIAN_FORMS[id].name}</strong><a href="${id}.glb" download>Model GLB ↓</a></figcaption></figure>`).join('');
await fs.writeFile('assets/guardians/'+galleryFile,`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Năm linh thú · Bản 3D</title><style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#202a34;color:#f5e9cf;font:16px 'Segoe UI',sans-serif}h1{margin:0 0 10px;font:32px Georgia,serif}p{margin:0 0 26px;color:#bdcbd4}main{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}figure{margin:0;background:#303b48;border:1px solid #52606a;border-radius:8px;overflow:hidden}img{display:block;width:100%;aspect-ratio:960/900;object-fit:contain}figcaption{display:flex;justify-content:space-between;align-items:center;gap:5px;padding:18px 12px}a{font-size:12px;color:#a8dce4;text-decoration:none}footer{padding-top:20px;color:#c6c7bb;font-size:14px}@media(max-width:900px){main{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>Năm linh thú · Bản 3D cách điệu</h1><p>Dựng trong Blender theo bộ ảnh tham khảo · Có khung xương và chuyển động trong game</p><main>${figures}</main><footer><a href="${later?'last':'first'}-five-guardians.blend">File Blender chỉnh sửa được ↓</a></footer></html>`,'utf8');
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files']});
try{const page=await browser.newPage({viewport:{width:1800,height:650}});await page.goto(pathToFileURL(path.resolve('assets/guardians',galleryFile)).href);await page.screenshot({path:'assets/guardians/'+imageFile,fullPage:true});}finally{await browser.close();}
console.log('Saved five-guardian gallery and preview image.');
