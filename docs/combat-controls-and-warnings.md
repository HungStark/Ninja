# Điều khiển chiến đấu, chọn mục tiêu và cảnh báo chiêu

## Hành vi

- Góc nhìn thứ nhất giữ camera tại mắt nhân vật khi thi triển. Đã tắt các đoạn tự ngước nhìn thiên thạch/mây, cúi nhìn sóng nước, bám đạn và nhìn lên chiêu Địa; Phong Linh cũng không chuyển camera lên cao. Hiệu ứng, sát thương, thời gian chiêu, hỗ trợ ngắm và phản hồi va chạm ngắn giữ nguyên. Chuột vẫn điều khiển hướng nhìn khi tắt hỗ trợ ngắm, kể cả lúc tụ lực.
- Máy tính, góc nhìn thứ nhất: chỉ di chuyển bằng bốn phím mũi tên. Góc nhìn thứ ba dùng chuột phải tới điểm đến và G lướt theo con trỏ chuột, kể cả khi đang ghim mục tiêu. Vị trí chuột dành cho di chuyển được giữ riêng với hướng ngắm chiêu. Cả hai dùng tốc độ chiến đấu 3,75 m/giây và tôn trọng phần sân, vật cản, làm chậm, khống chế. Tốc độ khám phá và các phím kết ấn giữ nguyên.
- Ô tích **Hỗ trợ tự ngắm** nằm trực tiếp trên thanh trên cùng và trong menu tạm dừng, đồng bộ và lưu tại `anhoa-combat-controls-v1`. Nhấn để bật/tắt ngay, không có popup và không đổi trạng thái tạm dừng. Thiết lập áp dụng trên máy tính và điện thoại; kéo ngắm thủ công trên điện thoại vẫn hoạt động khi tắt hỗ trợ. Đã bỏ các khung thống kê chiêu ở tạm dừng/kết quả. Góc nhìn thứ ba dùng chuột, góc nhìn thứ nhất dùng mũi tên.
- Hỗ trợ ngắm mặc định bật. Bấm một đối thủ để chọn lại; mục tiêu bị hạ được thay bằng đối thủ còn sống. Chiêu bắn, vị trí đặt chiêu và chỉ hướng dùng mục tiêu đã ghim. Trỏ chuột di chuyển không kéo đường ngắm khi hỗ trợ đang bật. Góc nhìn thứ nhất theo mục tiêu bằng camera; khi tắt hỗ trợ có thể ngắm bằng chuột.
- Điện thoại dùng chung HUD chiến thuật ở hai góc nhìn. Cần di chuyển, lướt, kết ấn và tấn công có mã ngón riêng. Chạm kết ấn trong lúc giữ lướt ghi ấn ngay, nhấc ngón không ghi thêm lần nữa. Các thao tác giữ xem thông tin khi không giữ lướt vẫn hoạt động.
- Trình chỉnh bố cục chiến đấu thao tác trên HUD chiến thuật thật: cần di chuyển, lướt, tấn công, cụm chiêu, phi tiêu, mục tiêu, máu/mana, chuỗi ấn, cài đặt và khung kết ấn. Nút chỉnh bố cục hiện trong cài đặt chiến thuật; trình chỉnh nằm trên menu và lưu vào khóa bố cục hiện có.

## Sát thương nhiều đối thủ

Thuyền và sóng thần từng kiểm tra va chạm với `enemyPos()` của đối thủ đầu tiên. Thuyền còn cố định ID nhận sát thương là `primary`, sóng dùng một cờ trúng chung cho tất cả mục tiêu. Nay đòn diện rộng xét từng đối thủ còn sống; sóng ghi tập ID đã trúng riêng cho từng đợt.

Đã sửa cùng dạng xử lý ở thiên thạch, sét giáng, Thiên Giai Thánh Phạt, voi bóng; chọn vị trí đất/ánh sáng/sương/vườn bỏ qua người đã bị hạ. Phong Nhận Loạn Vũ giữ ID nạn nhân được hất tung thay vì chọn lại người đầu tiên cùng phe. Chọn ngắm cho bong bóng nước, thuật Mộc và hỏa cầu tôn trọng mục tiêu đang ghim.

## Cảnh báo

- Cả 45 chiêu ninja địch có cảnh báo sau khi kết đủ ấn, ít nhất 0,65 giây trước khi thi triển; ném phi tiêu dùng luồng riêng và không thêm cảnh báo. Đường cảnh báo bổ sung dùng chung thông số với đường định hướng người chơi: cùng chiều dài, chiều rộng, bán kính và dạng tường/vòng/đường. Cảnh báo giữ qua giai đoạn tụ lực rồi được thu hồi ngay khung hình viên đạn đầu tiên bay. Chiêu không có đạn thu hồi cảnh báo khi kích hoạt. Kẻ đang chờ thi triển bị hạ hoặc khống chế sẽ hủy đòn đang chuẩn bị; các ninja có trạng thái chờ riêng.
- Giữ nguyên kích thước, thời gian và hiệu ứng cảnh báo có sẵn của Thiên Thạch, Thiên Lôi, Thiên Giai Thánh Phạt và các chiêu Địa đánh xuống đất. Không thay nhịp tung chiêu hoặc sát thương.
- Ninja và linh thú dùng trực tiếp hình học của `createSpellAimGuide`, đổi sang viền đỏ; chỉ hướng của người chơi giữ viền xanh. Cung quạt cận chiến dùng cùng nét, mũi tên và lớp viền. Những vùng an toàn và hiệu ứng chiêu đang hoạt động giữ màu riêng.
- Các lớp cảnh báo được thu hồi và tái sử dụng, tối đa giữ 128 bộ trong vùng dự trữ của mỗi bộ hiển thị; không thay nhịp combo, khoảng nghỉ, cuồng nộ hay chỉ số máu đã chỉnh của linh thú.

