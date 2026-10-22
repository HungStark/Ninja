# Ấn Hỏa — Đấu trường Cửu Hệ

## Chế độ khám phá · Kẻ Lữ Hành

Mỗi NPC có một nhiệm vụ phụ riêng (119 việc trên toàn thế giới), gồm tìm vật, khảo sát hoặc đánh kẻ phá hoại. Nhận và trả việc qua đối thoại; theo dấu trong nhật ký **B** hoặc khung nhiệm vụ. Làng Vô Danh chỉ thưởng xu, không thưởng sách hoặc kinh nghiệm nhiệm vụ. Các làng khác có thể thưởng cuộn giấy chưa có, luôn đúng hệ của làng; cần đủ cấp rồi mở **C** để học từ sách. Ninja lang thang đứng ném pháo phá làng, không đuổi theo người chơi; tới gần nhấn **E** để chiến đấu, bỏ qua thì rời đi sau 30 giây.

Mở `index.html` hoặc chạy `npm start`. Màn hình đầu cho phép tạo nhẫn giả tóc đen rối, lộ hai mắt, mặt nạ đen, khăn choàng và vạt áo đen đỏ rách (tên, màu áo, sắc tóc), tiếp tục bản lưu, hoặc vào đấu trường luyện tập. Bản lưu cũ tự nhận diện mạo mới và giữ tiến trình, trang bị. Khi chạy máy chủ, giữ thêm `adventure.css` cùng các file game.

- **Trang bị:** nhấn **C** để xem nhân vật 3D ở bên trái bảng thuộc tính và đổi giáp, loại phi tiêu, túi đã sở hữu. Giáp thay đổi ngoại hình cả khi khám phá và trong trận đấu, kháng đúng các hệ ghi trên món đồ; sức mạnh vẫn tăng sát thương theo phần trăm từ chỉ số gốc.
- **20 mẫu giáp làng:** mỗi làng có dáng giáp riêng và bản tinh anh thêm lớp bảo vệ, vạt dài, khảm kim loại. Thủy dùng giáp vảy; Hỏa dùng giáp phiến; Lôi có các mảng góc cạnh; Thổ có giáp đá; Phong có lông vũ và lụa; Quang có huy hiệu mặt trời; Băng có cổ lông thú và tinh thể; Mộc có lá và vỏ cây; Ám dùng giáp bất đối xứng; Vô Danh dùng da vá. Vai, giáp tay, hông và ống chân gắn theo các khớp khi nhân vật đi, nhảy hoặc kết ấn. Cửa hàng trưng bày giáp của làng; bảng C mô tả kiểu dáng đang mặc.
- **Thương hội:** mỗi làng có một cửa hàng lớn, biển hiệu và quầy hàng; tìm bằng nhật ký **B**, bản đồ nhỏ hoặc nút tìm cửa hàng trong bảng **C**. Tới trước cửa/quầy rồi nhấn **E**. Nhân vật mới khởi đầu với **100.000 xu**. Phi tiêu sắt/bạc/vàng/bạch kim gây **4/5/7/10 sát thương gốc**, bán bó 10 giá **8/24/55/100 xu**. Mỗi loại có màu riêng; bạch kim có năng lượng xoay sát lưỡi phi tiêu dẹp, mỏng. Thuật Thủy bộc cầu không cường hóa phi tiêu.
- **Túi và tiếp tế:** sau khi chọn thuật ở trưởng làng sẽ nhận **10 phi tiêu sắt**, túi 10 chỗ; túi nâng cấp chứa **20/30/50** chiếc, tính tổng mọi loại. Ném thành công tiêu hao một chiếc; thi triển thuật không tốn phi tiêu. Hết loại đang cầm sẽ **tự chọn loại cấp thấp nhất còn ít nhất một chiếc**. Nhấn **T** trong trận để lần lượt đổi các loại còn hàng, bỏ qua loại đã hết. Mua đồ, trang bị và số phi tiêu còn lại đều được lưu; rút lui không hoàn trả số đã dùng. Khi hết hoàn toàn phi tiêu và không đủ 8 xu, cửa hàng có gói tiếp tế khẩn cấp 10 phi tiêu sắt miễn phí.

- **Tạm mở mọi làng để kiểm tra:** nhấn **M**, chọn bất kỳ làng nào rồi bấm **Dịch chuyển tới làng này**. Công tắc **Tạm mở tất cả làng để kiểm tra** bật mặc định và có thể tắt trong bản đồ để dùng lại khóa theo truyện. Di chuyển kiểm tra không tự đánh bại thủ lĩnh, học chiêu, ký hiệp ước hoặc mở khóa vĩnh viễn các làng.
- Va chạm cảnh vật được lấy từ hình học thực tế, gồm cả đá vẽ bằng instancing, thân cây, cột, cầu ván, bến, sàn nhà sàn và các công trình ở mười làng. Đá giữ mặt nghiêng thật, sàn gỗ có mặt đỡ để nhảy lên và lưu lại độ cao. Tán cây nối vào thân, không treo rời trên không.
- Nhân vật **không biết bơi**. Sông Thủy sâu tới **4,5 m**, ở khoảng một phần ba bề ngang đã ngập đầu; chỉ được lội phần ven bờ sâu tối đa **1,15 m**. Đi bộ và nhảy đều bị chặn trước vùng sâu, còn sàn/bến và bè phía trên nước vẫn dùng được.

- Camera khám phá nằm sát sau đầu nhân vật. **Nhấn giữ chuột trái hoặc phải rồi kéo** để xoay camera và hướng nhân vật; **thả chuột** để dừng xoay. Di chuột bình thường không đổi góc nhìn, con trỏ luôn tự do để dùng giao diện. **WASD/phím mũi tên** di chuyển theo hướng nhìn, lăn chuột chỉnh khoảng cách 2,8–6,5 m. Click mặt đất hoặc bản đồ nhỏ không di chuyển nhân vật. Các nút nhiệm vụ/NPC đánh dấu hướng và khoảng cách tới mục tiêu; tự đi tới rồi nhấn **E** tương tác. **M** địa đồ, **B** nhật ký, **C** tu luyện/thuộc tính, **Esc** tạm dừng/đóng cửa sổ.
- Nhà có mái hai dốc khép kín, tường đầu hồi, cửa sổ từng tầng và móng bám nền dốc. Cảnh quan có thung lũng suối với lòng nước và bờ thoải, cầu trên các tuyến đường, bãi bằng xen đồi, cụm sỏi đá và lau ven bờ. Hỏa dùng dòng dung nham, Băng dùng mặt sông đóng băng; quảng trường đầu làng giữ nền bằng.
- Đi ngang dùng bước chân sang bên; đi lùi dùng bước ngắn và chậm hơn **25%** (3,45 m/s so với 4,6 m/s khi tiến), kể cả lùi chéo. Hướng mặt và camera giữ nguyên khi đi ngang/lùi. Nhịp chân theo vận tốc thực tế, gối gập khi nhấc chân, chuyển tiếp mềm khi đổi hướng hoặc dừng; đi chéo không tăng tốc.
- **Space** nhảy với trọng lực, cao khoảng **2,9 m**, có thể nhảy lên ruộng bậc thang hoặc từ dưới sông Vô Danh lên mặt cầu. Chỉ nhảy khi chân đã chạm đất/mặt đỡ; giữ Space không tự nhảy liên tục. **Nhấn đúp W hoặc ↑ trong 0,3 giây rồi giữ lần thứ hai** để chạy **7,36 m/s**; thả phím tiến để trở lại đi bộ. Lan can, trụ và mặt cầu có va chạm theo đúng hướng cầu; thành ruộng chặn người, đất trên từng bậc là mặt đứng. Bước khỏi mép sẽ rơi; lưu trên ruộng giữ đúng độ cao khi tải lại, lưu lúc nhảy dùng vị trí đặt chân gần nhất.
- Bấm tiêu đề **Tuyến truyện chính** để thu gọn/mở rộng; lựa chọn được lưu qua lần tải lại. Khung Trung tâm làng đã bỏ; bảng nhiệm vụ dùng chiều cao còn lại, hiển thị cả mô tả việc làng và cuộn khi màn hình thấp. Ninja lưu vong xuất hiện sau quãng đường ngẫu nhiên 90–160 m, có 45 giây yên bình đầu hành trình và 90 giây nghỉ sau trận hoặc rút lui.
- Dân làng có tỷ lệ người trưởng thành, nhiều chiều cao, vóc dáng, kiểu tóc và trang phục theo nghề: lái đò, thợ rèn, thợ mỏ, kỹ sư, thầy thuốc, kiểm lâm, tư tế, cao nhân và các vai trò khác. Chân dung hội thoại dùng cùng tạo hình với NPC ngoài thế giới; mô hình giữ dưới 2.600 tam giác mỗi người.
- Ninja lang thang, ninja nhiệm vụ và đối thủ người trong đấu trường dùng chung nền cơ thể/khuôn mặt với dân làng. Có mặt nạ, băng trán, giáp nhẹ, túi dụng cụ, kiếm sau lưng, khăn và một số biến thể trùm đầu; màu áo, da, vóc dáng theo làng và vai trò. Tạo hình ngoài thế giới khớp với khi vào trận; tay vẫn kết ấn và chân vẫn di chuyển né hai bên. Mỗi mẫu ninja dưới 3.100 tam giác, chưa tính bộ tay kết ấn dùng chung trong giao chiến.
- **Vô Danh giữ 140 × 140 m**. **Thủy, Hỏa, Lôi, Phong, Thổ, Băng và Mộc rộng 280 × 280 m**, bằng **4 lần diện tích Vô Danh**. Có 64 địa danh, cùng cư dân cố định, trưởng làng, sứ giả và các thủ lĩnh. Bản đồ nhỏ, cổng làng, đường tìm mục tiêu và lưu vị trí dùng đúng kích thước từng vùng. Bản lưu cũ tự đổi tọa độ theo bản đồ mới.
- **Vô Danh:** nhà tranh bỏ hoang có mái rơm thủng lộ kèo, cửa sổ trống, tường vỡ và dây leo. Cây khô, cỏ úa, đường đất lở mép, cầu mục mất lan can và hố chiến trận kể dấu tích giao tranh giữa Thủy, Hỏa, Lôi. **Nghĩa Trang Vô Danh** ở phía tây nam có 16 nấm mộ, bia nghiêng và hàng rào mục; khám phá để ghi lại câu chuyện trong nhật ký. **Thủy:** ba nhánh sông lớn, nhà sàn, giàn phơi lưới/cá, bến và năm tuyến bè hai chiều. Sông sâu chặn đi bộ; tới bến nhấn **E**, bè chở sang bờ kia.
- **Hỏa:** núi lửa, mỏ nham, trạm gác và Vách Tro Hồng có các mấu bám. Nhận nhiệm vụ **Hồng liên cứu thương** từ Thợ Khôi ở trung tâm, leo lên đỉnh hái hoa rồi trở lại nhận thưởng. Tới chân vách nhấn **E**, giữ **W** để tiếp tục leo, **S** để quay lại, thả phím để nghỉ. Nhiệm vụ thưởng một lần 80 xu và 100 kinh nghiệm.
- **Lôi:** mưa giông xen các khoảng tạnh, tia sét và ánh chớp, tiếng sấm khi âm thanh đã được kích hoạt bằng thao tác chuột. **Phong:** cối xay gió và ba nhà treo dưới chùm bóng bay, có sàn khám phá; tới thang dây nhấn **E**, giữ **W** để leo theo chiều đã chọn. Lên tới sàn có thể đi lại và dùng đầu thang phía trên để xuống.
- **Thổ:** nhiều cụm đá và Đại Hang Địa Tâm giữa làng; nhấn **E** tại cửa để xuống hang, đi bộ khám phá nhũ đá, hồ ngầm và tinh khoáng, rồi trở lại cửa bên trong để đi ra. **Băng:** tuyết, sông và biển băng; khi thả phím nhân vật trượt nhẹ rồi dừng, va chạm vẫn chặn chuyển động. **Mộc:** rừng dày và nhà trên cổ thụ ở trung tâm, có thang dây và sàn đi lại. Vị trí trên nhà hoặc trong hang được lưu; tải lại vẫn đứng đúng tầng.
- **Mở đầu mới:** nhân vật có **200 máu**, **100.000 xu**, xuất hiện ở khu nhà cạnh nghĩa trang. Gặp mẹ trước mộ cha và em trai để lập lời hứa hòa bình. Trưởng làng cho chọn đúng một thuật: **Hỏa liên đạn**, **Thủy bộc cầu** (4 quả, mỗi quả 10 sát thương gốc, nổ giây 1–2–3–4, hồi 6 giây) hoặc **Lôi thương** (50 sát thương gốc); sau đó tặng túi và 10 phi tiêu. Ba ninja Hỏa/Thủy/Lôi cùng trấn giữ hộ vệ bị phá hỏng, mỗi người 85 máu và một thuật cơ bản. Thắng cả ba để hồi sinh hộ vệ rồi trở về báo cáo với trưởng làng, nhận 100 xu và được truyền dạy ngay hai thuật khởi đầu còn lại. Bản lưu cũ giữ tiến trình; tạo hành trình mới để chơi đoạn mở đầu.
- **Dấu ấn hòa bình:** sau khi báo cáo có thể thâm nhập Thủy, Hỏa, Lôi theo thứ tự tùy chọn. Mỗi làng (trừ Vô Danh) có **8 cảnh vệ ẩn thân**, ngụy trang thành gốc cây, bụi rậm hoặc đá, rải tại các địa danh và cách nhau ít nhất **15 m** theo vị trí đã kiểm tra va chạm. Bên linh thú còn có **2 Hộ vệ** hiện hình sẵn, canh hai phía; họ có nhiều máu hơn, sát thương cao hơn và nhiều chiêu hơn cảnh vệ thường. Tới gần 10 m sẽ có tiếng bụp và khói trắng bung ra, cảnh vệ hiện hình rồi chạy đuổi theo đường tránh vật cản. Khi bị áp sát mà chưa có dấu ấn hòa bình, không thể rút lui ở đối thoại, màn chọn chiêu hoặc menu tạm dừng. Có dấu ấn thì được từ chối; hạ cảnh vệ sẽ xóa họ khỏi bản lưu và cho kinh nghiệm đúng hệ. Khuất phục quái thú hộ vệ rồi gặp trưởng làng để thương lượng nhận dấu ấn. Đủ ba dấu ấn mới đưa đại diện về Vô Danh ký hiệp ước.
- **Những miền xa:** mang hiệp ước tới Thổ, Phong, Quang, Băng, Mộc; đánh bại hộ vệ và thương lượng thêm dấu ấn ở mỗi làng. Sau đó cổng Ám mở để đối mặt Vô Nguyệt, kẻ giật dây chiến tranh.
- Cao nhân giao nhiệm vụ khám phá yên bình. Sau bài học đầu, có thể trở lại để xin dạy thêm mọi thuật đã đủ cấp. Thắng thủ lĩnh nhận **sách kỹ năng**, giữ trong Tu luyện; sách chỉ học được khi đủ cấp và phải bấm **Học từ sách**. Lên cấp, sở hữu sách hoặc thắng thủ lĩnh không tự học chiêu. Đủ **45 chiêu** đều có đường học.
- **Hộ vệ nhiều phase:** Thủy/Hỏa/Lôi có 520/580/620 máu, hai phase. Thổ/Phong/Quang/Băng/Mộc/Ám có 850/780/980/1000/1080/1600 máu, ba phase. Mất máu sẽ mở thêm thuật, tăng nhịp đánh và dùng đòn đặc trưng (nham nứt, lôi vũ, rễ cây, nguyệt thực…); vòng sáng trên đất báo trước khoảng 1,25–1,5 giây. Mỗi hộ vệ chỉ trao thưởng một lần.
- Ấn hồi sinh tại **Làng Vô Danh** được kích hoạt từ đầu. Tới ấn ở làng khác rồi click hoặc nhấn **E** để đặt điểm hồi sinh mới. Ghé qua một làng chưa tự đổi điểm hồi sinh.
- Nhân vật, vị trí, làng đã thăm, điểm hồi sinh, nhiệm vụ, địa danh, bài học, thuật đã học, cấp từng hệ, thuộc tính chung, thủ lĩnh đã thắng và hiệp ước được lưu bằng localStorage. Bản lưu cũ giữ quyền dùng những chiêu đã có; chọn hành trình mới bắt đầu lại với một thuật Thủy. Lên cấp từng hệ nhận điểm để nâng máu, sức mạnh hoặc mana dùng chung.

