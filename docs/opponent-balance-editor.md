# Bảng nội bộ cân bằng đối thủ

Mở `Mo-bang-doi-thu.cmd`, hoặc chạy `npm run balance` rồi vào <http://127.0.0.1:4180/opponents>. Hai bảng đối thủ và chiêu thức có liên kết qua lại; chúng nằm ở máy chủ nội bộ riêng, không thêm giao diện quản trị vào game.

Bảng có 86 cấu hình theo làng và loại đối thủ: ninja nhiệm vụ, ninja lang thang, hai nhóm cảnh vệ, võ đường, ninja tập luyện, ba ninja mở đầu, đối thủ sự kiện, và từng giai đoạn của 10 linh thú. Các dòng ninja trong làng áp dụng cho nhóm cùng loại tại làng đó, không sửa nhiệm vụ hay tiến trình đã lưu.

- **Máu:** giá trị HP riêng. Linh thú có dòng giai đoạn 1 (ninja), giai đoạn 2 (linh thú); U Minh Lang có thêm giai đoạn 3 hợp nhất. Máu đã chỉnh được dùng trực tiếp, không nhân lại theo cấp hoặc chia lại giữa các giai đoạn.
- **Bộ chiêu:** chọn 1–5 chiêu khác nhau từ 45 chiêu cho dạng ninja, kể cả ninja ở giai đoạn 1 của thủ lĩnh. Dạng linh thú dùng đòn riêng; dạng hợp nhất giữ bộ chiêu đặc trưng.
- **Mana:** tối đa và lượng bắt đầu trận / giai đoạn, cho phép nhỏ hơn 100. Bỏ chọn “Vô hạn” để dùng chi phí mana thật. Dạng linh thú thi triển trực tiếp nên không có mana hoặc kết ấn.
- **Kết ấn:** giây cho mỗi ấn; số nhỏ hơn là nhanh hơn. Thời gian nghỉ giữa các lần thi triển giữ cơ chế gốc. Các trường được chỉnh trở thành giá trị cố định, kể cả ở võ đường.
- **Hệ số nền:** nhập trực tiếp phần trăm sát thương gốc, từ 0 đến 10.000%. Ví dụ 33,5% biến chiêu gốc 100 thành 33,5 sát thương trước phòng thủ; 100% giữ toàn bộ sát thương gốc, 150% gây 150. Áp dụng cho chiêu, phi tiêu, triệu hồi và đòn linh thú. Mỗi giai đoạn có hệ số riêng; số gốc đã bao gồm phần tăng khi chuyển dạng, còn giá trị bạn chỉnh được dùng trực tiếp, không cộng thêm theo bậc hay giai đoạn. Hai cột tăng / giảm sát thương đã được bỏ.

Chưa chỉnh thì giữ cách cân bằng tự động theo tiến trình, thuộc tính nhân vật và vòng võ đường. Các số gốc trong bảng là mốc tham chiếu theo lộ trình chuẩn; máu mặc định trong luyện tập có thể khác phiêu lưu. Khi chỉnh một giai đoạn linh thú, giá trị đó dùng cho cả phiêu lưu và luyện tập nếu dạng tương ứng có mặt.

Bấm **Lưu vào dự án** để ghi `src/opponent-balance.js` và tạo lại `game.js` / `game.en.js`. Nạp lại game và vào trận mới để dùng các giá trị vừa chỉnh. Website đã triển khai và APK đã cài cần build / phát hành lại. Bảng 45 chiêu giữ dữ liệu riêng, không bị ghi đè khi lưu bảng đối thủ.

Có bản nháp trên trình duyệt, bỏ bản nháp, khôi phục từng dòng / toàn bộ, xuất / nhập JSON và kiểm tra xung đột giữa hai tab. `.opponent-balance-last.json` giữ phương án trước lần lưu gần nhất, có thể nhập trực tiếp để khôi phục. Những giá trị thử trong bộ kiểm tra nằm trong thư mục tạm, không thay cân bằng hiện tại của game.

File JSON mới dùng phiên bản 2. Khi nhập bản cũ, phần tăng sát thương được chuyển thành hệ số nền dựa trên mốc tham chiếu của dòng; phần giảm sát thương được bỏ và bảng thông báo việc chuyển đổi.

Kiểm tra bằng `npm run test:opponent-balance`: kiểm tra cấu hình, số máu lẻ chính xác ở từng giai đoạn, mana hữu hạn / vô hạn, nhịp kết ấn, bộ chiêu, các hệ số sát thương, API, lưu / tạo lại hai ngôn ngữ, giao diện và trận đấu thật với ninja và thủ lĩnh đổi dạng.
