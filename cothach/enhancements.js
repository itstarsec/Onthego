(() => {
  'use strict';

  const cfg = window.CO_THACH_DRIVE_CONFIG || {};
  const milestones = Array.isArray(cfg.milestones) ? cfg.milestones : [];
  const perfCfg = cfg.adaptivePerformance || {};
  const query = new URLSearchParams(location.search);

  const state = {
    started: false,
    completed: false,
    startedAt: 0,
    lastFrameAt: 0,
    pausedAt: 0,
    elapsedPausedMs: 0,
    rafId: 0,
    milestoneIndex: -1,
    look: cfg.defaultLook || 'sunset',
    photoMode: false,
    perfMode: false,
    autoPerfMode: false,
    odometerBaseKm: null,
    odometerLastKm: null,
    engineDistanceKm: 0,
    integratedDistanceKm: 0,
    speedKmh: 0,
    telemetrySeenAt: 0,
    frameEmaMs: 16.7,
    fps: 60,
    lowFpsSince: 0,
    criticalFpsSince: 0,
    splashPoll: 0,
    autoDriveWatchdog: 0,
    particleRaf: 0,
    particleLastDraw: 0,
    startAttempts: 0,
    autoStartTimer: 0,
    fallbackStartTimer: 0
  };

  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const fmt = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));

  function parseNumber(text) {
    if (typeof text !== 'string') return null;
    const cleaned = text.trim().replace(/\s/g, '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    if (!cleaned) return null;
    const value = Number(cleaned[0]);
    return Number.isFinite(value) ? value : null;
  }

  function patchMeta() {
    document.title = 'Đường về Cổ Thạch — Coastal Drive';
    const values = {
      description: 'Trải nghiệm lái xe điện ảnh trên trình duyệt, mô phỏng hành trình ven biển đến Cổ Thạch.',
      'theme-color': '#081820'
    };
    Object.entries(values).forEach(([name, content]) => {
      let el = q(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    });
  }

  function triggerEngineStart(source = 'auto') {
    if (state.started || state.completed) return true;
    const loader = q('#splash-loader');
    state.startAttempts += 1;
    if (loader) {
      loader.style.pointerEvents = 'auto';
      loader.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      loader.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      loader.click();
      document.body.classList.add('ct-engine-started');
      return true;
    }
    if (source === 'user') {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    }
    return false;
  }

  function ensureFallbackStart() {
    const splash = q('#splash-container');
    if (!splash || q('#ct-start-fallback')) return;
    const button = document.createElement('button');
    button.id = 'ct-start-fallback';
    button.type = 'button';
    button.textContent = 'BẮT ĐẦU HÀNH TRÌNH';
    button.addEventListener('click', () => triggerEngineStart('user'));
    const status = document.createElement('div');
    status.id = 'ct-start-status';
    status.textContent = 'ENGINE ĐÃ TẢI • NHẤN ĐỂ KHỞI HÀNH';
    document.body.append(button, status);
    state.fallbackStartTimer = window.setTimeout(() => {
      if (!state.started && !isSplashGone()) button.classList.add('ct-show');
    }, 2600);
  }

  function scheduleAutoStart() {
    if (cfg.autoStart === false || state.started || state.autoStartTimer) return;
    state.autoStartTimer = window.setTimeout(() => {
      state.autoStartTimer = 0;
      if (!triggerEngineStart('auto') && state.startAttempts < 4) scheduleAutoStart();
    }, Math.max(700, Number(cfg.autoStartDelayMs) || 1600));
  }

  function patchSplash() {
    const header = q('#splash-header');
    const sub = q('#splash-subheader');
    const loader = q('#splash-loader');
    if (header && header.textContent !== cfg.title) header.textContent = cfg.title || 'ĐƯỜNG VỀ CỔ THẠCH';
    if (sub) sub.textContent = cfg.subtitle || 'Một hành trình ven biển được mô phỏng bằng WebGL';
    if (loader?.classList.contains('splash-ready')) {
      const text = q('.splash-load-prog-text', loader) || loader;
      if (!/BẮT ĐẦU/.test(text.textContent || '')) text.textContent = 'BẮT ĐẦU HÀNH TRÌNH';
    }
    const splash = q('#splash-container');
    if (splash && !q('#ct-intro-kicker')) {
      const k = document.createElement('div');
      k.id = 'ct-intro-kicker';
      k.textContent = 'COASTAL DRIVE • CỔ THẠCH EDITION';
      splash.appendChild(k);
    }
    if (splash) {
      ensureFallbackStart();
      scheduleAutoStart();
    }
  }

  function createOverlay() {
    if (q('#ct-experience')) return;
    const root = document.createElement('div');
    root.id = 'ct-experience';
    root.innerHTML = `
      <div class="ct-postfx" aria-hidden="true">
        <canvas id="ct-particles"></canvas><div class="ct-clouds"></div><div class="ct-haze"></div>
        <div class="ct-sea-glint"></div><div class="ct-flare"></div><div class="ct-grain"></div><div class="ct-vignette"></div>
      </div>
      <div class="ct-brand"><div class="ct-brand-mark">◒</div><div>
        <div class="ct-brand-title">${escapeHtml(cfg.title || 'ĐƯỜNG VỀ CỔ THẠCH')}</div>
        <div class="ct-brand-sub">HÀNH TRÌNH MÔ PHỎNG • KHÔNG PHẢI TUYẾN ĐƯỜNG ĐỊNH VỊ THỰC</div>
      </div></div>
      <div class="ct-telemetry" aria-label="Thông tin hành trình">
        <div class="ct-metric"><div id="ct-speed" class="ct-metric-value">AUTO</div><div class="ct-metric-label">Tốc độ</div></div>
        <div class="ct-metric"><div id="ct-time" class="ct-metric-value">00:00</div><div class="ct-metric-label">Thời gian</div></div>
        <div class="ct-metric"><div id="ct-km" class="ct-metric-value">0 km</div><div class="ct-metric-label">Quy đổi</div></div>
      </div>
      <section class="ct-route-card" aria-live="polite">
        <div class="ct-route-label"><span>${escapeHtml(cfg.routeLabel || 'TP.HCM → PHAN THIẾT → CỔ THẠCH')}</span><span id="ct-percent">0%</span></div>
        <div id="ct-route-title" class="ct-route-title">Chuẩn bị khởi hành</div>
        <div id="ct-route-text" class="ct-route-text">Tiến độ sẽ bám theo quãng đường xe thực sự di chuyển trong engine.</div>
        <div class="ct-progress-track"><div id="ct-progress" class="ct-progress-fill"></div><div id="ct-progress-dot" class="ct-progress-dot"></div></div>
        <div class="ct-route-meta"><span id="ct-stage">CHẶNG 01 / ${fmt(Math.max(1, milestones.length))}</span><span id="ct-remaining">ĐANG TÍNH ETA</span></div>
      </section>
      <div class="ct-tools" aria-label="Tùy chỉnh hình ảnh">
        <button class="ct-tool" data-look="day">DAY</button><button class="ct-tool" data-look="sunset">SUN</button>
        <button class="ct-tool" data-look="night">NIGHT</button><button id="ct-photo" class="ct-tool">PHOTO</button><button id="ct-perf" class="ct-tool">LITE</button>
      </div>
      <div class="ct-toast"><div class="ct-toast-title"></div><div class="ct-toast-text"></div></div>
      <div id="ct-debug" class="ct-debug" hidden></div>
      <div class="ct-arrival"><div class="ct-arrival-card">
        <div class="ct-arrival-kicker">HÀNH TRÌNH HOÀN TẤT</div><h2>CỔ THẠCH</h2>
        <p>Bạn đã hoàn thành hành trình lái xe mô phỏng. Tiếp tục khám phá bãi đá, chùa Hang, làng chài và các điểm lưu trú.</p>
        <div class="ct-arrival-actions"><button id="ct-replay" class="ct-arrival-button">LÁI LẠI</button><button id="ct-explore" class="ct-arrival-button ct-primary">KHÁM PHÁ CỔ THẠCH</button></div>
      </div></div>`;
    document.body.appendChild(root);

    qa('[data-look]', root).forEach((btn) => btn.addEventListener('click', () => applyLook(btn.dataset.look)));
    q('#ct-photo', root)?.addEventListener('click', togglePhotoMode);
    q('#ct-perf', root)?.addEventListener('click', () => togglePerformance());
    q('#ct-replay', root)?.addEventListener('click', replay);
    q('#ct-explore', root)?.addEventListener('click', () => {
      const url = cfg.exploreUrl || '/kham-pha';
      if (url.startsWith('#')) location.hash = url.slice(1); else location.href = url;
    });

    applyLook(state.look);
    initParticles();
    initFlareTracking();
    if (query.get('debugCT') === '1') q('#ct-debug').hidden = false;
  }

  function applyLook(look) {
    state.look = ['day', 'sunset', 'night'].includes(look) ? look : 'sunset';
    document.body.classList.remove('ct-look-day', 'ct-look-sunset', 'ct-look-night');
    document.body.classList.add(`ct-look-${state.look}`);
    qa('[data-look]').forEach((b) => b.classList.toggle('ct-active', b.dataset.look === state.look));
    try { localStorage.setItem('ct-look', state.look); } catch (_) {}
  }

  function togglePhotoMode() {
    state.photoMode = !state.photoMode;
    document.body.classList.toggle('ct-photo-mode', state.photoMode);
    q('#ct-photo')?.classList.toggle('ct-active', state.photoMode);
  }

  function togglePerformance(force, automatic = false) {
    state.perfMode = typeof force === 'boolean' ? force : !state.perfMode;
    state.autoPerfMode = automatic && state.perfMode;
    document.body.classList.toggle('ct-performance', state.perfMode);
    document.body.classList.toggle('ct-auto-lite', state.autoPerfMode);
    q('#ct-perf')?.classList.toggle('ct-active', state.perfMode);
    q('#ct-perf')?.toggleAttribute('data-auto', state.autoPerfMode);
    try { localStorage.setItem('ct-lite', state.perfMode ? '1' : '0'); } catch (_) {}
    resizeParticleCanvas();
  }

  function detectLowPower() {
    const mobile = matchMedia('(max-width: 760px)').matches;
    const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
    const lowRam = Number(navigator.deviceMemory || 8) <= 4;
    let stored = false;
    try { stored = localStorage.getItem('ct-lite') === '1'; } catch (_) {}
    togglePerformance(stored || (mobile && (lowCpu || lowRam)), stored || (mobile && (lowCpu || lowRam)));
    try { const storedLook = localStorage.getItem('ct-look'); if (storedLook) applyLook(storedLook); } catch (_) {}
  }

  function isSplashGone() {
    const splash = q('#splash-container');
    if (!splash) return false;
    const style = getComputedStyle(splash);
    return style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.03;
  }

  function beginJourney() {
    if (state.started || !isSplashGone()) return;
    state.started = true;
    document.body.classList.add('ct-engine-started');
    clearTimeout(state.autoStartTimer);
    clearTimeout(state.fallbackStartTimer);
    q('#ct-start-fallback')?.remove();
    q('#ct-start-status')?.remove();
    state.startedAt = performance.now();
    state.lastFrameAt = state.startedAt;
    clearInterval(state.splashPoll);
    q('#ct-experience')?.classList.add('ct-visible');
    resetTelemetryBaseline();
    setTimeout(ensureAutodrive, 500);
    state.autoDriveWatchdog = window.setInterval(ensureAutodrive, Math.max(2, Number(cfg.autoDriveWatchdogSeconds) || 4) * 1000);
    showMilestone(0);
    scheduleTick();
  }

  function ensureAutodrive() {
    if (cfg.autoDrive === false || document.hidden || state.completed) return;
    const button = q('#autodrive-button');
    const container = q('#autodrive');
    if (button && /off/i.test(button.textContent || '') && container) {
      container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
      container.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
      container.click();
    } else if (!button) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'f', code: 'KeyF', bubbles: true }));
    }
  }

  function readEngineTelemetry(now, dtSeconds) {
    const speedNode = q('#ui-speed-val') || q('#ui-speed .ui-stat-val') || q('#ui-speed');
    const distanceNode = q('#ui-dist-val') || q('#ui-dist .ui-stat-val') || q('#ui-dist');
    const speed = parseNumber(speedNode?.textContent || '');
    const odometer = parseNumber(distanceNode?.textContent || '');

    if (speed !== null) {
      state.speedKmh = clamp(speed, 0, 500);
      state.integratedDistanceKm += state.speedKmh * Math.max(0, Math.min(dtSeconds, 0.1)) / 3600;
      state.telemetrySeenAt = now;
    }

    if (odometer !== null) {
      if (state.odometerBaseKm === null) state.odometerBaseKm = odometer;
      if (state.odometerLastKm !== null && odometer + 0.05 < state.odometerLastKm) state.odometerBaseKm = odometer - state.engineDistanceKm;
      state.odometerLastKm = odometer;
      state.engineDistanceKm = Math.max(state.engineDistanceKm, Math.max(0, odometer - state.odometerBaseKm));
      state.telemetrySeenAt = now;
    }
  }

  function resetTelemetryBaseline() {
    state.odometerBaseKm = null;
    state.odometerLastKm = null;
    state.engineDistanceKm = 0;
    state.integratedDistanceKm = 0;
    state.telemetrySeenAt = 0;
  }

  function activeElapsedSeconds(now) {
    const end = state.pausedAt || now;
    return Math.max(0, (end - state.startedAt - state.elapsedPausedMs) / 1000);
  }

  function computeProgress(now, elapsed) {
    const targetKm = Math.max(0.5, Number(cfg.experienceDistanceKm) || 8);
    const telemetryDistance = Math.max(state.engineDistanceKm, state.integratedDistanceKm);
    const telemetryFresh = now - state.telemetrySeenAt < 8000;
    if ((cfg.journeyMode || 'distance') === 'distance' && telemetryFresh) return clamp(telemetryDistance / targetKm, 0, 1);
    return clamp(elapsed / Math.max(45, Number(cfg.fallbackJourneySeconds) || 420), 0, 1);
  }

  function scheduleTick() {
    if (state.rafId || !state.started || state.completed || document.hidden) return;
    state.rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    state.rafId = 0;
    if (!state.started || state.completed || document.hidden) return;

    const rawDt = Math.max(1, now - state.lastFrameAt);
    state.lastFrameAt = now;
    const dtSeconds = Math.min(rawDt / 1000, 0.1);
    state.frameEmaMs = state.frameEmaMs * 0.94 + Math.min(rawDt, 100) * 0.06;
    state.fps = clamp(1000 / state.frameEmaMs, 1, 120);

    readEngineTelemetry(now, dtSeconds);
    const elapsed = activeElapsedSeconds(now);
    const progress = computeProgress(now, elapsed);
    updateHud(progress, elapsed);
    updateMilestone(progress);
    adaptiveQuality(now, progress);
    updateDebug(progress);

    if (progress >= 1) completeJourney(); else scheduleTick();
  }

  function updateHud(progress, elapsed) {
    const percent = Math.round(progress * 100);
    const routeKm = Math.round(progress * Math.max(1, Number(cfg.routeDistanceKm) || 232));
    q('#ct-progress')?.style.setProperty('width', `${percent}%`);
    q('#ct-progress-dot')?.style.setProperty('left', `${percent}%`);
    if (q('#ct-percent')) q('#ct-percent').textContent = `${percent}%`;
    if (q('#ct-time')) q('#ct-time').textContent = `${fmt(elapsed / 60)}:${fmt(elapsed % 60)}`;
    if (q('#ct-km')) q('#ct-km').textContent = `${routeKm} km`;
    if (q('#ct-speed')) q('#ct-speed').textContent = state.speedKmh > 0.5 ? `${Math.round(state.speedKmh)}` : 'AUTO';

    let etaText = 'ĐANG TÍNH ETA';
    if (progress > 0.025 && elapsed > 4) {
      const remaining = clamp((elapsed / progress) * (1 - progress), 0, 99 * 60);
      etaText = `CÒN ${fmt(remaining / 60)}:${fmt(remaining % 60)}`;
    }
    if (q('#ct-remaining')) q('#ct-remaining').textContent = etaText;
  }

  function updateMilestone(progress) {
    let idx = 0;
    for (let i = 0; i < milestones.length; i++) if (progress >= Number(milestones[i].at || 0)) idx = i;
    if (idx !== state.milestoneIndex) showMilestone(idx);
  }

  let toastTimer = 0;
  function showMilestone(index, overrideText = '') {
    if (!milestones.length) return;
    index = clamp(index, 0, milestones.length - 1);
    state.milestoneIndex = index;
    const m = milestones[index];
    if (q('#ct-route-title')) q('#ct-route-title').textContent = m.title || '';
    if (q('#ct-route-text')) q('#ct-route-text').textContent = overrideText || m.text || '';
    if (q('#ct-stage')) q('#ct-stage').textContent = `CHẶNG ${fmt(index + 1)} / ${fmt(milestones.length)}`;
    const toast = q('.ct-toast');
    if (toast) {
      q('.ct-toast-title', toast).textContent = m.title || '';
      q('.ct-toast-text', toast).textContent = overrideText || m.text || '';
      toast.classList.add('ct-show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('ct-show'), index === 0 ? 2800 : 4200);
    }
  }

  function adaptiveQuality(now, progress) {
    if (perfCfg.enabled === false) return;
    const liteThreshold = Number(perfCfg.liteBelowFps) || 42;
    const reloadThreshold = Number(perfCfg.reloadBelowFps) || 28;
    const sampleMs = Math.max(3, Number(perfCfg.sampleSeconds) || 6) * 1000;

    if (state.fps < liteThreshold) {
      if (!state.lowFpsSince) state.lowFpsSince = now;
      if (now - state.lowFpsSince > sampleMs && !state.perfMode) {
        togglePerformance(true, true);
        showSystemToast('Đã bật LITE tự động', `FPS trung bình ${Math.round(state.fps)} — giảm hiệu ứng phủ để giữ chuyển động ổn định.`);
      }
    } else state.lowFpsSince = 0;

    if (state.fps < reloadThreshold) {
      if (!state.criticalFpsSince) state.criticalFpsSince = now;
      const canReload = perfCfg.allowOneEarlyReload !== false && progress < 0.05 && sessionStorage.getItem('ct-auto-reloaded-v3') !== '1';
      if (canReload && now - state.criticalFpsSince > sampleMs) {
        sessionStorage.setItem('ct-auto-reloaded-v3', '1');
        sessionStorage.setItem('ct-force-lite-v3', '1');
        showSystemToast('Đang tối ưu lại đồ họa', 'Thiết bị có FPS thấp; hệ thống sẽ tải lại một lần với LOD và độ phân giải nhẹ hơn.');
        setTimeout(() => location.reload(), 900);
      }
    } else state.criticalFpsSince = 0;
  }

  function showSystemToast(title, text) {
    const toast = q('.ct-toast');
    if (!toast) return;
    q('.ct-toast-title', toast).textContent = title;
    q('.ct-toast-text', toast).textContent = text;
    toast.classList.add('ct-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('ct-show'), 5000);
  }

  function updateDebug(progress) {
    const debug = q('#ct-debug');
    if (!debug || debug.hidden) return;
    debug.textContent = [
      `FPS ${state.fps.toFixed(1)}`,
      `speed ${state.speedKmh.toFixed(1)} km/h`,
      `odo ${state.engineDistanceKm.toFixed(3)} km`,
      `integrated ${state.integratedDistanceKm.toFixed(3)} km`,
      `progress ${(progress * 100).toFixed(1)}%`,
      `profile ${localStorage.getItem('ct-graphics-profile-v3') || 'unknown'}`
    ].join(' · ');
  }

  function completeJourney() {
    state.completed = true;
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
    clearInterval(state.autoDriveWatchdog);
    updateHud(1, activeElapsedSeconds(performance.now()));
    q('.ct-arrival')?.classList.add('ct-show');
    showMilestone(Math.max(0, milestones.length - 1));
  }

  function replay() {
    state.completed = false;
    state.startedAt = performance.now();
    state.lastFrameAt = state.startedAt;
    state.elapsedPausedMs = 0;
    state.pausedAt = 0;
    state.milestoneIndex = -1;
    resetTelemetryBaseline();
    q('.ct-arrival')?.classList.remove('ct-show');
    showMilestone(0);
    ensureAutodrive();
    clearInterval(state.autoDriveWatchdog);
    state.autoDriveWatchdog = window.setInterval(ensureAutodrive, Math.max(2, Number(cfg.autoDriveWatchdogSeconds) || 4) * 1000);
    scheduleTick();
  }

  function initFlareTracking() {
    const flare = q('.ct-flare');
    if (!flare) return;
    addEventListener('pointermove', (e) => {
      if (state.perfMode || document.hidden) return;
      const x = 68 + (e.clientX / innerWidth - 0.5) * 9;
      const y = 21 + (e.clientY / innerHeight - 0.5) * 5;
      flare.style.setProperty('--x', `${x}%`);
      flare.style.setProperty('--y', `${y}%`);
    }, { passive: true });
  }

  let particleContext = null;
  let particles = [];
  function initParticles() {
    const canvas = q('#ct-particles');
    if (!canvas) return;
    particleContext = canvas.getContext('2d', { alpha: true });
    if (!particleContext) return;
    addEventListener('resize', resizeParticleCanvas, { passive: true });
    resizeParticleCanvas();
    state.particleRaf = requestAnimationFrame(drawParticles);
  }

  function resizeParticleCanvas() {
    const canvas = q('#ct-particles');
    const ctx = particleContext;
    if (!canvas || !ctx) return;
    const w = Math.max(1, innerWidth);
    const h = Math.max(1, innerHeight);
    const dpr = Math.min(state.perfMode ? 1 : 1.25, devicePixelRatio || 1);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = state.perfMode ? 10 : w < 760 ? 24 : 46;
    particles = Array.from({ length: count }, () => makeParticle(w, h));
  }

  function drawParticles(now) {
    state.particleRaf = requestAnimationFrame(drawParticles);
    if (document.hidden || state.photoMode) return;
    const targetInterval = state.perfMode ? 1000 / 12 : 1000 / 30;
    if (now - state.particleLastDraw < targetInterval) return;
    state.particleLastDraw = now;

    const canvas = q('#ct-particles');
    const ctx = particleContext;
    if (!canvas || !ctx) return;
    const w = innerWidth, h = innerHeight;
    ctx.clearRect(0, 0, w, h);
    const night = state.look === 'night';
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.phase += p.twinkle;
      if (p.x > w + 20 || p.y < -20 || p.y > h + 20) Object.assign(p, makeParticle(w, h, true));
      const alpha = p.a * (night ? 0.9 : 0.45) * (0.72 + Math.sin(p.phase) * 0.28);
      ctx.beginPath();
      ctx.fillStyle = night ? `rgba(176,231,225,${alpha})` : `rgba(255,232,194,${alpha})`;
      ctx.arc(p.x, p.y, p.r * (night ? 1.1 : 0.7), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function makeParticle(w, h, edge = false) {
    return { x: edge ? -10 : Math.random() * w, y: Math.random() * h, r: 0.5 + Math.random() * 1.5,
      vx: 0.08 + Math.random() * 0.25, vy: -0.03 + Math.random() * 0.08, a: 0.08 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2, twinkle: 0.008 + Math.random() * 0.02 };
  }

  function watchSplash() {
    const poll = () => {
      patchSplash();
      if (isSplashGone()) beginJourney();
    };
    poll();
    state.splashPoll = window.setInterval(poll, 350);
  }

  function visibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (!state.started || state.completed) return;
      if (document.hidden) {
        state.pausedAt = performance.now();
        cancelAnimationFrame(state.rafId);
        state.rafId = 0;
      } else {
        const now = performance.now();
        if (state.pausedAt) state.elapsedPausedMs += now - state.pausedAt;
        state.pausedAt = 0;
        state.lastFrameAt = now;
        ensureAutodrive();
        scheduleTick();
      }
    });
  }

  function keyboardShortcuts() {
    addEventListener('keydown', (e) => {
      if (e.repeat || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '')) return;
      if (e.code === 'KeyP') togglePhotoMode();
      if (e.code === 'KeyL') togglePerformance();
      if (e.code === 'Digit1') applyLook('day');
      if (e.code === 'Digit2') applyLook('sunset');
      if (e.code === 'Digit3') applyLook('night');
    });
  }

  function init() {
    patchMeta();
    createOverlay();
    detectLowPower();
    watchSplash();
    visibilityHandling();
    keyboardShortcuts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
