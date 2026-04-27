const TONES = {
  mint: {
    base: '#EAF2DD',
    blobs: [
      { c: '#CDEAFF', x: '85%', y: '85%', r: '60%', a: 0.85 },
      { c: '#D7E8B7', x: '15%', y: '12%', r: '55%', a: 0.70 },
      { c: '#F8E1B0', x: '70%', y: '15%', r: '40%', a: 0.45 },
    ],
  },
  sky: {
    base: '#E6EFE0',
    blobs: [
      { c: '#BFE0FF', x: '80%', y: '90%', r: '70%', a: 0.95 },
      { c: '#DAEDC0', x: '10%', y: '5%',  r: '55%', a: 0.70 },
    ],
  },
  peach: {
    base: '#FFF0E8',
    blobs: [
      { c: '#FECDA5', x: '80%', y: '20%', r: '55%', a: 0.70 },
      { c: '#FBD4EF', x: '15%', y: '80%', r: '50%', a: 0.55 },
    ],
  },
};

export function PathlyBg({ tone = 'mint' }) {
  const t = TONES[tone] ?? TONES.mint;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      background: t.base, overflow: 'hidden', pointerEvents: 'none',
    }}>
      {t.blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x, top: b.y,
            transform: 'translate(-50%,-50%)',
            width: b.r, height: b.r,
            borderRadius: '50%',
            background: b.c,
            filter: 'blur(60px)',
            opacity: b.a,
          }}
        />
      ))}
    </div>
  );
}
