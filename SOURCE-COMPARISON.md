# Đánh giá gói `slowroads-main (1).zip`

## Kết luận

Gói được tải lên là bản thu thập không chính thức, ghi phiên bản 1.01 và có cảnh báo đã lỗi thời. Không nên thay engine hiện tại bằng bundle này. Giá trị chính của nó là bundle còn dễ đọc hơn, giúp xác nhận cách engine xử lý đường, xe và hiệu năng.

## Những nguyên tắc có thể kế thừa

1. **Autodrive bám theo độ cong**
   - Target point thay đổi theo tốc độ và độ cong của các road node phía trước.
   - Tốc độ mục tiêu giảm trước khúc cua.
   - Góc lái kết hợp pursuit target, hướng mặt đường, độ trượt và khoảng cách tới mép đường.

2. **Ackermann steering**
   - Bánh trong và bánh ngoài dùng góc lái khác nhau.
   - Giảm cảm giác xe quay quanh tâm giả và giúp cua tự nhiên hơn.

3. **Terrain sinh theo từng hàng và từng frame**
   - Tile không được dựng toàn bộ trong một frame.
   - Normal/curvature được tính dần, hạn chế spike CPU.

4. **LOD theo hai trục**
   - `viewLodIndex`: khoảng nhìn.
   - `detailLodIndex`: cây cỏ, tường xa, bóng và mật độ vật thể.
   - `renderScale`: 0.5x, 0.75x, 1x, 1.5x.

5. **Giới hạn độ phân giải render**
   - Engine đặt pixel ratio tối đa 1.
   - WebGL yêu cầu `powerPreference: high-performance`.

6. **Tối ưu cập nhật vị trí trên road graph**
   - Kiểm tra node gần nhất bị giảm tần suất khi xe ở xa đường.
   - Khoảng gửi telemetry tăng dần để giảm xử lý không cần thiết.

7. **Tắt matrix auto-update cho object tĩnh**
   - Terrain tile/container không cập nhật ma trận mỗi frame nếu không thay đổi.

## Những thay đổi đã áp dụng vào Cổ Thạch v3

- Tiến độ hành trình đọc từ `#ui-dist-val` và `#ui-speed-val` của engine.
- Nếu odometer chưa sẵn sàng, quãng đường được tích phân từ tốc độ theo delta time đã clamp.
- Milestone không còn chạy theo đồng hồ cố định.
- Chỉ tồn tại một vòng `requestAnimationFrame` cho HUD hành trình.
- Bỏ MutationObserver theo dõi toàn bộ DOM; polling splash tự dừng sau khi bắt đầu.
- Particle overlay chạy 30 FPS hoặc 12 FPS ở Lite Mode và dừng khi tab ẩn.
- Theo dõi FPS bằng exponential moving average.
- Tự bật Lite Mode khi FPS thấp.
- Có thể tự tải lại đúng một lần ở đầu hành trình với LOD/render scale thấp hơn nếu FPS rất thấp.
- Cấu hình desktop không vượt render scale 1x; mobile dùng 0.75x hoặc 0.5x.
- Autodrive watchdog giữ engine ở chế độ lái tự động bằng bộ điều khiển native.
- Hỗ trợ chẩn đoán bằng `?debugCT=1`.

## Phần chưa thể kế thừa trực tiếp

- Road node, renderer, camera và vehicle controller nằm trong closure của bundle đã biên dịch.
- Không thể chỉnh chính xác hệ số look-ahead, suspension hoặc curvature từ lớp ngoài mà không patch bundle.
- Bản 1.01 cũ hơn engine trong gói Cổ Thạch v2 nên không nên thay bundle mới bằng bundle này.

## Tài nguyên kế thừa bổ sung

Gói 1.01 chứa 74 asset có cùng logical name với các asset mà bundle mới tham chiếu nhưng bản ZIP v2 chưa có. Các asset ảnh được chuyển sang WebP và đặt theo filename/hash mà bundle mới yêu cầu; OBJ, SVG và MP3 tương ứng được sao chép. Năm asset không có bản tương ứng được thay bằng fallback nội bộ để không phát sinh 404.
