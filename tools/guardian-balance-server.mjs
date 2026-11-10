import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {guardianBalanceDocument,updateGuardianSource} from './guardian-balance-data.mjs';
import {revisionOf} from './spell-balance-data.mjs';
import {englishPlugin,readEnglishCatalog,englishCatalogURL} from './localize.mjs';
import {atomicWriteFile} from './atomic-write.mjs';

const reply=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
export function createGuardianBalanceHandler({rootURL=new URL('../',import.meta.url),catalogURL=englishCatalogURL}={}){
 const sourceURL=new URL('src/guardian-balance.js',rootURL);let busy=false;
 return async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;if(!pathname.startsWith('/guardians'))return false;
  try{
   if(req.method==='GET'&&['/guardians','/guardians/'].includes(pathname)){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"});res.end(await fs.readFile(new URL('./guardians/index.html',import.meta.url)));return true;
   }
   if(pathname!=='/guardians/api'){reply(res,404,{error:'Không tìm thấy trang.'});return true;}
   if(req.method==='GET'){reply(res,200,guardianBalanceDocument(await fs.readFile(sourceURL,'utf8')));return true;}
   if(req.method!=='POST'){reply(res,405,{error:'Phương thức không được hỗ trợ.'});return true;}
   const host=req.headers.host||'';
   if(!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)||req.headers.origin!=='http://'+host||req.headers['content-type']?.split(';')[0]!=='application/json'){reply(res,403,{error:'Chỉ được lưu từ bảng nội bộ trên máy này.'});return true;}
   if(busy){reply(res,409,{error:'Đang có lần lưu khác. Hãy thử lại.'});return true;}busy=true;
   try{
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>256000)throw Error('Dữ liệu quá lớn.');}
    const request=JSON.parse(body),source=await fs.readFile(sourceURL,'utf8');
    if(request.revision!==revisionOf(source)){reply(res,409,{error:'Cấu hình linh thú đã thay đổi. Xuất bản nháp JSON rồi tải lại bảng để tránh ghi đè.'});return true;}
    const next=updateGuardianSource(source,request.overrides),missing=new Set(),catalog=await readEnglishCatalog(catalogURL);
    const overlay={name:'guardian-balance-candidate',setup(b){b.onLoad({filter:/[/\\]src[/\\]guardian-balance\.js$/},()=>({contents:next,loader:'js'}));}};
    const options={absWorkingDir:fileURLToPath(rootURL),entryPoints:['src/main.js'],bundle:true,format:'iife',target:'es2020',minify:true,legalComments:'eof',write:false};
    const [vi,en]=await Promise.all([build({...options,plugins:[overlay]}),build({...options,plugins:[overlay,englishPlugin(missing,catalog)]})]);
    if(missing.size)throw Error('Thiếu bản dịch: '+[...missing].join(' / ')+'; chưa lưu thay đổi.');
    if(await fs.readFile(sourceURL,'utf8')!==source){reply(res,409,{error:'Cấu hình vừa thay đổi. Hãy tải lại bảng.'});return true;}
    const outputs=[[sourceURL,next],[new URL('game.js',rootURL),vi.outputFiles[0].text],[new URL('game.en.js',rootURL),en.outputFiles[0].text]],previous=await Promise.all(outputs.map(([url])=>fs.readFile(url,'utf8')));
    await fs.writeFile(new URL('.guardian-balance-last.json',rootURL),JSON.stringify({version:1,kind:'guardian-skills',overrides:guardianBalanceDocument(source).overrides},null,2)+'\n');
    try{for(const [url,text] of outputs)await atomicWriteFile(url,text);}catch(error){for(let i=0;i<outputs.length;i++)await atomicWriteFile(outputs[i][0],previous[i]);throw error;}
    reply(res,200,guardianBalanceDocument(next));
   }finally{busy=false;}
  }catch(error){reply(res,400,{error:error instanceof SyntaxError?'Dữ liệu JSON không hợp lệ.':error.message});}
  return true;
 };
}
