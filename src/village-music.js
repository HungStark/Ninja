import scores from '../assets/music/scores.json' with {type:'json'};

const names={nameless:'Vô Danh · Dấu chân lữ khách',fire:'Hỏa · Trống lửa',water:'Thủy · Dòng nước xanh',lightning:'Lôi · Mạch trời',wind:'Phong · Sáo trên đồi',earth:'Thổ · Nhịp núi',light:'Quang · Chuông bình minh',dark:'Ám · Tiếng vọng bóng đêm',wood:'Mộc · Rừng thức giấc',ice:'Băng · Tuyết rơi'};
export const VILLAGE_MUSIC=Object.fromEntries(Object.entries(scores).map(([id,score])=>[id,{...score,name:names[id],file:'assets/music/'+id+'.wav',beats:64}]));
// The arena has no exploration score of its own; combat stays silent.
VILLAGE_MUSIC.duel={...VILLAGE_MUSIC.nameless,name:'Đấu trường · Nhịp kết ấn'};
