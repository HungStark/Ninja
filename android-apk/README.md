# Ấn Hỏa — Android APK

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

- Màn hình ngang, toàn màn hình; xoay ngược ngang vẫn được hỗ trợ. Màn hình dọc hiện hướng dẫn xoay máy.
- Hai mép có sáu nút kết ấn mỗi bên: trái **Q W E R A S**, phải **D F Z X C V**. Chạm lần lượt để kết ấn; **⌫** xóa chuỗi.
- Kéo ở vùng chiến trường để ngắm; thao tác trên nút không kéo camera. Có thể dùng nhiều ngón cùng lúc.
- **SPACE** thi triển nếu đủ ấn, hoặc ném phi tiêu nếu chưa kết xong chiêu. **‹ / ›** né trái/phải; **G** tăng lực 3 giây để lướt 2 m, hồi 12 giây và giữ nguyên chuỗi ấn.
- Năm chiêu nằm bên phải, có tranh, kết ấn, hồi chiêu quét vòng tròn và lớp xanh khi thiếu chakra. Chạm mũi tên trên bảng để thu gọn/mở rộng.
- Bộ chọn **Phi tiêu** liệt kê bốn loại cùng số lượng; loại không còn trong túi bị vô hiệu hóa. Luật tự đổi loại khi ném hết được giữ nguyên.
- **⚙** tạm dừng, đổi chất lượng và bật/tắt âm thanh. Mặc định Android dùng mức Thấp.
- Khi khám phá: cần tròn ở dưới phải để đi; bốn nút **⇈** chạy, **C** tu luyện, **E** tương tác và **↑** nhảy nằm thành cụm 2×2 dưới trái. Kéo trên cảnh để xoay camera. Nhiệm vụ, bản đồ và thông báo có vùng riêng; khi mở bảng, các nút khám phá được ẩn.
- Thông tin đối thủ bám theo đầu ở cả web và Android. Số tầng bỏng/tĩnh điện có hàng riêng giữa đầu và bảng thông tin. Trong trận ba đối thủ, mỗi người có bảng riêng.

## Kiểm tra

```powershell
node tools/build-android.mjs
node tests/enemy-nameplates.mjs
node tests/android-controls-browser.cjs
```

Ảnh kiểm tra nằm trong `test-results/android/`. APK dùng WebView trên thiết bị để dựng WebGL 2. Không có quyền mạng; tài nguyên được phục vụ từ bên trong APK qua `WebViewAssetLoader`, lưu hành trình bằng bộ nhớ riêng của ứng dụng. Bản debug cho phép kiểm tra WebView qua ADB; bản release tắt chức năng này.

Toolchain được khóa ở AGP 8.5.2 và Gradle 8.14. Tham khảo [AGP 8.5](https://developer.android.com/build/releases/agp-8-5-0-release-notes) và [tải tài nguyên nội bộ với WebViewAssetLoader](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content).
