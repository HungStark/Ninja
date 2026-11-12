export const isEarthDepartureTrial=encounter=>encounter?.kind==='boss'&&encounter.village==='earth'&&encounter.friendlyTrial===true;
export const earthDepartureTrialPending=save=>!save.bosses?.earth;
export const EARTH_DEPARTURE_TRIAL={
  title:'Thử thách cuối cùng trước biển',
  description:'Sau khi giúp Làng Thổ, gặp trưởng làng trong phòng họp để nhận thử thách thiện chí: đấu với ông ở phase 1 và Sơn Quy ở phase 2 trước khi ra khơi tới các đảo.',
  opening:[
    ['chief','Con đã cứu những người thợ mỏ và vạch trần căn cứ dưới lòng đất. Làng Thổ ghi nhớ điều đó.'],
    ['chief','Phía trước là biển lớn và những hòn đảo mà ký ức hay sức mạnh đơn độc chưa chắc giúp con vượt qua. Trước khi rời lục địa, ta muốn dành cho con một thử thách cuối cùng.'],
    ['hero','Ngài muốn thử sức cháu?'],
    ['chief','Đúng vậy. Trước hết con sẽ đấu với ta. Sau đó, Sơn Quy sẽ kiểm tra cách con ứng phó với linh thú. Đây là cuộc so tài giữa những người cùng chí hướng; khi con không thể tiếp tục, chúng ta sẽ dừng tay.'],
    ['haly','Hãy xem đây là cơ hội chuẩn bị cho chặng đường ngoài biển. Ta tin ngươi sẽ vượt qua.'],
    ['hero','Cháu nhận lời. Xin ngài và Sơn Quy chỉ giáo.']
  ],
  victory:[
    ['chief','Đủ rồi. Con đã vượt qua cả ta và Sơn Quy. Ta tin con đã sẵn sàng cho hành trình ngoài biển.'],
    ['hero','Cảm ơn ngài. Cuộc so tài giúp cháu hiểu mình vẫn còn nhiều điều phải học.'],
    ['chief','Làng Thổ sẽ cung cấp vật liệu và dựng thành trì cho liên minh. Hãy nhận bản thiết kế phòng thủ này rồi tới bến thuyền; những hòn đảo đang chờ con.'],
    ['haly','Chúng ta cùng đi. Lần này, hãy tiếp tục dựa vào nhau.']
  ],
  defeat:[
    ['chief','Dừng ở đây thôi. Đây là thử thách để con trưởng thành, không phải trận chiến sinh tử.'],
    ['chief','Hãy chuẩn bị thêm rồi trở lại. Ta và Sơn Quy sẽ tiếp tục chờ con trước chuyến ra khơi.'],
    ['hero','Cháu sẽ rút kinh nghiệm và thử lại.']
  ]
};
