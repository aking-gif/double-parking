/* Arsan Themes
 * Seasonal / brand theme system — swap palette at runtime via CSS vars.
 * Applied by setting  html[data-theme="key"]  OR html[data-arsan-theme="key"].
 * Admin opens picker via admin-fab → Themes.
 * Choice persists in localStorage.arsan_theme
 */
(function(){
  'use strict';

  const THEMES = [
    {
      key: 'royal-gold',
      label: { ar: 'الذهب الملكي', en: 'Royal Gold' },
      desc: { ar: 'الهوية الأساسية — دافئة وكلاسيكية', en: 'Core identity — warm & classic' },
      mode: 'dark',
      swatches: ['#1a1510', '#2a2014', '#d4a83c', '#f3e9c9'],
      vars: {
        '--arsan-bg-0':   '#0f0c08',
        '--arsan-bg-1':   '#1a1510',
        '--arsan-bg-2':   '#2a2014',
        '--arsan-ink-0':  '#f3e9c9',
        '--arsan-ink-1':  '#d9c896',
        '--arsan-ink-2':  '#8a7d5d',
        '--arsan-accent': '#d4a83c',
        '--arsan-accent-2':'#b89030',
        '--arsan-danger': '#e63946',
      }
    },
    {
      key: 'desert-ivory',
      label: { ar: 'العاج الصحراوي', en: 'Desert Ivory' },
      desc: { ar: 'وضع نهاري فاخر — بيج ودافئ', en: 'Elevated light mode — beige & warm' },
      mode: 'light',
      swatches: ['#faf6ea', '#f3ead0', '#d4a83c', '#3a2f15'],
      vars: {
        '--arsan-bg-0':   '#fdfaf0',
        '--arsan-bg-1':   '#faf6ea',
        '--arsan-bg-2':   '#f3ead0',
        '--arsan-ink-0':  '#3a2f15',
        '--arsan-ink-1':  '#5a4e30',
        '--arsan-ink-2':  '#8a7d5d',
        '--arsan-accent': '#b89030',
        '--arsan-accent-2':'#a17d26',
        '--arsan-danger': '#c5303c',
      }
    },
    {
      key: 'midnight-sapphire',
      label: { ar: 'ياقوت الليل', en: 'Midnight Sapphire' },
      desc: { ar: 'زرقة ليلية — هادئة وعميقة', en: 'Night blue — calm & deep' },
      mode: 'dark',
      swatches: ['#0b1020', '#162038', '#6e9cf7', '#e8efff'],
      vars: {
        '--arsan-bg-0':   '#060b18',
        '--arsan-bg-1':   '#0b1020',
        '--arsan-bg-2':   '#162038',
        '--arsan-ink-0':  '#e8efff',
        '--arsan-ink-1':  '#b8c4df',
        '--arsan-ink-2':  '#6d7a9a',
        '--arsan-accent': '#6e9cf7',
        '--arsan-accent-2':'#4a7ed3',
        '--arsan-danger': '#ef476f',
      }
    },
    {
      key: 'emerald-oasis',
      label: { ar: 'واحة الزمرد', en: 'Emerald Oasis' },
      desc: { ar: 'أخضر طبيعي — رمضاني ومعاصر', en: 'Natural green — Ramadan & contemporary' },
      mode: 'dark',
      swatches: ['#0a1812', '#14281f', '#5ec28b', '#e6f5ed'],
      vars: {
        '--arsan-bg-0':   '#05110c',
        '--arsan-bg-1':   '#0a1812',
        '--arsan-bg-2':   '#14281f',
        '--arsan-ink-0':  '#e6f5ed',
        '--arsan-ink-1':  '#b5d4c2',
        '--arsan-ink-2':  '#6b8c78',
        '--arsan-accent': '#5ec28b',
        '--arsan-accent-2':'#3e9e6b',
        '--arsan-danger': '#e06b6b',
      }
    },
    {
      key: 'pearl-dawn',
      label: { ar: 'فجر اللؤلؤ', en: 'Pearl Dawn' },
      desc: { ar: 'فاتح ومينيمال — أناقة أوروبية', en: 'Clean & minimal — European refinement' },
      mode: 'light',
      swatches: ['#ffffff', '#f5f5f7', '#6c5ce7', '#1a1a2e'],
      vars: {
        '--arsan-bg-0':   '#ffffff',
        '--arsan-bg-1':   '#f8f8fb',
        '--arsan-bg-2':   '#eceef5',
        '--arsan-ink-0':  '#1a1a2e',
        '--arsan-ink-1':  '#4a4a68',
        '--arsan-ink-2':  '#7a7a95',
        '--arsan-accent': '#6c5ce7',
        '--arsan-accent-2':'#5546c7',
        '--arsan-danger': '#e03e52',
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
        border:1px solid rgba(212,168,60,.3);
        border-radius:16px;
        box-shadow:0 30px 80px rgba(0,0,0,.5);
        color:#f3e9c9;
        overflow:hidden;
      }
      html[data-theme="light"] .arsan-theme-card{
        background:linear-gradient(180deg, rgba(250,246,234,.98), rgba(243,234,208,.96));
        color:#3a2f15;
      }
      .arsan-theme-head{
        padding:18px 22px;
        border-bottom:1px solid rgba(212,168,60,.2);
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
      .arsan-theme-head .x:hover{ opacity:1;background:rgba(212,168,60,.15); }
      .arsan-theme-grid{
        padding:18px;
        display:grid;
        grid-template-columns:repeat(auto-fill, minmax(170px, 1fr));
        gap:12px;
      }
      .arsan-theme-swatch{
        border-radius:12px;
        padding:14px;
        border:2px solid transparent;
        cursor:pointer;
        transition:transform .15s, border-color .15s, box-shadow .15s;
        position:relative;
        overflow:hidden;
      }
      .arsan-theme-swatch:hover{ transform:translateY(-2px); }
      .arsan-theme-swatch.active{
        border-color:#d4a83c;
        box-shadow:0 0 0 3px rgba(212,168,60,.25);
      }
      .arsan-theme-swatch .preview{
        height:70px;
        border-radius:8px;
        display:flex;
        margin-bottom:10px;
        overflow:hidden;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);
      }
      .arsan-theme-swatch .preview span{ flex:1; }
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
        background:#d4a83c;
        color:#fff;
        display:none;
        align-items:center;justify-content:center;
        font-size:12px;font-weight:700;
      }
      .arsan-theme-swatch.active .check{ display:flex; }
      .arsan-theme-foot{
        padding:14px 22px;
        border-top:1px solid rgba(212,168,60,.15);
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
          <div class="name">${theme.label[getLang()] || theme.label.en}</div>
          <div class="desc">${theme.desc[getLang()] || theme.desc.en}</div>
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
