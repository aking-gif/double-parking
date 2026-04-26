/* Arsan Themes
 * Seasonal / brand theme system — swap palette at runtime via CSS vars.
 * Applied by setting  html[data-theme="key"]  OR html[data-arsan-theme="key"].
 * Admin opens picker via admin-fab → Themes.
 * Choice persists in localStorage.arsan_theme
 */
(function(){
  'use strict';

  // Arsan brand palette: gold #3D5A80, deep brown #293F5C, ivory #E8EEF5, dark #0F1B2D
  // All themes harmonize around the brand gold or use it as a subtle accent.
  const THEMES = [
    {
      key: 'royal-gold',
      label: { ar: 'الذهب الملكي', en: 'Royal Gold' },
      desc: { ar: 'الهوية الأساسية — دافئة وكلاسيكية', en: 'Core brand — warm & classic' },
      mode: 'dark',
      swatches: ['#0A1422', '#0F1B2D', '#3D5A80', '#E8EEF5'],
      vars: {
        '--arsan-bg-0':   '#0A1422',
        '--arsan-bg-1':   '#0F1B2D',
        '--arsan-bg-2':   '#2a2014',
        '--arsan-ink-0':  '#E8EEF5',
        '--arsan-ink-1':  '#d9c896',
        '--arsan-ink-2':  '#8a7d5d',
        '--arsan-accent': '#3D5A80',
        '--arsan-accent-2':'#293F5C',
        '--arsan-danger': '#e63946',
      }
    },
    {
      key: 'desert-ivory',
      label: { ar: 'العاج الصحراوي', en: 'Desert Ivory' },
      desc: { ar: 'وضع نهاري — بيج فاخر مع ذهبي أرسان', en: 'Light mode — luxe beige + Arsan gold' },
      mode: 'light',
      swatches: ['#fdfaf0', '#f3ead0', '#3D5A80', '#1A2942'],
      vars: {
        '--arsan-bg-0':   '#fdfaf0',
        '--arsan-bg-1':   '#f8f1dc',
        '--arsan-bg-2':   '#f0e4c2',
        '--arsan-ink-0':  '#1A2942',
        '--arsan-ink-1':  '#5a4e30',
        '--arsan-ink-2':  '#8a7d5d',
        '--arsan-accent': '#3D5A80',
        '--arsan-accent-2':'#293F5C',
        '--arsan-danger': '#c5303c',
      }
    },
    {
      key: 'obsidian-gold',
      label: { ar: 'سبج وذهب', en: 'Obsidian Gold' },
      desc: { ar: 'أسود فحمي مع لمسات ذهبية — مسائي وفاخر', en: 'Charcoal + gold accents — evening luxury' },
      mode: 'dark',
      swatches: ['#0a0a0c', '#16161a', '#c9a85c', '#ede0bf'],
      vars: {
        '--arsan-bg-0':   '#06060a',
        '--arsan-bg-1':   '#0e0e12',
        '--arsan-bg-2':   '#1c1c22',
        '--arsan-ink-0':  '#ede0bf',
        '--arsan-ink-1':  '#bfb393',
        '--arsan-ink-2':  '#7a7363',
        '--arsan-accent': '#c9a85c',
        '--arsan-accent-2':'#9c7f3a',
        '--arsan-danger': '#e63946',
      }
    },
    {
      key: 'sand-stone',
      label: { ar: 'الحجر الرملي', en: 'Sandstone' },
      desc: { ar: 'بيج ترابي ناعم — هادئ ومريح للقراءة', en: 'Warm stone — calm & easy to read' },
      mode: 'light',
      swatches: ['#f7f1e3', '#ebe0c4', '#9b6b3f', '#3d2817'],
      vars: {
        '--arsan-bg-0':   '#fbf7ec',
        '--arsan-bg-1':   '#f4ecd6',
        '--arsan-bg-2':   '#e8dcb8',
        '--arsan-ink-0':  '#3d2817',
        '--arsan-ink-1':  '#6b4a2d',
        '--arsan-ink-2':  '#8c7458',
        '--arsan-accent': '#9b6b3f',
        '--arsan-accent-2':'#6e4a28',
        '--arsan-danger': '#b83a30',
      }
    },
    {
      key: 'midnight-bronze',
      label: { ar: 'برونز الليل', en: 'Midnight Bronze' },
      desc: { ar: 'كحلي عميق مع برونزي — هويّة مكتبية', en: 'Deep navy + bronze — executive feel' },
      mode: 'dark',
      swatches: ['#0c1220', '#172238', '#b88a4d', '#e8d9b8'],
      vars: {
        '--arsan-bg-0':   '#070b18',
        '--arsan-bg-1':   '#0e1525',
        '--arsan-bg-2':   '#1a2440',
        '--arsan-ink-0':  '#e8d9b8',
        '--arsan-ink-1':  '#bcb494',
        '--arsan-ink-2':  '#7a8099',
        '--arsan-accent': '#b88a4d',
        '--arsan-accent-2':'#8a6532',
        '--arsan-danger': '#ef476f',
      }
    },
    {
      key: 'pearl-dawn',
      label: { ar: 'فجر اللؤلؤ', en: 'Pearl Dawn' },
      desc: { ar: 'أبيض ناصع مع ذهبي خفيف — مينيمال', en: 'Crisp white + soft gold — minimal' },
      mode: 'light',
      swatches: ['#ffffff', '#f5f1e8', '#3D5A80', '#0F1B2D'],
      vars: {
        '--arsan-bg-0':   '#ffffff',
        '--arsan-bg-1':   '#fbf8f1',
        '--arsan-bg-2':   '#f0ead9',
        '--arsan-ink-0':  '#0F1B2D',
        '--arsan-ink-1':  '#4a4032',
        '--arsan-ink-2':  '#8a7d5d',
        '--arsan-accent': '#3D5A80',
        '--arsan-accent-2':'#293F5C',
        '--arsan-danger': '#c5303c',
      }
    },
  ];

  const STORE_KEY = 'arsan_theme';
  const DEFAULT_KEY = 'royal-gold';

  function getLang(){ return (localStorage.getItem('arsan_lang') || 'ar'); }
  function t(ar, en){ return getLang() === 'en' ? en : ar; }

  function getCurrent(){
    return localStorage.getItem(STORE_KEY) || DEFAULT_KEY;
  }

  function apply(key){
    const theme = THEMES.find(t => t.key === key) || THEMES[0];
    const root = document.documentElement;
    // Sync both the legacy data-theme (light|dark) and the specific arsan-theme key
    root.setAttribute('data-arsan-theme', theme.key);
    root.setAttribute('data-theme', theme.mode);
    // Inject CSS variables
    let styleEl = document.getElementById('arsan-theme-vars');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'arsan-theme-vars';
      document.head.appendChild(styleEl);
    }
    const cssLines = Object.entries(theme.vars).map(([k,v]) => `  ${k}: ${v};`).join('\n');

    // Map Arsan theme tokens → legacy dashboard tokens so both layouts respond.
    const v = theme.vars;
    const isDark = theme.mode === 'dark';
    // Simple helpers to derive soft/hover/line tones without extra palette work
    const hex = (c) => c.replace('#','');
    const mix = (a, b, pct) => {
      // pct=0 → a, pct=1 → b
      const ah = hex(a), bh = hex(b);
      const ar_ = parseInt(ah.slice(0,2),16), ag = parseInt(ah.slice(2,4),16), ab_ = parseInt(ah.slice(4,6),16);
      const br_ = parseInt(bh.slice(0,2),16), bg = parseInt(bh.slice(2,4),16), bb = parseInt(bh.slice(4,6),16);
      const r = Math.round(ar_ + (br_-ar_)*pct), g = Math.round(ag + (bg-ag)*pct), b2 = Math.round(ab_ + (bb-ab_)*pct);
      return '#' + [r,g,b2].map(x => x.toString(16).padStart(2,'0')).join('');
    };

    const legacyLines = [
      `  --bg: ${v['--arsan-bg-1']};`,
      `  --bg-0: ${v['--arsan-bg-0']};`,
      `  --bg-1: ${v['--arsan-bg-1']};`,
      `  --bg-2: ${v['--arsan-bg-2']};`,
      `  --surface: ${isDark ? v['--arsan-bg-1'] : '#ffffff'};`,
      `  --surface-2: ${v['--arsan-bg-2']};`,
      `  --ink: ${v['--arsan-ink-0']};`,
      `  --ink-2: ${v['--arsan-ink-1']};`,
      `  --ink-3: ${v['--arsan-ink-2']};`,
      `  --line: ${mix(v['--arsan-bg-2'], v['--arsan-ink-0'], 0.12)};`,
      `  --line-2: ${mix(v['--arsan-bg-1'], v['--arsan-ink-0'], 0.07)};`,
      `  --accent: ${v['--arsan-accent']};`,
      `  --accent-2: ${v['--arsan-accent-2']};`,
      `  --accent-ink: ${isDark ? v['--arsan-accent'] : v['--arsan-accent-2']};`,
      `  --accent-soft: ${mix(v['--arsan-bg-1'], v['--arsan-accent'], 0.15)};`,
      `  --accent-softer: ${mix(v['--arsan-bg-1'], v['--arsan-accent'], 0.07)};`,
      `  --header-bg: ${v['--arsan-bg-0']};`,
      `  --header-ink: ${v['--arsan-ink-0']};`,
      `  --header-muted: ${v['--arsan-ink-2']};`,
      `  --chip-bg: ${v['--arsan-bg-2']};`,
      `  --chip-ink: ${v['--arsan-ink-1']};`,
      `  --chip-active-bg: ${v['--arsan-accent']};`,
      `  --chip-active-ink: ${isDark ? v['--arsan-bg-0'] : '#ffffff'};`,
      `  --danger: ${v['--arsan-danger']};`,
    ].join('\n');

    // !important on every custom property so it overrides dashboard.html's page-level :root block
    styleEl.textContent = `
      html[data-arsan-theme]:root,
      html[data-arsan-theme],
      html[data-theme="${theme.mode}"][data-arsan-theme]{
        ${cssLines}
        ${legacyLines}
      }
    `;
    localStorage.setItem(STORE_KEY, theme.key);
    // Broadcast so other widgets can update
    window.dispatchEvent(new CustomEvent('arsan-theme-change', { detail: { key: theme.key, mode: theme.mode } }));
  }

  function injectPickerStyles(){
    if (document.getElementById('arsan-theme-picker-styles')) return;
    const s = document.createElement('style');
    s.id = 'arsan-theme-picker-styles';
    s.textContent = `
      .arsan-theme-overlay{
        position:fixed;inset:0;z-index:9700;
        background:rgba(0,0,0,.55);
        backdrop-filter:blur(6px);
        display:none;align-items:center;justify-content:center;
        padding:20px;
      }
      .arsan-theme-overlay.open{ display:flex; }
      .arsan-theme-card{
        width:100%;max-width:640px;
        background:linear-gradient(180deg, rgba(26,21,16,.96), rgba(35,26,16,.94));
        backdrop-filter:blur(24px);
        border:1px solid rgba(61,90,128,.3);
        border-radius:16px;
        box-shadow:0 30px 80px rgba(0,0,0,.5);
        color:#E8EEF5;
        overflow:hidden;
      }
      html[data-theme="light"] .arsan-theme-card{
        background:linear-gradient(180deg, rgba(250,246,234,.98), rgba(243,234,208,.96));
        color:#1A2942;
      }
      .arsan-theme-head{
        padding:18px 22px;
        border-bottom:1px solid rgba(61,90,128,.2);
        display:flex;align-items:center;justify-content:space-between;
      }
      .arsan-theme-head h2{
        margin:0;font-size:17px;font-weight:600;
      }
      .arsan-theme-head .sub{
        font-size:12px;opacity:.6;margin-top:2px;
      }
      .arsan-theme-head .x{
        background:transparent;border:none;color:inherit;
        font-size:22px;cursor:pointer;opacity:.6;
        width:30px;height:30px;border-radius:6px;
      }
      .arsan-theme-head .x:hover{ opacity:1;background:rgba(61,90,128,.15); }
      .arsan-theme-grid{
        padding:18px;
        display:grid;
        grid-template-columns:repeat(auto-fill, minmax(190px, 1fr));
        gap:14px;
        max-height:65vh;
        overflow-y:auto;
      }
      .arsan-theme-swatch{
        border-radius:14px;
        padding:0;
        border:2px solid rgba(61,90,128,.15);
        cursor:pointer;
        transition:transform .15s, border-color .15s, box-shadow .15s;
        position:relative;
        overflow:hidden;
        background:rgba(255,255,255,.02);
      }
      html[data-theme="light"] .arsan-theme-swatch{
        background:rgba(0,0,0,.02);
        border-color:rgba(61,90,128,.2);
      }
      .arsan-theme-swatch:hover{
        transform:translateY(-2px);
        border-color:rgba(61,90,128,.5);
        box-shadow:0 8px 20px rgba(0,0,0,.3);
      }
      .arsan-theme-swatch.active{
        border-color:#3D5A80;
        box-shadow:0 0 0 3px rgba(61,90,128,.35);
      }
      .arsan-theme-swatch .preview{
        height:90px;
        display:flex;
        overflow:hidden;
        position:relative;
      }
      .arsan-theme-swatch .preview span{
        flex:1;
        position:relative;
      }
      .arsan-theme-swatch .preview span:not(:last-child){
        border-inline-end:1px solid rgba(0,0,0,.08);
      }
      .arsan-theme-swatch .meta{
        padding:12px 14px 14px;
      }
      .arsan-theme-swatch .name{
        font-size:13px;font-weight:600;margin-bottom:2px;
      }
      .arsan-theme-swatch .desc{
        font-size:11px;opacity:.65;line-height:1.4;
      }
      .arsan-theme-swatch .check{
        position:absolute;
        top:8px; inset-inline-end:8px;
        width:22px;height:22px;
        border-radius:50%;
        background:#3D5A80;
        color:#fff;
        display:none;
        align-items:center;justify-content:center;
        font-size:12px;font-weight:700;
      }
      .arsan-theme-swatch.active .check{ display:flex; }
      .arsan-theme-foot{
        padding:14px 22px;
        border-top:1px solid rgba(61,90,128,.15);
        font-size:11px;opacity:.6;
        display:flex;align-items:center;gap:8px;
      }
    `;
    document.head.appendChild(s);
  }

  function openPicker(){
    injectPickerStyles();
    let o = document.getElementById('arsan-theme-overlay');
    if (o) o.remove();
    o = document.createElement('div');
    o.id = 'arsan-theme-overlay';
    o.className = 'arsan-theme-overlay open';
    const current = getCurrent();
    const swatchesHtml = THEMES.map(theme => {
      const isActive = theme.key === current;
      const colors = theme.swatches.map(c => `<span style="background:${c}"></span>`).join('');
      return `
        <div class="arsan-theme-swatch ${isActive?'active':''}" data-key="${theme.key}">
          <div class="check">✓</div>
          <div class="preview">${colors}</div>
          <div class="meta">
            <div class="name">${theme.label[getLang()] || theme.label.en}</div>
            <div class="desc">${theme.desc[getLang()] || theme.desc.en}</div>
          </div>
        </div>
      `;
    }).join('');
    o.innerHTML = `
      <div class="arsan-theme-card" role="dialog" aria-modal="true">
        <div class="arsan-theme-head">
          <div>
            <h2>${t('اختَر الثيم','Choose Theme')}</h2>
            <div class="sub">${t('أطلق ثيماً جديداً مع كل موسم أو مناسبة','Release a new theme each season or occasion')}</div>
          </div>
          <button class="x" type="button" aria-label="Close">✕</button>
        </div>
        <div class="arsan-theme-grid">${swatchesHtml}</div>
        <div class="arsan-theme-foot">
          ${t('يُطبَّق على هذا الجهاز فوراً. أطلِقه لكل فريقك بالضغط على "نشر كإعلان".','Applied on this device instantly. Publish to the whole team via "Post announcement".')}
        </div>
      </div>
    `;
    document.body.appendChild(o);
    o.querySelector('.x').addEventListener('click', () => o.remove());
    o.addEventListener('click', e => { if (e.target === o) o.remove(); });
    o.querySelectorAll('.arsan-theme-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const k = sw.dataset.key;
        apply(k);
        o.querySelectorAll('.arsan-theme-swatch').forEach(x => x.classList.toggle('active', x === sw));
      });
    });
  }

  function init(){
    // Apply saved theme ASAP
    apply(getCurrent());
  }

  // Run synchronously so the theme lands before paint
  init();

  window.ArsanThemes = {
    list: THEMES,
    current: getCurrent,
    apply,
    openPicker
  };
})();
