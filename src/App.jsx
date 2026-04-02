import { useState, useEffect } from 'react'

const CHART_COLORS_LIGHT = ['#378ADD','#5DCAA5','#D85A30','#7F77DD','#D4537E','#639922','#BA7517','#888780','#E24B4A']
const CHART_COLORS_DARK = ['#85B7EB','#5DCAA5','#F0997B','#AFA9EC','#ED93B1','#97C459','#FAC775','#B4B2A9','#F09595']

function DonutChart({ items, dark }) {
  const colors = dark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT
  const cats = {}
  items.forEach(i => { cats[i.category] = (cats[i.category] || 0) + 1 })
  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1])
  const total = items.length
  const r = 60, cx = 80, cy = 80, stroke = 24
  let cumulative = 0
  const circumference = 2 * Math.PI * r
  const arcs = entries.map(([cat, count], idx) => {
    const frac = count / total
    const offset = circumference * (1 - cumulative)
    cumulative += frac
    return (
      <circle key={cat} cx={cx} cy={cy} r={r} fill="none"
        stroke={colors[idx % colors.length]} strokeWidth={stroke}
        strokeDasharray={`${circumference * frac} ${circumference * (1 - frac)}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`} />
    )
  })
  return (
    <div className="chart-container">
      <svg viewBox="0 0 160 160" width="140" height="140">{arcs}</svg>
      <div className="chart-legend">
        {entries.map(([cat, count], idx) => (
          <div key={cat} className="legend-item">
            <span className="legend-dot" style={{ background: colors[idx % colors.length] }} />
            <span className="legend-label">{cat}</span>
            <span className="legend-count">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ items, dark }) {
  const colors = dark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT
  const scores = {}
  items.forEach(i => { scores[i.score] = (scores[i.score] || 0) + 1 })
  const keys = Object.keys(scores).sort((a, b) => b - a)
  const max = Math.max(...Object.values(scores))
  return (
    <div className="bar-chart">
      <div className="bar-chart-title">Score distribution</div>
      {keys.map((s, idx) => (
        <div key={s} className="bar-row">
          <span className="bar-label">{s}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{
              width: `${(scores[s] / max) * 100}%`,
              background: colors[idx % colors.length]
            }} />
          </div>
          <span className="bar-count">{scores[s]}</span>
        </div>
      ))}
    </div>
  )
}

function CriticalCard({ item }) {
  return (
    <div className="card card-critical-section">
      <div className="card-header">
        <div className="card-score card-score-critical">{item.score}</div>
        <div className="card-badges">
          <span className="tag-badge tag-critical">CRITICAL</span>
          <span className="cat-badge">{item.category}</span>
        </div>
      </div>
      <div className="card-headline">{item.headline}</div>
      <div className="card-desc">{item.description}</div>
      {item.action && <div className="card-action"><span className="action-label">Action:</span> {item.action}</div>}
      {!item.action && item.useCase && <div className="card-action"><span className="action-label">Action:</span> {item.useCase}</div>}
      {item.sourceUrl && (
        <a className="card-source" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          {item.sourceName || 'Source'}
        </a>
      )}
    </div>
  )
}

function WatchCard({ item }) {
  return (
    <div className="card card-watch-section">
      <div className="card-header">
        <div className="card-score">{item.score}</div>
        <div className="card-badges">
          <span className="tag-badge tag-watch">WATCH</span>
          <span className="cat-badge">{item.category}</span>
        </div>
      </div>
      <div className="card-headline">{item.headline}</div>
      <div className="card-desc">{item.description}</div>
      {item.clientPitch && <div className="card-pitch"><span className="pitch-label">Client pitch:</span> {item.clientPitch}</div>}
      {!item.clientPitch && item.useCase && <div className="card-pitch"><span className="pitch-label">Why it matters:</span> {item.useCase}</div>}
      {item.sourceUrl && (
        <a className="card-source" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          {item.sourceName || 'Source'}
        </a>
      )}
    </div>
  )
}

function ContextRow({ item }) {
  return (
    <div className="context-row">
      <span className="context-score">{item.score}</span>
      <span className="cat-badge cat-badge-sm">{item.category}</span>
      <div className="context-content">
        <span className="context-headline">{item.headline}</span>
        <span className="context-desc">{item.description}</span>
        {item.useCase && <span className="context-why">{item.useCase}</span>}
      </div>
      {item.sourceUrl && (
        <a className="card-source" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
          {item.sourceName || 'Source'}
        </a>
      )}
    </div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button className="btn copy-btn" onClick={handleCopy}>
      {copied ? 'Copied' : 'Copy briefing'}
    </button>
  )
}

export default function App() {
  const [digests, setDigests] = useState(null)
  const [dates, setDates] = useState([])
  const [currentDate, setCurrentDate] = useState(null)
  const [sidebar, setSidebar] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('ai-digest-dark') === 'true')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [contextOpen, setContextOpen] = useState(false)
  const [filterCat, setFilterCat] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('ai-digest-dark', dark)
  }, [dark])

  const fetchData = () => {
    setLoading(true)
    setError(null)
    fetch(import.meta.env.BASE_URL + 'digests.json')
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json() })
      .then(data => {
        setDigests(data.digests || {})
        const d = data.dates || []
        setDates(d)
        setCurrentDate(d[0] || null)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(fetchData, [])

  const currentIdx = dates.indexOf(currentDate)
  const hasPrev = currentIdx < dates.length - 1
  const hasNext = currentIdx > 0
  const goPrev = () => { hasPrev && setCurrentDate(dates[currentIdx + 1]); setFilterCat(null) }
  const goNext = () => { hasNext && setCurrentDate(dates[currentIdx - 1]); setFilterCat(null) }

  const digest = digests && currentDate ? digests[currentDate] : null

  if (loading) return <div className="center-msg">Loading...</div>
  if (error) return <div className="center-msg"><p>{error}</p><button className="btn" onClick={fetchData}>Retry</button></div>
  if (!digest) return <div className="center-msg">No digests yet. Run the pipeline to generate your first digest.</div>

  const formatDate = (d) => {
    const [y, m, day] = d.split('-')
    const dt = new Date(y, m - 1, day)
    return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const allItems = digest.items || []
  const filtered = filterCat ? allItems.filter(i => i.category === filterCat) : allItems
  const critical = filtered.filter(i => i.score >= 8)
  const watch = filtered.filter(i => i.score >= 6 && i.score <= 7)
  const context = filtered.filter(i => i.score < 6)

  const categories = [...new Set(allItems.map(i => i.category))].sort()

  return (
    <>
      {sidebar && <div className="sidebar-overlay" onClick={() => setSidebar(false)} />}
      <div className={`sidebar ${sidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span>All Digests</span>
          <button className="btn" onClick={() => setSidebar(false)}>&#x2715;</button>
        </div>
        <div className="sidebar-list">
          {dates.map((d, i) => (
            <button key={d}
              className={`sidebar-item ${d === currentDate ? 'active' : ''}`}
              onClick={() => { setCurrentDate(d); setSidebar(false); setFilterCat(null) }}>
              {d}{i === 0 && <span className="latest-label">latest</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="app">
        <header>
          <div className="header-top">
            <button className="btn hamburger" onClick={() => setSidebar(true)}>
              <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <div className="header-center">
              <div className="header-label">AI ECOSYSTEM DIGEST</div>
              <div className="header-date">
                <button className="btn nav-btn" onClick={goPrev} disabled={!hasPrev}>
                  <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <span>{formatDate(currentDate)}</span>
                <button className="btn nav-btn" onClick={goNext} disabled={!hasNext}>
                  <svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
            <button className="btn" onClick={() => setDark(!dark)}>
              {dark ? <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                : <svg width="20" height="20" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.003 8.003 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>}
            </button>
          </div>

          <div className="briefing">
            <div className="briefing-text">{digest.summary}</div>
            <CopyButton text={digest.summary} />
          </div>

          <div className="pills">
            <span className="pill">{digest.totalScanned} items</span>
            {digest.critical > 0 && <span className="pill pill-critical">{digest.critical} action</span>}
            {digest.watch > 0 && <span className="pill pill-watch">{digest.watch} watch</span>}
            {digest.low > 0 && <span className="pill pill-low">{digest.low} context</span>}
          </div>

          {categories.length > 1 && (
            <div className="filters">
              <button className={`filter-btn ${!filterCat ? 'filter-active' : ''}`} onClick={() => setFilterCat(null)}>All</button>
              {categories.map(c => (
                <button key={c} className={`filter-btn ${filterCat === c ? 'filter-active' : ''}`} onClick={() => setFilterCat(filterCat === c ? null : c)}>{c}</button>
              ))}
            </div>
          )}
          <div className="divider" />
        </header>

        <main>
          {allItems.length === 0 ? (
            <div className="center-msg">Nothing critical today.</div>
          ) : (
            <>
              {critical.length > 0 && (
                <section className="section">
                  <div className="section-header">
                    <h2 className="section-title section-title-critical">Act on this</h2>
                    <span className="section-count">{critical.length}</span>
                  </div>
                  <div className="cards">
                    {critical.map((item, i) => <CriticalCard key={i} item={item} />)}
                  </div>
                </section>
              )}

              {watch.length > 0 && (
                <section className="section">
                  <div className="section-header">
                    <h2 className="section-title section-title-watch">New capabilities</h2>
                    <span className="section-count">{watch.length}</span>
                  </div>
                  <div className="cards">
                    {watch.map((item, i) => <WatchCard key={i} item={item} />)}
                  </div>
                </section>
              )}

              {context.length > 0 && (
                <section className="section">
                  <div className="section-header section-header-toggle" onClick={() => setContextOpen(!contextOpen)}>
                    <h2 className="section-title section-title-context">Market context</h2>
                    <span className="section-count">{context.length}</span>
                    <span className="toggle-arrow">{contextOpen ? '\u25B2' : '\u25BC'}</span>
                  </div>
                  {contextOpen && (
                    <div className="context-list">
                      {context.map((item, i) => <ContextRow key={i} item={item} />)}
                    </div>
                  )}
                </section>
              )}

              {allItems.length >= 5 && (
                <div className="charts">
                  <DonutChart items={allItems} dark={dark} />
                  <BarChart items={allItems} dark={dark} />
                </div>
              )}
            </>
          )}
        </main>

        <footer>
          {digest.footerNote && <div className="footer-note">{digest.footerNote}</div>}
          <div className="footer-count">{dates.length} digest{dates.length !== 1 ? 's' : ''} in archive</div>
        </footer>
      </div>
    </>
  )
}
