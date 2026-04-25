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

  /* —— شعار أرسان: علامة ذهبية أنيقة (حرف "أ" stylized + موجة) ——
     استبدلت المكعّب 3D بشعار مسطّح راقٍ
  */
  const LOGO_SVG = (size = 32, color = COLORS.gold) => {
    const w = size;
    const h = size;
    const uid = 'ar' + Math.random().toString(36).slice(2,7);
    return `
    <svg width="${w}" height="${h}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
      <defs>
        <linearGradient id="${uid}-g" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#C2A977"/>
          <stop offset=".5" stop-color="${color}"/>
          <stop offset="1" stop-color="#5E4F36"/>
        </linearGradient>
      </defs>
      <!-- الإطار الدائري الذهبي -->
      <circle cx="50" cy="50" r="44" fill="none" stroke="url(#${uid}-g)" stroke-width="3"/>
      <!-- نقطة علوية صغيرة (تاج) -->
      <circle cx="50" cy="14" r="3.5" fill="url(#${uid}-g)"/>
      <!-- الحرف "أ" مركزياً -->
      <path d="M50 30 L50 70 M40 70 L60 70 M44 50 L56 50"
            stroke="url(#${uid}-g)" stroke-width="4.5"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
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
