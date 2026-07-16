(() => {
  'use strict';


  // Ignore accidental DOM URLs serialized as the literal string "null" by the archived build.
  try {
    const originalSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      if ((name === 'src' || name === 'href') && (value === null || value === undefined || String(value).trim().toLowerCase() === 'null')) {
        this.removeAttribute(name);
        return;
      }
      return originalSetAttribute.call(this, name, value);
    };
  } catch (_) {}

  const set = (key, value) => localStorage.setItem(key, String(value));
  const getInt = (key, fallback) => {
    const value = Number.parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(value) ? value : fallback;
  };

  try {
    const params = new URLSearchParams(location.search);
    const reset = params.get('resetCT') === '1';
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || matchMedia('(max-width: 760px)').matches;
    const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
    const lowRam = Number(navigator.deviceMemory || 8) <= 4;
    const constrained = mobile && (lowCpu || lowRam);
    const forcedLite = sessionStorage.getItem('ct-force-lite-v3') === '1';
    const profile = forcedLite || constrained ? 'mobile-lite' : mobile ? 'mobile-balanced' : 'desktop-balanced';
    const profileKey = 'ct-graphics-profile-v4';

    // Keep this private preview self-contained and avoid remote analytics/location calls.
    set('analytics_disable', 'true');
    set('analytics-nowrite', 'true');
    if (mobile) set('force-allow-mobile', 'true');

    if (reset || localStorage.getItem(profileKey) !== profile) {
      if (profile === 'mobile-lite') {
        set('config-view-lod-index', 1);
        set('config-detail-lod-index', 0);
        set('config-antialias', false);
        set('config-render-scale', 0); // 0.5x internal render scale
      } else if (profile === 'mobile-balanced') {
        set('config-view-lod-index', 2);
        set('config-detail-lod-index', 1);
        set('config-antialias', false);
        set('config-render-scale', 1); // 0.75x
      } else {
        set('config-view-lod-index', 3);
        set('config-detail-lod-index', 2);
        set('config-antialias', true);
        set('config-render-scale', 2); // 1.0x; avoid expensive 1.5x defaulting
      }
      set(profileKey, profile);
    }

    // Clamp corrupted or overly expensive values from previous sessions.
    set('config-view-lod-index', Math.max(0, Math.min(4, getInt('config-view-lod-index', 2))));
    set('config-detail-lod-index', Math.max(0, Math.min(3, getInt('config-detail-lod-index', 1))));
    set('config-render-scale', Math.max(0, Math.min(2, getInt('config-render-scale', 2))));

    if (localStorage.getItem('Units') === null) set('Units', 1);
    if (localStorage.getItem('ShowWorm') === null) set('ShowWorm', 2);
    if (localStorage.getItem('AutoPause') === null) set('AutoPause', 0);
    if (localStorage.getItem('Barriers') === null) set('Barriers', true);

    // Use the engine's native curvature-aware auto driver and cruise controller.
    set('has-autodrive', true);
    if (localStorage.getItem('speed-control_enabled') === null) set('speed-control_enabled', true);
    if (localStorage.getItem('speed-control_speed') === null) set('speed-control_speed', 80 / 3.6);
    if (localStorage.getItem('speed-control_control') === null) set('speed-control_control', 0);
  } catch (error) {
    console.warn('[Co Thach Drive] Startup profile could not be applied.', error);
  }
})();