`npm run test:adventure` kiểm tra địa hình, tất cả lối tương tác/cổng, luật chiến dịch, lưu cũ/mới, nhiệm vụ, chiến thắng/thất bại, hồi sinh, chạm trán và điện thoại. `npm run test:world-journey` chạy toàn bộ tuyến truyện qua UI từ một thuật Thủy tới lễ ký, năm chuyến truyền hòa ước và trận cuối. Ảnh ở `test-results/adventure/` và `test-results/world-journey/`. Thêm `?mode=duel` để mở luyện tập; `?test=1&adventure=1` bật kiểm thử khám phá.

NPC có nhịp chớp mắt riêng, chuyển trọng tâm, khớp khuỷu tay và quay đầu nhẹ về người chơi ở gần. Mỗi làng có các cụm vật dụng bên nhà và địa danh, tránh lối đi và điểm nhiệm vụ. Gỗ, vữa, đá, kim loại, đất và tuyết dùng vân cùng độ nhám riêng. Ánh sáng trời giảm để giữ tương phản; bóng mặt trời tập trung quanh người chơi và bóng tiếp đất dùng chung một lượt vẽ, vẫn có ở chế độ Thấp. `npm run test:presentation` kiểm tra bề mặt, biểu cảm, bóng tiếp đất và lưu ảnh các làng vào `test-results/presentation/`.

Vật phẩm việc cư dân có mô hình theo nhiệm vụ (bó bạch cúc, lưới, dụng cụ, quặng, vải, thuốc, cuộn giấy…), dùng **E · Thu thập** hoặc **Khảo sát** thay vì hội thoại. Cả 45 chiêu có tranh biểu tượng riêng trong quyển trục chọn chiêu và bộ mang theo. Khi giao chiến, quyển trục mặc định thu gọn thành cột biểu tượng bên phải; **H** mở rộng tên và kết ấn. Hồi chiêu hiện vùng tối quét vòng tròn cùng số giây, thiếu chakra phủ xanh đậm lên trên. Đối thủ hiển thị các phím thực tế đã kết ấn, thêm **␣** sau lần thi triển thành công; chuỗi mới thay chuỗi cũ. `npm run test:spell-presentation` kiểm tra vật phẩm, biểu tượng, các lớp trạng thái, H, chuỗi ấn và màn hình nhỏ.

Nguồn: `src/adventure.js` quản lý hành trình/UI; `src/adventure-scene.js` dựng cảnh, nhân vật và địa hình; `src/adventure-landmarks.js` dựng kiến trúc, địa danh và thủ hộ; `src/adventure-world.js` chứa các vùng, cư dân, bài học và bề mặt địa hình; `src/adventure-data.js` chứa luật chiến dịch, bản lưu và A*. Mô hình low-poly dựng bằng mã, cảnh tĩnh gộp theo vật liệu và thực vật dùng instancing.

Game ninja 3D góc nhìn thứ nhất, kết ấn bằng hai tay và quyết đấu với đối thủ máy. Bản 0.3 thay sân tập bia bằng trận đấu có sinh lực, chakra, phòng ngự và phản đòn.

## Tu luyện theo hệ và thuộc tính chung

Mỗi hệ có kinh nghiệm riêng, khai mở ở cấp 1 và tối đa cấp 10. Hệ của thuật được chọn ở trưởng làng là hệ khởi đầu. **Kinh nghiệm giao chiến dựa vào hệ của đối thủ**: dùng chiêu Thủy hay phi tiêu đánh ninja Hỏa đều tăng Hỏa; thi triển chiêu không tự cho kinh nghiệm. Trong trận ba ninja, sát thương tính riêng theo từng người và thưởng thắng trận chia cho cả Hỏa, Thủy, Lôi. Khám phá và bài học từ cao nhân vẫn có phần kinh nghiệm riêng. Một lần tăng cấp không tự trao kỹ năng.

Điểm nhận tại các cấp **1 → 10** lần lượt là **1, 1, 1, 1, 2, 2, 2, 3, 3, 4**, tổng 20 điểm mỗi hệ. Điểm từ mọi hệ gom vào **một quỹ chung**. Nhân vật chỉ có một bộ thuộc tính áp dụng cho tất cả chiêu và mọi hệ:

| Thuộc tính chung | Mỗi lần nâng | Công thức |
| --- | --- | --- |
| Sinh lực | +20 máu | 200 + 20 × số lần nâng |
| Sức mạnh | +1% sát thương gốc | Sát thương gốc × (1 + sức mạnh/100) |
| Mana | +1% chakra gốc | 100 + mana |

Các phần trăm cộng theo **chỉ số gốc**, không nhân lũy tiến. Ví dụ 10 sức mạnh cho phi tiêu 4,4 và phi tiêu nước 11; 10 mana cho tối đa 110 chakra. Giao diện **C / Tu luyện** hiển thị cấp, kinh nghiệm, điều kiện từng chiêu, sách và ba nút nâng thuộc tính. Chiêu yêu cầu từ cấp 1–5; đạt cấp 5 của một hệ là đủ điều kiện học toàn bộ thuật của hệ đó, nhưng vẫn phải được cao nhân dạy hoặc dùng sách. Cấp 6–10 tiếp tục cho điểm thuộc tính.

## Chơi ngay

Mở **index.html** bằng Chrome hoặc Edge hỗ trợ WebGL 2. Game đã được đóng gói để chơi ngoại tuyến, không cần CDN, Node.js hoặc Internet. Giữ index.html, style.css, game-core.js, game.js và ket_an.jpg cùng thư mục.

Nếu có Node.js, chạy **npm start** rồi mở http://127.0.0.1:4173.

## Quyển trục trước trận

