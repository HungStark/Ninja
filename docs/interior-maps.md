# Bản đồ trong hang và võ đường

## Hang Thổ

- Cửa Đại Hang ở giữa Làng Thổ là một cửa đen kín; không nhìn xuyên vào cảnh trong hang và không đi xuyên cửa bằng di chuyển thường.
- Đến gần rồi nhấn **E / Tương tác** để tải **Đại Hang Địa Tâm**. Bản đồ ngoài được gỡ, không còn cảnh vệ, nhà cửa, cổng làng hay sự kiện ngoài trời trong cảnh này.
- Hang có nền và va chạm riêng, nhũ đá, hồ ngầm, xe mỏ, tinh khoáng, đèn và hai cư dân cũ của hang. Hai địa danh cũ vẫn được khám phá và lưu bằng mã cũ.
- Nhấn E tại lối ra để trở lại vị trí đã vào ở Làng Thổ.

## Nhà trên cây Mộc

- Cầu thang xoắn và hiên nhà vẫn thuộc Làng Mộc. Lên hiên rồi đến cửa căn nhà và nhấn E để vào.
- Bên trong là **Võ Đường Cửu Làng**, một bản đồ riêng rộng hơn căn nhà nhìn từ bên ngoài: sàn gỗ, vòng đấu, khán đài, võ sinh, cờ chín làng và trọng tài.
- Nói chuyện với trọng tài để chọn giao hữu với đại diện một trong chín làng nguyên tố. Khi giao chiến, sân đấu cũng chuyển sang nội thất võ đường.
- Thắng hoặc thua giao hữu đều trở lại võ đường; không thưởng xu, không đánh dấu hộ vệ hay nhiệm vụ đã xong, không đưa về ấn hồi sinh khi thua. Phi tiêu đã sử dụng vẫn tiêu hao như các trận đấu khác.
- Nhấn E tại cửa ra để trở lại đúng hiên nhà, giữ độ cao và mặt sàn trên cây; sau đó có thể dùng cầu thang xuống làng.

## Lưu và chuyển cảnh

- Khi đổi bản đồ có màn chuyển cảnh ngắn và khóa điều khiển trong lúc tải.
- `save.interior` lưu mã phòng và vị trí/mặt sàn/độ cao quay ra. Tải lại game trong phòng tiếp tục ở phòng đó.
- Bản lưu cũ có `surface: earth-cave` được chuyển sang bản đồ hang mới, giữ tọa độ trong hang và tiến trình cũ.
- Hạ Ly đi cùng vào/ra hai bản đồ. Các mục tiêu ngoài trời trong nhật ký dẫn về cửa ra; từ ngoài, theo dấu cư dân hoặc địa danh trong hang sẽ dẫn tới cửa hang.
- Admin sử dụng bản sao tạm như trước; các thay đổi trong phòng không ghi sang tiến trình thường. Dịch chuyển admin tới làng sẽ rời phòng.
- Cấu hình và hình học phòng nằm ở `src/adventure-interiors.js`. Chạy `npm run test:interiors` để kiểm tra chuyển cảnh, đi lại/va chạm, lưu/tải, cầu thang và cửa thật, bạn đồng hành, giao hữu và đường quay ra.
