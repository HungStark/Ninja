# Chuyện của các làng và bạn đồng hành Hạ Ly

Mỗi làng nguyên tố có một chương gồm bốn bước. Tuyến truyện chính hướng người chơi đến sự kiện hiện tại; hoàn thành chương trong làng trước khi thách đấu hộ vệ. Cao nhân, cư dân và nhiệm vụ phụ vẫn có thể gặp bình thường.

| Làng | Chương | Những việc người chơi thực hiện |
| --- | --- | --- |
| Hỏa | Người con gái giữa tro tàn | Gặp Hạ Ly bị thương → đánh bại hai kẻ truy sát → lấy thuốc Hỏa Tâm → quay lại chữa thương và mời nàng đi cùng. |
| Thủy | Dòng nước không nói dối | Điều tra nước cứu trợ bị đầu độc, kiểm tra niêm phong giả, khóa đúng đường ống và tìm người làm chứng. |
| Lôi | Đêm cao nguyên tắt sáng | Điều tra phá hoại trạm tiếp lôi, nối đất an toàn, khôi phục mạch nguồn qua bộ ổn định và trả ánh sáng cho khu dân cư. |
| Thổ | Tiếng gõ sau vách đá | Tìm thợ mỏ mắc kẹt, gia cố cột chống, đưa dây cứu người và phát hiện thuốc nổ lạ. |
| Phong | Mật thư trên cánh diều | Gặp người đưa tin bị truy đuổi, thu hồi thư, giải thứ tự hành trình và chuyển lời cảnh báo. |
| Quang | Lời tiên tri trong gương giả | Điều tra ảo ảnh chiến tranh, xoay gương về ánh bình minh, thu vật chứng và công khai sự thật. |
| Băng | Ngọn đèn trong bão tuyết | Tìm đứa trẻ mất tích, đọc dấu chân, cứu cả đứa trẻ và người lữ hành rồi đưa họ về đoàn tụ. |
| Mộc | Vết bệnh dưới rễ cổ thụ | Điều tra rễ cây nhiễm độc, lấy mẫu nước và thuốc giải, xử lý nguồn độc rồi phục hồi khu rừng. |
| Ám | Lời hứa vượt qua bóng tối | Vượt qua tiếng gọi giả, nhớ lời hứa với mẹ, đánh bại kẻ giữ màn sương và ghép chứng cứ trước khi gặp Vô Nguyệt. |

Các vật chứng mang dấu trăng khuyết nối những sự kiện thành một âm mưu chung. Những câu đố có phản hồi khi chọn sai và cho thử lại, không xóa tiến trình hay trừ tài nguyên.

## Hạ Ly

- Có mô hình nữ ninja riêng, trang phục đỏ mận và tóc buộc đuôi ngựa.
- Chỉ gia nhập sau khi thắng trận bảo vệ nàng, lấy thuốc và quay lại đồng ý mời nàng đi cùng.
- Đi bộ theo dấu đường nhân vật đã đi, tránh vật cản; tiếp tục theo khi sang làng khác. Khi nhân vật leo hoặc đi bè, nàng bắt kịp sau khi kết thúc hành trình.
- Đến gần và nhấn E để trò chuyện; có lời nhắc về câu chuyện của làng hiện tại. Các điểm tương tác khác được ưu tiên để nàng không chắn nút E ở cửa hàng hay ấn hồi sinh.
- Hiện tại nàng là bạn đồng hành trong khám phá và hội thoại, chưa tham gia chiến đấu.

## Lưu tiến trình và phần thưởng

- `story.villageEvents[id]`: số bước đã hoàn tất, từ 0 đến 4.
- `story.companion.recruited`: trạng thái Hạ Ly, được xác nhận từ chương Hỏa khi đọc bản lưu.
- Mỗi chương hoàn tất thưởng một lần: **45 xu, 40 kinh nghiệm hành trình và 40 kinh nghiệm hệ tương ứng**. Đọc lại hoặc kết quả trận đấu trùng không trao thêm thưởng.
- Bản lưu cũ giữ nguyên xu, kỹ năng, hộ vệ và dấu ấn đã có. Chương mới vẫn mở để có thể cứu Hạ Ly dù trước đây đã thắng hộ vệ Hỏa.
- Trong admin, tiến trình truyện và việc tuyển bạn đồng hành chỉ thay đổi trên bản sao tạm. Thoát admin khôi phục hành trình bình thường.
- Nhật ký có nhóm **Chuyện của các làng**, tiến độ từng chương, danh sách các bước và nhóm **Bạn đồng hành**. Có thể thu gọn/mở rộng và theo dấu sự kiện hiện tại.

## Kiểm tra

Chạy `npm run test:village-events` để kiểm tra tiến trình, lựa chọn sai/thử lại, thưởng một lần, tải lại, admin, khả năng đi tới cả 36 mục tiêu, đồng hành và luồng thực tế trên giao diện điện thoại. Playwright dùng Microsoft Edge đã cài tại đường dẫn cấu hình trong bài kiểm tra.
