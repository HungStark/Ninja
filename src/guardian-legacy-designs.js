// The nine village beasts each have exactly three active arts. Nameless keeps
// its original ally and opponent choreography in guardian-phases.js.
export const GUARDIAN_BOSS_DESIGNS={
  fire:{difficulty:4,color:'#ff793f',passive:'Cửu Mệnh',counter:'Đuôi bản thể sáng vàng · né vào khe giữa các cột lửa.',skills:[
    {name:'Hồ Hỏa Truy Hồn',type:'fox-homing',duration:5.8},
    {name:'Huyễn Hồ Phân Thân',type:'fox-illusions',duration:7},
    {name:'Cửu Viêm Diệt Thế',type:'fox-nine-pillars',duration:6.8}]},
  water:{difficulty:3,color:'#50baff',passive:'Thủy Triều',counter:'Né ngang vào hành lang xanh để tránh sóng · tấn công để phá Thủy Lao.',skills:[
    {name:'Long Thủy Pháo',type:'dragon-pressure',duration:4.5},
    {name:'Thủy Lao',type:'dragon-prison',duration:6},
    {name:'Hải Khiếu Long Vương',type:'dragon-tsunami',duration:6}]},
  lightning:{difficulty:5,color:'#c4a0ff',passive:'Lôi Tích',counter:'Né vệt báo ziczac và dấu sét để tránh tích điện gây tê liệt.',skills:[
    {name:'Lôi Ảnh Xung Kích',type:'wolf-zigzag',duration:3.6},
    {name:'Thiên Lôi Ấn',type:'wolf-marks',duration:4.8},
    {name:'Vạn Lôi Lang Khiếu',type:'wolf-tempest',duration:7}]},
  wind:{difficulty:3,color:'#9fe9ce',passive:'Phong Vực',counter:'Né Ưng Kích · tấn công khi Phong Ưng choáng dưới đất.',skills:[
    {name:'Phong Nhận Liên Hoàn',type:'eagle-crescents',duration:4.8},
    {name:'Ưng Kích',type:'eagle-dive',duration:5.5},
    {name:'Thiên Phong Đại Trận',type:'eagle-tornadoes',duration:7}]},
  earth:{difficulty:3,color:'#d9ae69',passive:'Bất Động Như Sơn',counter:'Ngắm thấp vào chân để quật ngã · đánh đầu khi Sơn Quy mất thăng bằng.',skills:[
    {name:'Địa Chấn',type:'turtle-quake',duration:5},
    {name:'Huyền Giáp Phản Chấn',type:'turtle-rebound',duration:4.5},
    {name:'Ngũ Nhạc Trấn Địa',type:'turtle-mountains',duration:5.8}]},
  light:{difficulty:4,color:'#fff2ad',passive:'Kim Cương Vũ',counter:'Né bổ nhào · phản công khi lớp lông vàng mở ra.',skills:[
    {name:'Kim Vũ Bạo Vũ',type:'gold-feathers',duration:6},
    {name:'Kim Ưng Liệp Sát',type:'gold-hunt',duration:5.5},
    {name:'Thiên Kim Trảm',type:'gold-wingblades',duration:5}]},
  dark:{difficulty:5,color:'#b78ae8',passive:'U Minh Chi Thể',counter:'Đứng trong vòng đèn sáng để làm lộ U Minh Lang và khóa mục tiêu.',skills:[
    {name:'Ám Ảnh Tập Kích',type:'shadow-ambush',duration:4},
    {name:'U Hồn Phân Liệt',type:'shadow-pack',duration:6.5},
    {name:'Bách Quỷ Dạ Hành',type:'shadow-night',duration:8}]},
  wood:{difficulty:4,color:'#97cc70',passive:'Sinh Mệnh Tuần Hoàn',counter:'Ngắm bắn mầm cây và mộc linh để cắt nguồn hồi máu.',skills:[
    {name:'Thanh Đằng Trói Buộc',type:'stag-vines',duration:4.8},
    {name:'Mộc Linh Triệu Hoán',type:'stag-spirits',duration:6.5},
    {name:'Vạn Mộc Sinh Trưởng',type:'stag-forest',duration:8}]},
  ice:{difficulty:4,color:'#b4e8ff',passive:'Hàn Khí',counter:'Phá tinh thể băng để mở vòng trú ẩn · tránh để Hàn Khí tích tụ.',skills:[
    {name:'Hàn Băng Hổ Trảo',type:'tiger-claws',duration:4.5},
    {name:'Băng Tinh Bộc Phá',type:'tiger-crystals',duration:6.5},
    {name:'Băng Phách Thiên Địa',type:'tiger-blizzard',duration:8}]}
};