Có **9 hệ, 45 chiêu**: Hỏa, Thủy, Lôi, Phong, Thổ, Quang, Ám, Mộc và Băng. Quyển trục lọc theo hệ và **Tất cả chiêu / Đã học / Chưa học**. Hành trình mới chỉ cho trang bị chiêu đã học từ một thuật Thủy ban đầu; bài học/bí thuật lưu cùng hành trình. Luyện tập giữ bộ sưu tập riêng trong `anhoa-learned-spells-v1` (mặc định đủ 45 chiêu), và bộ mang theo riêng. Bỏ chiêu không làm mất trạng thái học.

- Mang **từ 1 đến tối đa 5 chiêu**, có thể mang toàn chiêu phòng ngự.
- Bấm thẻ chiêu để chọn/bỏ; nút **Bỏ hết** ở cột bộ chiêu xóa toàn bộ lựa chọn.
- Khi lọc một hệ cụ thể, nút **Chọn hết** cạnh **Chưa học** thay toàn bộ bộ đang mang bằng 5 chiêu của hệ đó; ở **Tất cả** nút này được ẩn.
- Thẻ chiêu giữ loại, chakra và **Hồi chiêu**, bỏ nhãn cấp và số ấn; chuỗi phím vẫn hiển thị để tra cứu.
- Chỉ các chiêu mang theo mới nhận chuỗi ấn và thi triển được trong trận.
- Bộ chiêu được lưu trên trình duyệt khi có localStorage. Mỗi trận tiếp theo đều quay lại quyển trục để thay bộ chiêu.

## Chiêu thức và trận đấu

Tốc độ bay của Hỏa và Thủy dùng chung hai mốc với Phong: **Hỏa liên đạn, Thủy ngục và Phong nhận: 29 m/giây**; **Rồng lửa, Thiên thạch, Ném thuyền, Sóng thần và Phong lốc: 22 m/giây**. Các mốc nằm ở `flightSpeeds` trong `game-core.js`. Thiên thạch tính thời gian tới đích từ quãng đường và tốc độ; các nhịp giữ đạn, triệu hồi, dựng sóng và camera vẫn giữ nguyên.

Các mốc trên là tốc độ gốc. Mọi chiêu có vật thể bay dùng nhịp **2 m đầu ở 20% tốc độ gốc, sau đó bứt tốc lên 180% trong 0,12 giây**: nhóm 29 m/giây đạt 52,2 m/giây, nhóm 22 m/giây đạt 39,6 m/giây. Khi vượt 2 m, vòng áp lực bung tại điểm tăng tốc, các tia xé gió tỏa ra và vệt khí trắng pha màu nguyên tố kéo theo chiêu; camera giật nhẹ một nhịp khi người chơi tăng tốc chiêu. Hiệu ứng dùng lại bộ mesh giới hạn, hỗ trợ đồ họa thấp và giảm chuyển động. Mỗi viên đạn/lá bay có đồng hồ riêng; thời gian tụ chiêu không tính vào đoạn này. Nhịp được giữ khi phản đòn, dừng khi tạm dừng và vẫn chịu vùng làm chậm. Tham số nằm trong `FLIGHT_PROFILE` ở `src/projectile-motion.js`. Laser, sét đánh tức thời, hiệu ứng tại chỗ và phi tiêu giữ cơ chế riêng. Chạy `npm run test:flight` để kiểm tra khoảng bay, tăng tốc, hiệu ứng, va chạm, phản đòn và các hệ có vật thể bay.

Mỗi chiêu có hồi chiêu riêng theo cấp: **D 3 giây, C 4 giây, B 6 giây, A 8 giây, S 11 giây, SS 15 giây**; riêng **Ảnh phân thân hồi 2 giây**, áp dụng cả triệu hồi và nâng cấp. Thời gian còn lại hiện trên quyển trục trong trận; vẫn có nhịp nghỉ chung 1 giây giữa hai lần thi triển thuật. Chakra hồi **5 điểm/giây**. Các chiêu giới hạn một lần mỗi trận vẫn giữ giới hạn đó.

Nhấn **SPACE** khi chưa kết đủ chuỗi ấn hợp lệ sẽ ném một phi tiêu nhỏ bốn cánh xoay theo hướng ngắm: **6 sát thương, không tốn chakra**, cách mỗi lần ném ít nhất **0,45 giây**. Ném phi tiêu xóa chuỗi ấn đang dở. Chuỗi đã hoàn chỉnh nhưng thiếu chakra, chưa đủ điều kiện hoặc còn hồi chiêu sẽ được giữ lại.

Giáp bao thân và các mặt chắn đều có độ bền. Đòn mạnh hơn độ bền còn lại sẽ phá lớp chắn và tiếp tục với sát thương dư; ví dụ 100 sát thương gặp mặt chắn còn 30 độ bền thì còn 70 sát thương để đi tiếp. Từng lớp chắn trừ sát thương riêng, theo thứ tự trên đường bay, áp dụng cả thuyền và laser bảy màu. Quang kính có 120 độ bền: phản đòn khi còn chịu được, vỡ khi quá tải.

**Sóng thần** cuốn các chiêu, mặt chắn, giáp đối thủ, gương và tinh linh nằm trong thể tích sóng, tiếp tục gây 36 sát thương một lần và không bị phản lại. Phân thân Ám không bị phá hủy: sóng cuốn cả đàn nằm trong thể tích sóng về phía sau đối thủ của người thi triển, cách 4 m theo hướng sóng, giữ độ lệch ngang của từng con. Khi bị cuốn, phân thân tạm ngừng tấn công/nhận lệnh; khi dạt tới đích sẽ đứng chờ và có thể nhận lệnh mới. Vị trí mới cũng là nơi trồi lên lại trong lãnh địa. Tuyết tích lũy, quả cầu Tuyết Táng và các cây sống của vườn Mộc được giữ nguyên; tường băng và quả óc chó đang chắn đòn vẫn bị cuốn.

Mỗi lần kết ấn, bóng tương ứng xuất hiện phía sau hai tay với độ đậm **55%** và ẩn sau **0,2 giây**.
Ấn **F — Đối quyền**: co cả bốn ngón, ôm ngón cái ngoài nắm tay rồi đưa hai nắm đấm chạm khớp ngón ở giữa.
Ấn mới thay bóng cũ và bắt đầu lại thời gian hiển thị. Bảng ghép 12 ấn với ảnh bóng
nằm trong [assets/seal-shadows.md](assets/seal-shadows.md). Khi nút **SPACE** sẵn sàng
cho chiêu Hỏa, tay được bao quanh bởi vầng lửa và tàn lửa chuyển động; vầng lửa tắt
khi tung chiêu, xóa chuỗi, tạm dừng hoặc chưa đủ chakra/hồi chiêu.
Chiêu Thủy sẵn sàng tạo vòng nước xanh quanh hai tay, có dòng nước và giọt nước xoay theo vòng; vòng nước dùng cùng điều kiện sẵn sàng và được tắt khi thi triển, xóa chuỗi, tạm dừng hoặc thiếu chakra/hồi chiêu.
Phong, Ám và Quang cũng có vòng thuộc tính riêng quanh hai tay khi chiêu sẵn sàng: Phong là một vòng xanh ngọc mảnh, sáng nhẹ theo dòng gió; Ám là vòng tím đen với viền tím mảnh; Quang là vòng trắng vàng với tia và hạt sáng hình thoi. Thủy bộc cầu đặt bong bóng cố định quanh vị trí mục tiêu khi thi triển; đối thủ có thể di chuyển ra khỏi vùng nổ. AI dùng cùng cơ chế. Các trạng thái dừng khi tạm dừng và xóa khi đấu lại; đòn bị chắn hết, phản lại hoặc gặp miễn nhiễm không tích tầng.

Vòng Phong và Ám thu gọn thành quầng thấp phía sau lòng bàn tay, giới hạn độ rộng, giảm hạt sáng và bỏ các dải xoay lớn bên ngoài. Vòng theo vị trí tay và chỉ sáng khi Space dùng được, gồm cả điều kiện lãnh địa, phân thân, hất tung. Các vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi, thiếu chakra, hồi chiêu hoặc tạm dừng; hỗ trợ đồ họa thấp và giảm chuyển động.

Tay được dựng trong Blender dựa trên mesh 3D `anime_style_hand.glb` do người dùng cung cấp. Giữ cấu trúc lòng bàn tay cong, kẽ ngón và khối cơ gốc ngón cái của mẫu; dựng lại đầu ngón bằng các tiết diện tròn thuôn, đóng cổ tay và dùng subdivision để nối mượt. Các phần móng dài của mẫu được thay bằng móng riêng nhỏ, mỏng và ôm theo bề mặt. Model được gắn 16 xương theo tỷ lệ mới, với trọng số chuyển tiếp mượt và giữ 12 thế kết ấn. Vị trí FPS, giáp xanh đen, vòng vàng và ánh sáng/vật liệu hiện tại được giữ nguyên.

Hình khối được kiểm tra riêng bằng vật liệu xám trung tính ở chính diện, nghiêng 45° và nhìn ngang trước khi áp màu. Trong game, da/móng dùng cel shading nhẹ dựa trên normal của mesh với bốn mức sáng; giáp giữ bảng màu cũ. Viền da rộng 0,35 pixel, móng 0,18 pixel và giáp 0,40 pixel theo kích thước màn hình. Tay được vẽ sau bước chuyển màu của cảnh; vòng Hỏa–Thủy–Lôi vẫn đi qua bloom. Ánh sáng chạng vạng của môi trường được giữ nguyên. Model được xuất sẵn thành GLB và nhúng trong game để chơi ngoại tuyến.

Phong cảnh dùng ánh sáng chạng vạng, bầu trời và sương tối hơn để chiêu thức nổi bật.

Hiệu ứng Hỏa–Thủy–Lôi–Phong–Ám dùng mảng màu cel rõ: lửa có lõi vàng và vùng cam/đỏ, nước có dòng chảy và bọt lớn, Lôi điểu có thân tím rõ với lõi sét trắng mảnh, phân thân và đầm mực dùng các vùng tím đen thay bề mặt bóng. Thuyền Thủy có buồm và cờ rách nhẹ, lỗ thủng thật, miếng vá có đường khâu, ván boong sửa và lan can sứt. Các thay đổi đồ họa giữ thời điểm thi triển, góc nhìn, sát thương và ánh sáng chạng vạng.

Hệ Hỏa có hiệu ứng và cơ chế riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Hỏa liên đạn | 4 | Q W D F | 40 | Ba hỏa cầu nhỏ xếp ngang phía trên tay, giữ 0,5 giây rồi phóng lần lượt cách nhau 0,1 giây tới điểm ngắm đã chọn; mỗi viên 11 sát thương gốc (tổng 33), mỗi viên gây sát thương tích một tầng bỏng |
| Rồng lửa | 6 | Q W C V Z X | 56 | Rồng cuộn thành vòng lửa trước mặt trong 1,1 giây rồi lao tới; camera chuyển lên trên bên trái và trở lại sau cú đánh, 104 sát thương |
| Thiên thạch | 8 | Q W C V Z X E R | 82 | Bay một đường thẳng từ trời tới đất trong 3,4 giây; camera ngước lên, zoom in trong 0,24 giây rồi zoom out dần trong cảnh trời 1,4 giây, trở về trong 0,4 giây; 150 sát thương trong bán kính 5,5 m |
| Phóng hỏa | 3 | Q W A | 26 | Tiêu thụ 1–5 tầng bỏng trên đối thủ, gây ngay 10 / 20 / 30 / 45 / 60 sát thương; lửa bùng lớn theo số tầng |
| Tường lửa | 5 | Q W Z X C | 36 | Tường rộng 7 m, cao 4,2 m, dựng cách 3 m phía trước; 120 độ bền, tồn tại 5 giây |

