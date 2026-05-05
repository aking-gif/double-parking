/* Direction 3: Playful Tech — Light, big shapes, color blocks, fun motion */
const Dir3Home = () => {
  return (
    <div style={d3Styles.page}>
      <header style={d3Styles.topbar}>
        <div style={d3Styles.brand}>
          <div style={d3Styles.brandShape}/>
          <span style={d3Styles.brandName}>arsann</span>
        </div>
        <div style={d3Styles.searchWrap}>
          <input style={d3Styles.search} placeholder="اضغط ⌘K للبحث في كل شيء…"/>
        </div>
        <div style={d3Styles.topActions}>
          <button style={d3Styles.iconRound}>🔔</button>
          <div style={d3Styles.avatar}>أ</div>
        </div>
      </header>

      <main style={d3Styles.main}>
        <div style={d3Styles.heroBlock}>
          <div style={d3Styles.heroLeft}>
            <div style={d3Styles.heroLabel}>الإثنين · ٣٠ أبريل</div>
            <h1 style={d3Styles.hero}>
              مساء الخير،
              <br/>
              <span style={d3Styles.heroName}>أحمد</span> ✨
            </h1>
            <p style={d3Styles.heroSub}>اليوم عندك <strong style={{color:'#E8A860'}}>٤ مهام</strong> و <strong style={{color:'#5B7CFA'}}>اجتماعين</strong>. خلّيك جاهز.</p>
            <div style={d3Styles.heroBtns}>
              <button style={d3Styles.btnPrimary}>اعرض اليوم →</button>
              <button style={d3Styles.btnGhost}>كل التطبيقات</button>
            </div>
          </div>
          <div style={d3Styles.heroRight}>
            <div style={{...d3Styles.heroBubble, ...d3Styles.bubbleA}}>
              <div style={d3Styles.bubbleNum}>247</div>
              <div style={d3Styles.bubbleLabel}>إجراء نشط</div>
            </div>
            <div style={{...d3Styles.heroBubble, ...d3Styles.bubbleB}}>
              <div style={d3Styles.bubbleNum}>89%</div>
              <div style={d3Styles.bubbleLabel}>إنجاز</div>
            </div>
            <div style={{...d3Styles.heroBubble, ...d3Styles.bubbleC}}>
              <div style={d3Styles.bubbleNum}>34</div>
              <div style={d3Styles.bubbleLabel}>موظف</div>
            </div>
          </div>
        </div>

        <div style={d3Styles.appsTitle}>التطبيقات</div>
        <div style={d3Styles.appsGrid}>
          {[
            {n:'الإجراءات', c:'#FFE9C7', i:'📋'},
            {n:'التقويم', c:'#D7E5FF', i:'📅'},
            {n:'البريد', c:'#FFD7E9', i:'✉️'},
            {n:'CRM', c:'#D7FFE9', i:'🤝'},
            {n:'HR', c:'#E9D7FF', i:'👥'},
            {n:'المهام', c:'#FFE9D7', i:'✓'},
            {n:'الاجتماعات', c:'#D7FFFF', i:'🎥'},
            {n:'التقارير', c:'#FFFFD7', i:'📊'},
          ].map(a =>
            <div key={a.n} style={{...d3Styles.appCard, background: a.c}}>
              <div style={d3Styles.appEmoji}>{a.i}</div>
              <div style={d3Styles.appName}>{a.n}</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const d3Styles = {
  page: {
    width: '100%', height: '100%', minHeight: 720,
    background: '#FFFCF5', color: '#1A1A1A',
    fontFamily: '"Amiri","Zarid Slab","IBM Plex Sans Arabic",serif',
    direction: 'rtl',
  },
  topbar: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '20px 40px',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandShape: {
    width: 36, height: 36, borderRadius: 18,
    background: 'linear-gradient(135deg,#E8A860 0%, #FF6B9D 100%)',
  },
  brandName: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' },
  searchWrap: { flex: 1, maxWidth: 520, marginInlineStart: 32 },
  search: {
    width: '100%', padding: '14px 20px', borderRadius: 14,
    background: '#fff', border: '2px solid #1A1A1A',
    fontSize: 14, fontFamily: 'inherit',
    boxShadow: '4px 4px 0 #1A1A1A',
  },
  topActions: { display: 'flex', alignItems: 'center', gap: 12, marginInlineStart: 'auto' },
  iconRound: {
    width: 44, height: 44, borderRadius: 22,
    background: '#fff', border: '2px solid #1A1A1A',
    fontSize: 18, cursor: 'pointer',
    boxShadow: '3px 3px 0 #1A1A1A',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    background: 'linear-gradient(135deg,#E8A860,#FF6B9D)',
    border: '2px solid #1A1A1A', boxShadow: '3px 3px 0 #1A1A1A',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16,
  },
  main: { padding: '40px 60px' },
  heroBlock: {
    display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40,
    marginBottom: 60, alignItems: 'center',
  },
  heroLeft: {},
  heroLabel: { fontSize: 13, color: '#888', fontFamily: 'IBM Plex Mono', letterSpacing: 1, marginBottom: 16 },
  hero: { fontSize: 64, fontWeight: 500, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 20, fontFamily: '"Amiri","Zarid Slab",serif' },
  heroName: { background: 'linear-gradient(135deg,#E8A860,#FF6B9D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 },
  heroSub: { fontSize: 18, color: '#555', lineHeight: 1.6, marginBottom: 28 },
  heroBtns: { display: 'flex', gap: 12 },
  btnPrimary: {
    padding: '14px 28px', borderRadius: 12,
    background: '#1A1A1A', color: '#FFFCF5',
    border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #E8A860',
    fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  },
  btnGhost: {
    padding: '14px 28px', borderRadius: 12,
    background: '#fff', color: '#1A1A1A',
    border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A',
    fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  },
  heroRight: { position: 'relative', height: 320 },
  heroBubble: {
    position: 'absolute', borderRadius: 24,
    padding: 24, border: '2px solid #1A1A1A',
    boxShadow: '6px 6px 0 #1A1A1A',
  },
  bubbleA: { top: 0, right: 20, width: 180, height: 180, background: '#FFE9C7', transform: 'rotate(-4deg)' },
  bubbleB: { top: 80, left: 0, width: 160, height: 160, background: '#D7E5FF', transform: 'rotate(6deg)' },
  bubbleC: { bottom: 0, right: 80, width: 150, height: 150, background: '#D7FFE9', transform: 'rotate(-2deg)' },
  bubbleNum: { fontSize: 48, fontWeight: 700, fontFamily: '"Amiri","Zarid Slab",serif', letterSpacing: '-1.5px' },
  bubbleLabel: { fontSize: 14, color: '#444', marginTop: 4 },
  appsTitle: { fontSize: 28, fontWeight: 600, marginBottom: 24, fontFamily: '"Amiri","Zarid Slab",serif' },
  appsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  appCard: {
    padding: 24, borderRadius: 18,
    border: '2px solid #1A1A1A', boxShadow: '4px 4px 0 #1A1A1A',
    cursor: 'pointer',
  },
  appEmoji: { fontSize: 32, marginBottom: 12 },
  appName: { fontSize: 18, fontWeight: 600 },
};

window.Dir3Home = Dir3Home;
