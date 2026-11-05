# Bảng nội bộ cân bằng đối thủ

Mở `Mo-bang-doi-thu.cmd`, hoặc chạy `npm run balance` rồi vào <http://127.0.0.1:4180/opponents>. Hai bảng đối thủ và chiêu thức có liên kết qua lại; chúng nằm ở máy chủ nội bộ riêng, không thêm giao diện quản trị vào game.

Bảng có 86 cấu hình theo làng và loại đối thủ: ninja nhiệm vụ, ninja lang thang, hai nhóm cảnh vệ, võ đường, ninja tập luyện, ba ninja mở đầu, đối thủ sự kiện, và từng giai đoạn của 10 linh thú. Các dòng ninja trong làng áp dụng cho nhóm cùng loại tại làng đó, không sửa nhiệm vụ hay tiến trình đã lưu.

- **Máu:** giá trị HP riêng. Linh thú có dòng giai đoạn 1 (ninja), giai đoạn 2 (linh thú); U Minh Lang có thêm giai đoạn 3 hợp nhất. Máu đã chỉnh được dùng trực tiếp, không nhân lại theo cấp hoặc chia lại giữa các giai đoạn.
- **Bộ chiêu:** chọn 1–5 chiêu khác nhau từ 45 chiêu cho dạng ninja, kể cả ninja ở giai đoạn 1 của thủ lĩnh. Dạng linh thú dùng đòn riêng; dạng hợp nhất giữ bộ chiêu đặc trưng.
- **Mana:** tối đa và lượng bắt đầu trận / giai đoạn, cho phép nhỏ hơn 100. Bỏ chọn “Vô hạn” để dùng chi phí mana thật. Dạng linh thú thi triển trực tiếp nên không có mana hoặc kết ấn.
- **Kết ấn:** giây cho mỗi ấn; số nhỏ hơn là nhanh hơn. Thời gian nghỉ giữa các lần thi triển giữ cơ chế gốc. Các trường được chỉnh trở thành giá trị cố định, kể cả ở võ đường.
- **Tăng sát thương:** phần trăm tăng thêm trên sức mạnh hiện có. Ví dụ 20% nhân sát thương hiện tại với 1,2; có thể dùng số âm để giảm. Áp dụng cả chiêu, phi tiêu, triệu hồi và các đòn linh thú.
- **Giảm sát thương:** phần trăm giảm thêm vào lượng sát thương nhân vật nhận, cùng với kháng hệ và các cơ chế gốc. Ví dụ 25% nhận 75% lượng sát thương còn lại. Không thay độ bền của các tường được tạo bởi chiêu.

Chưa chỉnh thì giữ cách cân bằng tự động theo tiến trình, thuộc tính nhân vật và vòng võ đường. Các số gốc trong bảng là mốc tham chiếu theo lộ trình chuẩn; máu mặc định trong luyện tập có thể khác phiêu lưu. Khi chỉnh một giai đoạn linh thú, giá trị đó dùng cho cả phiêu lưu và luyện tập nếu dạng tương ứng có mặt.

Bấm **Lưu vào dự án** để ghi `src/opponent-balance.js` và tạo lại `game.js` / `game.en.js`. Nạp lại game và vào trận mới để dùng các giá trị vừa chỉnh. Website đã triển khai và APK đã cài cần build / phát hành lại. Bảng 45 chiêu giữ dữ liệu riêng, không bị ghi đè khi lưu bảng đối thủ.

Có bản nháp trên trình duyệt, bỏ bản nháp, khôi phục từng dòng / toàn bộ, xuất / nhập JSON và kiểm tra xung đột giữa hai tab. `.opponent-balance-last.json` giữ phương án trước lần lưu gần nhất, có thể nhập trực tiếp để khôi phục. Những giá trị thử trong bộ kiểm tra nằm trong thư mục tạm, không thay cân bằng hiện tại của game.

Kiểm tra bằng `npm run test:opponent-balance`: kiểm tra cấu hình, số máu lẻ chính xác ở từng giai đoạn, mana hữu hạn / vô hạn, nhịp kết ấn, bộ chiêu, các hệ số sát thương, API, lưu / tạo lại hai ngôn ngữ, giao diện và trận đấu thật với ninja và thủ lĩnh đổi dạng.
