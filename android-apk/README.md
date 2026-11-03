# Cửu Ấn — Android APK

Bản Android chạy game được đóng gói sẵn trong APK. Thư mục `www/` được tạo từ mã và tài nguyên ở dự án gốc; mỗi lần build sẽ đồng bộ lại, không sửa trực tiếp trong đó. Phần giao diện Android ở `ui/android.css`, điều khiển cảm ứng ở `../src/android-controls.js`.

## Build trên Windows

Cài thư viện ở thư mục `D:\Ninja` bằng `npm ci` nếu chưa có `node_modules/`. Cần Node.js 20+, JDK 17+ (có thể dùng thư mục `jbr` của Android Studio), Android SDK Platform 34 và Build-Tools 34.0.0.

```powershell
cd D:\Ninja
powershell -NoProfile -ExecutionPolicy Bypass -File android-apk\Build-APK.ps1
```

Kết quả: **`android-apk/out/AnHoa-debug.apk`** — APK đã ký debug để cài thử. Khóa debug được tạo trong `.local/` và được dùng lại cho những lần build sau. Khi đã tải đủ thư viện, thêm `-Offline` để build không cần mạng. Các biến `JAVA_HOME`, `ANDROID_HOME` và `NODE_BINARY` có thể chỉ định bộ công cụ riêng.

Cũng có thể mở thư mục `android-apk` bằng Android Studio và chọn **Build APK(s)**. Gradle Wrapper, bước chuẩn bị tài nguyên và tạo khóa debug đã nằm trong dự án. Bản `Release` từ script là APK chưa ký, tên `AnHoa-release-unsigned.apk`.

## Điều khiển

