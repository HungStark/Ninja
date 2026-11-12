# Cập nhật làng, trạm y tế và hiệu năng tương tác

- Danh sách chiêu trên quyển trục được sắp tăng theo bậc trong từng hệ. Các chiêu bậc D hiện có được giữ nguyên bậc, đứng trước C; tiếp theo là B, A, S, SS. Thứ tự các ô chiêu người chơi đã chọn không bị đổi.
- Mỗi nhân vật chỉ bắt đầu một lần chớp đỏ trong một giây. Chớp kéo dài 0,2 giây; sát thương liên tiếp không kéo dài hay khởi động lại chớp.
- Hai hộ vệ linh thú dùng cùng một trận và cùng bảng cân bằng hộ vệ. Chỉ khi cả hai bị hạ mới ghi nhận chiến thắng. File lưu cũ đã hạ một hộ vệ vẫn tiếp tục với người còn lại.
- Bỏ khu y tế lớn, thay bằng hai nhà y tế một tầng, kích thước 7 × 6,5, gần cổng trường và cổng sân nhà họp. Mỗi nhà có một NPC mang nhãn **Y Tá**, tương tác trực tiếp để trị thương, không có việc riêng. Vô Danh chưa có khu trường/hội đồng riêng nên có hai trạm trong làng.
- Trị thương khóa di chuyển trong 2 giây; dấu cộng xanh bay lên quanh người. Kết thúc mới hồi đầy máu và nạp bình thuốc. Tài nguyên còn lại được lưu sau trận, kể cả khi thua; ấn hồi sinh chỉ lưu điểm/dịch chuyển. Khi hết máu, cần trị thương trước khi đánh tiếp.
- Trường thu từ 84 × 92 xuống 60 × 65 (50,5%); khu quân sự từ 58 × 68 xuống 42 × 48 (51,1%). Khối lớp, phòng chức năng, ký túc và doanh trại đều giảm kích thước/số tầng.
- Có cửa thoát nhìn thấy từ trong nhà họp; bản đồ làng ẩn quyển trục phía dưới. Bậc thang nhà họp Thủy có va chạm đỡ chân và độ cao điều hướng; khi trở ra giữ đúng cao độ. Các bản lưu cũ trong nhà họp được đưa về cửa theo bố cục mới.

Nguyên nhân khựng khi nhận việc, nhận thưởng, nhặt đồ:

1. `refreshStory()` gọi `refresh()` rồi cập nhật dấu mục tiêu lần nữa; `refresh()` cũng đã cập nhật dấu mục tiêu.
2. `setObjectiveMarker()` gọi `routeTo()` → `planExpedition()` → A* chỉ để đặt một dấu chỉ dẫn. Tại làng có bè/thang, thao tác có thể tìm nhiều tuyến đi bộ, kể cả các tuyến không tới được, kiểm tra va chạm trên bản đồ lớn. Hai lần cập nhật còn nhân đôi chi phí này.
3. `loadJourneySpells()` luôn dựng lại DOM danh sách chiêu và đặt lại bộ lọc, dù không học chiêu mới.
4. Bộ lập lịch nhạc chạy mỗi 80 ms trên luồng giao diện, đặt nốt trước khoảng 300 ms. Một tác vụ đồng bộ quá dài có thể làm lỡ lịch phát nốt; đây là cơ chế gây gián đoạn âm thanh cùng lúc với khựng hình, không chứng minh mọi lỗi âm thanh trên mọi thiết bị đều có cùng nguyên nhân.

Đã bỏ lần cập nhật dấu mục tiêu dư; dấu chỉ dẫn dùng đồ thị bè/thang nhỏ, không chạy A*. Tìm đường chi tiết chỉ chạy khi ra lệnh di chuyển. Danh sách chiêu chỉ dựng lại khi cần. Đồng bộ vật phẩm/nhiệm vụ tiếp tục chỉ thêm/xóa mục tiêu tương ứng, không dựng lại cảnh làng.

Kiểm tra chính: `test:clinic-revision`, `tests/quest-refresh-core.mjs`, `tests/inventory-map-core.mjs`, `tests/village-peace-revision-browser.cjs`, `tests/opponent-balance-core.mjs`. Tái hiện phần đặt dấu cũ trên làng Thủy: hai lần cập nhật chạy 8 lượt tìm đường, 126.426 phép kiểm tra va chạm, mất khoảng 3.349 ms; phần đồ thị thay thế khoảng 0,62 ms trên môi trường kiểm tra.

Bộ kiểm tra trình duyệt mới bao gồm trị thương đủ 2 giây, hiệu ứng, khóa đi, giữ tài nguyên qua thắng/thua/tải lại, ấn hồi sinh không nạp thuốc, thứ tự chiêu và không tìm đường/dựng danh sách khi nhặt đồ.

Giới hạn của các bài kiểm tra cũ: `tests/adventure-core.mjs` còn giả định Vô Danh có cao nhân (không còn đúng với dữ liệu hiện tại); `tests/audio-browser.cjs` mở trực tiếp bằng `file://` và dừng ở bước tải mô hình trong môi trường này. Bài `clinic-revision-browser.cjs` thay thế cho kiểm tra tương tác ở đây chạy qua HTTP, xác nhận đầu ra âm thanh thực, nhạc tiếp tục phát qua nhận việc/nhận thưởng/nhặt đồ và toàn bộ các thay đổi nêu trên.