Tường đứng yên khi người chơi né, chặn đạn đối phương đi xuyên qua mặt tường và có thể tồn tại cùng khiên. Dựng tường mới thay tường cũ của người thi triển. Thiên thạch xuyên một tầng mây bị đẩy tách ra, có dấu báo vùng rơi và đuôi lửa. Khi chạm đất, đá lớn nhỏ bật tung theo quỹ đạo, bụi đất lan ra, tia lửa bắn lên và vết nứt nóng sáng xuất hiện quanh tâm nổ; có thể né khỏi vùng nổ, nhưng không phản được thiên thạch. Nhắm ngang sẽ thả ở khoảng cách 31 m; nhắm xuống sẽ chọn điểm trên mặt đất (6–55 m). Camera giữ hướng ngắm gốc khi trở về; đối thủ thi triển không đổi camera của người chơi. Các ID chiêu Hỏa cũ được giữ để bộ chiêu đã lưu vẫn dùng được.

Camera giật nhẹ và zoom out khi phóng liên đạn; zoom in lúc tích lực rồng rồi giật khi phóng và trúng mục tiêu. Thiên thạch chạm đất gây rung và zoom out theo khoảng cách tới vụ nổ. Khiên, tường, phản đòn và trúng đạn có nhịp rung riêng; hướng ngắm được giữ nguyên. Hiệu ứng dừng khi tạm dừng, được xóa khi bắt đầu lại và tắt rung/zoom nếu trình duyệt yêu cầu giảm chuyển động.

Các đòn Hỏa gây sát thương lên máu tích **bỏng tối đa 5 tầng**, số đỏ và lửa quanh người. Mỗi tầng có thời hạn riêng 10 giây; ở mức tối đa, đòn mới thay tầng cũ nhất. Bỏng chưa kích hoạt không tự gây thêm sát thương. Phóng hỏa tiêu thụ tầng và gây sát thương một lần theo bảng trên, không tự tích lại bỏng.

Hệ Thủy có năm chiêu riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Thủy ngục | 5 | W E Z X C | 38 | 14,4 sát thương; khi xuyên khiên, giam đối thủ trong cầu nước 3 giây, ngắt chuỗi ấn và khóa di chuyển/thi triển |
| Ném thuyền | 6 | W E C V Z X | 56 | Thuyền hải tặc trồi từ dưới đất lên trong 1,2 giây, rồi bay thẳng tới điểm ngắm đã chọn; camera chuyển lên trên như Rồng lửa và trở lại sau cú đánh; 108 sát thương trong bán kính 3,5 m và choáng 1 giây nếu gây sát thương |
| Sóng thần | 8 | W E C V Z X E R | 72 | Camera nhìn xuống chân, nước tụ và dựng thành sóng trong 1,8 giây rồi trả hướng ngắm; sóng rộng 12 m, cao 5 m, dày khoảng 7 m, có ngọn cuộn, bọt và nước bắn; cuốn đạn/mặt chắn, gây 36 sát thương một lần |
| Thủy bộc cầu | 3 | W E A | 26 | Tạo 4 bong bóng quanh mục tiêu; nổ lần lượt ở giây 1–2–3–4, mỗi quả gây 10 sát thương gốc trong bán kính 2,8 m. Hồi 6 giây; không tương tác với Sóng thần |
| Thủy thuẫn | 4 | W E D F | 32 | Mặt chắn nước hình tròn bán kính 2,2 m, dựng cách 3 m phía trước; 95 độ bền, tồn tại 5 giây |

Thủy thuẫn đứng tại vị trí thi triển, chặn chiêu bay qua mặt chắn, không phản đòn và có thể tồn tại cùng Thủy bộc cầu. Sóng thần cuốn đạn khi chúng thực sự đi qua thể tích sóng; chiêu bay cao hơn hoặc ngoài bề rộng sóng vẫn đi tiếp. Bong bóng đứng riêng và chỉ nổ theo bộ đếm của từng quả; Sóng thần không kích nổ, cuốn đi hay cường hóa chúng. Thuyền, sóng thần và vụ nổ bong bóng không bị phản đòn; khiên cá nhân và giáp kháng Thủy vẫn giảm sát thương nổ. Giữ các ID Thủy cũ để bộ chiêu đã lưu vẫn dùng được. Thủy ngục, sóng và bong bóng đều dừng thời gian khi tạm dừng, được xóa khi đấu lại.

Đòn Lôi gây sát thương lên máu tích **tĩnh điện tối đa 3 điểm**, số xanh tím trên đầu và tia điện quanh người. Mỗi điểm tĩnh điện tồn tại riêng 10 giây; đủ 3 điểm thì đòn mới thay điểm cũ nhất. Điện giật chỉ tiêu thụ các điểm còn hiệu lực. Hết choáng do Điện giật, từ tính bắt đầu đếm thời gian: Lôi thương và Lôi điểu liên tục hướng tới vị trí thật hiện tại của đối thủ, kể cả khi né; Thiên lôi cũng theo vị trí mục tiêu trước khi đánh. Hết từ tính, chiêu đang bay tiếp tục hướng cuối. Phản đòn đổi người sở hữu nên chọn lại mục tiêu từ tính theo bên mới.

Hệ Lôi có năm chiêu với hiệu ứng điện riêng:

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Lôi thương | 4 | E R D F | 40 | Thương sét dài và nhanh, 62 sát thương |
| Lôi điểu | 6 | E R C V Z X | 56 | Cầu sét tụ trước mặt, chim hiện ra và dang cánh trong 1,1 giây rồi lao tới; camera chuyển lên cao như Rồng lửa, 102 sát thương |
| Thiên lôi | 8 | E R C V Z X E R | 82 | Ngước nhìn mây chớp điện 1,4 giây, trả góc nhìn trong 0,4 giây rồi sét đánh xuống điểm ngắm, 150 sát thương trong bán kính 4,5 m |
| Điện giật | 3 | E R A | 26 | Tiêu thụ 1–3 tĩnh điện; choáng 0,5 / 1 / 2 giây, hết choáng bắt đầu từ tính 3 / 5 / 7 giây |
| Lôi trận | 5 | E R Z X C | 36 | Vùng điện bán kính 9 m, cao 8 m, tồn tại 5 giây; đạn đối phương còn 15% tốc độ trong vùng |

Thiên lôi ngước camera lên đám mây chớp điện, trả về góc ngắm ban đầu trước khi tia sét đánh xuống; chiêu của máy không điều khiển camera người chơi. Vòng báo trên đất cho phép né trước khi sét đánh; sét không bị phản đòn. Lôi trận đứng tại vị trí thi triển, giữ nguyên sát thương và vận tốc gốc của đạn: đạn rời vùng sẽ nhanh trở lại, đạn cùng bên không bị làm chậm, vùng chồng nhau không nhân độ chậm. Thi triển lại thay vùng cũ của cùng người chơi. Tĩnh điện, từ tính và trận có thể tồn tại cùng nhau; hiệu ứng, thời gian và camera dừng khi tạm dừng, được xóa khi đấu lại. Giữ các ID Lôi cũ để bộ chiêu đã lưu vẫn dùng được.

Kết đủ ấn và sẵn sàng thi triển bất kỳ chiêu Lôi nào sẽ hiện vòng sét tím trắng cùng tia điện chạy quanh tay. Vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng, đang hồi chiêu hoặc thiếu chakra; khi đủ điều kiện, vòng hiện lại như Hỏa và Thủy. Chế độ giảm chuyển động làm điện và tia sáng chuyển động chậm hơn.

Kết đủ ấn và sẵn sàng thi triển bất kỳ chiêu Lôi nào sẽ hiện vòng sét tím trắng cùng tia điện chạy quanh tay. Vòng tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng, đang hồi chiêu hoặc thiếu chakra; khi đủ điều kiện, vòng hiện lại như Hỏa và Thủy. Chế độ giảm chuyển động làm điện và tia sáng chuyển động chậm hơn.

### Phong thuật

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Phong nhận | 2 | R A | 24 | Phóng nhát chém gió lưỡi liềm, 36 sát thương |
| Phong liên trảm | 3 | R A D | 22 | Chỉ nối khi đối thủ đang bị lốc của mình hất tung; 8 nhát chém trong 2 giây, tổng 70 sát thương và giữ trên không thêm 2 giây |
| Phong bích | 4 | R A Z X | 32 | Tường gió trước mặt rộng 7 m, cao 5 m, 110 độ bền, tồn tại 5 giây |
| Phong lốc | 6 | R A C V Z X | 46 | Lốc xoáy 3D lao tới, 70 sát thương và hất tung/khóa thao tác 2 giây |
| Tiên linh gió | 8 | R A C V Z X E R | 70 | Tinh linh toon xuất hiện trước mặt; giữ góc nhìn FPS, thổi gió trong 5 giây |

Phong có đúng năm chiêu, giữ các ID đã lưu. Lốc nâng mô hình đối thủ và góc nhìn của người bị trúng lên thật khỏi mặt đất. Trong cửa sổ 2 giây, người tung lốc có thể kết **R A D → SPACE** để nối liên trảm đúng mục tiêu đó, một lần mỗi lốc; thời gian giữ trên không được cộng thêm 2 giây vào thời gian còn lại. Liên trảm không dùng độc lập hoặc nối lốc của bên kia, không trừ chakra/xóa ấn khi điều kiện không còn hợp lệ. Lốc bị khiên hấp thụ hoàn toàn hoặc đánh trượt không hất tung; có thể né hoặc dùng độn thổ để tránh. Hất tung cộng với các trạng thái khống chế khác mà không xóa chúng.

Tinh linh nhỏ xinh dạng tiên bướm, hai đôi cánh 3D tròn mềm, râu bướm, ánh xanh lá nhẹ và đốm sáng bay quanh; vật liệu cel với viền rất mảnh xuất hiện trong 1,8 giây, sau đó thổi gió và bảo vệ trong 5 giây. Tinh linh xuất hiện trước mặt ở tầm mắt, lệch nhẹ khỏi đường ngắm, chào người triệu hồi rồi quay về phía đối thủ. Camera giữ FPS trong toàn bộ quá trình; vẫn kết ấn, ngắm và né bình thường. Mã camera nhìn thẳng xuống 90°, mô hình người chơi 3D và mũi tên hướng ngắm vẫn được giữ, mặc định tắt; kiểm tra bằng `test:wind-camera` có thể bật riêng qua hook test `setWindCameraEnabled(true)`. Tinh linh đi theo người triệu hồi, hướng gió theo hướng ngắm hiện tại; bảo vệ vùng trước mặt rộng 8 m, sâu 10 m, cao 10 m. Chiêu đang bay vào vùng từ phía trước bị thổi ngược về đối thủ, giữ sát thương và tốc độ; phản liên tục nhiều chiêu, gồm cả thuyền đang di chuyển. Sóng thần cuốn tinh linh thay vì bị phản. Đòn từ bên hông, phía sau, sét đánh thẳng từ trên trời, hoặc chiêu chưa hình thành/bắt đầu bay không bị phản. Phản bởi gió không phụ thuộc thuộc tính phản khiên thông thường; chiêu qua hai tinh linh đối nghịch vẫn có thời gian sống hữu hạn. Tường gió đứng ở vị trí thi triển, có thể tồn tại cùng tinh linh; thi triển lại thay tường/tinh linh cũ của cùng bên. Hoạt ảnh, combo, thời gian bảo vệ và camera đều dừng khi tạm dừng, xóa khi đấu lại. Đồ họa thấp giữ toàn bộ cơ chế.

