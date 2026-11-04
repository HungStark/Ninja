import fs from 'node:fs/promises';
import {transform} from 'esbuild';
import {balanceDocument,updatedSource,revisionOf} from './spell-balance-data.mjs';
import {localizeSource} from './localize.mjs';

function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>128000)throw Error('Dữ liệu quá lớn.');}return JSON.parse(value);}
export function createBalanceHandler({rootURL=new URL('../',import.meta.url)}={}){
const coreURL=new URL('game-core.js',rootURL),englishURL=new URL('game-core.en.js',rootURL);
let saving=false;
return async function handleBalance(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith('/balance'))return false;
  try{
    if(['/balance','/balance/','/balance/editor.js','/balance/editor.css'].includes(pathname)&&req.method==='GET'){
      const name=pathname.endsWith('.js')?'editor.js':pathname.endsWith('.css')?'editor.css':'index.html';
      const data=await fs.readFile(new URL('./balance/'+name,import.meta.url));
      res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"});res.end(data);return true;
    }
    if(pathname!=='/balance/api'){json(res,404,{error:'Không tìm thấy trang.'});return true;}
    if(req.method==='GET'){json(res,200,balanceDocument(await fs.readFile(coreURL,'utf8')));return true;}
    if(req.method!=='POST'){json(res,405,{error:'Phương thức không được hỗ trợ.'});return true;}
    const host=req.headers.host||'';
    if(!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)||req.headers.origin!=='http://'+host||req.headers['content-type']?.split(';')[0]!=='application/json'){
      json(res,403,{error:'Chỉ được lưu từ bảng mở trên máy này.'});return true;
    }
    if(saving){json(res,409,{error:'Một lần lưu khác đang chạy. Hãy thử lại.'});return true;}
    saving=true;
    try{
      const request=await body(req),source=await fs.readFile(coreURL,'utf8');
      if(request.revision!==revisionOf(source)){json(res,409,{error:'Dữ liệu dự án đã thay đổi. Xuất bản nháp JSON trước, rồi tải lại trang để tránh ghi đè.'});return true;}
      const next=updatedSource(source,request.overrides),missing=new Set();
      const english=(await transform(localizeSource(next,'game-core.js',missing),{target:'es2020',minify:true,legalComments:'eof'})).code;
      if(missing.size)throw Error('Thiếu bản dịch; chưa lưu thay đổi.');
      const oldEnglish=await fs.readFile(englishURL,'utf8');
      // Recheck after compilation in case an external editor changed the core.
      if(await fs.readFile(coreURL,'utf8')!==source){json(res,409,{error:'Dữ liệu vừa thay đổi. Hãy tải lại bảng.'});return true;}
      await fs.writeFile(new URL('.spell-balance-last.json',rootURL),JSON.stringify({savedAt:new Date().toISOString(),overrides:balanceDocument(source).overrides},null,2)+'\n');
      try{await fs.writeFile(englishURL,english);await fs.writeFile(coreURL,next);}
      catch(error){await fs.writeFile(coreURL,source);await fs.writeFile(englishURL,oldEnglish);throw error;}
      json(res,200,balanceDocument(next));
    }finally{saving=false;}
  }catch(error){json(res,400,{error:error instanceof SyntaxError?'Dữ liệu JSON không hợp lệ.':error.message});}
  return true;
}
}
