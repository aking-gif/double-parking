/* =================================================================
   Aurora Runtime — theme toggle, time-based aurora, animated counters,
   sparkline helper, confetti for task completion
   ================================================================= */
(function(){
  if (window.__auroraLoaded) return;
  window.__auroraLoaded = true;

  // ===== Theme toggle =====
  const THEME_KEY = 'arsann_theme_v1';
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    updateAurora();
  }
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);

  window.toggleTheme = function(){
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  };

  // ===== Time-based aurora =====
  // Hour-aware tint shifts subtly through day
  function updateAurora(){
    const h = new Date().getHours();
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    let tintA, tintB, posA = '80% -10%', posB = '10% 110%';
    if (h < 6){
      // Late night — deep blue/purple
      tintA = isDark ? 'rgba(120,80,200,.10)' : 'rgba(120,80,200,.18)';
      tintB = isDark ? 'rgba(60,100,180,.08)' : 'rgba(60,100,180,.12)';
    } else if (h < 11){
      // Morning — warm gold + soft pink
      tintA = isDark ? 'rgba(232,168,96,.14)' : 'rgba(232,168,96,.22)';
      tintB = isDark ? 'rgba(255,150,180,.08)' : 'rgba(255,150,180,.14)';
    } else if (h < 16){
      // Midday — bright blue + gold
      tintA = isDark ? 'rgba(232,168,96,.10)' : 'rgba(232,168,96,.18)';
      tintB = isDark ? 'rgba(96,160,232,.10)' : 'rgba(96,160,232,.16)';
    } else if (h < 19){
      // Late afternoon — amber + coral
      tintA = isDark ? 'rgba(255,140,80,.14)' : 'rgba(255,140,80,.20)';
      tintB = isDark ? 'rgba(232,168,96,.10)' : 'rgba(232,168,96,.18)';
    } else if (h < 22){
      // Evening — deep amber + violet
      tintA = isDark ? 'rgba(232,120,80,.12)' : 'rgba(232,120,80,.18)';
      tintB = isDark ? 'rgba(140,100,200,.08)' : 'rgba(140,100,200,.14)';
    } else {
      // Night — indigo + soft gold
      tintA = isDark ? 'rgba(100,80,200,.10)' : 'rgba(100,80,200,.16)';
      tintB = isDark ? 'rgba(232,168,96,.08)' : 'rgba(232,168,96,.14)';
    }
    document.documentElement.style.setProperty('--aurora-1', `radial-gradient(800px 500px at ${posA}, ${tintA}, transparent 60%)`);
    document.documentElement.style.setProperty('--aurora-2', `radial-gradient(700px 500px at ${posB}, ${tintB}, transparent 60%)`);
  }
  updateAurora();
  // Update every 30 min
  setInterval(updateAurora, 30 * 60 * 1000);

  // ===== Animated counter =====
  // Usage: <span data-count="247" data-format="number"></span>
  // formats: 'number' (default), 'currency' (1.2M), 'percent' (89%)
  function animateCount(el){
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const fmt = el.dataset.format || 'number';
    const dur = parseInt(el.dataset.duration || '900');
    const decimals = parseInt(el.dataset.decimals || '0');
    const start = performance.now();
    const from = 0;
    function step(now){
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const val = from + (target - from) * eased;
      el.textContent = format(val, fmt, decimals);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = format(target, fmt, decimals);
    }
    requestAnimationFrame(step);
  }
  function format(n, fmt, decimals){
    if (fmt === 'currency'){
      if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
      if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
      return Math.round(n).toLocaleString('ar-SA');
    }
    if (fmt === 'percent') return Math.round(n) + '%';
    return n.toLocaleString('ar-SA', { maximumFractionDigits: decimals });
  }
  function startCounters(root){
    (root || document).querySelectorAll('[data-count]:not([data-counted])').forEach(el => {
      el.dataset.counted = '1';
      animateCount(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => startCounters());
  else startCounters();
  window.AuroraCounter = { start: startCounters, animate: animateCount };

  // ===== Sparkline generator =====
  // Usage: <svg class="ar-spark" data-spark="10,12,9,15,18,16,22,25" data-color="#E8A860"></svg>
  function buildSpark(svg){
    const data = (svg.dataset.spark || '').split(',').map(parseFloat).filter(n => !isNaN(n));
    if (data.length < 2) return;
    const color = svg.dataset.color || 'var(--brand)';
    const W = 200, H = 36;
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const step = W / (data.length - 1);
    const pts = data.map((v, i) => [i * step, H - 4 - ((v - min) / range) * (H - 8)]);
    const line = pts.map((p, i) => (i === 0 ? 'M ' : 'L ') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const fill = line + ` L ${W} ${H} L 0 ${H} Z`;
    const id = 'sg' + Math.random().toString(36).slice(2, 7);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = `
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity=".35"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${fill}" fill="url(#${id})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="2.5" fill="${color}"/>
    `;
  }
  function startSparks(root){
    (root || document).querySelectorAll('svg.ar-spark[data-spark]:not([data-sparked])').forEach(s => {
      s.dataset.sparked = '1';
      buildSpark(s);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => startSparks());
  else startSparks();
  window.AuroraSpark = { start: startSparks, build: buildSpark };

  // ===== Confetti (lightweight, no deps) =====
  function confetti(opts){
    opts = opts || {};
    const x = opts.x || window.innerWidth / 2;
    const y = opts.y || window.innerHeight / 2;
    const count = opts.count || 80;
    const colors = opts.colors || ['#E8A860','#87C0FF','#87E0A8','#FF8888','#C087FF','#FFD060'];
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999';
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const parts = [];
    for (let i = 0; i < count; i++){
      const a = Math.random() * Math.PI * 2;
      const v = 6 + Math.random() * 8;
      parts.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4,
        size: 4 + Math.random() * 6,
        color: colors[i % colors.length],
        rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .4,
        life: 60 + Math.random() * 30,
      });
    }
    function frame(){
      ctx.clearRect(0, 0, cv.width, cv.height);
      let alive = 0;
      for (const p of parts){
        p.life--;
        if (p.life <= 0) continue;
        alive++;
        p.vy += .35; p.vx *= .99;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * .4);
        ctx.restore();
      }
      if (alive > 0) requestAnimationFrame(frame);
      else cv.remove();
    }
    requestAnimationFrame(frame);
  }
  window.AuroraConfetti = confetti;

  // ===== Greet helper =====
  window.AuroraGreet = function(){
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'صباح الخير';
    if (h >= 12 && h < 17) return 'مساء الخير';
    if (h >= 17 && h < 22) return 'مساء النور';
    return 'سهرة سعيدة';
  };

  // ===== Auto-init theme toggle on any [data-theme-toggle] =====
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-theme-toggle]');
    if (t){ window.toggleTheme(); }
  });
})();