## Xác minh

- `tests/aim-assist-toggle-browser.cjs`: hai ô tích đồng bộ, lưu qua tải lại, bật/tắt ghim mục tiêu, không mở popup, không hiện thống kê, không tự tạm dừng/tiếp tục trận và hỗ trợ phím Space trên máy tính/giả lập điện thoại.
- `tests/first-person-stable-view-browser.cjs`: bản `index.html` thật, chín dạng chiêu trên máy tính và trình duyệt giả lập điện thoại, đối chiếu hướng/điểm nhìn/hiển thị tay qua các giai đoạn hình thành và bay. Kiểm tra sát thương đòn từ trời, hiệu ứng Địa/Phong và xoay chuột lúc tạo sóng.
- `tests/desktop-cursor-dash-browser.cjs`: mở trực tiếp `index.html`, kiểm tra G theo con trỏ ở tám lần lướt với hỗ trợ ngắm bật/tắt, hướng chiêu vẫn ghim đối thủ, bỏ lựa chọn mũi tên góc nhìn ba và chuyển thiết lập cũ sang chuột. Kiểm tra chuột phải đi bộ và mũi tên/lướt góc nhìn thứ nhất.
- `tests/ninja-warning-size-timing.mjs` và `tests/ninja-warning-size-timing-browser.cjs`: so sánh hình học sau biến đổi ra tọa độ sân giữa 39 cảnh báo ninja và đường ngắm người chơi, kiểm tra thời điểm hết cảnh báo theo trạng thái đạn thật trong `index.html`, bảo toàn sáu dạng cảnh báo có sẵn.
- `tests/combat-targets-revision-core.mjs`: đối thủ đầu đã bị hạ, nhiều người cùng trong vùng, sóng trúng mỗi ID một lần, chọn vị trí và sát thương Mộc/Ánh sáng/Phong/Bóng.
- `tests/ninja-telegraphs-core.mjs`: đủ 45 chiêu, chờ trước thi triển, hủy khi người phát chết, điểm báo cố định, so sánh trực tiếp bộ đệm đỉnh của chỉ hướng người chơi và cảnh báo đối thủ, viền đỏ/xanh và tái sử dụng hình học.
- `tests/combat-controls-revision-browser.cjs`: tải thật `index.html`, không thay mã qua route; kiểm tra mũi tên, chuột, ô tích hỗ trợ ngắm, sát thương 10 chiêu thuộc 9 hệ sau khi hạ đối thủ đầu, cảnh báo 45 chiêu và đa chạm qua CDP trên cả hai góc nhìn. Kiểm tra chỉnh/lưu bố cục và đổi hỗ trợ ngắm từ menu điện thoại.
- Bộ linh thú: 80 chiêu, 640 tình huống cảnh báo, combo/nhịp nghỉ/đi lại, góc nhìn thứ nhất và Thủy Long trong luồng local.

Phạm vi thiết bị: kiểm tra cảm ứng dùng trình duyệt giả lập điện thoại, chưa xác minh bằng điện thoại vật lý. `tests/combat-core.mjs` cũ vẫn có kỳ vọng sát thương tia sáng lệch với dữ liệu cân bằng hiện tại (25 sát thương gặp tổng 25 khiên nhưng kỳ vọng mất thêm 1 HP); phần sát thương tia thực tế được kiểm tra riêng trong kịch bản local mới.

## Tích Hỏa/Lôi và sóng đa mục tiêu trên điện thoại

Thanh máu gọn hiện số tầng bỏng và tĩnh điện ngay phía trên, tách riêng từng ID đối thủ. Dòng tích số biến mất khi hết/tiêu thụ tích số, đối thủ bị hạ hoặc ra ngoài màn hình. Kích thước dòng được giữ lại theo nội dung và kích thước cửa sổ để không đo bố cục DOM mỗi khung hình.

Thương Hải Nộ Triều là đòn quét nhiều mục tiêu. Mỗi người trong chiều rộng, độ cao và đường đi của sóng nhận sát thương một lần cho mỗi đợt; trúng hoặc hạ một người không tiêu hao sóng hay giảm sát thương đối với những người phía sau. Mục tiêu ngoài vùng quét giữ nguyên máu. Mô tả chiêu trong quyển trục đã ghi rõ hành vi này.

`npm run test:mobile-stacks-tsunami` kiểm tra thêm một sóng quét ba người, kẻ đứng đầu bị hạ trước các hàng sau, mục tiêu ngoài vùng, không gây sát thương lặp; kiểm tra file `index.html` thật trên trình duyệt cảm ứng, gây tích số bằng Hỏa Vũ Liên Châu/chiêu thương sét rồi đo vị trí trên thanh máu. Hình kiểm tra: `test-results/mobile-stacks-tsunami/stacks-above-health.png`.
