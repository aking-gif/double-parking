/* Direction 2: Glass Aurora — dark + aurora gradients + glass cards + animated numbers */
const Dir2Home = () => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(v + 7, 247);
      setCount(v);
      if (v >= 247) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={d2Styles.page}>
      <div style={d2Styles.aurora}/>
      <div style={d2Styles.auroraB}/>

      <header style={d2Styles.topbar}>
        <div style={d2Styles.brand}>
          <span style={d2Styles.brandMark}>A</span>
          <span style={d2Styles.brandName}>Arsann <span style={{opacity:.5}}>OS</span></span>
        </div>
        <div style={d2Styles.search}>
          <span>ابحث، نفّذ، اقفز…</span>
          <kbd style={d2Styles.kbd}>⌘K</kbd>
        </div>
        <div style={d2Styles.iconBtn}>🔔</div>
        <div style={d2Styles.avatar}>أ</div>
      </header>

      <main style={d2Styles.main}>
        <div style={d2Styles.welcome}>
          <div style={d2Styles.welcomeLabel}>الإثنين · ٣٠ أبريل ·  ٢٢:١٤</div>
          <h1 style={d2Styles.welcomeText}>مساء الخير، أحمد</h1>
        </div>

        <div style={d2Styles.bento}>
          <div style={{...d2Styles.tile, ...d2Styles.tileLg, gridColumn: '1/3', gridRow: '1/3'}}>
            <div style={d2Styles.tileTop}>
              <span style={d2Styles.tileLabel}>الإجراءات النشطة</span>
              <span style={d2Styles.tilePill}>+12 هذا الأسبوع</span>
            </div>
            <div style={d2Styles.bigNum}>{count}</div>
            <Sparkline />
          </div>

          <div style={d2Styles.tile}>
            <div style={d2Styles.tileLabel}>المهام اليوم</div>
            <div style={d2Styles.midNum}>4</div>
            <div style={d2Styles.tileFoot}>1 عاجلة</div>
          </div>

          <div style={d2Styles.tile}>
            <div style={d2Styles.tileLabel}>الاجتماعات</div>
            <div style={d2Styles.midNum}>2</div>
            <div style={d2Styles.tileFoot}>القادم: ١٥:٠٠</div>
          </div>

          <div style={{...d2Styles.tile, gridColumn: '3/5'}}>
            <div style={d2Styles.tileLabel}>قيد المتابعة</div>
            <div style={d2Styles.midNum}>1.2M <span style={{fontSize:18, opacity:.5}}>ر.س</span></div>
            <Sparkline color="#87E0A8" />
          </div>

          <div style={d2Styles.tile}>
            <div style={d2Styles.tileLabel}>غير مقروء</div>
            <div style={d2Styles.midNum}>23</div>
            <div style={d2Styles.tileFoot}>في الوارد</div>
          </div>

          <div style={d2Styles.tile}>
            <div style={d2Styles.tileLabel}>إعلانات</div>
            <div style={d2Styles.midNum}>3</div>
            <div style={d2Styles.tileFoot}>جديدة</div>
          </div>
        </div>

        <div style={d2Styles.appsRow}>
          {['SOPs','تقويم','بريد','CRM','HR','اجتماعات'].map(n =>
            <div key={n} style={d2Styles.appPill}>
              <div style={d2Styles.appPillIcon}/>
              <span>{n}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const Sparkline = ({ color = '#E8A860' }) => (
  <svg width="100%" height="40" viewBox="0 0 200 40" style={{marginTop:16}}>
    <defs>
      <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient>
    </defs>
    <path d="M 0 30 L 25 28 L 50 22 L 75 25 L 100 18 L 125 20 L 150 12 L 175 14 L 200 8 L 200 40 L 0 40 Z" fill={`url(#g-${color})`}/>
    <path d="M 0 30 L 25 28 L 50 22 L 75 25 L 100 18 L 125 20 L 150 12 L 175 14 L 200 8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const d2Styles = {
  page: {
    width: '100%', height: '100%', minHeight: 720,
    background: '#0A0B12', color: '#F5F1EA', position: 'relative', overflow: 'hidden',
    fontFamily: '"Amiri","Zarid Slab","IBM Plex Sans Arabic",serif',
    direction: 'rtl',
  },
  aurora: {
    position: 'absolute', top: '-30%', right: '-10%', width: 600, height: 600,
    background: 'radial-gradient(circle, rgba(232,168,96,.18), transparent 60%)',
    filter: 'blur(40px)', pointerEvents: 'none',
  },
  auroraB: {
    position: 'absolute', bottom: '-30%', left: '-10%', width: 700, height: 700,
    background: 'radial-gradient(circle, rgba(96,160,232,.15), transparent 60%)',
    filter: 'blur(50px)', pointerEvents: 'none',
  },
  topbar: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 40px', position: 'relative', zIndex: 2,
    backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 32, height: 32, borderRadius: 9,
    background: 'linear-gradient(135deg,#E8A860,#C98F47)', color: '#1a1410',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15,
  },
  brandName: { fontSize: 16, fontWeight: 600, letterSpacing: '0.3px' },
  search: {
    flex: 1, maxWidth: 480, marginInlineStart: 'auto',
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderRadius: 11,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
    color: 'rgba(245,241,234,.5)', fontSize: 13,
    backdropFilter: 'blur(20px)',
  },
  kbd: { fontFamily: 'IBM Plex Mono', fontSize: 10, background: 'rgba(255,255,255,.08)', padding: '2px 6px', borderRadius: 4, marginInlineStart: 'auto' },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10,
    background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg,#E8A860,#C98F47)', color: '#1a1410',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15,
  },
  main: { padding: '50px 60px', position: 'relative', zIndex: 1 },
  welcome: { marginBottom: 50 },
  welcomeLabel: { fontSize: 12, color: 'rgba(245,241,234,.4)', fontFamily: 'IBM Plex Mono', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  welcomeText: { fontSize: 56, fontWeight: 500, letterSpacing: '-1px', fontFamily: '"Amiri","Zarid Slab",serif' },
  bento: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
    marginBottom: 40,
  },
  tile: {
    padding: '24px 26px', borderRadius: 16,
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.06)',
    backdropFilter: 'blur(30px)',
  },
  tileTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  tileLabel: { fontSize: 12, color: 'rgba(245,241,234,.5)', letterSpacing: 0.5, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase' },
  tilePill: { fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(135,224,168,.12)', color: '#87E0A8', fontFamily: 'IBM Plex Mono' },
  bigNum: { fontSize: 84, fontWeight: 500, letterSpacing: '-3px', lineHeight: 1, fontFamily: '"Amiri","Zarid Slab",serif' },
  midNum: { fontSize: 42, fontWeight: 500, letterSpacing: '-1.5px', lineHeight: 1, marginTop: 14, fontFamily: '"Amiri","Zarid Slab",serif' },
  tileFoot: { fontSize: 12, color: 'rgba(245,241,234,.5)', marginTop: 10, fontFamily: 'IBM Plex Mono' },
  appsRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  appPill: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', borderRadius: 12,
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.06)',
    cursor: 'pointer', fontSize: 14,
  },
  appPillIcon: { width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#E8A860,#C98F47)' },
};

window.Dir2Home = Dir2Home;
