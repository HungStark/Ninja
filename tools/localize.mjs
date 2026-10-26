import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{babelParse}=require(fileURLToPath(new URL('../node_modules/playwright/lib/transform/babelBundle.js',import.meta.url)));
export const english=JSON.parse(await fs.readFile(new URL('../src/locales/en.json',import.meta.url),'utf8'));
const vietnamese=/[À-ỹĐđ]/;
function unit(value,missing){const key=value.trim();if(!key)return value;if(Object.hasOwn(english,key))return value.replace(key,english[key]);if(vietnamese.test(key))missing?.add(key);return value;}
export function localizeText(value,missing){
 if(!value.includes('<'))return unit(value,missing);
 return value.replace(/(^|>)([^<>]*)(?=<|$)/g,(_,prefix,text)=>prefix+unit(text,missing)).replace(/((?:aria-label|title|placeholder|alt|value)=["'])([^"']*)(["']|$)/g,(_,prefix,text,suffix)=>prefix+unit(text,missing)+suffix);
}
function walk(node,visit){if(!node||typeof node!=='object')return;if(node.type)visit(node);for(const [key,value]of Object.entries(node))if(!['loc','comments','leadingComments','trailingComments','innerComments','tokens'].includes(key)){if(Array.isArray(value))value.forEach(v=>walk(v,visit));else if(value&&typeof value==='object')walk(value,visit);}}
const template=text=>text.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$\{/g,'\\${');
export function localizeSource(source,filename,missing){
 const edits=[];walk(babelParse(source,filename,true),node=>{
  if(node.type==='StringLiteral'){const value=localizeText(node.value,missing);if(value!==node.value)edits.push([node.start,node.end,JSON.stringify(value)]);}
  else if(node.type==='TemplateElement'&&node.value.cooked!==null){const value=localizeText(node.value.cooked,missing);if(value!==node.value.cooked)edits.push([node.start,node.end,template(value)]);}
 });
 for(const [start,end,value]of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,start)+value+source.slice(end);
 return source;
}
export function englishPlugin(missing){return {name:'english-catalog',setup(build){build.onLoad({filter:/[/\\]src[/\\].*\.js$/},async args=>({contents:localizeSource(await fs.readFile(args.path,'utf8'),args.path,missing),loader:'js'}));}};}
