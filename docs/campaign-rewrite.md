# Cốt truyện chính — bản 2

Truyện được chuyển từ thu thập chín ấn hòa bình sang hành trình trùng sinh, điều tra tổ chức trăng khuyết và học cách tin tưởng đồng đội. Dữ liệu lời thoại, lựa chọn và nhiệm vụ nằm trong `src/locales/campaign.vi.json`; bản tiếng Anh ở `campaign.en.json`. Luật mở chương và liên minh nằm trong `src/campaign-plot.js`.

| Chương | Tiến trình chơi |
| --- | --- |
| I — Tàn tro của hận thù | Ký ức chết ở kiếp trước, lời hứa trước mộ, cứu Vô Danh Thú và nhận mảnh lõi. Điều tra Thủy, giải cứu và kết nạp Hạ Ly ở Hỏa, ngăn chiếm đóng ở Lôi. Thách đấu ba trưởng làng, ký ba cam kết rút quân. |
| II — Những kẻ đồng hành | Ký hiệp ước tại Vô Danh và báo tin cho mẹ. Phong khôi phục liên lạc sau khi giải thoát Phong Ưng; Thổ giải cứu thợ mỏ và xây phòng thủ; Hạ Ly cùng Linh Chi cứu cổ thụ Mộc bằng vật chứa độc tố. |
| III — Vết nứt của lịch sử | Băng phân biệt pháp sư tị nạn với quân xâm lược. Quang phá lời tiên tri giả; Hạ Ly rời nhóm vì nhân vật chính tiếp tục giấu bí mật. |
| IV — Bóng tối trong liên minh | Ám: thú nhận trùng sinh, tàn sát và từng giết Hạ Ly. Cô trở lại đồng hành nhưng không tha thứ thay người chết. Vô Nguyệt tiết lộ Hội đồng bị xâm nhập và danh tính Kẻ Mở Cổng. |
| V — Ngày tận thế thứ hai | Cổng mở sớm tại Đồi Chuông Gió; Hạ Ly, chín làng và Vô Danh Thú tập hợp. Trận chống Kẻ Mở Cổng cùng đội tiên phong, rồi đoạn kết liên quân giữ phong ấn trước đợt xâm lược đầu tiên. |

Có 44 bước sự kiện ở chín làng và 4 bước cuối tại Vô Danh. Bảy trận nhiệm vụ riêng: căn cứ rút chakra, cai ngục, tướng phản bội, kẻ đưa tin giả, Phong Ưng, căn cứ khai thác và Kẻ Mở Cổng. Các làng từ Phong trở đi tham gia bằng vai trò riêng, không cần đấu trưởng làng để lấy ấn. Hợp tác vẫn cấp sách kỹ năng của nguồn thưởng được thay thế.

Mảnh lõi là vật phẩm thật, được kiểm tra trước các bước cảm nhận phong ấn và có hiệu ứng cộng hưởng. Hạ Ly xuất hiện/biến mất theo trạng thái truyện được lưu. Trong chiến đấu, cô hỗ trợ 6 sát thương mỗi 3 giây và cứu nguy một lần mỗi trận khi người chơi còn tối đa 25% máu: khiên bằng 15% máu tối đa trong 4 giây và miễn nhiễm 0,6 giây. Ở trận liên quân, Vô Danh Thú cùng tham chiến và có khiên mở trận.

Dữ liệu lưu cũ giữ tiền, cấp độ, kỹ năng, trang bị, việc cư dân và chiến thắng đã có. Bốn bước Thủy/Hỏa cũ được giữ, các chương điều tra mới phải được chơi tiếp; kết thúc thu thập ấn cũ không tự hoàn thành truyện mới. Các bản đồ đã ghé vẫn đi lại được để tránh mắc kẹt sau chuyển đổi.

Chạy `npm run test:campaign-rewrite` để kiểm tra tiến trình, lưu/nạp ở từng bước, vị trí sự kiện, dịch thuật và các cảnh/trận quan trọng qua trình duyệt. `test:story` và `test:village-main-story` trỏ tới bộ kiểm tra này; những bộ cũ kiểm tra việc thu thập chín ấn không còn mô tả cốt truyện hiện tại. Các bài kiểm tra chiến đấu/cân bằng riêng vẫn giữ nguyên.
