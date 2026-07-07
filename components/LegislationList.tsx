'use client'

export default function LegislationList({ legislation, openLeg, setOpenLeg }: {
  legislation: any[]
  openLeg: number | null
  setOpenLeg: (i: number | null) => void
}) {
  if (!legislation.length) return null
  return (
    <div style={{ paddingTop: 10 }}>
      {legislation.map((l: any, i: number) => {
        const isOpen = openLeg === i
        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <button onClick={() => setOpenLeg(isOpen ? null : i)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 10px', borderRadius: 4, border: `1.5px solid ${isOpen ? 'var(--amber)' : 'var(--line)'}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: 'var(--surf)', color: isOpen ? 'var(--amber)' : 'var(--mut)' }}>
              {l.code} <span style={{ fontSize: 9, opacity: 0.6 }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={{ marginTop: 6, background: 'var(--surf)', border: '1.5px solid var(--line)', borderRadius: 4, padding: '12px 14px' }}>
                {l.description && <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mut)', lineHeight: 1.55, marginBottom: l.clauses?.length ? 10 : 0 }}>{l.description}</div>}
                {l.clauses?.length > 0 && (
                  <>
                    <div style={{ height: 1.5, background: 'var(--div)', marginBottom: 10 }}/>
                    <div style={{ fontWeight: 600, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', marginBottom: 10 }}>Clauses</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {l.clauses.map((c: any, j: number) => (
                        <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, border: '1.5px solid var(--line)', background: 'var(--bg)', color: 'var(--amber)', flexShrink: 0 }}>{c.ref}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, paddingTop: 2 }}>{c.summary}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
      <div style={{ fontWeight: 600, fontSize: 9.5, color: 'var(--mut)', paddingLeft: 2, marginTop: -2, letterSpacing: '0.08em' }}>Tap each to expand</div>
    </div>
  )
}
