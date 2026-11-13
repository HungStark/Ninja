# Cốt truyện chính — bản 4

Bản cập nhật nội gián, cai ngục, hồi ức mở đầu không lời thoại và hai kết thúc Hạ Ly được mô tả trong [crescent-phoenix.md](crescent-phoenix.md). Phần này thay thế cách gọi boss cuối tại Ám là Kẻ Mở Cổng: đối thủ hiện tại là thủ lĩnh Trăng Khuyết, đang tìm cách hồi sinh Kẻ Mở Cổng thật sự.

Truyện được chuyển từ thu thập chín ấn hòa bình sang hành trình trùng sinh, điều tra tổ chức trăng khuyết và học cách tin tưởng đồng đội. Dữ liệu lời thoại, lựa chọn và nhiệm vụ nằm trong `src/locales/campaign.vi.json`; bản tiếng Anh ở `campaign.en.json`. Luật mở chương và liên minh nằm trong `src/campaign-plot.js`.

| Chương | Tiến trình chơi |
| --- | --- |
| I — Tàn tro của hận thù | Ký ức chết ở kiếp trước, lời hứa trước mộ, cứu Vô Danh Thú và nhận mảnh lõi. Điều tra Thủy, giải cứu và kết nạp Hạ Ly ở Hỏa, ngăn chiếm đóng ở Lôi. Thách đấu ba trưởng làng, ký ba cam kết rút quân. |
| II — Những kẻ đồng hành | Ký hiệp ước tại Vô Danh và báo tin cho mẹ. Phong khôi phục liên lạc sau khi giải thoát Phong Ưng. Thổ giải cứu thợ mỏ, phá căn cứ và tổ chức thử thách hữu nghị hai phase trước khi ra khơi. Mộc: người chơi thi đấu tại trường học trong khi Hạ Ly tìm cách chữa cây; tụ họp tại nhà trên cổ thụ và chuyển độc tố sang vật chứa để cứu cây. |
| III — Cuộc săn bắt linh thú | Băng: cứu người trong bão, bảo vệ thiếu nữ pháp sư tị nạn. Băng Hổ bị bắt; thắng quân Trăng Khuyết ở ven biển nhưng kẻ phản bội Băng vẫn đưa linh thú lên tàu đi đảo Quang–Ám. |
| IV — Hòn đảo bị chiếm đóng | Giải cứu Quang sau trận phó đoàn hai phase. Tại Ám, hạ phó đoàn Mộc hai phase, phó đoàn Băng hai phase và Kẻ Mở Cổng ba phase. Giải phóng bốn linh thú, trưởng làng và cảnh vệ. Sau chiến thắng mới biết âm mưu mở cổng và nguồn năng lượng nghi thức đã tích lũy. |
| V — Ngày tận thế thứ hai | Trở về Vô Danh cảnh báo liên minh. Cổng mở; Hạ Ly, chín làng và linh thú được cứu tập hợp. Trận chống đội tiên phong ngoại giới, rồi liên quân giữ phòng tuyến trước đợt xâm lược đầu tiên. |

Có 57 bước sự kiện ở chín làng và 4 bước cuối tại Vô Danh. Quang và Ám vẫn là hai làng riêng trên cùng đảo. Tuyến Băng–Quang–Ám không còn gương tiên tri, hồ sơ kiếp trước, thú nhận quá khứ hay việc Hạ Ly rời nhóm. Chi tiết thứ tự boss, trạng thái chiếm đóng và chuyển bản lưu nằm trong [island-campaign.md](island-campaign.md).

Mảnh lõi là vật phẩm thật, được kiểm tra trước các bước cảm nhận phong ấn và có hiệu ứng cộng hưởng. Hạ Ly tiếp tục đồng hành ở các chương cuối; chỉ chia nhóm tạm thời tại Mộc để chữa cây và tham gia giải đấu. Cơ chế máu Hạ Ly, sát thương lan, bất tỉnh, bế, giảm tốc độ và chữa trị một phút tại trạm y tế được giữ. Khi cô bất tỉnh, người chơi phải chữa trị cho cô trước khi tiếp tục tuyến chính. Ở trận liên quân, Vô Danh Thú cùng tham chiến và có khiên mở trận.

Dữ liệu lưu phiên bản 2 giữ tiến trình trước Băng, thử thách Thổ, giải đấu Mộc, tiền, cấp độ, kỹ năng, trang bị và máu Hạ Ly. Tiến trình Băng được giữ tối đa tới bước tiếp đón trưởng làng; Quang/Ám và đoạn kết được đặt lại để chơi tuyến mới. Các bản đồ đã ghé vẫn đi lại được để tránh mắc kẹt sau chuyển đổi.

Chạy `npm run test:island-campaign` để kiểm tra bản lưu, cảnh chiếm đóng/giải phóng, bốn boss với tổng chín phase, trận tiên phong và giao diện PC/mobile. `npm run test:campaign-rewrite` kiểm tra toàn tuyến, vị trí sự kiện và bản dịch. `test:story` và `test:village-main-story` trỏ tới bộ kiểm tra này; những bộ cũ kiểm tra việc thu thập chín ấn không còn mô tả cốt truyện hiện tại. Các bài kiểm tra chiến đấu/cân bằng riêng vẫn giữ nguyên.
