# Âm thanh và cập nhật nhiệm vụ

- Nhạc nền nguyên bản cho Vô Danh, Hỏa, Thủy, Lôi, Phong, Thổ, Quang, Ám, Mộc, Băng và đấu trường. Mỗi bản có nhịp, giai điệu và hòa âm riêng; chuyển cảnh có chuyển âm nhẹ.
- Kết ấn có tiếng tay và âm cao độ theo ấn; chiêu đủ ấn có tiếng báo. Hiệu ứng theo chín hệ, tiếng va chạm/khiên, phi tiêu, G, chiến thắng/thất bại, sấm trời và biến thân dùng chung bộ chỉnh âm lượng.
- Hội thoại có tiếng nhân vật theo nhịp chữ. Khi thiết bị có giọng tiếng Việt, tùy chọn đọc lời thoại sẽ dùng giọng đó; nếu không có hoặc giọng đọc gặp lỗi, tiếng nhân vật vẫn hoạt động ngoại tuyến. Chuyển lời, bỏ qua và đóng hội thoại ngắt âm cũ.
- **Cài đặt âm thanh** có ở màn hình đầu, menu dừng chân khi khám phá và menu tạm dừng khi chiến đấu. Chỉnh riêng nhạc nền, hiệu ứng, hội thoại và lưu trên thiết bị. Nút ♪ và phím M trong chiến đấu vẫn bật/tắt nhanh. Phím M khi khám phá vẫn mở bản đồ.
- Nhạc và hiệu ứng tạo bằng Web Audio, không tải tệp hoặc phụ thuộc dịch vụ ngoài. Khởi động sau thao tác đầu tiên của người chơi; tạm ngừng khi ứng dụng ra nền và tiếp tục khi trở lại. Giới hạn số nguồn âm đồng thời, tái sử dụng bộ đệm nhiễu và dùng bộ nén chung.

## Giảm khựng khi làm nhiệm vụ

Trước đây `refreshStory()` dựng lại toàn bộ làng khi nhận việc, thu thập và nhận thưởng, gồm địa hình, nhà, cư dân, vật liệu, vật cản và hình học gộp. Một lần dựng lại Vô Danh đo bằng Node mất khoảng 600 ms, chưa gồm công việc GPU của khung hình tiếp theo.

Nay các thao tác này chỉ thêm/xóa mục tiêu nhiệm vụ đang hoạt động, cập nhật HUD và lưu tiến trình. Đối tượng nhiệm vụ không gộp vào hình học cảnh tĩnh, nên có thể xóa sạch sau khi hoàn thành. Nhân vật, vật cản, cảnh vệ và cư dân được giữ nguyên. Chỉ những sự kiện thực sự đổi bố cục hội nghị/đoàn đại diện mới yêu cầu dựng lại làng.

## Kiểm tra

- `npm run test:audio`: đầu ra âm thanh thực, các bản nhạc, âm lượng lưu, tắt tiếng, chuyển nền/quay lại, giọng tiếng Việt và dự phòng, hiệu ứng chiến đấu, cài đặt màn hình nhỏ.
- `node tests/mobile-dialogue.cjs`: tiếng nhân vật ngoại tuyến, hội thoại cố định, cuộn nội dung và thao tác ở màn hình 480–915 px.
- `npm run test:quest-refresh`: nhận/hoàn thành/nhận thưởng mọi nhiệm vụ ở cả 10 làng; không dựng lại cảnh hoặc thay đổi vị trí/vật lý; kiểm tra thao tác thực trong trình duyệt.
- Kiểm tra cảnh vệ và tuyến truyện đã qua. `tests/biomes-core.mjs` vẫn báo đường tới `water-sentry-1` không tìm được; đã xác nhận cùng lỗi trên mã cảnh ở HEAD trước thay đổi này.