### Ám thuật và Hắc lãnh địa

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Hắc lãnh địa | 8 | D F C V Z X E R | 70 | Mở mắt thấy mái vòm đen 3D trước mặt, rồi mực lan ra thành lãnh địa; tồn tại 30 giây sau khi mở xong |
| Ảnh phân thân | 3 | D F A | 26 | Thêm một chó bóng; đủ 3 bóng thì mỗi lần thi triển nâng một chó thành bò bóng, giữ nửa sân và ánh đỏ |
| Ảnh tập kích | 2 | D F | 34 | Ra lệnh cho phân thân lao tới điểm ngắm; chó đánh 38, bò đánh 57 sát thương rồi biến mất |
| Ảnh tượng | 6 | D F C V Z X | 56 | Voi bóng 3D rơi từ trên xuống trong 0,7 giây, gây 90 sát thương khi đáp và nhấn chìm, khóa thao tác 2 giây |
| Ảnh độn | 5 | D F Z X C | 32 | Lặn dưới đất 3 giây, miễn nhiễm mọi đòn tấn công; nhìn ra qua lớp bóng đen mờ, vẫn ngắm, né, kết ấn và thi triển |

Ám có đúng năm chiêu. Phân thân và lệnh tấn công dùng được ngoài lãnh địa. Phân thân đứng nguyên hàng cho đến khi nhận lệnh; lệnh chọn điểm ngắm cố định, có thể đánh trượt nếu đối thủ né. Phân thân không bị chiêu thức đối thủ phá hủy, kể cả đạn, laser, nổ lan và sóng thần. Phân thân chỉ biến mất sau khi tự tấn công (kể cả đánh trượt): ngoài lãnh địa không hồi lại; trong lãnh địa chờ 0,7 giây rồi trồi lên từ vị trí đứng ban đầu. Mỗi lần triệu hồi thêm một phân thân, giữ nguyên các phân thân đã tạo; mỗi bên có giới hạn riêng 3 con. Hàng phân thân nằm ở một phần tư khoảng cách từ bên triệu hồi tới đối thủ, thuộc nửa sân của mình. Phân thân đang chờ hồi vẫn giữ chỗ. Khi đủ 3 bóng, thi triển Ảnh phân thân thêm lần nữa sẽ nâng đúng một chó thành bò bóng, theo thứ tự được tạo; mỗi lần vẫn tốn 26 chakra, bò gây 57 sát thương (38 × 1,5). Không tăng số lượng, không đổi vị trí/lệnh đang nhận. Bò có thân lớn, sừng và móng guốc; vẫn không cản đạn. Nâng được cả bóng đang chờ trồi lại trong lãnh địa; khi hồi lại vẫn là bò và giữ sát thương 57. Khi cả ba đã là bò, thi triển thêm không trừ chakra hoặc xóa chuỗi ấn. Nếu mất một con ngoài lãnh địa, lần thi triển sau tạo chó mới vào chỗ trống trước. Đạn xuyên qua mọi phân thân trên đường bay, giữ nguyên phân thân, sát thương và tốc độ. Ảnh phân thân có hồi chiêu riêng 2 giây. Sóng thần cuốn các phân thân còn hiện diện ra sau đối thủ theo hướng sóng, giữ nguyên dạng chó/bò và sát thương. Ra lệnh khi chưa có phân thân không trừ chakra hoặc xóa chuỗi ấn.

Chỉ Ảnh tượng và Ảnh độn cần lãnh địa đã mở. Ảnh tượng rơi xuống điểm ngắm cố định: đối thủ có thể né trong lúc voi đang rơi. Khi đáp trúng, voi gây 90 sát thương trực tiếp một lần, nhấn đối thủ xuống nền bóng và khóa ngắm, né, kết ấn, thi triển trong 2 giây; sau đó đối thủ nổi lại. Voi có thân, bốn chân, tai, vòi và ngà 3D theo phong cách toon của các thú bóng. Ảnh độn chặn cả đạn, vụ nổ, Thủy ngục, Thiên lôi và Ảnh tượng, không tiêu hao khiên hoặc phản đòn. Ảnh độn hạ mắt nhìn xuống dưới mặt đất, lớp mực phía trên chuyển thành màn đen bán trong suốt để thấy đối thủ và chiêu thức ngoài sân. Sau 3 giây nổi lại trong 0,35 giây. Hướng ngắm, kết ấn và thi triển vẫn hoạt động; khi đang lặn, chiêu có camera điện ảnh vẫn thi triển nhưng giữ góc nhìn dưới đất. Ảnh tượng giữ góc nhìn FPS khi khóa thao tác.

Lãnh địa dùng được cho cả hai bên. Mở mắt vẫn thấy sân đấu và một mái vòm đen 3D trước mặt. Mái vòm bán cầu nở rộng, mực phủ dần đường, núi và bầu trời. Khi mở xong, lãnh địa bắt đầu tính 30 giây. Thi triển lại làm mới thời gian; hết hạn trả cảnh cũ, kết thúc kéo/lặn và khả năng hồi phân thân, nhưng các phân thân còn sống vẫn đứng chờ ngoài lãnh địa. Tạm dừng đóng băng tất cả hiệu ứng và đồng hồ; đấu lại hoặc về chọn chiêu xóa phân thân, kéo, lặn và khôi phục cảnh. Máy hệ Ám mở lãnh địa, tạo phân thân rồi phát lệnh tấn công.

### Thổ thuật

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Thổ Thứ | 2 | A S | 24 | Chạy ngầm với vệt nứt, đất nhô nhẹ và vụn đá dạt sang hai bên theo đường đi; tới đối thủ mới bật cụm gai gây 40 sát thương; để lại gờ đá 3 giây |
| Địa Ngục Chông | 4 | A S D F | 34 | Phủ chông trong hố Địa Bộc Thiên Tinh của chính bạn; gây 50 sát thương một lần khi địch rơi xuống hoặc bước vào; chông biến mất cùng hố |
| Sơn Hà Đảo Chuyển | 6 | A S C V Z X | 56 | Địa hình nâng/hạ theo 5 đợt trong 5 giây, mỗi đợt 30 sát thương; còn mô đất và hõm sâu thêm 5 giây |
| Thổ Bích | 5 | A S Z X C | 32 | Tường đá cong trước mặt, cao 3,2 m, 180 độ bền chung, tồn tại 6 giây; chặn đạn, laser và đường đi; có thể đi vòng |
| Địa Bộc Thiên Tinh | 8 | A S C V Z X E R | 82 | Ném cầu và nứt đất trong 1 giây; nâng mảng trung tâm trước, đá ngoài bay theo đợt 5 viên cách nhau 0,2 giây, tăng tốc khi gần quả cầu; giam 3 giây gây 80 sát thương, rơi trong 0,65 giây gây 100; hố biến mất 1,5 giây sau cú rơi |

Địa hình thay đổi thật: mặt đất, đường lát đá, cỏ, hoa và đá nhỏ biến dạng theo vùng chiêu; độ cao nhân vật, camera và tốc độ né cùng dùng bề mặt đó. Đòn bay và laser bị địa hình nhô cao chặn. Hết hạn hoặc đấu lại trả bề mặt về trạng thái ban đầu. Vật thể chỉ xuất hiện khi thi triển thành công, không có mô hình xem trước lúc kết ấn.

Địa Bộc Thiên Tinh ném lõi đen theo cung từ tay lên trên vị trí đã ngắm. Khi cầu tới nơi, các vết nứt tỏa ra mặt đất; mảng đất trung tâm nhấc mục tiêu lên trước, rồi các mảnh xung quanh tách khỏi mặt đất và gom thành khối cầu. Đá ngoài được chia thành 20 đợt, mỗi đợt 5 viên, bắt đầu cách nhau 0,2 giây. Mỗi viên tăng tốc liên tục khi bay về quả cầu (vận tốc đầu 10 m/s, gia tốc 42 m/s²), vẫn giữ đường cong và độ xoay riêng để các đợt bay lên từ nhiều hướng. Khối cầu chỉ hoàn thành khi đợt cuối cùng đã tới nơi. Có thể né khỏi vùng hút bán kính 5,5 m trong giây đầu. Người bị bắt bị khóa di chuyển/kết ấn cho tới khi rơi xuống; khiên vẫn hấp thụ sát thương, miễn nhiễm ngăn bắt. Camera theo cầu, hạ xuống vùng đất nứt rồi theo khối đất nâng lên trước khi trở về hướng ngắm. Hố có bán kính 6,5 m, được lấp lại trong 1,5 giây kể từ cú rơi; chông trong hố hết hạn cùng lúc. Các chiêu dùng được cho cả hai bên, gồm AI; tạm dừng đóng băng hiệu ứng, hỗ trợ đồ họa thấp và giảm chuyển động.

Hố bắt đầu dùng được cho Địa Ngục Chông khi đất đá đã gom xong. Có thể đặt chông khi địch còn bị giam để đón cú rơi. Không có hố của mình thì chiêu 4 ấn bị khóa và không tốn chakra. Thổ Thứ chạy ngầm theo hướng đã ngắm, không tự đuổi theo địch né sang bên.

Kết đủ ấn của một chiêu Thổ có thể thi triển sẽ hiện vòng nâu quanh tay, kèm đá vụn nổi và bụi bay. Vòng tắt khi thi triển, xóa/sai/hết hạn chuỗi, tạm dừng hoặc chưa đủ chakra/điều kiện của chiêu.

Giữ năm ID Thổ cũ cho bộ chiêu đã lưu. `earth-lance` nay là Địa Ngục Chông; `earth-reflect` là Địa Bộc Thiên Tinh (chiêu công), còn `earth-barrier` là tường địa hình.

### Quang thuật

Ánh sáng chủ đạo là **trắng và vàng**. Chỉ laser xuyên qua cầu thủy tinh mới chuyển thành đủ **7 sắc cầu vồng**.

Cầu thủy tinh, mái vòm và gương **chỉ xuất hiện sau khi bấm SPACE và thi triển thành công**. Chọn chiêu hoặc kết đủ ấn không dựng mô hình xem trước; kết ấn chiêu khác không tạo thêm vật thể.

