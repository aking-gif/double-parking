/* Direction 1: Monochrome Editorial — أبيض/أسود، Zarid Slab كبير، accent ذهبي ناعم */
const Dir1Home = () => {
  const [hour, setHour] = React.useState(new Date().getHours());
  React.useEffect(() => {
    const t = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(t);
  }, []);
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';

  return (
    <div style={d1Styles.page}>
      <header style={d1Styles.topbar}>
        <div style={d1Styles.brand}>
          <span style={d1Styles.brandMark}>A</span>
          <span style={d1Styles.brandName}>Arsann</span>
        </div>
        <nav style={d1Styles.nav}>
          <a style={{...d1Styles.navLink, ...d1Styles.navLinkActive}}>الرئيسية</a>
          <a style={d1Styles.navLink}>اليوم</a>
          <a style={d1Styles.navLink}>الإجراءات</a>
          <a style={d1Styles.navLink}>التقويم</a>
          <a style={d1Styles.navLink}>البريد</a>
        </nav>
        <div style={d1Styles.topRight}>
          <div style={d1Styles.search}>
            <span>بحث في كل شيء…</span>
            <kbd style={d1Styles.kbd}>⌘K</kbd>
          </div>
          <div style={d1Styles.avatar}>أ</div>
        </div>
      </header>

      <main style={d1Styles.main}>
        <div style={d1Styles.heroLabel}>{greeting} — الإثنين ٣٠ أبريل</div>
        <h1 style={d1Styles.hero}>
          عندك <span style={d1Styles.heroAccent}>٤ مهام</span> اليوم،
          <br/>منها <span style={d1Styles.heroRed}>واحدة عاجلة</span>.
        </h1>

        <div style={d1Styles.statRow}>
          <Stat n="247" label="إجراء نشط" trend="+12" />
          <Stat n="1.2M" label="ر.س قيد المتابعة" trend="+18%" />
          <Stat n="34" label="موظفاً" trend="—" />
          <Stat n="89%" label="معدل الإنجاز" trend="+4%" />
        </div>

        <section style={d1Styles.section}>
          <h2 style={d1Styles.sectionTitle}>التطبيقات</h2>
          <div style={d1Styles.appsGrid}>
            {['الإجراءات','التقويم','البريد','CRM','HR','المهام','الاجتماعات','التقارير'].map(n =>
              <div key={n} style={d1Styles.appCard}>
                <div style={d1Styles.appIcon}/>
                <div style={d1Styles.appName}>{n}</div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const Stat = ({ n, label, trend }) => (
  <div style={d1Styles.stat}>
    <div style={d1Styles.statNum}>{n}</div>
    <div style={d1Styles.statLabel}>{label}</div>
    {trend && trend !== '—' && <div style={d1Styles.statTrend}>{trend}</div>}
  </div>
);

const d1Styles = {
  page: {
    width: '100%', height: '100%', minHeight: 720,
    background: '#FAFAF7', color: '#1A1A1A',
    fontFamily: '"Amiri","Zarid Slab","IBM Plex Sans Arabic",serif',
    direction: 'rtl', display: 'flex', flexDirection: 'column',
  },
  topbar: {
    display: 'flex', alignItems: 'center', gap: 24,
    padding: '18px 40px', borderBottom: '1px solid #E8E5DE',
    background: '#FAFAF7',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 32, height: 32, borderRadius: 9,
    background: '#1A1A1A', color: '#FAFAF7',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16,
  },
  brandName: { fontSize: 17, fontWeight: 600, letterSpacing: '-0.3px' },
  nav: { display: 'flex', gap: 4, marginInlineStart: 32 },
  navLink: {
    padding: '8px 14px', borderRadius: 8, fontSize: 14,
    color: '#666', textDecoration: 'none', cursor: 'pointer',
  },
  navLinkActive: { background: '#1A1A1A', color: '#FAFAF7', fontWeight: 600 },
  topRight: { display: 'flex', alignItems: 'center', gap: 12, marginInlineStart: 'auto' },
  search: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 14px', borderRadius: 9,
    background: '#F0EDE5', border: '1px solid #E0DCD2',
    color: '#888', fontSize: 13, minWidth: 280,
  },
  kbd: {
    fontFamily: 'IBM Plex Mono', fontSize: 11,
    background: '#fff', padding: '2px 6px', borderRadius: 4,
    border: '1px solid #E0DCD2', color: '#666',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: '#C98F47', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: 14,
  },
  main: { padding: '60px 80px', flex: 1 },
  heroLabel: {
    fontSize: 13, color: '#888', letterSpacing: '1.5px',
    textTransform: 'uppercase', fontFamily: 'IBM Plex Mono',
    marginBottom: 20,
  },
  hero: {
    fontSize: 64, fontWeight: 400, lineHeight: 1.15,
    letterSpacing: '-1.5px', marginBottom: 60,
    fontFamily: '"Amiri","Zarid Slab",serif',
  },
  heroAccent: { color: '#C98F47', fontWeight: 600 },
  heroRed: { color: '#C42E2E', fontWeight: 600 },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#E8E5DE', border: '1px solid #E8E5DE', borderRadius: 14, overflow: 'hidden', marginBottom: 60 },
  stat: { padding: '24px 28px', background: '#FAFAF7' },
  statNum: { fontSize: 38, fontWeight: 500, letterSpacing: '-1px', fontFamily: '"Amiri","Zarid Slab",serif' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4, letterSpacing: '0.5px' },
  statTrend: { fontSize: 11, color: '#1A8A50', marginTop: 8, fontFamily: 'IBM Plex Mono', fontWeight: 600 },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: 500, marginBottom: 24, fontFamily: '"Amiri","Zarid Slab",serif' },
  appsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 },
  appCard: {
    padding: '28px 24px', borderRadius: 14, background: '#fff',
    border: '1px solid #E8E5DE', cursor: 'pointer',
    transition: 'all .2s',
  },
  appIcon: {
    width: 44, height: 44, borderRadius: 11,
    background: 'linear-gradient(135deg,#1A1A1A,#3A3A3A)',
    marginBottom: 16,
  },
  appName: { fontSize: 16, fontWeight: 500 },
};

window.Dir1Home = Dir1Home;
