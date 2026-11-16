# Cài đặt chiến đấu và bố cục điện thoại

- Bản xem trước bố cục dùng lại HTML/CSS của HUD thật trong một document riêng, cùng kích thước màn hình. Hiển thị năm chiêu Hỏa mặc định, cho phép chỉnh từng nút chiêu, joystick, tấn công, lướt, phi tiêu, máu/mana, bảng đối thủ, khung tay và các nút khám phá. Không chạy sự kiện chiến đấu trong bản xem trước.
- PC có nút **Tùy chỉnh chiến đấu** mở popup. Điện thoại có thẻ cùng cấp **Quyển trục** và **Cài đặt chung**. Ba thiết lập: hỗ trợ ngắm, góc nhìn, đường dự đoán chiêu; lưu trên thiết bị. Đường dự đoán của người chơi và cảnh báo đỏ dùng chung tùy chọn hiển thị; tắt chúng không thay đổi thời gian hay sát thương chiêu.
- Hai góc nhìn dùng chung tỉ lệ nhân vật 1,5, hitbox, sân/hàng rào, bot, chiêu thức và arsenal linh thú. Góc nhìn thứ nhất di chuyển theo phím mũi tên/hướng camera; góc nhìn thứ ba di chuyển bằng chuột phải. Cả hai dùng joystick trên điện thoại. Chọn góc nhìn trước trận và khóa cho đến khi trận kết thúc, kể cả lúc tạm dừng. Thiết lập ngắm/đường dự đoán vẫn thay đổi được khi tạm dừng.
- Bộ chiêu tự chọn của ninja đấu luyện ưu tiên hơn `ninja:practice.spellIds` trong bảng cân bằng; các chỉ số HP/mana/tốc độ kết ấn vẫn áp dụng từ bảng cân bằng.
- Điện thoại xử lý ấn còn chờ trước khi giải quyết thả nút thi triển. Khi chuỗi ấn chưa hoàn chỉnh, nút thi triển không ném phi tiêu xen vào. Khi không có ấn vẫn ném phi tiêu bình thường.
- Đã gỡ eSpeak-NG, worker và dữ liệu đọc thêm. Ưu tiên Android TTS/Web Speech của thiết bị; máy thiếu giọng đọc phát bíp bíp qua kênh âm lượng hội thoại, có tạm dừng/tiếp tục và hủy.

Kiểm thử: `npm run test:combat-settings-revision` và `node tests/first-person-stable-view-browser.cjs`. Bộ kiểm thử đối chiếu cả chín linh thú trong hai lựa chọn góc nhìn và xác nhận khóa camera trong trận.