| Chiêu | Số ấn | Chuỗi phím | Chakra | Tác dụng |
| --- | --- | --- | --- | --- |
| Quang laser | 2 | S D | 24 | Một tia thẳng trắng–vàng, 40 sát thương; tích sáng 0,08 giây |
| Cầu thủy tinh | 6 | S D C V Z X | 32 | Cầu trong suốt cách mặt 3 m, tồn tại 8 giây; laser xuyên qua thành 7 sắc và 70 sát thương |
| Mái vòm gương | 8 | S D C V Z X S D | 54 | 96 tấm gương rơi ghép vòm trong 1,2 giây; bán kính 6,2 m, đủ 3 nhịp né mỗi phía; giữ địch bên trong, vòm kín tồn tại 10 giây |
| Quang kính | 5 | S D Z X C | 28 | Gương cách mặt 2,4 m, tồn tại 2,5 giây; phản đòn bay tới từ phía trước, kể cả laser |
| Nấc thang của Jacob | 6 | S D Z X C V | 82 | Cột sáng giáng từ trời xuống điểm ngắm, 160 sát thương trong bán kính 3,5 m |

**Cầu thủy tinh:** laser phải thực sự xuyên qua cầu của bên thi triển mới được tăng 75% sát thương. Phần tia trước cầu vẫn trắng–vàng; từ cầu trở đi là bảy dải màu. Cầu giữ vị trí lúc tạo. Mỗi bên có một cầu; tạo lại thay cầu cũ.

**Mái vòm gương:** các tấm gương rơi từ trên cao, xoay và ghép lần lượt từ chân vòm lên đỉnh trong 1,2 giây. Vành chân đánh dấu vùng và chặn mục tiêu đi ra ngoài ngay khi bắt đầu dựng; phạm vi cho phép 3 nhịp né (5,4 m) về mỗi phía. Sau khi ghép kín mới bắt laser, rồi tồn tại đủ 10 giây. Bản thân vòm không gây sát thương. Bắn laser vào vòm kín của mình để giữ tia bên trong. Tia phản xạ theo các mặt gương và nền, liên tục nảy cho tới khi vòm biến mất. Mỗi tia bị giữ gây 20 sát thương mỗi giây, hoặc 35 nếu đã đi qua cầu thủy tinh. Màu và sức mạnh của tia đã giữ không mất khi cầu thủy tinh hết hạn. Các laser bắn thêm được giữ riêng và cộng dồn sát thương: hai tia thường gây 40/giây, hai tia 7 sắc gây 70/giây, một tia thường và một tia 7 sắc gây 55/giây. Mỗi bên chỉ có một mái vòm. Mục tiêu có thể di chuyển trong vòm nhưng không vượt qua thành; hết hạn hoặc thay vòm sẽ giải phóng đường đi. Tường nằm trước vòm chặn laser và ngăn kích hoạt.

**Quang kính:** gương đặt cố định theo hướng ngắm lúc tạo, rộng 2,2 m và cao 2,8 m. Các đòn bay tới từ phía trước và chạm mặt gương được phản lại theo góc tới, đổi bên gây sát thương; đạn đi ngoài gương hoặc từ sau lưng không bị phản. Gương không tiêu hao sau một lần phản, nhưng chỉ tồn tại 2,5 giây. Laser trực tiếp cũng bị gương phản. Các đòn giáng từ trời không bay qua gương trước mặt.

**Nấc thang của Jacob:** camera ngước lên vòng sáng trên trời trong 1,25 giây, sau đó lia xuống theo cột sáng đang giáng trong 0,55 giây. Cột chạm đất mới gây sát thương, rồi tan trong 1,1 giây. Trả lại hướng ngắm và góc nhìn ban đầu. Điểm rơi giữ nguyên khi đã thi triển nên có thể ngắm trượt hoặc né. Màu cột sáng là trắng với hào quang vàng.

Sát thương vẫn tôn trọng khiên và miễn nhiễm. Cả người chơi và AI dùng bộ chiêu mới. HUD hiển thị thời gian còn lại của cầu, gương và mái vòm. Tạm dừng đóng băng hiệu ứng và camera; đấu lại/về quyển trục xóa toàn bộ. Hỗ trợ đồ họa thấp và giảm chuyển động. Giữ năm ID chiêu cũ để bộ chiêu đã lưu vẫn dùng được, chuỗi ấn được đổi theo bảng trên.

**Mộc** có ba chiêu công, một chiêu thủ và một chiêu gieo hạt:

| Chiêu | Số ấn | Phím | Tác dụng |
| --- | --- | --- | --- |
| Độc Hoa | 3 | F Z C | Miệng hoa nhả khói tím thành vùng độc 6 giây; bán kính mỗi vùng tăng từ 2 lên 5 m theo cây; địch chỉ mất 5–15 máu/giây khi ở trong vùng |
| Dây Leo Trói Buộc | 4 | F Z D F | Dây leo bò từ vườn tới quấn đối thủ; 18–54 sát thương, trói 2–6 giây |
| Trúc Diệp Phi Vũ | 6 | F Z C V Z X | Mỗi bụi tre rung, mọc cành lá phát sáng trong 0,55 giây rồi phóng theo 1–3 đợt tới điểm ngắm; tổng 75–225 sát thương; lá phải bay tới mới gây sát thương và có thể bị né/chắn/phản |
| Óc Chó Hộ Vệ | 5 | F Z Z X C | Cây phía trước bên phải thả quả óc chó; quả rơi, hóa lớn và chắn phía trước trong 5–7 giây, độ bền 90–270 |
| Vườn Sinh Mệnh | 10 | F Z C V Z X E R Q W | Tự gieo 37 hạt: 12 hoa độc, 12 dây leo và 12 bụi tre bao quanh đối thủ, cả trước, sau và hai bên, 1 cây óc chó phía trước bên phải; không gây sát thương, một lần mỗi trận |

Hạt bay theo quỹ đạo từ người thi triển rồi đáp đất và nảy mầm. Bốn chiêu điều khiển cây chỉ mở sau khi rừng đã mọc. Cây trưởng thành hoàn toàn sau 60 giây kể từ khi thi triển và tồn tại đến hết trận, mọc quanh vị trí đối thủ lúc gieo hạt trong vùng rộng khoảng 20 m, có cây ở cả trước, sau và hai bên. Cây phía trước đối thủ, nằm giữa hai người, chỉ cao tối đa nửa chiều cao đối thủ, kể cả khi trưởng thành và lay động; cây ở nửa vùng phía sau giữ quy mô rừng lớn với nhiều chiều cao xen kẽ, kể cả giữa các cây cùng loại. Cây óc chó có 23 cụm tán lá nhỏ xếp thành nhiều tầng thay cho vài tán lớn. Các cây mọc rải rác với khoảng trống giữa các thân, không xếp thành hàng hoặc cột. Cây trưởng thành cao tới khoảng 5,9 m, giữ kích thước bằng 3/4 cổng cũ sau khi dọn map. Cây càng lớn thì vùng khói độc càng rộng, sát thương tăng, dây leo dày hơn và trói lâu hơn, tre phóng nhiều đợt lá lớn hơn, quả óc chó to và bền hơn. Sức mạnh được lấy tại lúc ra lệnh. Rừng không tự gây sát thương khi chưa ra lệnh tấn công. Khói tím phun từ miệng hoa, loang ra và ở lại quanh cây; sát thương dừng ngay khi đối thủ rời vùng, không đeo độc theo người. Các vùng khói của cùng một rừng không nhân sát thương khi chồng lên nhau; gọi lại Độc Hoa thay đợt khói cũ. Lá tre bay từ tán tre tới điểm ngắm lúc thi triển, không tự đuổi mục tiêu. Quả óc chó mất 1,05 giây để rơi và hóa lớn trước khi chặn đòn, đứng cố định phía trước tại vị trí thi triển, không cấp giáp bao thân và không đỡ đòn tới từ phía sau.

Kết đủ ấn và đủ điều kiện thi triển chiêu Mộc sẽ hiện vòng xanh với lá bay quanh tay. Vòng Băng có màu trắng xanh, kèm bông tuyết sáu cánh bay vòng. Hiệu ứng đi theo tay, tắt khi tung chiêu, xóa/sai/hết hạn chuỗi ấn, tạm dừng hoặc chưa đủ điều kiện; chế độ giảm chuyển động làm lá và tuyết bay chậm hơn.

**Băng** có ba chiêu câu giờ, một chiêu tạo tuyết và một chiêu kết thúc trận:

| Chiêu | Số ấn | Phím | Tác dụng |
| --- | --- | --- | --- |
| Tuyết Táng | 2 | Z X | Khóa đến khi tích đủ 90 tuyết; gom tuyết thành cầu khổng lồ tự tìm đối thủ |
| Băng Phược | 4 | Z X D F | Gom tuyết trong không khí 0,75 giây rồi bắn tinh thể; trúng địch thì đóng băng 3 giây, không gây sát thương |
| Huyễn Sương | 6 | Z X C V Z X | Sương mù 6 giây, ẩn người thật và tạo bản sao ở vị trí lệch |
| Băng Bích | 5 | Z X Z X C | 7 mảng tường băng mọc từ đất trong 0,82 giây, chắn đòn phía trước; 120 độ bền, tồn tại 5 giây |
| Băng Thiên Tuyết Địa | 10 | Z X C V Z X E R Q W | Tạo mưa tuyết dày dần, không gây sát thương, một lần mỗi trận |

Mưa tuyết tích 1 tuyết mỗi giây, tối đa 90. Băng Phược, Huyễn Sương và Băng Bích mỗi lần tốn 3 tuyết; cần gọi mưa tuyết và đủ dự trữ trước khi dùng. Không dùng chiêu hỗ trợ thì đủ tuyết sau 90 giây; mỗi lần dùng kéo dài thêm 3 giây. Dùng khi đã đầy làm lượng tuyết giảm còn 87 và khóa lại Tuyết Táng đến khi tích bù đủ. Tuyết và hiệu ứng trên sân giảm theo lượng còn lại; tạm dừng cũng dừng tích tuyết và cây lớn. Băng Phược gom các mảnh tuyết trong không khí về tinh thể trong 0,75 giây rồi mới bắn; chỉ đóng băng 3 giây khi chạm địch. Băng Bích dựng 7 mảng tinh thể trong suốt có cạnh sáng và vân nứt từ mặt đất lên trong 0,82 giây; tường đứng cố định phía trước, cao khoảng 3,9 m, rộng 5,9 m, 120 độ bền và tồn tại 5 giây, chắn đạn phía trước thay cho giáp bao người. Huyễn Sương phủ quanh vị trí thật và đi theo người dùng; từ bên trong, sương ở rìa tầm nhìn và để giữa màn hình trong để nhìn địch. Đối phương thấy sương dày che người thật và một bản sao lệch khoảng 4,3 m; AI ngắm bản sao thay vì vị trí thật. Tuyết Táng gom tuyết trong 2,2 giây: tuyết trên mặt đất và trong không khí cuốn về tâm, các cụm tuyết bay lên tăng tốc, lớp tuyết rút dần và quả cầu lớn dần tại chỗ. Cầu hoàn chỉnh mới bắt đầu lăn; không cần ngắm, tự đuổi đối thủ ở tốc độ 3,1 m/giây, xuyên tường, khiên, phản đòn và miễn nhiễm. Cầu nuốt đối thủ rồi lăn tiếp 2,8 giây để kết thúc trận thắng/thua thật. Toàn bộ tuyết của người thi triển được gom vào cầu. Đấu lại sẽ xóa cây, tuyết, ảo ảnh, khống chế, cầu tuyết và lượt dùng chiêu 10 ấn. AI Mộc/Băng mở trận bằng chiêu khởi tạo tương ứng; AI Băng câu giờ rồi dùng Tuyết Táng khi đủ tuyết.

