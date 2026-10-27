import {build,transform} from 'esbuild';
import fs from 'node:fs/promises';
import {englishPlugin,localizeSource,localizeText} from './localize.mjs';
for(const [name,key] of [['fire-dragon-roar','FIRE_DRAGON_ROAR_BASE64'],['wind-whoosh','WIND_WHOOSH_BASE64'],['wind-spirit-chant','WIND_SPIRIT_CHANT_BASE64'],['lightning-hawk-cry','LIGHTNING_HAWK_CRY_BASE64'],['thunder-clap','THUNDER_CLAP_BASE64'],['shadow-dog-bark','SHADOW_DOG_BARK_BASE64'],['shadow-bull-moo','SHADOW_BULL_MOO_BASE64'],['shadow-elephant-trumpet','SHADOW_ELEPHANT_TRUMPET_BASE64'],['bamboo-flight-swoosh','BAMBOO_FLIGHT_SWOOSH_BASE64'],['snowstorm-wind','SNOWSTORM_WIND_BASE64'],['earth-gravity-cinematic','EARTH_GRAVITY_CINEMATIC_BASE64'],['earth-heavy-rock','EARTH_HEAVY_ROCK_BASE64'],['light-laser','LIGHT_LASER_BASE64'],['holy-stair-laser','HOLY_STAIR_LASER_BASE64'],['handsign','HANDSIGN_BASE64']]){
 const recording=(await fs.readFile('assets/audio/'+name+'.mp3')).toString('base64');
 await fs.writeFile('assets/audio/'+name+'.js','// Generated from '+name+'.mp3 by tools/build.mjs.\nexport const '+key+'='+JSON.stringify(recording)+';\n');
}
const options={entryPoints:['src/main.js'],bundle:true,format:'iife',target:'es2020',minify:true,legalComments:'eof'};
await build({...options,outfile:'game.js'});
const missing=new Set();await build({...options,outfile:'game.en.js',plugins:[englishPlugin(missing)]});
const core=localizeSource(await fs.readFile('game-core.js','utf8'),'game-core.js',missing);
await fs.writeFile('game-core.en.js',(await transform(core,{target:'es2020',minify:true,legalComments:'eof'})).code);
const html=localizeText(await fs.readFile('index.html','utf8'),missing).replace('<html lang="vi">','<html lang="en">').replace('src="game-core.js"','src="game-core.en.js"').replace('src="game.js"','src="game.en.js"');
await fs.writeFile('index.en.html',html);
if(missing.size)throw Error('Missing English translations: '+JSON.stringify([...missing]));
await fs.copyFile('android-apk/ui/android.css','android.css');
console.log('Built Vietnamese and English offline bundles; English catalog coverage is complete.');
