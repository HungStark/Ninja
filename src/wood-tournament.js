// Eight entrants: the player represents Nameless; Light and Dark do not enter.
export const TOURNAMENT_VILLAGES=Object.freeze(['nameless','water','fire','lightning','wind','earth','wood','ice']);
export const TOURNAMENT_ROUNDS=Object.freeze(['Vòng bảng · Lượt 1','Vòng bảng · Lượt 2','Vòng bảng · Nhóm 1–1','Bán kết','Chung kết']);
export const TOURNAMENT_PLAYER='nameless';
export const newTournament=()=>({version:1,run:0,completedRuns:0,championships:0,rewardClaimed:false,status:'idle',round:0,matches:[]});
const shuffle=(items,random)=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function tournamentRecord(arena,id,through=2){let wins=0,losses=0;for(const m of arena.matches)if(m.round<=through&&m.winner&&(m.a===id||m.b===id)){if(m.winner===id)wins++;else losses++;}return {wins,losses};}
export const pendingTournamentMatch=arena=>arena?.status==='active'?arena.matches.find(m=>!m.winner&&(m.a===TOURNAMENT_PLAYER||m.b===TOURNAMENT_PLAYER)):null;
function pair(arena,players,round,random){
  let order=shuffle(players,random);
  // Prefer fresh pairings in the Swiss rounds whenever the score group permits it.
  if(round<=2&&order.length===4){const first=order[0],rest=order.slice(1);for(const j of [0,1,2]){const candidate=[first,rest[j],...rest.filter((_,i)=>i!==j)];if(!arena.matches.some(m=>(m.a===candidate[0]&&m.b===candidate[1]||m.b===candidate[0]&&m.a===candidate[1])||(m.a===candidate[2]&&m.b===candidate[3]||m.b===candidate[2]&&m.a===candidate[3]))){order=candidate;break;}}}
  for(let i=0;i<order.length;i+=2)arena.matches.push({id:arena.run+':'+arena.matches.length,round,a:order[i],b:order[i+1],winner:null});
}
function settle(arena,random){
  while(true){
    for(const m of arena.matches)if(!m.winner&&m.a!==TOURNAMENT_PLAYER&&m.b!==TOURNAMENT_PLAYER)m.winner=random()<.5?m.a:m.b;
    if(arena.matches.some(m=>!m.winner))return;
    if(arena.round===0){
      arena.round=1;
      for(const wins of [1,0])pair(arena,TOURNAMENT_VILLAGES.filter(id=>tournamentRecord(arena,id).wins===wins),1,random);
    }else if(arena.round===1){
      arena.round=2;pair(arena,TOURNAMENT_VILLAGES.filter(id=>{const r=tournamentRecord(arena,id);return r.wins===1&&r.losses===1;}),2,random);
    }else if(arena.round===2){
      arena.round=3;const perfect=shuffle(TOURNAMENT_VILLAGES.filter(id=>{const r=tournamentRecord(arena,id);return r.wins===2&&r.losses===0;}),random),qualified=shuffle(TOURNAMENT_VILLAGES.filter(id=>{const r=tournamentRecord(arena,id);return r.wins===2&&r.losses===1;}),random);
      for(let i=0;i<2;i++)arena.matches.push({id:arena.run+':'+arena.matches.length,round:3,a:perfect[i],b:qualified[i],winner:null});
    }else if(arena.round===3){arena.round=4;pair(arena,arena.matches.filter(m=>m.round===3).map(m=>m.winner),4,random);}
    else{const champion=arena.matches.find(m=>m.round===4).winner;arena.status=champion===TOURNAMENT_PLAYER?'champion':'eliminated';arena.completedRuns++;if(arena.status==='champion')arena.championships++;return;}
    // Once eliminated, resolve the rest of the competition instantly, including the final.
    for(const m of arena.matches)if(!m.winner&&(m.a===TOURNAMENT_PLAYER||m.b===TOURNAMENT_PLAYER)){
      const record=tournamentRecord(arena,TOURNAMENT_PLAYER);
      if(record.losses>=2)m.winner=m.a===TOURNAMENT_PLAYER?m.b:m.a;
    }
  }
}
export function registerTournament(save,random=Math.random){
  const previous=readTournament(save.arena);if(previous.status==='active')return false;
  const arena={...newTournament(),run:previous.run+1,completedRuns:previous.completedRuns,championships:previous.championships,rewardClaimed:previous.rewardClaimed,status:'active'};
  pair(arena,TOURNAMENT_VILLAGES,0,random);settle(arena,random);save.arena=arena;return true;
}
export function resolveTournamentMatch(save,encounter,victory,random=Math.random){
  const arena=save.arena,m=pendingTournamentMatch(arena);if(!m||encounter.tournamentRun!==arena.run||encounter.tournamentMatch!==m.id)return false;
  m.winner=victory?TOURNAMENT_PLAYER:m.a===TOURNAMENT_PLAYER?m.b:m.a;if(victory)save.wins++;
  settle(arena,random);return true;
}
export function readTournament(raw){
  const clean=newTournament();if(raw?.version!==1)return clean;
  for(const k of ['run','completedRuns','championships'])clean[k]=Number.isSafeInteger(raw[k])&&raw[k]>=0?raw[k]:0;
  clean.rewardClaimed=!!raw.rewardClaimed;
  if(!['active','champion','eliminated'].includes(raw.status)||!Array.isArray(raw.matches)||raw.matches.length>13)return clean;
  const matches=raw.matches.map(m=>({id:m.id,round:m.round,a:m.a,b:m.b,winner:m.winner}));
  if(matches.length<4||matches.some(m=>typeof m.id!=='string'||!Number.isInteger(m.round)||m.round<0||m.round>4||!TOURNAMENT_VILLAGES.includes(m.a)||!TOURNAMENT_VILLAGES.includes(m.b)||m.a===m.b||m.winner!==null&&m.winner!==m.a&&m.winner!==m.b)||new Set(matches.map(m=>m.id)).size!==matches.length)return clean;
  clean.matches=matches;clean.status=raw.status;clean.round=Math.max(...matches.map(m=>m.round));
  if(clean.status==='active'&&!pendingTournamentMatch(clean))return {...clean,status:'idle',matches:[],round:0};
  return clean;
}