Chuỗi của mỗi hệ bắt đầu bằng hai ấn nhận diện hệ. Nếu mang chiêu 2 ấn, có thể nhấn Space sau hai ấn để thi triển, hoặc tiếp tục kết ấn cho chiêu dài hơn. Hỏa, Thủy và Lôi không còn chiêu cầu 2 ấn; game không tự tung chiêu. Khi đang xem chiêu dài, quyển trục giữ công thức đó để theo dõi tiến trình. Rồng lửa có thể nối thêm **E R** thành Thiên thạch nếu mang cả hai chiêu.

Thi triển khiên bao thân mới thay thế khiên cũ. Đạn đã phản không được phản tiếp để tránh vòng lặp. Mỗi đạn có màu, ánh sáng và vệt theo hệ.

Hai bên có **1000 sinh lực** và **100 chakra**. Chakra hồi 5 mỗi giây; mỗi chiêu hồi riêng 2–15 giây (Ảnh phân thân 2 giây, các chiêu khác theo cấp), cách hai lần thi triển thuật ít nhất 1 giây. Kết đủ chuỗi 2–10 ấn của chiêu theo quyển trục rồi nhấn Space. Chuỗi phím kết ấn vẫn hiển thị trên thẻ chiêu. Nhập sai sẽ thử bắt đầu chuỗi mới từ phím vừa bấm; chuỗi hết hạn sau 7 giây không nhập ấn.

Quyển trục mang theo trong trận hiện đủ tên và phím kết ấn của cả 5 chiêu, không cần cuộn; trên màn hình nhỏ, bảng chiêu nằm phía dưới. Nhấn Space khi đủ ấn sẽ thi triển chiêu ngay, đồng thời đọc tên chiêu và trừ chakra. Có thể kết chuỗi tiếp theo khi giọng đọc vẫn đang chạy; khoảng cách giữa hai lần thi triển vẫn là 1 giây. Giọng đọc dùng tính năng tổng hợp tiếng nói của trình duyệt, ưu tiên giọng tiếng Việt trên máy. Tắt âm thanh, thiếu giọng đọc hoặc lỗi dịch vụ giọng nói không làm chậm chiêu. Tạm dừng cũng dừng giọng đọc; đấu lại hoặc về chọn chiêu sẽ hủy giọng đang đọc. Banner 12 hình kết ấn được ẩn.

Đối thủ đứng ở đầu sân bên kia, cách vị trí xuất phát của người chơi 31 m, sử dụng model tay có khớp và bộ 12 thế tay như người chơi. Máy kết từng ấn theo đúng độ dài của từng chiêu trước khi tung chiêu, ngắm vị trí của người chơi lúc phóng đạn, có chakra và có thể chọn phòng ngự khi bị tấn công. Thanh trên cùng cho biết máu, hệ, chakra và chiêu đang kết ấn. Qua mỗi trận, máy dùng tổ hợp hệ khác.

Tuyết Táng kết thúc trận khi chôn vùi và cuốn đối thủ đi. Với chiêu gây sát thương thông thường, trúng chiêu mất máu sau khi trừ khiên. Máu cơ bản là 200. Trong luyện tập, khi sinh lực chạm 0 thì hồi đầy để tiếp tục; trong hành trình, hết máu kết thúc trận và người chơi trở về điểm hồi sinh. Tạm dừng giữ nguyên máu, chakra, khiên, đạn, chuỗi ấn và tiến trình máy.

## Điều khiển

- **Q W E R A S D F Z X C V:** 12 ấn. Xem chuỗi phím trên quyển trục mang theo; banner hình ấn được ẩn.
- **Space:** thi triển chiêu đã kết đủ ấn; nếu chưa có chuỗi hoàn chỉnh, ném phi tiêu không tốn chakra. **Backspace:** xóa chuỗi.
- **Lia chuột:** xoay hướng ngắm. Con trỏ được khóa và thay bằng tâm ngắm chính giữa màn hình khi vào trận. Hướng bắn luôn đi qua tâm ngắm.
- **Click chuột trái:** né một bước 0,2 m trong 0,2 giây sang trái. **Click chuột phải:** né một bước 0,2 m trong 0,2 giây sang phải. Hướng né theo nút bấm, độc lập vị trí hoặc hướng lia chuột. Giữ nút không tự di chuyển tiếp; bấm thêm để né tiếp, trong giới hạn sân đấu.
- Không còn di chuyển tiến/lùi hoặc di chuyển bằng phím mũi tên. Q/W/A/S/D dành cho kết ấn.
- Trên màn hình cảm ứng, kéo trên sân đấu để ngắm.
- **1–5:** xem công thức chiêu mang theo. **H:** ẩn/hiện quyển trục trong trận. **M:** bật/tắt âm thanh.
- **Enter:** vào trận, tiếp tục sau tạm dừng, hoặc về quyển trục sau kết thúc. **Esc:** tạm dừng và thả con trỏ để thao tác giao diện. Bấm vào sân đấu để khóa lại nếu trình duyệt chưa khóa con trỏ.
- Chuyển khỏi tab hoặc cửa sổ tự tạm dừng. Màn hình tạm dừng có nút đấu lại cùng bộ chiêu hoặc trở về chọn chiêu.

12 hình ấn từ bốn hàng đầu của ket_an.jpg, đọc trái sang phải, trên xuống dưới. Tên mô tả thế tay và chuỗi chiêu là thiết kế của game, không phải công thức chính thức trong Naruto.

## Triển khai trên Vercel

Bản production: https://an-hoa-ninja.vercel.app.

