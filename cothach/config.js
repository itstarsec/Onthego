window.CO_THACH_DRIVE_CONFIG = {
  title: 'ĐƯỜNG VỀ CỔ THẠCH',
  subtitle: 'Một hành trình ven biển được mô phỏng bằng WebGL',
  routeLabel: 'TP.HCM  →  PHAN THIẾT  →  CỔ THẠCH',

  // Progress is driven by actual engine telemetry, not a fixed countdown.
  journeyMode: 'distance',
  experienceDistanceKm: 8,
  routeDistanceKm: 232,
  fallbackJourneySeconds: 420,

  autoDrive: true,
  autoStart: true,
  autoStartDelayMs: 1600,
  autoDriveWatchdogSeconds: 4,
  defaultLook: 'sunset',
  exploreUrl: '/kham-pha',

  adaptivePerformance: {
    enabled: true,
    liteBelowFps: 42,
    reloadBelowFps: 28,
    sampleSeconds: 6,
    allowOneEarlyReload: true
  },

  milestones: [
    { at: 0.00, title: 'Rời phố thị', text: 'Chuyến đi bắt đầu. Phía trước là cung đường hướng về miền biển Bình Thuận.' },
    { at: 0.16, title: 'Qua miền nắng gió', text: 'Cảnh quan dần mở rộng, nhịp xe chậm lại và bầu trời trở nên trong hơn.' },
    { at: 0.34, title: 'Chạm vùng cát trắng', text: 'Những triền cát và cây bụi thấp báo hiệu miền duyên hải đang đến gần.' },
    { at: 0.52, title: 'Theo đường ven biển', text: 'Gió biển xuất hiện. Hành trình chuyển sang nhịp thư giãn và điện ảnh.' },
    { at: 0.70, title: 'Gần Tuy Phong', text: 'Những làng chài và dải đá ven bờ mở ra trên hành trình mô phỏng.' },
    { at: 0.87, title: 'Cổ Thạch phía trước', text: 'Bãi đá nhiều màu, chùa Hang và làng biển chỉ còn một chặng ngắn.' },
    { at: 1.00, title: 'Đã đến Cổ Thạch', text: 'Hãy tiếp tục hành trình bằng bản đồ khám phá điểm đến.' }
  ]
};
