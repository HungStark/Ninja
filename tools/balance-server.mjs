import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {createBalanceHandler} from './spell-balance-server.mjs';
import {createOpponentHandler} from './opponent-balance-server.mjs';
import {createGuardianBalanceHandler} from './guardian-balance-server.mjs';

export function createBalanceServer(options={}){
  const handler=createBalanceHandler(options);
  const opponents=createOpponentHandler(options);
  const guardians=createGuardianBalanceHandler(options);
  let saving=false;
  return http.createServer(async(req,res)=>{
    if(req.url==='/'){res.writeHead(302,{Location:'/balance'});res.end();return;}
    const mutation=req.method==='POST'&&['/balance/api','/opponents/api','/guardians/api'].includes(new URL(req.url,'http://localhost').pathname);
    if(mutation&&saving){res.writeHead(409,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Một bảng cân bằng khác đang lưu. Hãy thử lại sau.'}));return;}
    if(mutation)saving=true;
    try{if(!await guardians(req,res)&&!await opponents(req,res)&&!await handler(req,res)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}}
    finally{if(mutation)saving=false;}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.BALANCE_PORT)||4180;
  createBalanceServer().listen(port,'127.0.0.1',()=>console.log('Bảng cân bằng nội bộ: http://127.0.0.1:'+port+'/balance'));
}
