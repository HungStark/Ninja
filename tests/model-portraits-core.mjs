import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PORTRAIT_IMAGES} from '../src/portrait-images.js';
import {portraitKey,HERO_PORTRAIT_COAT,HERO_PORTRAIT_HAIR} from '../src/portrait-key.js';
import {portraitPresets} from '../src/portrait-presets.js';
import {ARMORS} from '../src/equipment.js';
const presets=portraitPresets(),keys=presets.map(([key])=>key);
assert.deepEqual(Object.keys(PORTRAIT_IMAGES).sort(),[...keys].sort(),'catalog only contains active presets');
for(const [key,spec]of presets){assert.ok(PORTRAIT_IMAGES[key],'generated preset exists: '+key);if(spec.kind==='hero'){assert.equal(spec.equipment.hero.coat,HERO_PORTRAIT_COAT);assert.equal(spec.equipment.hero.hair,HERO_PORTRAIT_HAIR);}}
assert.equal(presets.filter(([,spec])=>spec.kind==='hero').length,ARMORS.length,'one hero preset per armor');
let bytes=0;for(const name of new Set(Object.values(PORTRAIT_IMAGES))){assert.match(name,/^[a-f0-9]{20}\.webp$/);const b=await fs.readFile('assets/portraits/'+name);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');bytes+=b.length;}assert.ok(bytes<3*1024*1024,'whole portrait catalog stays below 3 MiB');
for(const armor of ARMORS)assert.ok(PORTRAIT_IMAGES[portraitKey({id:'hero',armor})]);
assert.deepEqual((await fs.readdir('assets/portraits')).filter(n=>n.endsWith('.webp')).sort(),[...new Set(Object.values(PORTRAIT_IMAGES))].sort(),'no obsolete portrait files remain');
const hero={id:'hero',coat:'#211e25',armor:ARMORS[0]};assert.equal(portraitKey(hero),portraitKey({...hero,name:'Renamed',equipment:{armor:ARMORS[0],ammo:{iron:0}}}));
assert.equal(portraitKey(hero),portraitKey({...hero,coat:'#8b7046',hair:'#ffffff',equipment:{armor:ARMORS[0],hero:{coat:'#693f40',hair:'#cccccc'}}}),'old appearance colors never request deleted variants');
const runtime=await fs.readFile('src/model-portrait.js','utf8');assert.ok(!/WebGLRenderer|createHero|createNinja|getVertexPosition|toDataURL|portrait-renderer/.test(runtime),'dialogue path only reads baked images');
const intro=await fs.readFile('src/battle-intro.js','utf8');assert.ok(!/WebGLRenderer|createHero|createNinja|toDataURL/.test(intro),'VS portraits also avoid runtime model rendering');
console.log('PASS: complete portrait catalog, one fixed-color hero preset per armor, legacy colors ignored, no unused WebP files and no runtime 3D snapshot work.');