Chạy **npm run build:vercel** để tạo thư mục **dist/** chỉ chứa game và asset công khai.
Cấu hình **vercel.json** dùng **npm ci**, **npm run build:vercel** và output **dist**.

Để triển khai bằng CLI: chạy **npx vercel login**, sau đó **npx vercel --prod** ở thư mục dự án.
Cũng có thể import repository GitHub vào Vercel; cấu hình build được đọc từ **vercel.json**.

## Phát triển

Node.js 20 trở lên; **npm ci** để cài dependency.

- **npm run build:** bundle src/main.js thành game.js để chơi trực tiếp ngoại tuyến.
- **npm run assets:** chạy Blender Python để dựng model từ `anime_style_hand.glb` ở thư mục gốc, lưu `.blend`, xuất GLB, thêm 12 clip kết ấn và tạo dữ liệu nhúng. File mẫu được giữ nguyên; runtime dùng model đã đóng gói. Cần Blender 4.5 LTS: đặt bản portable trong `.tools/`, đặt biến `BLENDER_PATH` trỏ tới `blender.exe`, hoặc cài Blender vào PATH. `node tools/generate-hands.mjs` chỉ đóng gói lại bản GLB đã xuất từ Blender. `npm run assets -- --procedural` dựng lại bản loft cũ để so sánh.
- **npm test:** luật 45 chiêu, giới hạn bộ chiêu, chuỗi ấn, chakra, khóa kéo/lặn ngoài lãnh địa và lệnh khi thiếu phân thân, miễn nhiễm, khiên/phản đòn/hồi máu, va chạm tường, vùng làm chậm và vị trí thiên thạch, GLB, animation và máy chủ.
- **npm run test:hand-volume:** đo độ dày lòng bàn tay, khối cơ ngón cái, độ cong mặt lưng, tiết diện ngón, độ sát của móng và vị trí/góc FPS. Kiểm tra trực tiếp geometry của GLB, độc lập với shader.
- **npm run test:browser:** Edge headless, WebGL 2/SwiftShader; kiểm tra chọn chiêu, 12 thế tay, di chuyển chuột, máy kết ấn, sát thương, khiên, phản đòn, hồi đầy máu, tạm dừng, chọn lại và giao diện nhỏ.
- **npm run test:ranks:** kiểm tra vị trí xuất phát của đối thủ, độ dài 2–8 ấn, tiến trình chiêu dài, sức mạnh theo cấp, thời gian đạn bay và máy kết đúng số ấn.
- **npm run test:lightning:** năm chiêu Lôi, khiên, trận 5 giây, tốc độ đạn, Thiên lôi, né, camera, tạm dừng/đấu lại và đồ họa thấp.
- **npm run test:dark:** năm Ám thuật, mái vòm và lãnh địa, chó bóng đứng chờ/nhận lệnh, mỗi lần một con, tối đa ba con mỗi bên, đạn xuyên qua, biến mất/hồi lại trong và ngoài lãnh địa, voi bóng rơi gây 90 sát thương và khóa 2 giây, né hoặc lặn trước khi voi đáp, lặn miễn nhiễm với thao tác bình thường, hai bên và máy, hết hạn, tạm dừng/reset, đồ họa thấp và giảm chuyển động.
- **npm run test:wind:** năm Phong thuật, combo hất tung 2 + 2 giây, sát thương 70 + 70, tường gió, camera tinh linh, phản liên tục phía trước và theo hướng ngắm, thuyền đổi hướng, hai bên, tạm dừng/reset/hết hạn, đồ họa thấp, giảm chuyển động và máy nối combo.
- **npm run test:earth:** luật và trình duyệt cho năm Thổ thuật, địa hình thật, độ cao/chậm bước/khôi phục, gai đá, năm đợt Sơn Hà, tường cong chặn đạn và di chuyển, Địa Bộc Thiên Tinh và góc máy, né/khiên/miễn nhiễm, hai bên/AI, tạm dừng/reset và các chế độ đồ họa; ảnh tại `test-results/earth/`.
- **npm run test:nature:** luật và trình duyệt cho Băng/Mộc: chiêu 10 ấn một lần mỗi trận, vườn bốn loại cây, giới hạn chiều cao, độc theo thời gian, dây leo/trúc/quả óc chó chắn trước, hoạt ảnh và mật độ phun theo tăng trưởng, tuyết đủ 90 giây và gom thành cầu, sương mù và ảo ảnh, cầu tuyết không thể chặn, thắng/thua, AI hai hệ, tạm dừng/reset và đồ họa thấp; ảnh tại `test-results/nature/`.
- **npm run test:light:** luật và trình duyệt cho laser trắng–vàng, cầu thủy tinh 8 giây/7 sắc, mái vòm 10 giây/laser nảy/sát thương mỗi giây, gương 2,5 giây/phản đòn, Jacob và góc máy; kiểm tra hai bên, AI, ngắm trượt/tường/khiên/miễn nhiễm, tạm dừng/reset, đồ họa thấp và giảm chuyển động; ảnh tại `test-results/light/`.
- **npm run test:fire:** kiểm tra năm chiêu Hỏa, ba viên liên đạn giữ 0,5 giây, rồng lửa, thiên thạch trúng/trượt/vụ nổ lan, khiên, tường chặn đạn, tạm dừng và reset; chụp hiệu ứng và kiểm tra giao diện tám ấn.
- **npm run test:water:** kiểm tra năm chiêu Thủy, khống chế hai bên, thuyền trúng/trượt điểm ngắm, sóng cuốn chiêu, hai kiểu khiên, tạm dừng/reset và hiệu ứng ở ba mức đồ họa.
- **npm run test:elemental:** sát thương Thủy, buff phi tiêu, choáng thuyền, Lôi trận 15%, từng tầng bỏng/tĩnh điện hết hạn riêng sau 10 giây, các mức kích hoạt, từ tính sau choáng, đổi hướng khi mục tiêu né, hiệu ứng/số tầng, AI, tạm dừng và reset.
- **npm run test:impact-motion:** kiểm tra hàng ba viên đạn, điểm ngắm cố định, quỹ đạo thiên thạch thẳng và phản ứng camera khi tích lực/phóng/trúng/chặn đòn, tạm dừng, reset và giảm chuyển động.
- **npm run test:incantation:** kiểm tra đọc tên đồng thời tung chiêu công/thủ, trừ chakra ngay, hồi chiêu, nhập chuỗi tiếp khi đang đọc, tạm dừng/hủy giọng đọc, lỗi giọng nói, hiện đủ 5 chiêu ở 8 kích thước màn hình và ẩn banner hình ấn.
- **npm run test:controls:** kiểm tra khóa con trỏ, hướng bắn trùng tâm ngắm, click trái/phải độc lập vị trí chuột, giữ nút không đi tiếp và giới hạn sân đấu.
- **npm run test:layout:** kiểm tra nút vào trận trên cửa sổ nhỏ và điện thoại, tâm ngắm ở giữa màn hình, khóa/thả con trỏ, nút HUD không gây né và đổi kích thước cửa sổ.
- **npm run test:graphics:** kiểm tra pixel môi trường ở ba mức đồ họa và chụp thế tay/giao diện.
- **npm run test:anime:** chụp dáng nghỉ và đủ 12 thế tay, viền theo khung xương, vòng Hỏa–Thủy–Lôi, camera Lôi điểu, ba mức đồ họa, cửa sổ nhỏ/điện thoại và giảm chuyển động; kiểm tra lỗi shader.
- **npm run test:hand-vfx:** kiểm tra 12 bóng, thời gian 0,2 giây, kết ấn liên tiếp, vầng lửa khi Space sẵn sàng, hồi chiêu/chakra, tạm dừng/reset và chế độ đồ họa thấp.
- **npm run test:cooldowns:** hồi chiêu riêng, chakra hồi 5/giây, phi tiêu xoay bốn cánh không tốn chakra, hướng ngắm/sát thương/chặn tường, chuỗi ấn bị khóa, tạm dừng/reset và máy.
- **npm run test:hand-element-rings:** kiểm tra vòng Phong–Ám–Quang–Thổ–Mộc–Băng cho cả 30 chiêu, điều kiện thi triển, màu/hoạt ảnh, đi theo tay, chuyển hệ, hồi chiêu/chakra, tạm dừng/reset, đồ họa thấp và giảm chuyển động; xuất ảnh vào `test-results/hand-element-rings/`.
- **npm run test:meteor-zoom:** kiểm tra zoom in/out trên trời, tạm dừng, đổi kích thước/chất lượng, khôi phục hướng ngắm, reset và chế độ giảm chuyển động.

Đặt **BROWSER_PATH** để dùng Chrome/Chromium khác đường dẫn Edge mặc định trên Windows. Ảnh và báo cáo kiểm thử nằm trong test-results. Chỉ URL có **test=1** cung cấp bước thời gian xác định; gameplay bình thường dùng requestAnimationFrame.

**npm run test:loadout** kiểm tra bộ toàn chiêu phòng ngự, giới hạn 1–5 ô, bộ lọc trạng thái học độc lập, thay bộ theo cả 9 hệ, bỏ hết, thông tin thẻ và khôi phục bộ đã lưu.

## Cấu trúc

- **game-core.js:** 9 hệ, 45 chiêu, kiểm tra bộ chiêu, luật kết ấn/chakra và điều kiện dùng Ám thuật, sinh lực/khiên/phản đòn/miễn nhiễm/khống chế, va chạm tường, vùng làm chậm và chọn vùng thiên thạch.
- **src/main.js:** quyển trục, HUD, điều khiển chuột, AI, va chạm và vòng trận đấu.
- **src/opponent.js:** nhân vật ninja, tay kết ấn có khớp, tay áo đi theo cổ tay, khiên máy.
- **src/scene.js:** môi trường anime, toon shading, ánh sáng, bóng và gió; map giữ cỏ lay động, đã dọn cây thân gỗ mặc định, cổng và bốn cột đèn. Cây triệu hồi hệ Mộc vẫn xuất hiện qua kỹ năng.
- **src/effects.js:** đạn theo màu hệ, ánh sáng, vệt, khói và vòng va chạm.
- **src/fire-arts.js:** shader lửa, rồng có thân uốn lượn, thiên thạch, dấu báo vùng rơi, vòm khiên, tường lửa và vụ nổ.
- **src/lightning-arts.js:** cầu điện, thương sét, chim điện, mây và tia Thiên lôi, khiên và Lôi trận.
- **src/dark-domain.js:** khép/mở mắt, lãnh địa, thú bóng đứng chờ/nhận lệnh/hồi lại, voi bóng 3D rơi, nhấn chìm đối thủ và lặn miễn nhiễm.
- **src/wind-arts.js:** lốc xoáy 3D, nâng/hạ đối thủ, liên trảm, tường gió, tinh linh có cánh và luồng gió phản chiêu phía trước.
- **src/dark-domain-intro.js:** mái vòm đen 3D và vùng mực lan trong không gian 3D, phủ dần môi trường nhưng giữ nhân vật và bàn tay; hỗ trợ tạm dừng/reset và giảm chuyển động.
- **src/water-arts.js:** mặt nước, cầu giam giữ, thuyền hải tặc, sóng cuốn chiêu và hai kiểu khiên nước.
- **src/vfx-materials.js:** bảng bốn mức sáng dùng chung cho các vật liệu rắn của chiêu thức.
- **src/worn-sail.js:** lưới buồm/cờ rách có lỗ thủng, độ cong và miếng vá có đường khâu của thuyền Thủy.
- **src/hands.js / poses.js:** nạp GLB Blender và điều khiển 12 thế kết ấn.
- **tools/blender-hands.py / build-hands.mjs:** lưới tay kín có cấu trúc quad, subdivision, móng, nếp ngón, giáp và trọng số xương; kiểm tra lưới manifold trước khi xuất.
- **tools/reference-hand.py:** nhập bản sao file mẫu, hàn các đỉnh trùng ở seam, giữ topology lòng bàn tay, thay đầu ngón/móng dài, đóng cổ tay, subdivision và gán trọng số 16 xương.
- **tools/inspect-hand-reference.py:** kiểm tra mesh gốc và xuất ba preview xám của mẫu đã chuẩn hóa góc nhìn; file đầu vào không bị chỉnh sửa.
- **tools/preview-hand-geometry.py:** render xám không outline ở ba góc, đo mesh và lưu hash trang phục/rig trong `test-results/hand-volume/<stage>/`. Chạy `blender --background assets/anime-hands.blend --python tools/preview-hand-geometry.py -- clay`.
- **tools/audit-hand-intersections.py:** kiểm tra giao cắt giữa các tam giác của mesh ở tư thế nghỉ; lưu báo cáo trong `test-results/hand-volume/intersections.json`.
- **tools/capture-hand-turntable.mjs:** chụp ba góc từ GLB và vật liệu cel/viền thực tế trong game; chạy `node tools/capture-hand-turntable.mjs 05-final`.
- **src/hand-model.js / hand-sculpt.js:** bộ dựng tay Three.js cũ, không còn dùng trong pipeline tạo asset hiện tại.
- **src/hand-materials.js:** bảng màu anime, cel shading nhẹ cho da/móng và màu phẳng cho giáp.
- **src/ink-outline.js:** viền mảnh theo kích thước màn hình cho tay có khớp, móng, giáp và vật thể chính; viền cây chuyển động theo gió.
- **assets/anime-hands.blend / blender-hands.glb:** nguồn Blender chỉnh sửa được và bản xuất trung gian.
- **assets/ninja-hands.glb / hand-data.js:** model chỉnh sửa được và dữ liệu nhúng ngoại tuyến.

Trong bảng **C**, nhân vật, hành trang dạng ô ảnh và thuộc tính/tu luyện nằm ở ba phần riêng. Giáp thân và giáp tay đổi độc lập; mọi trang bị đã mua được giữ trong hành trang. Giáp thường kháng một hệ 8% hoặc hai hệ 5%; tinh anh kháng một hệ 14%, hai hệ 11%/8%, hoặc ba hệ 8%. Giáp tay bán tại mỗi làng có cùng mốc thưởng nhưng tăng sát thương thuật đúng hệ, cộng với sức mạnh trên sát thương gốc, không tăng phi tiêu. Giáp tay tinh anh kèm găng phủ bàn tay kết ấn; bỏ găng sẽ khôi phục da tay. Save cũ tự nhận băng tay khởi đầu, giữ nguyên giáp đã mua. Chạy `npm run test:armguards` để kiểm tra dữ liệu, hình ảnh trang bị, các cỡ màn hình và sát thương trong trận.

Trong giao chiến, nhấn **G** để tăng lực trong **3 giây**, có gió nhẹ từ chân đi lên. Click trái/phải trong thời gian đó dùng một lượt lướt **2 m trong 0,2 giây**; hồi **12 giây** tính từ lúc lướt. Không dùng thì trạng thái tự hết và không tốn hồi chiêu. G và thao tác né/lướt không xóa chuỗi kết ấn. Tạm dừng đóng băng thời gian tăng lực/hồi chiêu, hủy phần di chuyển còn lại; đấu lại xóa trạng thái. Bước né thường của người chơi và bot đều là **0,2 m trong 0,2 giây** trên đất bằng, bot có thể chậm hơn khi thi triển, bị làm chậm hoặc là thủ lĩnh nặng. Lôi trận tồn tại **5 giây**, hồi chiêu vẫn **8 giây**. Chạy `npm run test:dash` để kiểm tra các cơ chế này.

Mỗi địa danh trong 10 làng có một cư dân cố định: **64 NPC mới**, có tên, nghề nghiệp, lời thoại, chân dung và hoạt động riêng. Nghĩa trang Vô Danh có bà Liên viếng hoa; Xóm Lò Đỏ có thợ rèn Lâm gõ sắt trên đe và tia lửa; các bến, vườn, hang và nhà trên cao có ngư dân, người vá lưới, thợ gốm, thợ sửa chữa, người chăm cây, người ghi chép hoặc gác đường. Tìm họ trong nhật ký **B**, tới gần rồi nhấn **E** để trò chuyện. Vị trí cố định được kiểm tra với địa hình, nước sâu, lối đi và sàn trên cao; bàn làm việc có va chạm. Các phần tĩnh được gộp theo khớp để giảm lượt vẽ. Chạy `npm run test:residents` để kiểm tra hoạt ảnh, đường tới NPC, đối thoại và tải lại làng.

Asset nhân vật và môi trường được dựng từ mã nguồn của dự án. Giấy phép Three.js trong THIRD_PARTY_NOTICES.md.
