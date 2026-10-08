# Ấn Hỏa — Game kết ấn 3D

Bản thử nghiệm góc nhìn thứ nhất lấy cảm hứng từ cách kết ấn trong Naruto. Chọn 12 thế tay ở **bốn hàng đầu của ket_an.jpg**, đọc từ trái sang phải, từ trên xuống dưới. Các tên mô tả bên dưới do game đặt để phân biệt hình tham chiếu; không phải tên ấn chính thức trong Naruto.

## Chạy game

Mở **index.html** bằng Chrome hoặc Edge, bấm **Bắt đầu luyện tập** hoặc Enter. Không cần tải thư viện, kết nối mạng hay cài gói npm. Giữ các tệp trong cùng thư mục để ảnh và mã được tải đúng.

Nếu trình duyệt không khóa con trỏ khi mở tệp, giữ và kéo chuột trong sân tập để ngắm. Có thể dùng máy chủ cục bộ khi đã có Node.js: chạy **npm start**, rồi mở http://127.0.0.1:4173.

## Gán 12 ấn

| Phím | Vị trí trong ảnh | Mô tả |
| --- | --- | --- |
| Q | Hàng 1, cột 1 | Mỏ nhọn |
| W | Hàng 1, cột 2 | Tai kép |
| E | Hàng 1, cột 3 | Trụ thẳng |
| R | Hàng 2, cột 1 | Móc tay |
| A | Hàng 2, cột 2 | Chụm ngang |
| S | Hàng 2, cột 3 | Song chỉ |
| D | Hàng 3, cột 1 | Xòe chéo |
| F | Hàng 3, cột 2 | Khóa ngón |
| Z | Hàng 3, cột 3 | Vòng cung |
| X | Hàng 4, cột 1 | Chắp nghiêng |
| C | Hàng 4, cột 2 | Mở lòng |
| V | Hàng 4, cột 3 | Cuộn tay |

Bảng phía dưới màn hình có hình trích vùng từ ảnh gốc để đối chiếu. Hai bàn tay 3D có khớp ngón và chuyển động giữa 12 tư thế. Mô hình khối đơn giản diễn giải các thế tay tham chiếu, chưa phải bản sao từng chi tiết của ảnh.

## Hỏa thuật

| Thuật | Chuỗi phím, bấm lần lượt | Thi triển | Chakra | Hiệu ứng |
| --- | --- | --- | --- | --- |
| Hỏa cầu | Q → W → E → R | Space | 30 | Một cầu lửa, 70 sát thương |
| Hỏa long | A → S → D → F | Space | 45 | Phun lửa 1,5 giây, tầm khoảng 10 m; mỗi đạn 18 sát thương |
| Phượng hỏa | Z → X → C → V | Space | 60 | Năm đạn lửa xòe ngang, mỗi đạn 35 sát thương |

Các chuỗi chiêu là thiết kế cho bản game này. Bấm phím riêng lẻ theo thứ tự; không cần giữ đồng thời. Game tự nhận chuỗi của cả ba thuật, không bắt buộc chọn trước trong quyển trục.

- Chakra tối đa 100, hồi 9 mỗi giây. Thời gian chờ giữa hai thuật là 1,2 giây.
- Nếu bấm sai, chuỗi được xóa; nếu phím sai cũng là phím mở đầu của thuật khác thì bắt đầu chuỗi mới từ phím đó.
- Không nhập tiếp trong 7 giây thì chuỗi hết hạn. Thiếu chakra vẫn giữ chuỗi để chờ hồi, trong giới hạn 7 giây.
- Hướng bắn đi theo tâm ngắm. Bia đổi màu khi trúng, có thanh máu và đổ xuống khi bị hạ.
- Mỗi đợt có 5 bia, mỗi bia 100 máu. Hạ đủ bia để luyện tiếp một đợt mới.

## Điều khiển

- **Q W E R A S D F Z X C V:** kết ấn; cũng có thể bấm nút ấn trên giao diện.
- **Space:** thi triển chuỗi hoàn chỉnh.
- **Phím mũi tên:** di chuyển; **Shift + mũi tên:** đi nhanh.
- **Chuột:** ngắm khi đã khóa con trỏ; **giữ và kéo chuột:** ngắm nếu không khóa được.
- **Backspace:** xóa chuỗi ấn.
- **1 / 2 / 3:** xem công thức hỏa thuật tương ứng.
- **H:** ẩn/hiện quyển trục. **M:** bật/tắt âm thanh.
- **Esc:** tạm dừng / thả con trỏ. **Enter:** bắt đầu, tiếp tục hoặc sang lượt mới.

Chuyển khỏi cửa sổ hoặc tab sẽ tự tạm dừng. Bấm Tiếp tục để quay lại. Bắt đầu lại lượt tập sẽ khôi phục chakra, bia, điểm và vị trí người chơi.

## Mã nguồn và kiểm thử

- index.html / style.css: giao diện tiếng Việt và bảng 12 ấn.
- game-core.js: bộ luật chuỗi ấn, chakra, thời gian chờ.
- game.js: bộ dựng WebGL thuần, sân tập, rig bàn tay, điều khiển và va chạm đạn.
- server.cjs: máy chủ cục bộ tùy chọn, không có dependency.
- tests/smoke.cjs: kiểm thử bộ luật và mô phỏng đầu vào thật của game với DOM/WebGL giả lập.
- tests/render-world.cjs: dựng chẩn đoán hình học từ các lệnh vẽ đã ghi; world-preview.png là ảnh hình học, không phải screenshot trình duyệt.

Chạy kiểm thử bằng **npm test** nếu có Node.js. Kiểm thử gồm cả ba thuật, sai chuỗi, hết hạn, thiếu chakra, cooldown, trúng bia/hạ bia, di chuyển, hướng nhìn, pause/resume và reset.

**Giới hạn xác minh:** kiểm thử mô phỏng đã chạy qua. Trình duyệt headless trong môi trường phát triển không khởi tạo được GPU, nên chưa xác minh shader, bố cục CSS và tốc độ khung hình trên trình duyệt thực. Mở bằng Chrome/Edge hỗ trợ WebGL để kiểm tra phần hiển thị cuối cùng.
