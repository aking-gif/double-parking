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

  /* —— شعار أرسان: المعيّن المائل ثلاثي الأبعاد (Pantone 871) ——
     مطابق للأصل: parallelogram أصفر/ذهبي بدون نص داخلي
  */
  const LOGO_SVG = (size = 32, color = COLORS.gold) => {
    const w = size;
    const h = Math.round(size * 0.92);
    return `
    <svg width="${w}" height="${h}" viewBox="0 0 100 92" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <defs>
        <linearGradient id="arsan-front-${size}" x1="10" y1="20" x2="70" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#A89066"/>
          <stop offset=".55" stop-color="${color}"/>
          <stop offset="1" stop-color="#5E4F36"/>
        </linearGradient>
        <linearGradient id="arsan-side-${size}" x1="70" y1="5" x2="95" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#5E4F36"/>
          <stop offset="1" stop-color="#2e2511"/>
        </linearGradient>
        <linearGradient id="arsan-top-${size}" x1="0" y1="0" x2="100" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#C2A977"/>
          <stop offset="1" stop-color="#7a6638"/>
        </linearGradient>
      </defs>
      <!-- الوجه الجانبي اليمين (العمق) -->
      <path d="M70 13 L95 30 L95 78 L70 90 Z"
            fill="url(#arsan-side-${size})"/>
      <!-- الوجه العلوي (الحافة المضيئة) -->
      <path d="M15 18 L70 4 L95 18 L70 28 Z"
            fill="url(#arsan-top-${size})"/>
      <!-- الوجه الأمامي الكبير -->
      <path d="M15 18 L70 13 L70 90 L15 75 Z"
            fill="url(#arsan-front-${size})"
            stroke="${color}"
            stroke-width=".8"
            stroke-linejoin="round"/>
      <!-- لمعة (highlight) -->
      <path d="M22 28 L62 22 L62 30 L22 35 Z"
            fill="#FFFFFF"
            opacity=".12"/>
    </svg>
  `;
  };

  /* —— شعار مبسّط جداً (للـ favicon والمواقع الصغيرة) —— */
  const LOGO_MARK_SVG = (size = 24, color = COLORS.gold) => `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <path d="M22 4 L29 9 L29 26 L22 29 Z" fill="#5E4F36"/>
      <path d="M5 7 L22 4 L29 9 L22 11 Z" fill="#A89066"/>
      <path d="M5 7 L22 4 L22 29 L5 25 Z" fill="${color}"/>
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
