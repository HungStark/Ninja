# Chuyện làng trong tuyến truyện chính

Mỗi chương bốn bước của chín làng nay là phần bắt buộc của tuyến chính, trước chuỗi linh thú → hai hộ vệ → trưởng làng bị nhập. Các làng thuộc chặng sứ giả vẫn yêu cầu trao hòa ước trước khi mục tiêu chuyển sang chuyện làng.

- HUD lấy bước chuyện làng làm mục tiêu chính, kèm tiến độ 1/4–4/4.
- Nhật ký đặt chín chương trong mục **Tuyến truyện chính**.
- Chưa xong chương thì đi vào sân nhà họp không tự mở đối thoại/trận hộ vệ. Tương tác với linh thú hoặc hộ vệ sẽ chỉ về mục tiêu tuyến chính.
- Điều kiện áp dụng cho cả lệnh giao chiến trực tiếp và bản lưu cũ đã nhận lệnh/đánh một hộ vệ. Tiến độ hộ vệ được giữ lại; chương xong thì tiếp tục từ hộ vệ còn lại.
- Trận cứu Hạ Ly, trận trong chuyện Làng Ám, cảnh vệ thường và trận mở đầu Vô Danh vẫn hoạt động. Phiên admin tiếp tục cho phép thử trận riêng.
- Bản lưu đã thắng linh thú giữ nguyên chiến thắng, vẫn có thể làm chương chuyện chưa hoàn thành.

## Kiểm tra

`npm run test:village-main-story` chạy kiểm tra tiến trình chiến dịch, 36 bước chuyện của chín làng, bản lưu cũ, chặn trận trước chương, mở trận sau chương và chuỗi hai hộ vệ/trưởng làng/ký hòa ước trên trình duyệt.

Đã kiểm tra thêm `tests/inventory-map-browser.cjs` (giao diện trên máy tính/điện thoại). Các gói web Việt/Anh và dữ liệu Android đã được tạo lại. Ảnh nằm trong `test-results/village-main-story/`.

Bài `village-events-browser.cjs` cũ chưa chạy trọn vẹn: thiếu chờ tải sau khi trở về từ trận đánh; khi bổ sung chờ trong bản chạy chẩn đoán, luồng giải cứu, thuốc, nhận Hạ Ly và lưu/chuyển làng đã qua, nhưng tự đi tới điểm hồi sinh/mục tiêu nước bị kẹt. Không thay đổi bài này để che các lỗi tự đi. Kiểm tra mới `village-main-story-browser.cjs` xác nhận đủ bốn bước Thủy bằng tương tác tại mục tiêu; kiểm tra core xác nhận 36 mục tiêu có đường đi từ điểm vào làng.

Ba bài kiểm tra rộng hơn có lỗi đã tồn tại trước thay đổi này, xác nhận bằng cách chạy lại với bốn module nguồn từ `HEAD`:

- `journey-story-core.mjs`: mong 22 cảnh vệ, dữ liệu hiện có 24.
- `adventure-access-core.mjs`: đi qua chương Hỏa mà chưa cấp thuốc Hồng Liên.
- `peace-and-ally-core.mjs`: mong 4 phần thưởng, dữ liệu hiện có 5.

Không thay đổi dữ liệu trò chơi để đáp ứng các kỳ vọng cũ đó.