- Trong tập luyện, sau khi chọn chiêu của bạn sẽ có bước chọn đối thủ: **Ninja** cần đúng **5 chiêu**, hoặc **Linh thú hộ vệ** cho chọn một trong chín linh thú Hỏa, Thủy, Lôi, Phong, Thổ, Quang, Ám, Mộc, Băng. Chạm **Tiếp tục** để vào trận; đấu lại giữ lựa chọn, quay về chọn chiêu để đổi đối thủ.
- Màn hình ngang, toàn màn hình; xoay ngược ngang vẫn được hỗ trợ. Màn hình dọc hiện hướng dẫn xoay máy.
- Chạm biểu tượng chiêu trên quyển trục bên trái để kết **một ấn mỗi lần chạm**; chạm tiếp sau khi đủ chuỗi sẽ bắt đầu lại từ ấn đầu. **⌫** xóa chuỗi. Các ấn dùng chung: có **Q W** từ Hỏa Liên Đạn thì chạm Hỏa Long sẽ nối ấn thứ ba, vì hai chiêu có cùng phần đầu **Q W**.
- Trong chiến đấu, tâm ngắm tự bám thẳng vào đối thủ còn sống. Có thể dùng nhiều ngón cùng lúc.
- **SPACE** thi triển nếu đủ ấn, hoặc ném phi tiêu nếu chưa kết xong chiêu. **‹ / ›** né trái/phải; **G** tốn 15 mana để tăng lực 3 giây, sau đó lướt 3 m, hồi 1 giây và giữ nguyên chuỗi ấn.
- Quyển trục năm chiêu nằm bên trái, mỗi hàng giữ icon bên trái và tên/chuỗi kết ấn bên phải; chuỗi kết ấn và máu/mana ở bên phải. Nút thi triển/chọn phi tiêu ở góc dưới trái; né trái/tăng lực/né phải ở góc dưới phải. Biểu tượng chiêu giữ hồi chiêu quét vòng tròn và lớp xanh khi thiếu chakra. Chạm tiêu đề quyển trục để thu gọn/mở rộng.
- Bộ chọn **Phi tiêu** liệt kê bốn loại cùng số lượng; loại không còn trong túi bị vô hiệu hóa. Luật tự đổi loại khi ném hết được giữ nguyên.
- **Ⅱ** tạm dừng, đổi chất lượng và bật/tắt âm thanh. Mặc định Android dùng mức Thấp.
- **Tùy chỉnh giao diện** nằm ở màn hình đầu, menu tạm dừng khám phá và menu cài đặt chiến đấu. Chọn riêng Khám phá/Chiến đấu, kéo từng nút hoặc bảng, chỉnh vị trí/kích thước/độ rõ rồi **Lưu bố cục**. Có Hủy, đặt lại từng thành phần và khôi phục toàn bộ mặc định; bố cục được lưu trên máy và giữ các thành phần trong mép màn hình khi đổi kích thước.
- Cần di chuyển lấy chỗ đặt ngón tay làm tâm trong vùng gần vị trí đã chọn, có thể chạm cả phần cảnh bên cạnh cần. Tâm được giới hạn trong màn hình; nhấc tay sẽ trả cần về vị trí đã đặt. Nút khóa chạy đi theo cần đang dùng.
- Khi khám phá: cần tròn bên trái lớn hơn 15%; kéo lên khỏi mép trên cần để hiện nút **Chạy nhanh**, rồi thả tay ngay trên nút đó để ghim chạy thẳng. Thả ngoài nút sẽ dừng. Chạm lại cần hoặc nút đang chạy, tương tác hay mở bảng để hủy chạy. Bên phải là nút nhảy tròn lớn, với **C** và **E** thành cột bên phải nút nhảy. Nhảy giữ nguyên cần đang kéo và trạng thái chạy đã ghim. Kéo trên cảnh để xoay camera.
- Các bảng thông tin hỗ trợ vuốt lên/xuống, kể cả khi bắt đầu vuốt trên nút hoặc thẻ vật phẩm.
- Hội thoại trên điện thoại dùng khung cố định: chỉ phần lời thoại cuộn, còn các nút lựa chọn, Tiếp lời và Bỏ qua luôn ở ngoài vùng cuộn. Đổi lời thoại sẽ trở về đầu nội dung.
- Tuyến truyện chính mặc định đóng, nằm ngay trái Nhật ký khám phá. Mở ra để đọc bảng nhiệm vụ kéo xuống sát đáy màn hình, phủ lên cảnh và các nút.
- Chuỗi ấn được giữ khi ném phi tiêu, chờ lâu và nhận khống chế. Hết khống chế có thể kết tiếp; kết sai, xóa thủ công hoặc thi triển thành công mới xóa chuỗi. Hai ấn đầu nhận diện hệ; phần sau dùng 10 ấn còn lại và không lặp liền kề. Phong nhận cần 3 ấn.
- Thông tin đối thủ bám theo đầu ở cả web và Android. Số tầng bỏng/tĩnh điện có hàng riêng giữa đầu và bảng thông tin. Trong trận ba đối thủ, mỗi người có bảng riêng.

## Kiểm tra

```powershell
node tools/build-android.mjs
node tests/enemy-nameplates.mjs
node tests/android-controls-browser.cjs
node tests/mobile-gameplay.cjs
node tests/mobile-touch.cjs
node tests/mobile-dialogue.cjs
node tests/mobile-layout.cjs
node tests/interaction-position.cjs
```

Ảnh kiểm tra nằm trong `test-results/android/`. APK dùng WebView trên thiết bị để dựng WebGL 2. Không có quyền mạng; tài nguyên được phục vụ từ bên trong APK qua `WebViewAssetLoader`, lưu hành trình bằng bộ nhớ riêng của ứng dụng. Bản debug cho phép kiểm tra WebView qua ADB; bản release tắt chức năng này.

Toolchain được khóa ở AGP 8.5.2 và Gradle 8.14. Tham khảo [AGP 8.5](https://developer.android.com/build/releases/agp-8-5-0-release-notes) và [tải tài nguyên nội bộ với WebViewAssetLoader](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content).
