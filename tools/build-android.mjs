import './build.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'android-apk/www');
await fs.mkdir(path.join(out,'assets'),{recursive:true});
const files=['language-loader.js','game.en.js','game-core.en.js','style.css','adventure.css','game-core.js','game.js','ket_an.jpg','assets/ninja-hands.glb','assets/ha-ly.glb','assets/hero-ninja.glb','assets/npc.vrm','THIRD_PARTY_NOTICES.md'];
await Promise.all(files.map(f=>fs.copyFile(path.join(root,f),path.join(out,f))));
for(const language of ['vi','en']){
 const name=language==='en'?'index.en.html':'index.html';
 let html=await fs.readFile(path.join(root,name),'utf8');
 html=html.replace('<html lang="'+language+'">','<html lang="'+language+'" data-android="true">').replace('width=device-width,initial-scale=1','width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover').replace('</head>','<link rel="stylesheet" href="android.css"></head>');
 await fs.writeFile(path.join(out,name),html);
}
await fs.copyFile(path.join(root,'android-apk/ui/android.css'),path.join(out,'android.css'));
console.log('Prepared offline Android assets: android-apk/www/');
// AAPT transparently expands .gz assets; use .tgz and remove old generated names.
for(const name of ['source.tar.gz','wrapper-source.tar.gz'])await fs.unlink(path.join(out,'vendor/espeak-ng',name)).catch(e=>{if(e.code!=='ENOENT')throw e;});
await fs.cp(path.join(root,'vendor/espeak-ng'),path.join(out,'vendor/espeak-ng'),{recursive:true});
