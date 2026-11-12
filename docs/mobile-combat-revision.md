# Mobile, phản bóng, thương hội và tốc độ

## Hành vi

- Mobile và mức đồ họa thấp có bóng đổ từ mặt trời trong chiến đấu và phiêu lưu, dùng shadow map 512. Các mức khác giữ 1024/2048.
- Cỏ chiến đấu giữ màu xanh cố định, vẫn lay theo gió nhưng không nhận ánh sáng từ chiêu, không có emissive/rim và không đổ bóng từng lá. Điều này bỏ việc đổi dải sáng trên các mặt cỏ mỏng và giảm số vật thể tham gia lượt vẽ bóng.
- U Minh Tập Kích trước đây chỉ kiểm tra tuyết và tường thường trong `DarkDomain.updateClones`; nó chưa chạy qua phản chiêu của `LightArts`/`WindArts`. Nay chó và bò đang lao có kiểm tra gương/tinh linh, đổi phe gây sát thương và đuổi lại chính người triệu hồi. Bóng trong lãnh địa hồi sinh về phe ban đầu sau khi hoàn thành cú cắn.
- Gương dùng độ bền hiện tại và phản từ mặt trước; tinh linh cần hoàn thành tạo hình, còn thời gian và đón đòn từ phía trước. Tường thường vẫn chặn cú lao.
- Chín thương hội nguyên tố bán hai áo và hai găng: thường 5%, tinh anh 10%, chỉ áp dụng hệ của làng. Áo giảm sát thương nhận vào; găng tăng sát thương thuật gây ra, không tăng phi tiêu. Vô Danh bán một áo và một găng, mỗi món có chỉ số 2% Hỏa/Thủy/Lôi theo công dụng tương ứng.
- ID đồ cũ vẫn đọc và trang bị được. Các mẫu cũ không còn bán được chuẩn hóa chỉ số theo hệ/cấp tương ứng; không xóa món đã mua.
- Đi/chạy và tự đi phiêu lưu tăng 1,5 lần. Di chuyển thường của địch chính, địch trong nhóm và linh thú ở chế độ nhìn từ trên tăng 1,3 lần.
- Ninja địch dùng lướt 5 m khi dự đoán đòn sắp trúng, hồi 10 giây riêng mỗi địch; tôn trọng biên sân, vật cản, làm chậm, khống chế và vùng cấm lướt. Đang kết ấn sẽ không bắt đầu lướt. Hồi chiêu/lướt của người chơi giữ mức hiện tại.

## Kiểm tra

`npm run test:mobile-combat-revision` gồm kiểm tra core, mô hình găng, chuyển động, lướt, bóng triệu hồi, 27 chiêu linh thú và trình duyệt mobile. Đã chạy các bước tương ứng thành công.

Kiểm tra phản bóng dùng trực tiếp hai lớp gương/tinh linh: chó/bò, mặt trước/sau, tinh linh chưa tạo xong/hết hạn, gương vỡ và hồi sinh trong lãnh địa. Kiểm tra trình duyệt chạy qua luồng chiến đấu thật, xác nhận người triệu hồi mất máu và người phòng thủ không bị cắn.

Ảnh và báo cáo: `test-results/mobile-combat-revision/`.

Kiểm tra mở rộng `equipment-core.mjs` qua phần đồ và tính sát thương, nhưng vẫn lỗi tại phép kiểm tra độ cao bậc thương hội ở dòng 36. Chạy lại nguồn và bài kiểm tra từ `HEAD` tái hiện cùng lỗi, cùng hai giá trị 3.3941528944929207 / 2.9475806822415684. `light-core.mjs` cũ dừng ở kỳ vọng thời gian cầu sáng 8 giây, trong khi cấu hình có sẵn là 9 giây; thay đổi này giữ cấu hình chiêu hiện có.

Đã tạo lại gói offline Việt/Anh, dữ liệu Android và thư mục triển khai web. Chưa đo FPS trên điện thoại vật lý.
