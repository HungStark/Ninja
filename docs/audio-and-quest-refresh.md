# Âm thanh và cập nhật nhiệm vụ

- Nhạc nền nguyên bản cho Vô Danh, Hỏa, Thủy, Lôi, Phong, Thổ, Quang, Ám, Mộc, Băng và đấu trường. Mỗi bản có nhịp, giai điệu và hòa âm riêng; chuyển cảnh có chuyển âm nhẹ.
- Kết ấn có tiếng tay và âm cao độ theo ấn; chiêu đủ ấn có tiếng báo. Hiệu ứng theo chín hệ, tiếng va chạm/khiên, phi tiêu, G, chiến thắng/thất bại, sấm trời và biến thân dùng chung bộ chỉnh âm lượng.
- APK ưu tiên bộ đọc tiếng Việt Android qua `AnHoaSpeech`, không phụ thuộc Web Speech của WebView. Khi thiếu giọng hoặc bộ đọc lỗi, dùng eSpeak-NG tiếng Việt đã đóng gói, chạy ngoại tuyến trong worker. Chuyển lời, đóng hội thoại, tắt tiếng hoặc đưa ứng dụng ra nền sẽ ngắt âm cũ; hết hiệu ứng gõ chữ vẫn đọc hết câu. Bộ đọc dự phòng có giọng máy tổng hợp.
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

## Sửa âm thanh APK ngày 25/10/2026

- Nguyên nhân mất giọng: trước đây chỉ gọi Web Speech API; WebView không đảm bảo cung cấp API này. Nay có cầu nối Android TTS và bộ đọc Việt ngoại tuyến trong APK. Không cần cài hoặc tải giọng ngoài.
- Cài đặt có nút **Nghe thử giọng Việt** và trạng thái bộ đọc. Giữ tùy chọn tắt đọc thoại, âm lượng riêng và xử lý mute/nền ứng dụng.
- Nhạc trên Android tăng gain 2 lần (khoảng +6 dB trước bộ nén); cài mới đặt nhạc 75%, giọng 90%. Giữ các mức cũ đã lưu, âm lượng hiệu ứng độc lập. Nhạc hạ khi đang đọc thoại.
- Nguồn và giấy phép của bộ đọc được đóng gói tại `vendor/espeak-ng/`. Dữ liệu chỉ nạp lần đầu cần đọc và tổng hợp trong worker để tránh chặn giao diện.
- Kiểm tra: `tests/speech-output.mjs`, `tests/offline-speech-browser.cjs`, `tests/audio-browser.cjs`; phát PCM thật khi tắt nhạc và hiệu ứng, thiếu giọng hệ thống, hủy yêu cầu cũ, dừng/tiếp tục, mute, nền ứng dụng và giao diện nhỏ.
