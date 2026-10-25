# Đối thoại trước lời hứa và giao chiến

- Lần gặp mẹ đầu tiên gồm lời hỏi của nhân vật chính và hai lượt kể của mẹ. Nút hứa chỉ mở sau lượt cuối; không có nút bỏ qua trong cuộc trò chuyện này.
- Nếu bật giọng đọc, phải nghe xong lượt hiện tại mới tiếp lời. Hiện đầy đủ chữ không ngắt giọng đọc. Khi tắt tiếng/giọng đọc, điều kiện là đã xem đầy đủ các lượt thoại.
- Mỗi loại đối thủ có lời khiêu chiến riêng: ba ninja Vô Danh, chạm trán trên đường, nhiệm vụ, cảnh vệ, hộ vệ, sự kiện làng và võ đài. Hội thoại không hiển thị chỉ số chiến đấu; thông số vẫn nằm trong cấu hình trận đấu.
- Nút chuẩn bị giao chiến chỉ mở sau lượt thoại cuối. Nút lùi lại và quy tắc không được rút lui ở các trận cảnh vệ vẫn theo tiến trình hiện tại.
- Ba ninja Hỏa, Thủy, Lôi đứng theo đội hình tam giác, thay phiên áp sát, ra đòn và đỡ đòn trong cảnh phiêu lưu. Hoạt ảnh dừng khi mở hội thoại/tạm dừng, không gây sát thương, và biến mất khi hộ vệ được cứu.

`npm run test:challenge-dialogue` build bản web rồi kiểm tra kịch bản mọi làng, hoạt ảnh và luồng thoại thực tế. Kiểm tra trình duyệt giả lập sự kiện bắt đầu/kết thúc giọng Android để xác minh nút không mở sớm. Các kiểm tra hành trình và bố cục di động bổ sung nằm ở `tests/journey-story-browser.cjs` và `tests/mobile-dialogue.cjs`.
