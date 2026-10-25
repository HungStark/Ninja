# Chỉ số mới, hộ vệ đồng minh và cam kết hòa bình

## Chỉ số và giá

- Nhân vật khởi đầu **300 máu**. Mỗi điểm nâng Sinh lực cộng **6 máu**; các điểm đã nâng trong bản lưu cũ áp dụng công thức mới ngay.
- Hồi mana **4/giây**, cho cả quy tắc chiến đấu thường và hành trình. Chiêu của hộ vệ vốn không tốn mana vẫn giữ cơ chế đó.
- Máu mọi đối thủ gấp đôi mức trước bản cập nhật: bot tập luyện **220 → 440**, ba ninja mở đầu **94 → 188 mỗi người**, đối thủ thường, cảnh vệ, hộ vệ phụ, toán truy sát và các phase hộ vệ đều được tăng. Nhân đôi sau khi làm tròn để giữ đúng gấp đôi từng thanh máu, không nhân thêm lần nữa khi chuyển phase.
- Giáp nhập môn Vô Danh **140 xu**, giáp tay **100 xu**, đồng giá trang bị thường tại các làng khác. Hàng bán vẫn là ba cặp hai hệ 5%; giá các làng khác không đổi. Đồ đã mua không bị thu lại hay trừ xu thêm.

## Vô Danh Thú cùng chiến đấu

Trong trận ba ninja Hỏa, Thủy và Lôi ở quê nhà, Vô Danh Thú dùng phần sức mạnh còn lại để chiến đấu cùng người chơi, rồi cả hai khôi phục lõi ấn. Màn VS có người chơi và hộ vệ ở bên trái, ba đối thủ bên phải.

Hộ vệ tự hỗ trợ bằng:

- **Hư quang:** đạn linh lực gây 22 sát thương, khoảng 4,5 giây/lần.
- **Chấn địa:** gây 12 sát thương lên mỗi đối thủ còn sống, khoảng 10 giây/lần.
- **Vòng hộ mệnh:** bảo đảm ít nhất 24 lá chắn trong 5 giây, khoảng 12 giây/lần.

Đòn đánh thật sự trừ máu và lá chắn thật sự đỡ đòn. Hộ vệ không cần người chơi kết ấn hay trả mana. Đồng minh chỉ xuất hiện trong trận mở đầu; thời gian và đòn đánh dừng khi tạm dừng hoặc đang chạy màn VS. Rời trận, thua, thắng hoặc bắt đầu trận khác đều dọn trạng thái đồng minh.

## Báo chiến thắng và ký kết

Đánh bại hộ vệ chỉ ghi nhận chiến thắng. Người chơi vẫn phải trở về trưởng làng để **báo chiến thắng và chọn ký cam kết hòa bình**.

Hoạt cảnh dài khoảng 5,2 giây gồm mở văn bản, người chơi ký, trưởng làng ký, hạ con dấu và hiện dấu hòa bình. Có nút hoàn tất nhanh. Điều khiển khám phá bị khóa trong hoạt cảnh để tránh nhân vật tự đi khỏi vị trí.

- Dấu ấn và thưởng 100 xu chỉ được ghi nhận **khi đóng dấu**, đúng một lần.
- Tải lại trước khi đóng dấu: chiến thắng vẫn còn, chưa có dấu ấn; có thể trở lại trưởng làng ký tiếp.
- Tải lại sau khi đóng dấu: giữ dấu ấn và thưởng, không nhận lặp.
- Đã có dấu từ bản lưu cũ thì vẫn giữ dấu cũ.
- Sau Vô Nguyệt ở Làng Ám cũng phải báo trưởng làng và ký dấu cuối; sau đó tuyến truyện mới hoàn tất. Vô Danh là quê nhà được giải cứu trong trận bộ ba, không phải làng đối địch để nhận dấu.
- Trong admin, ký kết chỉ áp dụng trên bản sao tạm; không ghi sang tiến trình thường.

Chạy `npm run test:peace-ally` để kiểm tra chỉ số, đồng minh, màn VS, thưởng một lần, tải lại trước/sau khi đóng dấu, kết thúc tại Ám và bố cục điện thoại 915×412 / 480×270.
