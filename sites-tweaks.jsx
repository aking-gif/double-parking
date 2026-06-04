/* ============================================================
   sites.html — Tweaks panel app
   Snapshot baseline: v3.0.0 (pre team-share)
   Loads after tweaks-panel.jsx (provides useTweaks + Tweak* controls).
   Applies live to the page via CSS vars / body classes / global flags.
   ============================================================ */

const SITES_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C9A961",
  "density": "comfortable",
  "cardWidth": 360,
  "showMap": true,
  "showStatusbar": true,
  "motion": true,
  "dataMode": "auto",
  "autoRefresh": true
}/*EDITMODE-END*/;

// ---- helpers ----
function hexToRgb(h){
  h = String(h || '').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function darkenHex(h, f){
  const [r, g, b] = hexToRgb(h);
  const d = x => Math.max(0, Math.round(x * (1 - f)));
  return '#' + [d(r), d(g), d(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function applyAccent(hex){
  const [r, g, b] = hexToRgb(hex);
  const s = document.documentElement.style;
  s.setProperty('--accent', hex);
  s.setProperty('--accent-2', darkenHex(hex, 0.12));
  s.setProperty('--accent-soft', `rgba(${r},${g},${b},0.10)`);
  s.setProperty('--accent-line', `rgba(${r},${g},${b},0.25)`);
}

function SitesTweaks(){
  const [t, setTweak] = useTweaks(SITES_TWEAK_DEFAULTS);

  React.useEffect(() => { applyAccent(t.accent); }, [t.accent]);
  React.useEffect(() => {
    document.documentElement.style.setProperty('--site-grid-min', t.cardWidth + 'px');
  }, [t.cardWidth]);
  React.useEffect(() => {
    document.body.classList.toggle('density-compact', t.density === 'compact');
  }, [t.density]);
  React.useEffect(() => {
    document.body.classList.toggle('hide-map', !t.showMap);
  }, [t.showMap]);
  React.useEffect(() => {
    document.body.classList.toggle('hide-statusbar', !t.showStatusbar);
  }, [t.showStatusbar]);
  React.useEffect(() => {
    document.body.classList.toggle('motion-off', !t.motion);
  }, [t.motion]);
  React.useEffect(() => {
    window.SITES_AUTO_REFRESH = !!t.autoRefresh;
  }, [t.autoRefresh]);
  React.useEffect(() => {
    window.SITES_MODE = t.dataMode;
    if (typeof window.reloadSites === 'function') window.reloadSites();
  }, [t.dataMode]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="المظهر · Appearance" />
      <TweakColor label="اللون المميّز" value={t.accent}
        options={['#C9A961', '#5BA37A', '#5B8DEF', '#D98C8C']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakRadio label="الكثافة" value={t.density}
        options={['comfortable', 'compact']}
        onChange={(v) => setTweak('density', v)} />
      <TweakSlider label="عرض البطاقة" value={t.cardWidth} min={300} max={460} step={20} unit="px"
        onChange={(v) => setTweak('cardWidth', v)} />

      <TweakSection label="العرض · Layout" />
      <TweakToggle label="شريط الخريطة" value={t.showMap}
        onChange={(v) => setTweak('showMap', v)} />
      <TweakToggle label="شريط الحالة العلوي" value={t.showStatusbar}
        onChange={(v) => setTweak('showStatusbar', v)} />
      <TweakToggle label="الحركة والتأثيرات" value={t.motion}
        onChange={(v) => setTweak('motion', v)} />

      <TweakSection label="البيانات · Data" />
      <TweakRadio label="المصدر" value={t.dataMode}
        options={['auto', 'demo', 'live']}
        onChange={(v) => setTweak('dataMode', v)} />
      <TweakToggle label="تحديث مباشر تلقائي" value={t.autoRefresh}
        onChange={(v) => setTweak('autoRefresh', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<SitesTweaks />);
