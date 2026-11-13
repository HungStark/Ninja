# Tuyến truyện Băng → Quang → Ám → Vô Danh

Cập nhật phiên bản 4: xem [crescent-phoenix.md](crescent-phoenix.md) cho bí mật Phượng Hoàng, cuộc đối thoại riêng với thủ lĩnh và nhánh true end/bad end. Boss ba phase tại Ám là **Thủ lĩnh Trăng Khuyết**, người muốn hồi sinh **Kẻ Mở Cổng thật sự**.

Bốn bước cứu đứa trẻ, đoàn thương nhân và gặp thiếu nữ dùng ma pháp ở Làng Băng được giữ lại. Sau khi báo cáo trưởng làng, Băng Hổ bị tấn công. Người chơi truy đuổi tới bờ biển và thắng đội bắt linh thú Trăng Khuyết, nhưng một ninja cấp cao phản bội dùng phong ấn đưa Băng Hổ lên tàu đi đảo Quang–Ám. Chiến thắng trận ven biển không tính là đã giải cứu linh thú.

Quang và Ám vẫn là hai bản đồ làng trên cùng hòn đảo. Khi chưa giải phóng, quân Trăng Khuyết đứng công khai thay cho cảnh vệ, mang huy hiệu trăng khuyết, canh cổng/đường/phòng thủ và truy đuổi người chơi. Trưởng làng và cảnh vệ trung thành xuất hiện trong nhà ngục; trưởng làng không đồng thời xuất hiện trong phòng họp. Lối vào sở chỉ huy có phong ấn khóa theo tiến trình.

Các trận boss bắt buộc theo thứ tự:

1. Làng Quang, bước 3: Phó đoàn Quang, hai phase người → Kim Ưng. Thắng chuyển sang bước 4, giải cứu Kim Ưng, mở ngục và khôi phục cảnh vệ trung thành.
2. Làng Ám, bước 2: phó đoàn phản bội Mộc, hai phase người → Thanh Lộc. Thắng giải cứu Thanh Lộc.
3. Làng Ám, bước 4: phó đoàn phản bội Băng, hai phase người → Băng Hổ. Đây là kẻ đã đưa Băng Hổ lên tàu. Thắng giải cứu Băng Hổ.
4. Làng Ám, bước 6: Thủ lĩnh Trăng Khuyết, ba phase người → U Minh Lang → nhân thú hợp nhất, giữ bộ chiêu và cân bằng boss Ám cũ. Thắng giải cứu U Minh Lang, mở ngục và giải phóng Làng Ám. Nếu người chơi chết, Hạ Ly hy sinh để hồi sinh một lần với 50% máu và chuyển sang bad end.

Boss dùng `guardianVillage` để chọn bộ chiêu, hình dạng và chỉ số; vị trí truyện vẫn là `village` của nhiệm vụ. Vì vậy, đánh phó đoàn Mộc/Băng ở Làng Ám không chuyển người chơi sang bản đồ Mộc/Băng hay hoàn thành nhầm một nhiệm vụ ở làng đó. Trận chỉ hoàn thành khi đã thắng hết các phase. Kết quả cũ hoặc sai bước không thể trao thưởng hoặc bỏ qua boss.

Sau chiến thắng mới có cuộc đối thoại tiết lộ động cơ: dùng bốn linh thú gần các điểm phong ấn trên biển làm nguồn năng lượng phá ngăn cách hai thế giới. Đình chiến Hỏa–Thủy–Lôi và liên minh khiến tổ chức đẩy nhanh việc bắt linh thú. Nghi thức đã khởi động, năng lượng tích lũy không mất đi khi thủ lĩnh thất bại.

Người chơi trở về Vô Danh cảnh báo liên minh, cùng Hạ Ly ở true end hoặc một mình sau khi nàng hy sinh ở bad end. Cánh cổng xuất hiện; chín làng cùng những linh thú được cứu tập hợp. Trận cuối tại Vô Danh là cuộc chiến với đội tiên phong ngoại giới. Bốn linh thú được cứu có mô hình tại đội hình liên quân. Bad end thay cảnh kết thúc cùng Hạ Ly bằng cảnh tưởng niệm và lời chia buồn.

Hạ Ly đồng hành xuyên suốt Băng–Quang–Ám cho tới khi có thể hy sinh trong trận thủ lĩnh. Tuyến gương tiên tri, hồ sơ kiếp trước và chia tách ở Quang đã được bỏ. Bí mật trùng sinh chỉ được nói riêng với thủ lĩnh sau trận cuối. Cơ chế máu/bất tỉnh/bế/chữa trị được giữ; hy sinh là trạng thái riêng, không bị khóa ở bước chữa trị và không thể hồi phục tại trạm y tế.

Phiên bản truyện 3 chuyển bản lưu phiên bản 2 về sự kiện tiếp đón ở Băng (tối đa bước 4), đặt lại Quang/Ám và đoạn kết Vô Danh để chơi tuyến mới. Giữ tiến trình trước Băng, thử thách Thổ, giải đấu Mộc, thuộc tính, trang bị, tiền và máu Hạ Ly. Các chiến thắng cảnh vệ cũ ở đảo được đặt lại để thay bằng quân chiếm đóng và phục hồi đúng cảnh vệ trung thành khi giải cứu.

Kiểm tra: `npm run test:island-campaign` gồm tiến trình/bản lưu, cảnh chiếm đóng/giải phóng, trận ven biển, bốn boss với tổng chín phase, đồng hành Hạ Ly, tiết lộ động cơ và trận tiên phong trên PC/mobile.
