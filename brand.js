/* ===================================================================
   Arsann Brand Identity — Official Brand File
   File: brand.js
   =================================================================== */

(function () {
  'use strict';
  if (window.ArsannBrand) return;

  /* ===============================
     COLORS (Pantone 871C / Black / White)
  =============================== */
  const COLORS = {
    gold: '#3D5A80',
    goldLight: '#98B4D4',
    goldDark: '#293F5C',
    goldSoft: '#DCE7F2',
    goldGlow: 'rgba(61,90,128,.35)',
    white: '#FFFFFF',
    black: '#0A0A0A',
    blackSoft: '#1A1A1A',
  };

  /* ===============================
     OFFICIAL LOGO PATH (from SVG)
     ⚠️ لا يتم تعديل هذا المسار
  =============================== */
  const ARSANN_OFFICIAL_PATH = `
M961.82,557.92l-13.88,14.42v-23.66l13.86-14.3v9.53l.02-.02v14.03h0ZM961.82,583.51l-13.88,14.42v-22.69l13.88-14.41v22.69h0ZM961.82,608.99l-13.88,14.43v-22.6l13.88-14.42v22.59h0ZM961.82,634.47l-13.88,14.43v-22.6l13.88-14.42v22.59h0ZM961.82,659.66l-13.88,14.4v-22.28l13.88-14.41v22.3h0ZM947.94,533.18v-10.17l13.88-14.41v22.29l-.02.02v.25l-13.87,14.43v-12.41h.01ZM947.94,497.53l13.88-14.41v22.59l-13.88,14.41v-22.59ZM947.94,472.04l13.88-14.41v22.59l-13.88,14.41v-22.59ZM947.94,446.47l13.88-14.43v22.7l-13.88,14.42v-22.7h0ZM947.94,419.91l13.88-14.32v23.57l-13.88,14.42v-23.67ZM974.22,402.37h-12.4l-15.45,16.08l-.15.15l-.29.31c-.09.07-.15.18-.15.32v128.76h0v128.9c0,.57.33.75.91.75h9.69c.47,0,.9-.24,1.4-.77l16.44-17.04v-128.68h-.08l.08-.09v-128.68h0Z
`;

  /* ===============================
     LOGO GENERATORS
  =============================== */

  /* صورة الحصان الأسود (الأدهم) — للجولة التعريفية والمساعد الذكي فقط */
  const HORSE_IMG = './adham.png';

  /* شعار الشركة الرسمي — SVG path الموحّد (للموقع كله) */
  const LOGO_SVG = (size = 32, color = COLORS.gold) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
         viewBox="940 395 30 290" preserveAspectRatio="xMidYMid meet"
         style="display:block">
      <path d="${ARSANN_OFFICIAL_PATH}" fill="${color}"/>
    </svg>
  `;

  const LOGO_MARK_SVG = (size = 24, color = COLORS.gold) => LOGO_SVG(size, color);

  /* alias للتوافق مع الكود القديم */
  const LOGO_PATH_SVG = LOGO_SVG;

  /* صورة الأدهم — للجولة التعريفية والمساعد الذكي فقط */
  const HORSE_LOGO = (size = 64) => `
    <img src="${HORSE_IMG}" alt="الأدهم"
         style="width:${size}px;height:${size}px;display:block;object-fit:contain;
                filter:drop-shadow(0 2px 4px rgba(0,0,0,.2))" />
  `;

  const LOGO_WITH_NAME = (opts = {}) => {
    const size = opts.size || 32;
    const color = opts.color || COLORS.gold;
    const lang = opts.lang || document.documentElement.lang || 'ar';

    const name = lang === 'en' ? 'ARSANN' : 'أرسان';
    const sub = opts.subtitle || (lang === 'en' ? 'Parking Solutions' : 'حلول مواقف ذكية');

    return `
      <div style="display:flex;align-items:center;gap:10px;color:${color}">
        ${LOGO_SVG(size, color)}
        <div style="line-height:1.1">
          <div style="font-weight:800;font-size:${Math.round(size * 0.55)}px;">
            ${name}
          </div>
          ${
            opts.showSub !== false
              ? `<div style="font-size:${Math.round(size * 0.32)}px;opacity:.65;margin-top:2px">
                  ${sub}
                 </div>`
              : ''
          }
        </div>
      </div>
    `;
  };

  /* ===============================
     CSS VARIABLES INJECTION
  =============================== */
  function injectCSSVars() {
    if (document.getElementById('arsann-brand-vars')) return;

    const css = `
      :root {
        --arsann-gold: ${COLORS.gold};
        --arsann-gold-light: ${COLORS.goldLight};
        --arsann-gold-dark: ${COLORS.goldDark};
        --arsann-gold-soft: ${COLORS.goldSoft};
        --arsann-black: ${COLORS.black};
        --arsann-white: ${COLORS.white};
      }
    `;

    const style = document.createElement('style');
    style.id = 'arsann-brand-vars';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ===============================
     FAVICON INJECTION
  =============================== */
  function injectFavicon() {
    try {
      document.querySelectorAll("link[rel*='icon']").forEach(l => l.remove());
      // Build a small SVG favicon from the official path
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="940 395 30 290"><path d="${ARSANN_OFFICIAL_PATH}" fill="${COLORS.gold}"/></svg>`;
      const dataUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = dataUri;
      document.head.appendChild(link);
      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = dataUri;
      document.head.appendChild(apple);
    } catch (e) {}
  }

  /* ===============================
     AUTO INIT
  =============================== */
  function init() {
    injectCSSVars();
    injectFavicon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ===============================
     GLOBAL EXPORT — both spellings for backwards compat
  =============================== */
  const api = {
    COLORS,
    logo: LOGO_SVG,
    logoMark: LOGO_MARK_SVG,
    logoPath: LOGO_PATH_SVG,
    logoWithName: LOGO_WITH_NAME,
    horseLogo: HORSE_LOGO,
    horseImg: HORSE_IMG,
    injectFavicon,
    injectCSSVars,
  };

  window.ArsannBrand = api;
  // Backwards-compat alias for older code that uses the single-N spelling
  window.ArsanBrand = api;

})();
