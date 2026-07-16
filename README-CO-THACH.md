# Đường về Cổ Thạch — Coastal Drive Enhanced Preview

Bản thử nghiệm này kế thừa **bản build đã biên dịch** do người dùng cung cấp và bổ sung một lớp trải nghiệm mới dành cho hành trình du lịch số đến Cổ Thạch.

## Những phần đã cải tiến

### Đồ họa và hiệu ứng

- Tăng tầm nhìn và độ chi tiết địa hình trên máy tính.
- Tự hạ LOD trên điện thoại hoặc thiết bị cấu hình thấp.
- Ba bộ màu: ban ngày, hoàng hôn và ban đêm.
- Hậu kỳ bằng CSS: color grading, vignette, atmospheric haze, cloud shadow, sea glint và film grain.
- Lens flare chuyển động nhẹ theo con trỏ.
- Hạt bụi ban ngày và đom đóm ban đêm bằng canvas 2D.
- Chế độ `LITE` để giảm hiệu ứng trên thiết bị yếu.
- Chế độ `PHOTO` để ẩn giao diện và chụp cảnh.

### Trải nghiệm hành trình

- Tự bật autodrive và cruise control khoảng 80 km/h.
- Đơn vị mặc định là kilomet.
- HUD hành trình mới với tiến độ, thời gian và số kilomet mô phỏng.
- Bảy mốc kể chuyện từ lúc rời thành phố tới Cổ Thạch.
- Màn hình hoàn thành hành trình và nút chuyển sang `/kham-pha`.
- Thông báo rõ đây là hành trình mô phỏng, không phải tuyến định vị thực tế.
- Khi chuyển tab, đồng hồ trải nghiệm được tạm dừng để tránh nhảy tiến độ.

### Quyền riêng tư và triển khai

- Tắt analytics và yêu cầu tra cứu vị trí của bản gốc bằng cấu hình localStorage trước khi engine khởi chạy.
- Chạy hoàn toàn tĩnh, không yêu cầu backend.
- Có cấu hình cache cho Cloudflare Pages.

## Chạy trên Windows

Không mở trực tiếp bằng `file://`. Hãy giải nén rồi chạy một HTTP server trong thư mục này:

```powershell
python -m http.server 8080
```

Sau đó truy cập:

```text
http://localhost:8080/#A1-71e2bdd4@1
```

Có thể chạy nhanh bằng file:

```text
RUN_LOCAL_WINDOWS.bat
```

## Triển khai Cloudflare Pages

Direct Upload toàn bộ thư mục này hoặc đưa lên GitHub rồi kết nối Pages.

- Framework preset: `None`
- Build command: để trống
- Build output directory: `/`

## Cấu hình nội dung

Chỉnh file:

```text
cothach/config.js
```

Các thông số chính:

- `totalJourneySeconds`: thời lượng hành trình.
- `exploreUrl`: trang mở sau khi đến Cổ Thạch.
- `defaultLook`: `day`, `sunset` hoặc `night`.
- `milestones`: danh sách mốc nội dung và tỷ lệ xuất hiện.

## Phím tắt

- `1`: ban ngày.
- `2`: hoàng hôn.
- `3`: ban đêm.
- `P`: bật/tắt Photo Mode.
- `L`: bật/tắt Lite Mode.
- Các phím lái, camera và reset của engine gốc vẫn được giữ nguyên.

## Đặt lại cấu hình đồ họa

Mở một lần với tham số:

```text
?resetCT=1
```

Ví dụ:

```text
http://localhost:8080/?resetCT=1#A1-71e2bdd4@1
```

## Giới hạn kiểm thử

Mã JavaScript mới đã được kiểm tra cú pháp và toàn bộ đường dẫn tài nguyên đã được rà soát. Môi trường tạo gói không cho phép Chromium truy cập localhost/file URL và không khởi tạo được WebGL, do đó cần kiểm tra hình ảnh cuối cùng trên Chrome/Edge máy thật.

## Giấy phép

Bản build gốc tự công bố giấy phép **CC BY-NC-ND 4.0** và phần FAQ bên trong nêu rõ không cho phép tạo bản phái sinh hoặc sử dụng thương mại khi chưa có chấp thuận. Vì vậy gói này chỉ nên dùng làm **private preview/PoC nội bộ**. Muốn công khai hoặc kiếm tiền, cần xin phép tác giả hoặc chuyển toàn bộ ý tưởng sang engine tự xây.


## Bản vá v4

Bản v4 tự khởi động engine. Nếu trình duyệt chặn auto-start, nút **BẮT ĐẦU HÀNH TRÌNH** sẽ hiện ở cuối màn hình sau khoảng 2,6 giây. Lần chạy đầu nên dùng `http://localhost:8080/?resetCT=1#A1-71e2bdd4@1`.
