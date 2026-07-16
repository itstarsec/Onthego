# Cổ Thạch Enhanced v4 — Startup hotfix

- Sửa stacking context khiến nền topo che logo, tiêu đề và nút Begin của engine.
- Tự động nhấn nút Begin sau khi React splash sẵn sàng.
- Bổ sung nút khởi hành dự phòng nếu auto-start bị trình duyệt chặn.
- Dọn CTA khởi động ngay khi canvas bắt đầu.
- Chặn URL DOM bị serialize thành chuỗi `null`; lỗi Chrome DevTools `.well-known` vẫn vô hại.
- Thêm cache-busting cho lớp Cổ Thạch.

# Changelog — Cổ Thạch Enhanced Preview

## v2.0

- Thêm cấu hình khởi động theo năng lực thiết bị.
- Desktop mặc định view LOD 3 và detail LOD 2.
- Mobile hỗ trợ force allow và profile LOD thích ứng.
- Tắt analytics/location lookup của bản gốc.
- Thêm cinematic color grading và ba thời điểm trong ngày.
- Thêm haze, flare, moving cloud overlay, grain, sea glint và particle canvas.
- Thêm HUD hành trình du lịch, milestone toast và màn hình arrival.
- Tự bật autodrive, cruise control và đơn vị kilomet.
- Thêm Photo Mode, Lite Mode và keyboard shortcuts.
- Bổ sung hai tài nguyên thiếu trong package đầu vào để tránh lỗi 404.
- Cập nhật metadata, manifest và cấu hình Cloudflare Pages.
