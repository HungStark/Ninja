# Bảng cân bằng 45 chiêu thức

Đây là web nội bộ riêng, dùng máy chủ và địa chỉ riêng, không nằm trong giao diện hoặc máy chủ game.

Nhấp đúp `Mo-bang-can-bang.cmd` ở thư mục dự án. Bảng mở tại <http://127.0.0.1:4180/balance> và tự khởi động máy chủ cục bộ. Có thể chạy `npm run balance` rồi mở cùng địa chỉ nếu Node nằm trong PATH.

Tab **Kỹ năng linh thú** mở bảng riêng cho 27 kỹ năng và 9 nội tại của các linh thú. Có thể nhấp đúp `Mo-bang-linh-thu.cmd` để mở trực tiếp; xem [hướng dẫn bảng linh thú](guardian-balance-editor.md).

1. Lọc theo hệ hoặc tìm tên chiêu (có thể gõ không dấu).
2. Sửa hồi chiêu, mana, thời gian khống chế, sát thương, độ bền hoặc hiệu lực. Ô `—` là chỉ số không áp dụng cho cơ chế chiêu.
3. Bấm **Lưu vào dự án**, rồi tải lại tab game. Nếu đang giữa trận, nên vào lại trận để dùng đồng nhất toàn bộ chỉ số mới.

Các ô sát thương có ghi rõ mỗi viên, mỗi đợt hay tổng cả chiêu. Hai ô Địa Bộc Thiên Tinh là sát thương khi giam và khi rơi; tổng tự cập nhật. Liệt Diễm Bùng Phát có 5 mức theo tầng bỏng, Lôi Mạch Tê Liệt có 3 mức choáng và 3 mức từ tính. Sát thương U Ảnh Tuyệt Sát lấy từ chó / bò đã triệu hồi; chỉnh ở U Minh Phân Ảnh. Mộc vẫn tăng sức mạnh theo cây, trang bị và nhân vật vẫn áp dụng các hệ số riêng.

Chống chịu dạng độ bền áp dụng cho khiên và tường có máu. Miễn nhiễm, phản đòn, ẩn thân và làm chậm đạn có cơ chế riêng; chỉnh thời gian hoặc mở **Chi tiết & chỉ số bổ sung**. Số 0 được chấp nhận khi cơ chế cho phép; các thời gian làm mẫu số phải lớn hơn 0.

**Bỏ bản nháp** quay lại lần lưu gần nhất. **Về chỉ số gốc** khôi phục một chiêu, **Khôi phục chỉ số gốc** khôi phục cả 45 chiêu; sau đó vẫn cần bấm lưu. Bản nháp hợp lệ được giữ trên trình duyệt khi tải lại trang. Nếu dữ liệu dự án đổi từ bên ngoài, bảng yêu cầu tải lại để tránh ghi đè. Có thể xuất / nhập JSON để lưu nhiều phương án cân bằng; nhập thay thế toàn bộ phương án trong bản nháp.

Nút lưu cập nhật vùng `spell-balance` trong `game-core.js` và đồng bộ `game-core.en.js`. Đây là dữ liệu thật, không chỉ là localStorage. Chỉ các chỉ số khác mặc định được lưu; công thức ấn, mã chiêu và tiến trình người chơi được giữ nguyên. `.spell-balance-last.json` là bản dự phòng của lần lưu trước; nội dung `overrides` có thể đưa vào file `{ "version": 1, "overrides": ... }` rồi nhập lại.

Các bản build web và Android tiếp theo dùng dữ liệu đã lưu. Website đã triển khai và APK đã cài cần build / phát hành lại. Công cụ chỉnh chỉ số và API ghi file chỉ chạy ở máy chủ Node cục bộ, không được đưa vào bản Vercel / Android.

Kiểm tra: `npm run test:balance-editor`.

Các kiểm tra riêng của bảng, cân bằng cơ bản, máy chủ game, triệu hồi bóng và chiêu thức sửa đổi đã đạt. Hai kiểm tra cũ `tests/core.cjs` và `tests/water-bubbles.mjs` vẫn có lỗi kỳ vọng; đã xác nhận chúng cũng lỗi với `game-core.js` gốc trước thay đổi này.
