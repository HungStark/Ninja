# Bản đồ và hành trình giữa các làng

Làng Vô Danh ở phía bắc. Thủy, Hỏa, Lôi nằm dưới Vô Danh; Phong nối ba miền ở giữa, Thổ ở cuối lục địa. Băng là đảo phía tây nam, Mộc phía đông nam; Quang và Ám chung một đảo phía nam.

Thứ tự mở làng: **Thủy → Hỏa → Lôi → Phong → Thổ → Mộc → Băng → Quang → Ám**. Hoàn thành và nhận dấu ấn hòa bình ở làng trước để mở làng tiếp theo. Sau Lôi vẫn cần về Vô Danh ký hòa ước. Bản lưu cũ giữ quyền quay lại những làng đã ghé.

- Thổ có thuyền hai chiều tới Mộc và Băng.
- Mộc, Băng, Quang có thuyền hai chiều tới nhau.
- Ám chỉ có cổng đường bộ nối với Quang; không có bến thuyền.
- Tuyến Thổ–Băng hiện sẵn nhưng Băng chưa mở khi chưa hoàn thành Mộc.

Tới bến, nhấn E hoặc nút tương tác. Nhân vật bước lên thuyền lớn có người lái ở đuôi, rồi thuyền rời cầu tàu và chạy ra mép bản đồ. Sau đó mới hiện màn hình chờ. Cảnh và nhân vật ở đích, gồm cả người lái, tải xong mới bỏ màn hình chờ. Người chơi tiếp tục thấy thuyền đi từ mép bản đồ vào bến, cập cầu tàu rồi tự xuống thuyền. Điều khiển được trả lại sau khi nhân vật đứng trên cầu tàu. Trong toàn bộ chuyến đi và lúc tải, các thao tác di chuyển, đổi đích và giao chiến đều bị khóa.

Mỗi bến có một cửa biển mở rộng từ cầu tàu ra ngoài rìa địa hình; đáy đất được hạ xuống dưới mặt nước. Cây, đá và các khối núi nền không chắn cửa biển. Vùng nước ngăn đi bộ, còn cầu tàu có sàn đỡ và lối tiếp cận được san nhẹ. Các tuyến thuyền có bến riêng, cách nhau đủ xa để không chồng thuyền hoặc cầu tàu.

Bản lưu trong lúc lên tàu giữ vị trí an toàn ở bến xuất phát. Khi đã tải làng đích, bản lưu giữ vị trí an toàn trên cầu tàu đích; đóng game giữa cảnh vào bến không lưu nhân vật ngoài biển.

Các dải đường, lối lát giữa nhà và mảng lát sân trong khu dân cư đã bỏ để lộ nền đất tự nhiên. Cầu qua sông, cầu thang, công trình và sàn bến vẫn phục vụ địa hình.

Kiểm tra toàn bộ: `npm run test:village-travel`. Kiểm tra nhanh hoạt ảnh và địa hình biển: `node tests/harbor-voyage-core.mjs`. Kiểm tra cảnh đi bộ tới từng bến: `node tests/village-exits-scene.mjs`.
