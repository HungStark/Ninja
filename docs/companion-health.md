# Máu và cứu chữa Hạ Ly

Hạ Ly có 300 máu tối đa khi được kết nạp ở Hỏa. Lần đầu ghé mỗi làng Lôi, Phong, Thổ, Mộc, Băng, Quang và Ám tăng 30 máu tối đa, đạt 510 ở cuối hành trình. Quay lại làng cũ không cộng thêm. Khi còn tỉnh, phần máu mới được cộng vào máu hiện tại để giữ nguyên lượng thương tích; tăng cấp không thể đánh thức cô khi đã bất tỉnh.

Trong chiến đấu, Hạ Ly là đồng minh có thể nhận sát thương nhưng không phải mục tiêu cho AI ngắm, truy đuổi hoặc chọn chiêu khóa mục tiêu. Đạn đi ngang vẫn va chạm với cô, cũng như vùng nổ, sóng, độc, laser, gai đá và chiêu của linh thú. Máu độc lập với người chơi và được giữ giữa các trận. Cô dừng tấn công/cứu nguy khi máu về 0, không tự hồi sinh. Cơ chế này áp dụng cả giao hữu khi cô đang đồng hành.

Trở về phiêu lưu sau thắng, thua, rút lui hoặc tải lại game, nhân vật tự bế Hạ Ly đang bất tỉnh. Mô hình được gắn vào nhân vật, có tư thế bế và nhắm mắt. Đi bộ còn 4,2 m/s, chạy 7 m/s, đi lùi 3,5 m/s; tự đi theo mục tiêu cũng nhân 0,7. Các bước truyện, nhận liên minh và ký cam kết bị khóa, nhưng vẫn có thể đi lại để tìm trạm y tế. Một trận nhiệm vụ đã thắng vẫn ghi nhận kết quả; bước truyện kế tiếp phải chờ cô tỉnh.

Tại trạm y tế, chữa cho Hạ Ly bất tỉnh mất đủ 60 giây thời gian chơi tại trạm. Có bộ đếm và hiệu ứng dấu cộng xanh. Nút **Tạm dừng chữa trị** hoặc Esc cho phép dừng lại; thời gian đã chữa được lưu, không tự tăng khi đi nơi khác hoặc tắt game. Chữa xong hồi đầy máu Hạ Ly, bỏ tư thế bế, phục hồi tốc độ và mở lại tiến trình truyện. Nếu cô chỉ bị thương và còn tỉnh thì được hồi máu cùng lần điều trị 2 giây thông thường. Khi cô rời nhóm theo cốt truyện, việc chữa cho người chơi không hồi máu từ xa cho cô.

Các trạng thái nằm trong `story.companion`: `hp`, `maxHp`, `growthVillages`, `treatmentSeconds`. Save trước bản cập nhật được cấp máu tương ứng những làng đã ghé. Mã xử lý chính: `src/companion-health.js`, `src/campaign-ally.js`, `src/village-story-actors.js`, `src/adventure.js` và hệ thống va chạm trong `src/main.js`.

Kiểm tra: `npm run test:companion-health`. Bộ kiểm tra gồm tăng máu, lưu/nạp, bất tỉnh sau thắng/thua, va chạm thực tế, AI không chọn Hạ Ly, bế nhân vật, tốc độ 4,2 m/s và chữa đủ 60 giây qua tạm dừng/tải lại. Các bộ `guardian-moba-core.mjs`, `guardian-boss-combat.mjs`, `water-bubbles.mjs` và `mobile-combat-revision-core.mjs` kiểm tra các cơ chế chiến đấu liên quan.
