import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {createBalanceHandler} from './spell-balance-server.mjs';
import {createOpponentHandler} from './opponent-balance-server.mjs';

export function createBalanceServer(options={}){
  const handler=createBalanceHandler(options);
  const opponents=createOpponentHandler(options);
  return http.createServer(async(req,res)=>{
    if(req.url==='/'){res.writeHead(302,{Location:'/balance'});res.end();return;}
    if(!await opponents(req,res)&&!await handler(req,res)){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.BALANCE_PORT)||4180;
  createBalanceServer().listen(port,'127.0.0.1',()=>console.log('Bảng cân bằng nội bộ: http://127.0.0.1:'+port+'/balance'));
}
