/* ===================================================================
   Arsann Brand Identity — official colors + logo
   Pantone 871 C (gold) / Opaque White / Pantone Black CP
   =================================================================== */
(function(){
  'use strict';
  if (window.ArsanBrand) return;

  /* —— الألوان الرسمية —— */
  const COLORS = {
    gold:       '#85714D',  // Pantone 871 C (الذهبي الأساسي)
    goldLight:  '#A89066',  // فاتح للأسطح والـ hover
    goldDark:   '#5E4F36',  // غامق للنصوص على فاتح
    goldSoft:   '#EFE7D5',  // خلفية ناعمة (للـ chips/tags)
    goldGlow:   'rgba(133,113,77,.35)', // ظلال
    white:      '#FFFFFF',
    black:      '#0A0A0A',  // Pantone Black CP
    blackSoft:  '#1A1A1A',
  };

  /* —— شعار A المعيّن المائل (parallelogram 3D، مبسّط من الـ AI) ——
     مقاس قياسي 120×100، يقبل currentColor للون
  */
  const LOGO_SVG = (size = 32, color = COLORS.gold) => {
    const w = size;
    const h = Math.round(size * 0.85);
    return `
    <svg width="${w}" height="${h}" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <defs>
        <linearGradient id="arsan-gold-front-${size}" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#A89066"/>
          <stop offset=".5" stop-color="${color}"/>
          <stop offset="1" stop-color="#5E4F36"/>
        </linearGradient>
        <linearGradient id="arsan-gold-side-${size}" x1="80" y1="0" x2="110" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#5E4F36"/>
          <stop offset="1" stop-color="#3a2f15"/>
        </linearGradient>
      </defs>
      <!-- الجانب الأيمن (العمق ثلاثي الأبعاد) -->
      <path d="M80 5 L110 25 L110 80 L80 95 Z"
            fill="url(#arsan-gold-side-${size})"/>
      <!-- الوجه الأمامي (المعيّن المائل الكبير) -->
      <path d="M20 20 L80 5 L80 95 L20 80 Z"
            fill="url(#arsan-gold-front-${size})"
            stroke="${color}"
            stroke-width="1"
            stroke-linejoin="round"/>
      <!-- الحرف A الأبيض (negative space) -->
      <path d="M35 70 L48 28 L58 28 L72 72 L65 72 L62 60 L46 60 L43 72 Z M48 53 L60 53 L54 35 Z"
            fill="#FFFFFF"
            opacity=".95"/>
      <!-- الحافة العلوية (مضيئة) -->
      <path d="M20 20 L80 5 L110 25 L80 35 Z"
            fill="#A89066"
            opacity=".4"/>
    </svg>
  `;
  };

  /* —— شعار مبسّط جداً (للـ favicon والمواقع الصغيرة) —— */
  const LOGO_MARK_SVG = (size = 24, color = COLORS.gold) => `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <path d="M9 6 L23 6 L26 10 L26 26 L12 26 L9 22 Z"
            fill="${color}"/>
      <path d="M14 22 L16 12 L18 12 L20 22 M15 19 L19 19"
            stroke="#FFFFFF"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"/>
    </svg>
  `;

  /* —— شعار + اسم —— */
  const LOGO_WITH_NAME = (opts = {}) => {
    const size = opts.size || 32;
    const color = opts.color || COLORS.gold;
    const lang = opts.lang || (document.documentElement.lang || 'ar');
    const name = lang === 'en' ? 'ARSANN' : 'أرسان';
    const sub  = opts.subtitle || (lang === 'en' ? 'SOPs Platform' : 'منصّة الإجراءات');
    return `
      <div style="display:flex;align-items:center;gap:10px">
        ${LOGO_SVG(size, color)}
        <div style="line-height:1.1">
          <div style="font-weight:800;font-size:${Math.round(size*0.55)}px;letter-spacing:.5px;color:inherit">${name}</div>
          ${opts.showSub !== false ? `<div style="font-size:${Math.round(size*0.32)}px;opacity:.65;font-weight:500;margin-top:2px">${sub}</div>` : ''}
        </div>
      </div>
    `;
  };

  /* —— حقن favicon ديناميكياً —— */
  function injectFavicon(){
    try{
      const svg = LOGO_MARK_SVG(64, COLORS.gold);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      // أزل القديم
      document.querySelectorAll("link[rel*='icon']").forEach(l => l.remove());
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = url;
      document.head.appendChild(link);
    }catch(e){}
  }

  /* —— حقن متغيّرات CSS الموحّدة —— */
  function injectCSSVars(){
    const css = `
      :root{
        --arsan-gold: ${COLORS.gold};
        --arsan-gold-light: ${COLORS.goldLight};
        --arsan-gold-dark: ${COLORS.goldDark};
        --arsan-gold-soft: ${COLORS.goldSoft};
        --arsan-gold-glow: ${COLORS.goldGlow};
        --arsan-black: ${COLORS.black};
        --arsan-white: ${COLORS.white};
      }
    `;
    const style = document.createElement('style');
    style.id = 'arsan-brand-vars';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* —— تشغيل تلقائي —— */
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => { injectCSSVars(); injectFavicon(); });
  } else {
    injectCSSVars(); injectFavicon();
  }

  window.ArsanBrand = {
    COLORS,
    logo: LOGO_SVG,
    logoMark: LOGO_MARK_SVG,
    logoWithName: LOGO_WITH_NAME,
    injectFavicon,
  };
})();
