/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// ----- Helpers -----
function flattenProjects(groups) {
  return groups.flatMap(g => g.projects.map(p => ({ ...p, groupId: g.id, groupLabel: g.label })));
}

function PreviewIframe({ url, title }) {
  // Live iframe of the actual site, scaled down. Click events disabled so card
  // remains the clickable surface.
  return (
    <iframe
      src={url}
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

function PreviewAnimated({ id, name }) {
  // Pre-rendered slow animated WebP cycling through scroll positions of the site.
  return (
    <img
      className="preview-animated"
      src={`assets/previews/${id}.webp`}
      alt={`${name} — animated preview`}
      loading="lazy"
    />
  );
}

function PreviewFallback({ name }) {
  // Used when iframe is blocked or for visual variety
  return (
    <div className="preview-fallback">— {name} —</div>
  );
}

// ============================================================
// VIEW: GRID
// ============================================================
function GridView({ data, onOpen, livePreview }) {
  return (
    <div className="view-grid">
      {data.groups.map((g, gi) => (
        <section key={g.id} className="grid-section">
          <h3>
            <span className="num">/ {String(gi + 1).padStart(2, '0')}</span>
            {g.label}
          </h3>
          <p className="blurb">{g.blurb}</p>
          <div className="grid">
            {g.projects.map(p => (
              <div key={p.id} className="card" onClick={() => onOpen(p)}>
                <div className="browser-chrome">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                  <div className="url">{p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</div>
                </div>
                <div className="preview">
                  {livePreview && !p.noEmbed ? (
                    <PreviewIframe url={p.url} title={p.name} />
                  ) : (
                    <PreviewAnimated id={p.id} name={p.name} />
                  )}
                </div>
                <div className="body">
                  <div className="top">
                    <div className="sector">{p.sector}</div>
                    <div className="pills">
                      {p.clientDomain && (
                        <div className="pill pill-client" title="Client-owned domain (not RMAI)">client domain</div>
                      )}
                      <div className="status-pill">
                        <span className="dot" /> live
                      </div>
                    </div>
                  </div>
                  <h4>{p.name}</h4>
                  <div className="sub">{p.subtitle}</div>
                  <p className="summary">{p.summary}</p>
                  <div className="stack">
                    {p.stack.slice(0, 3).map(s => (
                      <span key={s} className="tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ============================================================
// DETAIL OVERLAY
// ============================================================
function Overlay({ project, onClose }) {
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div className={'overlay' + (project ? ' open' : '')} onClick={onClose}>
      <div className="overlay-panel" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <div className="preview-pane">
          {project && !project.noEmbed && (
            <iframe
              src={project.url}
              title={project.name}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
          {project && project.noEmbed && (
            <PreviewFallback name={project.name} />
          )}
        </div>
        <div className="info-pane">
          {project && (
            <>
              <div className="eyebrow">{project.sector} · {project.groupLabel}</div>
              <h2>{project.name}</h2>
              <p className="ovr-sub">{project.subtitle}</p>
              <p className="ovr-summary">{project.summary}</p>

              <div className="ovr-section">
                <div className="lbl">Audience</div>
                <div className="val">{project.for}</div>
              </div>
              <div className="ovr-section">
                <div className="lbl">Why it matters</div>
                <div className="val">{project.why}</div>
              </div>
              <div className="ovr-section">
                <div className="lbl">Stack</div>
                <div className="val ovr-stack">
                  {project.stack.map(s => <span key={s} className="tag" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#8D8D92', background: '#FAFAFA', padding: '4px 10px', borderRadius: 999, border: '1px solid #E8E8EB' }}>{s}</span>)}
                </div>
              </div>
              <div className="ovr-section">
                <div className="lbl">Status</div>
                <div className="val mono" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                  <span style={{ color: '#22C55E' }}>●</span> {project.status}
                </div>
              </div>

              <div className="ovr-actions">
                <a href={project.url} target="_blank" rel="noreferrer" className="btn-cta">Visit site →</a>
                {project.repo && (
                  <a
                    href={`https://github.com/${project.repo}`}
                    target="_blank" rel="noreferrer"
                    className="btn-secondary"
                  >
                    {project.repoPrivate ? 'Repo (private)' : 'View repo'}
                  </a>
                )}
                {project.appUrl && (
                  <a href={project.appUrl} target="_blank" rel="noreferrer" className="btn-secondary">App (auth) →</a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP
// ============================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "livePreviews": false,
  "showStandingRule": true
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  const data = window.SHOWCASE_DATA;
  const flat = useMemo(() => flattenProjects(data.groups), [data]);
  const [openProject, setOpenProject] = useState(null);

  const totalProjects = flat.length;
  const totalGroups = data.groups.length;
  const rmaiDomains = flat.filter(p =>
    !p.clientDomain &&
    (/realmindsai\.com\.au/.test(p.url) || /realmindsai\.com\.au/.test(p.appUrl || ''))
  ).length;
  const clientDomains = flat.filter(p => p.clientDomain).length;

  return (
    <>
      <div className="page">
        <header className="topbar">
          <div className="wordmark">
            real minds, artificial intelligence
            <em>— wisdom, amplified</em>
          </div>
          <nav className="topnav">
            <a href="https://realmindsai.com.au/">realmindsai.com.au</a>
            <a href="#contact">Book a call</a>
          </nav>
        </header>

        <section className="mast">
          <div>
            <div className="eyebrow">
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
              Showcase · 2026
            </div>
            <h1>
              Twelve sites,<br />
              one small <em>practice.</em>
            </h1>
            <p className="lede">
              Everything below was designed, built and shipped by a two-person Melbourne consultancy with Claude Code as a third pair of hands. Civic tech, conservation, regtech, retail — same toolkit, very different problems.
            </p>
          </div>
          <div className="mast-side">
            <div className="row">
              <span className="lbl">In production</span>
              <span className="val mono"><span className="live-dot">●</span> {totalProjects} sites</span>
            </div>
            <div className="row">
              <span className="lbl">Groups</span>
              <span className="val mono">{totalGroups}</span>
            </div>
            <div className="row">
              <span className="lbl">RMAI domains</span>
              <span className="val mono">{rmaiDomains}</span>
            </div>
            <div className="row">
              <span className="lbl">Client domains</span>
              <span className="val mono">{clientDomains}</span>
            </div>
            <div className="row">
              <span className="lbl">Avg. ship</span>
              <span className="val mono">~ weeks, not quarters</span>
            </div>
            <div className="row">
              <span className="lbl">Built with</span>
              <span className="val mono">Claude Code · human in loop</span>
            </div>
          </div>
        </section>

        {tweaks.showStandingRule && (
          <div className="rule-strip">
            <div className="lhs">
              <span className="pulse" />
              <span style={{ color: '#1A1B25', fontWeight: 600 }}>standing rule</span>
              <span>—</span>
              <span>Claude produces. Trace decides. Every artifact, no exceptions.</span>
            </div>
            <div>realmindsai.com.au · AI consulting · Melbourne</div>
          </div>
        )}

        <div className="toolbar">
          <div className="count-line">
            {totalProjects} projects · {totalGroups} groups · last updated 2026-04-28
          </div>
        </div>

        <GridView data={data} onOpen={setOpenProject} livePreview={tweaks.livePreviews} />

        <footer className="foot" id="contact">
          <div className="col">
            <h5>What this is</h5>
            <p>An honest inventory of every public site Real Minds AI has shipped — the consulting work, the tools, the teaching, and the lead-gen demo we built for NorthLink.</p>
            <p>If something here looks like a problem you have, the next move is a half-hour call.</p>
          </div>
          <div className="col">
            <h5>Built with</h5>
            <p>Claude Code as a third pair of hands. Human in the loop on every artifact — that's the standing rule.</p>
            <p>Stacks span Astro, WordPress, Python, vanilla HTML, Postgres, ABS data feeds and Chart.js.</p>
          </div>
          <div className="col">
            <h5>Get in touch</h5>
            <p><a href="mailto:info@realmindsai.com.au">info@realmindsai.com.au</a></p>
            <p><a href="https://realmindsai.com.au/">realmindsai.com.au</a></p>
            <p style={{ marginTop: 16, fontStyle: 'italic', color: '#8D8D92' }}>— wisdom, amplified</p>
          </div>
        </footer>
      </div>

      <Overlay project={openProject} onClose={() => setOpenProject(null)} />

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Content">
            <window.TweakToggle
              label="Live iframe previews (default: animated)"
              value={tweaks.livePreviews}
              onChange={v => setTweak('livePreviews', v)}
            />
            <window.TweakToggle
              label="Standing rule strip"
              value={tweaks.showStandingRule}
              onChange={v => setTweak('showStandingRule', v)}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
