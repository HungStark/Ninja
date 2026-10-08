const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const allowed=new Set(['index.html','style.css','game.js','game-core.js','ket_an.jpg']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg'};
const port=Number(process.env.PORT)||4173;
http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';}catch{res.writeHead(400);res.end();return;}if(!allowed.has(name)){res.writeHead(404);res.end('Not found');return;}fs.readFile(path.join(__dirname,name),(error,data)=>{if(error){res.writeHead(500);res.end('Unable to read game asset');return;}res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);});}).listen(port,'127.0.0.1',()=>console.log('Ấn Hỏa: http://127.0.0.1:'+port));
