import * as T from 'three';
import {TOURNAMENT_ROUNDS,TOURNAMENT_VILLAGES,tournamentRecord,pendingTournamentMatch} from './wood-tournament.js';
const names={nameless:'Làng Vô Danh',water:'Làng Thủy',fire:'Làng Hỏa',lightning:'Làng Lôi',wind:'Làng Phong',earth:'Làng Thổ',wood:'Làng Mộc',ice:'Làng Băng'};
export const tournamentName=(id,save)=>id==='nameless'?save.hero.name+' · '+names[id]:names[id];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function tournamentBoardContent(save){
  const arena=save.arena,pending=pendingTournamentMatch(arena);
  return `<p class="tournament-rules">8 đại diện · Bốc thăm theo thành tích · 2–0 vào bán kết; nhóm 1–1 tranh hai vé 2–1. Bán kết: 2–0 gặp 2–1. Mỗi trận bắt đầu đầy máu; cấm bình thuốc.</p><p>${arena.status==='idle'?'Gặp trọng tài để đăng ký thi đấu.':arena.status==='champion'?'Bạn đã vô địch giải đấu.':arena.status==='eliminated'?'Lượt thi đấu đã kết thúc. Có thể đăng ký lượt mới.':'Đang thi đấu · Lượt '+arena.run}</p><div class="tournament-records">${TOURNAMENT_VILLAGES.map(id=>{const r=tournamentRecord(arena,id);return `<span class="${id==='nameless'?'is-player':''}">${esc(tournamentName(id,save))}<b>${r.wins}–${r.losses}</b></span>`;}).join('')}</div><div class="tournament-rounds">${TOURNAMENT_ROUNDS.map((title,round)=>`<section><h3>${title}</h3>${arena.matches.filter(m=>m.round===round).map(m=>`<article class="tournament-match ${m.id===pending?.id?'is-next':''}"><span class="${m.winner===m.a?'is-winner':''}">${esc(tournamentName(m.a,save))}</span><small>${m.winner?'ĐÃ KẾT THÚC':m.id===pending?.id?'TRẬN TIẾP THEO':'CHỜ KẾT QUẢ'}</small><span class="${m.winner===m.b?'is-winner':''}">${esc(tournamentName(m.b,save))}</span>${m.winner?'<strong>Thắng: '+esc(tournamentName(m.winner,save))+'</strong>':''}</article>`).join('')||'<p>Chưa bốc thăm</p>'}</section>`).join('')}</div>`;
}
export function createTournamentBoardUI(){
  const popup=document.createElement('dialog');popup.id='tournamentBoard';popup.className='tournament-popup';popup.innerHTML='<header><h2>Bảng giải đấu Trường học Làng Mộc</h2><button type="button" class="journey-secondary" aria-label="Đóng bảng giải đấu">Đóng</button></header><div class="tournament-board-body"></div>';document.body.append(popup);popup.querySelector('button').onclick=()=>popup.close();popup.addEventListener('click',e=>{if(e.target===popup)popup.close();});
  return {open(save){popup.querySelector('.tournament-board-body').innerHTML=tournamentBoardContent(save);if(!popup.open)popup.showModal();},get isOpen(){return popup.open;},close:()=>popup.close()};
}
export function buildTournamentNoticeboard(c,parent){
  const group=new T.Group();group.name='school-tournament-noticeboard';group.userData.dynamic=true;group.position.set(9,0,16);parent.add(group);
  for(const side of [-1,1])c.box(group,c.M('#665035'),side*4,2.8,0,.22,5.6,.3);
  c.box(group,c.M('#665035'),0,5.7,0,8.5,.3,.4);c.box(group,c.M('#665035'),0,1.25,0,8.5,.3,.4);
  const material=new T.MeshBasicMaterial({color:'#e2d4ab'}),board=new T.Mesh(new T.PlaneGeometry(7.8,4.1),material);board.position.set(0,3.45,.18);group.add(board);
  let canvas,ctx,texture,key;
  if(typeof document!=='undefined'){canvas=document.createElement('canvas');canvas.width=1024;canvas.height=540;ctx=canvas.getContext('2d');if(ctx){texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;material.color.set('#ffffff');material.map=texture;}}
  return {sync(save){const next=JSON.stringify(save.arena);if(!ctx||next===key)return;key=next;ctx.fillStyle='#18322d';ctx.fillRect(0,0,1024,540);ctx.fillStyle='#efce88';ctx.font='bold 30px sans-serif';ctx.fillText('GIẢI ĐẤU · TRƯỜNG HỌC LÀNG MỘC',25,45);ctx.font='19px sans-serif';ctx.fillText('Nhấn vào bảng để xem cặp đấu và kết quả',25,80);
    for(let round=0;round<5;round++){const x=20+round*201;ctx.fillStyle='#efce88';ctx.font='bold 16px sans-serif';ctx.fillText(TOURNAMENT_ROUNDS[round],x,125,190);save.arena.matches.filter(m=>m.round===round).forEach((m,i)=>{const y=153+i*83;ctx.fillStyle='#29483e';ctx.fillRect(x,y,190,73);ctx.font='16px sans-serif';for(const [j,id]of [m.a,m.b].entries()){ctx.fillStyle=m.winner===id?'#a4e6ac':'#e6dec8';ctx.fillText((m.winner===id?'✓ ':'')+tournamentName(id,save),x+8,y+25+j*25,175);}});}texture.needsUpdate=true;
  }};
}
