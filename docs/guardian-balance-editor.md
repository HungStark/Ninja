# Bảng cân bằng kỹ năng linh thú

Nhấp đúp `Mo-bang-can-bang.cmd` rồi chọn tab **Kỹ năng linh thú**, hoặc mở trực tiếp bằng `Mo-bang-linh-thu.cmd`. Địa chỉ cục bộ là <http://127.0.0.1:4180/guardians>. Máy chủ này dùng chung với hai bảng 45 chiêu và sức mạnh đối thủ; không đưa công cụ chỉnh sửa vào game, Vercel hay APK.

Bảng có **36 dòng, 372 thông số**: ba kỹ năng và một nội tại cho mỗi linh thú trong chín làng. Vô Danh Thú giữ nguyên. Bảng này chỉnh bộ linh thú mới ở góc nhìn thứ ba; góc nhìn thứ nhất dùng dữ liệu legacy riêng.

1. Lọc linh thú, chọn **Kỹ năng / Nội tại**, hoặc tìm tên không dấu.
2. Sửa các ô số chính. Mở **Chi tiết & chỉ số bổ sung** để chỉnh số đợt, tốc độ, thời gian báo trước, bán kính, hồi máu, nội tại và vùng an toàn.
3. Bấm **Lưu vào dự án**, tải lại game rồi vào trận mới. Lưu sẽ cập nhật `src/guardian-balance.js` và dựng lại `game.js` / `game.en.js`. Những thay đổi trong bảng không sửa bộ 45 chiêu của người chơi, cấu hình máu các giai đoạn hoặc tiến trình đã lưu.

## Đọc chỉ số

- **Nghỉ sau chiêu** là số giây boss chờ sau khi kết thúc chiêu trước khi chuyển sang chiêu kế tiếp; không phải hồi chiêu riêng của chiêu ninja. Linh thú dùng trực tiếp, không tiêu mana hay kết ấn.
- **Thi triển** là thời gian boss thực hiện chiêu. Đạn, sóng, phân thân, cây, hoa và vật cản đã tạo có thời gian tồn tại riêng.
- **Sát thương** ghi theo từng cơ chế: mỗi quả cầu, lưỡi gió, cột, vòng sóng, bóng sói hoặc mỗi lần trúng. Long Thủy Phá dùng sát thương mỗi giây. Hải Tuyền Lao Ngục và lốc xoáy dùng sát thương mỗi nhịp; nhịp chỉnh riêng trong chi tiết.
- **Độ bền** là HP của phân thân, Mộc Linh, cổ thụ, hoa, cột đá hoặc mũi băng mà người chơi có thể phá. Máu boss từng giai đoạn vẫn chỉnh ở tab **Sức mạnh đối thủ**.
- **Tỉ lệ** dùng số thập phân: `0,01` là 1%, `0,35` là 35%. Hồi máu là phần máu tối đa mỗi giây của từng nguồn; các nguồn cùng tồn tại cộng dồn. Các ô hệ số như sát thương lúc lộ điểm yếu dùng `1,5` cho 150%.
- Thông số gốc còn chịu nội tại, hệ số sát thương đối thủ và phòng thủ người chơi. Chỉnh ngưỡng tích tầng sẽ cập nhật cả số tầng yêu cầu trên HUD.
- Sóng thần dùng hành lang an toàn để né ngang; không thêm vùng đất cao. AI có thể rút ngắn khoảng nghỉ để nối combo; dưới 30% máu, thời gian nghỉ/hồi giảm 18%.

Các ô đếm phải là số nguyên. HP vật thể, thời gian dùng làm mẫu số và bán kính phải dương; sát thương, nghỉ sau chiêu, giảm sát thương và hồi máu có thể là 0. Máy chủ kiểm tra các mốc liên quan, ví dụ thời gian phun tia phải nằm trong thời gian thi triển, tinh thể phải tồn tại đủ lâu để nổ, và các mốc tập kích phải theo đúng thứ tự. Nếu sai, bản nháp được giữ và thông báo chỉ rõ lỗi; chưa ghi vào dự án.

## Lưu nhiều phương án

**Bỏ bản nháp** trở lại lần lưu gần nhất. **Về chỉ số gốc** khôi phục riêng một dòng; **Khôi phục chỉ số gốc** khôi phục cả bảng trong bản nháp. Sau đó vẫn cần lưu để áp dụng.

**Xuất JSON / Nhập JSON** giữ nhiều phương án với định dạng `{ "version": 1, "kind": "guardian-skills", "overrides": {} }`. Nhập thay thế toàn bộ phương án trong bản nháp. Bảng từ chối JSON của bảng chiêu người chơi hoặc đối thủ để tránh nhập nhầm. Chỉ số khác mặc định mới được ghi; `.guardian-balance-last.json` giữ phương án trước lần lưu để dự phòng.

Bản nháp được lưu trên trình duyệt bằng khóa riêng. Nếu nguồn đã đổi từ bên ngoài, cần xuất bản nháp rồi tải lại để tránh ghi đè. Các bảng dùng chung khóa lưu trong máy chủ, nên không dựng chồng các bản game khi bấm lưu đồng thời.

Build Android sau đó lấy dữ liệu đã lưu; APK đang cài và website đã triển khai cần được build / phát hành lại. Trình mở bảng tự khởi động máy chủ ẩn; nếu máy chủ cũ của chính dự án đang chạy và chưa có bảng linh thú, trình mở khởi động lại máy chủ đó.

## Kiểm tra

Chạy `npm run test:guardian-balance`. Bộ kiểm tra xác nhận dữ liệu, giới hạn số, các mốc thời gian, chỉ số đã chỉnh tác động đến giao chiến, 27 chiêu mặc định, Vô Danh Thú, bản build web/Android, thao tác bảng, bản nháp, JSON, lưu/khôi phục, ngăn ghi đè, lỗi build không ghi dở và thử chỉ số đã lưu trong cả hai bản web Việt/Anh.

`npm run test:balance-editor` kiểm tra hồi quy bảng 45 chiêu dùng chung giao diện. Ảnh kiểm tra nằm trong `test-results/guardian-balance/`.
