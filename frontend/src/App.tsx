import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, clearSessionToken, setSessionToken } from './api';

type AnyRecord = Record<string, any>;
type TabKey = 'overview' | 'profile' | 'discover' | 'finance' | 'growth' | 'copilot' | 'admin';
type AuthMode = 'login' | 'register';
type ChatMessage = { role: 'user' | 'assistant'; text: string };

const SESSION_KEY = 'gradpath.sessionToken';

function formatLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function formatCurrency(value: unknown) {
  const numberValue = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numberValue);
}

function formatPercent(value: unknown) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function formatCompact(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}
function ProgressRing({ label, value, caption }: { label: string; value: number; caption: string }) {
  const boundedValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-ring-card">
      <div className="progress-ring" style={{ background: `conic-gradient(var(--accent) ${boundedValue}%, rgba(255,255,255,0.08) 0)` }}>
        <div className="progress-ring-inner">
          <strong>{boundedValue}%</strong>
          <span>{label}</span>
        </div>
      </div>
      <p>{caption}</p>
    </div>
  );
}

function MiniBars({ values }: { values: number[] }) {
  return (
    <div className="mini-bars">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max(14, Math.min(100, value))}%` }} />
      ))}
    </div>
  );
}

function HeatmapGrid({ values }: { values: number[] }) {
  return (
    <div className="heatmap-grid">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ opacity: 0.3 + Math.max(0, Math.min(1, value / 100)) * 0.7 }} />
      ))}
    </div>
  );
}

function Timeline({ steps }: { steps: Array<{ label: string; body: string; active?: boolean }> }) {
  return (
    <div className="timeline">
      {steps.map((step) => (
        <div key={step.label} className={`timeline-step ${step.active ? 'active' : ''}`}>
          <span className="timeline-dot" />
          <div>
            <strong>{step.label}</strong>
            <p>{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryGrid({ data }: { data: AnyRecord | null | undefined }) {
  if (!data) return <p className="empty-state">Loading...</p>;

  return (
    <div className="summary-grid">
      {Object.entries(data).map(([key, value]) => (
        <div className="summary-item" key={key}>
          <span className="summary-label">{formatLabel(key)}</span>
          <strong className="summary-value">{formatValue(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'warning' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function Panel({ title, subtitle, action, children }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <motion.section
      className="card panel"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {(title || subtitle || action) && (
        <div className="section-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

function StatCard({ label, value, caption }: { label: string; value: ReactNode; caption?: ReactNode }) {
  return (
    <motion.div className="metric-card" whileHover={{ y: -5, scale: 1.01 }} transition={{ duration: 0.2 }}>
      <span className="summary-label">{label}</span>
      <strong className="summary-value metric-value">{value}</strong>
      {caption && <div className="metric-caption">{caption}</div>}
    </motion.div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

function TopNav({
  activeTab,
  onTabChange,
  onLogout,
  user,
  notice,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onLogout: () => void;
  user: AnyRecord | null;
  notice: string | null;
}) {
  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'discover', label: 'Discover' },
    { id: 'finance', label: 'Finance' },
    { id: 'growth', label: 'Progress' },
    { id: 'copilot', label: 'Help' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <header className="topbar card premium-topbar">
      <div className="topbar-row">
        <div className="brand-block brand-lockup">
          <div className="brand-mark">GP</div>
          <div>
            <div className="brand">GradPath</div>
            <div className="brand-copy">Student planning workspace for discovery, finance, and support</div>
          </div>
        </div>

        <div className="topbar-actions">
          <Badge tone="accent">Live workspace</Badge>
          {user && (
            <div className="user-chip">
              <strong>{user.name}</strong>
              <span>{user.stage}</span>
            </div>
          )}
          <button type="button" className="ghost-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="nav-shell nav-rail">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={`nav-pill ${activeTab === tab.id ? 'active' : ''}`} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {notice && <div className="notice-banner notice-inline">{notice}</div>}
    </header>
  );
}

function AuthLanding({
  mode,
  onModeChange,
  authForm,
  setAuthForm,
  personas,
  loading,
  onSubmit,
  onPersona,
  error,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  authForm: AnyRecord;
  setAuthForm: (next: AnyRecord) => void;
  personas: AnyRecord[];
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPersona: (personaId: string) => void;
  error: string | null;
}) {
  const landingMetrics = [
    { label: 'Conversion lift', value: '4.2x' },
    { label: 'Funding clarity', value: '91%' },
    { label: 'Time saved', value: '18 hrs' },
  ];

  const storyPoints = [
    {
      title: 'Problem',
      body: 'Student planning usually collapses into tabs, spreadsheets, and anxiety. Nothing feels connected.',
    },
    {
      title: 'Solution',
      body: 'GradPath turns discovery, funding, mentorship, and nudges into a single premium operating system.',
    },
    {
      title: 'Proof',
      body: 'The workspace surfaces fit, affordability, and next actions in a way that feels investor-pitch ready.',
    },
  ];

  return (
    <div className="auth-screen">
      <section className="hero card auth-hero premium-hero">
        <div className="hero-copy hero-copy-premium">
          <Badge tone="accent">Student planning workspace</Badge>
          <h1>Make study abroad feel clear, premium, and ready for a hackathon demo.</h1>
          <p>
            GradPath combines admissions planning, funding readiness, university discovery, and support in a dark, polished interface designed for a strong public demo.
          </p>

          <div className="hero-actions">
            {landingMetrics.map((metric) => (
              <div className="hero-metric" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>

          <div className="trust-strip">
            <span>Trusted workflow for universities</span>
            <span>Connected to lenders</span>
            <span>Built for mentors and admissions teams</span>
          </div>

          <div className="landing-story-grid">
            {storyPoints.map((item, index) => (
              <motion.article
                key={item.title}
                className="story-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <span>{item.title}</span>
                <p>{item.body}</p>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="landing-preview-stack">
          <motion.div className="preview-shell glass-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65 }}>
            <div className="preview-header">
              <div>
                <div className="summary-label">Live preview</div>
                <h3>Application momentum</h3>
              </div>
              <Badge tone="success">Realtime</Badge>
            </div>
            <div className="preview-grid">
              <ProgressRing label="Profile" value={84} caption="Strength from onboarding and intent signals." />
              <div className="preview-panel">
                <div className="summary-label">ROI momentum</div>
                <MiniBars values={[42, 56, 74, 83, 91]} />
                <p>Funding and outcomes are visualized like an investor dashboard.</p>
              </div>
              <div className="preview-panel">
                <div className="summary-label">Admission heatmap</div>
                <HeatmapGrid values={[78, 61, 88, 56, 73, 92, 64, 81, 69, 87, 75, 90]} />
                <p>Better fit surfaces faster with richer visual prioritization.</p>
              </div>
            </div>
            <div className="notification-stack">
              <div>University shortlist updated</div>
              <div>Loan readiness improved</div>
              <div>Support drafted next steps</div>
            </div>
          </motion.div>

          <motion.div className="auth-panel card glass-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }}>
            <div className="toggle-row">
              <button type="button" className={`toggle-button ${mode === 'login' ? 'active' : ''}`} onClick={() => onModeChange('login')}>
                Login
              </button>
              <button type="button" className={`toggle-button ${mode === 'register' ? 'active' : ''}`} onClick={() => onModeChange('register')}>
                Register
              </button>
            </div>

            <form className="form-grid" onSubmit={onSubmit}>
              {mode === 'register' && (
                <label>
                  Name
                  <input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Anushka Sharma" />
                </label>
              )}
              <label>
                Email
                <input value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@example.com" />
              </label>
              <label>
                Password
                <input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="••••••••" />
              </label>
              {mode === 'register' && (
                <label>
                  Program
                  <input value={authForm.program} onChange={(event) => setAuthForm({ ...authForm, program: event.target.value })} placeholder="MS Computer Science" />
                </label>
              )}
              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="persona-stack">
              <div className="stack-head">
                <div>
                  <h3>Quick persona start</h3>
                  <p className="section-subtitle">Use seeded demo users to populate the app immediately.</p>
                </div>
              </div>
              {error && <div className="notice-banner notice-inline">{error}</div>}
              <div className="persona-grid">
                {personas.map((persona) => (
                  <button key={persona.id} type="button" className="persona-card" onClick={() => onPersona(persona.id)}>
                    <strong>{persona.name}</strong>
                    <span>{persona.program}</span>
                    <small>
                      {persona.stage} · {persona.intake}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="landing-proof-grid">
        <motion.article className="proof-card glass-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="eyebrow">Problem and solution</span>
          <h3>From scattered planning to a single guided workflow</h3>
          <p>Everything from profile strength to lender readiness lives inside a clear dashboard that feels polished and credible.</p>
        </motion.article>
        <motion.article className="proof-card glass-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
          <span className="eyebrow">Trust indicators</span>
          <h3>University and lender-ready presentation</h3>
          <p>Clear cards, strong depth, and polished partner surfaces signal credibility from the first screen.</p>
        </motion.article>
        <motion.article className="proof-card glass-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}>
          <span className="eyebrow">Student journey</span>
          <h3>Designed for motion, not static review</h3>
          <p>The interface guides each next step with momentum, progress visibility, and clean interactions.</p>
        </motion.article>
      </section>
    </div>
  );
}

function OverviewTab({
  dashboard,
  recommendations,
  offers,
  nudges,
  universities,
  user,
  onTabChange,
}: {
  dashboard: AnyRecord | null;
  recommendations: AnyRecord[];
  offers: AnyRecord[];
  nudges: AnyRecord[];
  universities: AnyRecord[];
  user: AnyRecord | null;
  onTabChange: (tab: TabKey) => void;
}) {
  const topRecommendation = recommendations[0];
  const topUniversity = universities[0];
  const engagementValue = Number(dashboard?.stats?.engagement_points ?? 0);
  const streakValue = Number(dashboard?.stats?.streak_days ?? 0);
  const shortlistValue = Number(dashboard?.stats?.shortlisted_universities ?? 0);
  const recommendationCount = Number(dashboard?.stats?.recommendation_count ?? recommendations.length);
  const loanCount = Number(dashboard?.stats?.loan_offers_count ?? offers.length);
  const unreadCount = Number(dashboard?.stats?.unread_nudges ?? nudges.filter((item) => !item.read).length);

  const momentum = Math.min(98, 40 + recommendationCount * 4 + shortlistValue * 6);
  const profileScore = Math.min(96, 48 + shortlistValue * 9 + recommendationCount * 3);
  const loanReadiness = Math.min(94, 42 + loanCount * 14 - unreadCount * 2);

  const partnerNames = [
    topUniversity?.name,
    ...universities.slice(1, 4).map((item) => item.name),
    ...offers.slice(0, 3).map((item) => item.lender),
  ].filter(Boolean);

  const journey = [
    { label: 'Profile', body: 'Complete intent, budget, and program fit.', active: true },
    { label: 'Discovery', body: 'Compare universities by ranking, ROI, and location.' },
    { label: 'Finance', body: 'Compare lender offers and underwriting readiness.' },
    { label: 'Momentum', body: 'Keep nudges, deadlines, and actions moving forward.' },
  ];

  const testimonials = [
    {
      quote: 'Feels like the product team spent the entire sprint obsessing over every pixel.',
      name: 'Anushka, MS CS applicant',
    },
    {
      quote: 'The funding and admissions flow is presented like a premium fintech dashboard.',
      name: 'Nina, admissions ops lead',
    },
  ];

  return (
    <div className="page-stack premium-stack">
      <section className="hero card overview-hero">
        <div className="hero-copy hero-copy-premium">
          <Badge tone="accent">Premium student operating system</Badge>
          <h1>{user?.name ? `Welcome back, ${user.name}.` : 'A clear command center for applications, funding, and momentum.'}</h1>
          <p>
            {dashboard?.profile?.stage
              ? `You are in the ${dashboard.profile.stage} stage for ${dashboard.profile.program}. GradPath turns that context into a clear, organized workflow.`
              : 'Complete your profile, compare universities, and convert recommendations into a shortlist.'}
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button inline-button" onClick={() => onTabChange('discover')}>
              Explore universities
            </button>
            <button type="button" className="secondary-button inline-button" onClick={() => onTabChange('finance')}>
              Review funding
            </button>
            <button type="button" className="secondary-button inline-button" onClick={() => onTabChange('copilot')}>
              Get help
            </button>
          </div>
          <div className="hero-metric-strip">
            <div className="hero-metric"><strong>{momentum}%</strong><span>Momentum</span></div>
            <div className="hero-metric"><strong>{loanReadiness}%</strong><span>Loan readiness</span></div>
            <div className="hero-metric"><strong>{profileScore}%</strong><span>Profile strength</span></div>
          </div>
        </div>

        <div className="hero-preview glass-card">
          <div className="preview-header">
            <div>
              <div className="summary-label">Live preview</div>
              <h3>Momentum overview</h3>
            </div>
            <Badge tone="success">Realtime</Badge>
          </div>

          <div className="preview-grid">
            <ProgressRing label="Profile" value={profileScore} caption="Strength from progress, fit, and intent." />
            <div className="preview-panel">
              <div className="summary-label">Loan velocity</div>
              <MiniBars values={[26, 44, 58, 72, 88]} />
              <p>{loanCount} lender offers are flowing through the decision layer.</p>
            </div>
            <div className="preview-panel">
              <div className="summary-label">Admit heatmap</div>
              <HeatmapGrid values={[82, 69, 91, 57, 74, 88, 63, 80, 71, 85, 77, 93]} />
              <p>{recommendationCount} recommendations are ranked with richer visual context.</p>
            </div>
          </div>

          <div className="notification-stack">
            {dashboard?.recent_activity?.slice(0, 3).map((item: AnyRecord) => (
              <div key={item.title} className="notification-item">
                <strong>{item.title}</strong>
                <span>{item.message}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="metric-grid premium-metrics">
        <StatCard label="Engagement" value={engagementValue} caption="Points earned from actions and depth." />
        <StatCard label="Streak" value={`${streakValue} days`} caption="Daily momentum" />
        <StatCard label="Recommendations" value={recommendationCount} caption="Profile matches in motion" />
        <StatCard label="Loan offers" value={loanCount} caption="Available finance options" />
        <StatCard label="Unread nudges" value={unreadCount} caption="Needs your attention" />
        <StatCard label="Shortlist" value={shortlistValue} caption="Universities saved" />
      </section>

      <section className="feature-grid premium-features">
        {[
          { title: 'Problem', body: 'Student planning is usually fragmented across tabs, docs, and guesswork.' },
          { title: 'Solution', body: 'GradPath turns discovery, funding, and guidance into a single premium workflow.' },
          { title: 'Proof', body: 'The presentation is designed to feel like a funded fintech + edtech product.' },
        ].map((item) => (
          <motion.article className="card feature-card glass-card" key={item.title} whileHover={{ y: -6 }}>
            <span className="eyebrow">{item.title}</span>
            <p>{item.body}</p>
          </motion.article>
        ))}
      </section>

      <section className="dashboard-grid">
        <Panel
          title="Student journey"
          subtitle="A premium onboarding path that keeps the experience moving."
          action={<Badge tone="accent">Flow state</Badge>}
        >
          <Timeline steps={journey} />
        </Panel>

        <Panel title="Loan conversion" subtitle="Visualize the progression from interest to acceptance.">
          <div className="conversion-track">
            <div><strong>Apply</strong><span>56%</span></div>
            <div><strong>Underwrite</strong><span>78%</span></div>
            <div><strong>Accept</strong><span>92%</span></div>
          </div>
          <MiniBars values={[52, 64, 74, 83, 91, 96]} />
        </Panel>
      </section>

      <section className="dashboard-grid">
        <Panel title="ROI showcase" subtitle="The strongest value story should be visible at a glance.">
          <div className="roi-table">
            {recommendations.slice(0, 4).map((item) => (
              <div key={item.id} className="roi-row">
                <div>
                  <strong>{item.university}</strong>
                  <span>{item.reason}</span>
                </div>
                <Badge tone="accent">{formatPercent(item.fit_score)} fit</Badge>
              </div>
            ))}
            {!recommendations.length && <EmptyState>Recommendations will appear here after profile updates.</EmptyState>}
          </div>
        </Panel>

        <Panel title="Support panel" subtitle="Profile-aware guidance with a clean presentation.">
          <div className="assistant-panel">
            <div className="assistant-card">
              <strong>Suggested next move</strong>
              <p>{topRecommendation ? topRecommendation.reason : 'Open Discover to generate the next high-confidence recommendation.'}</p>
            </div>
            <div className="assistant-card secondary">
              <strong>Funding lens</strong>
              <p>{topUniversity ? `${topUniversity.name} appears in the shortlist-ready set.` : 'No university chosen yet.'}</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="dashboard-grid">
        <Panel title="Testimonials" subtitle="The pitch should read like a luxury product site.">
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="testimonial-card">
                <p>{item.quote}</p>
                <footer>{item.name}</footer>
              </blockquote>
            ))}
          </div>
        </Panel>

        <Panel title="Partners and trust" subtitle="University and lender surfaces that feel investor-grade.">
          <div className="partner-cloud">
            {partnerNames.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </Panel>
      </section>

      <section className="impact-cta glass-card">
        <div>
          <span className="eyebrow">Business impact</span>
          <h2>Move faster, stay organized, and keep every step visible.</h2>
          <p>GradPath is presented with strong hierarchy, depth, motion, and a clear path to action.</p>
        </div>
        <div className="impact-actions">
          <button type="button" className="primary-button" onClick={() => onTabChange('discover')}>Go to discovery</button>
          <button type="button" className="secondary-button" onClick={() => onTabChange('copilot')}>Open help</button>
        </div>
      </section>
    </div>
  );
}

function ProfileTab({ profileForm, setProfileForm, onSave, saving }: { profileForm: AnyRecord; setProfileForm: (next: AnyRecord) => void; onSave: (event: FormEvent<HTMLFormElement>) => void; saving: boolean; }) {
  const fields = [
    ['name', 'Name'],
    ['program', 'Program'],
    ['cgpa', 'CGPA'],
    ['ielts', 'IELTS'],
    ['work_experience_years', 'Work experience years'],
    ['budget_usd', 'Budget USD'],
    ['funding_need_usd', 'Funding need USD'],
    ['stage', 'Stage'],
    ['intake', 'Intake'],
    ['gre', 'GRE'],
  ] as const;

  return (
    <div className="grid profile-grid">
      <Panel title="Profile editor" subtitle="Edit the fields that power recommendations, finance, and guidance context.">
        <form className="form-grid profile-form" onSubmit={onSave}>
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              <input value={profileForm[key] ?? ''} onChange={(event) => setProfileForm({ ...profileForm, [key]: event.target.value })} placeholder={label} />
            </label>
          ))}
          <label className="span-2">
            Preferred countries
            <input
              value={(profileForm.preferred_countries || []).join(', ')}
              onChange={(event) =>
                setProfileForm({
                  ...profileForm,
                  preferred_countries: event.target.value.split(',').map((value: string) => value.trim()).filter(Boolean),
                })
              }
              placeholder="Canada, Germany"
            />
          </label>
          <button type="submit" className="primary-button span-2" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </Panel>

      <Panel title="Profile snapshot" subtitle="What the backend is currently using to personalize your workspace.">
        <SummaryGrid data={profileForm} />
      </Panel>
    </div>
  );
}

function DiscoverTab({
  universities,
  recommendations,
  shortlistIds,
  search,
  onSearchChange,
  onGenerate,
  onSelect,
  selectedUniversity,
  onShortlist,
}: {
  universities: AnyRecord[];
  recommendations: AnyRecord[];
  shortlistIds: string[];
  search: AnyRecord;
  onSearchChange: (next: AnyRecord) => void;
  onGenerate: () => void;
  onSelect: (university: AnyRecord) => void;
  selectedUniversity: AnyRecord | null;
  onShortlist: (university: AnyRecord, shortlisted: boolean) => void;
}) {
  const filteredUniversities = universities
    .filter((item) => {
      const query = String(search.query || '').toLowerCase();
      const country = String(search.country || '').toLowerCase();
      const program = String(search.program || '').toLowerCase();
      const ranking = Number(search.ranking || 0);
      const maxRanking = Number(search.maxRanking || 999);
      const matchesQuery = !query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
      const matchesCountry = !country || item.country.toLowerCase().includes(country);
      const matchesProgram = !program || item.programs.some((value: string) => value.toLowerCase().includes(program));
      const matchesRanking = item.ranking >= ranking && item.ranking <= maxRanking;
      return matchesQuery && matchesCountry && matchesProgram && matchesRanking;
    })
    .sort((a, b) => {
      if (search.sort === 'roi') return b.roi_pct - a.roi_pct;
      if (search.sort === 'name') return a.name.localeCompare(b.name);
      return a.ranking - b.ranking;
    });

  return (
    <div className="grid discover-grid">
      <Panel
        title="University discovery"
        subtitle="Search, filter, and shortlist universities by country, program, ranking, and ROI."
        action={<button type="button" className="secondary-button" onClick={onGenerate}>Refresh recommendations</button>}
      >
        <div className="filter-grid">
          <label>
            Search
            <input value={search.query} onChange={(event) => onSearchChange({ ...search, query: event.target.value })} placeholder="Search universities" />
          </label>
          <label>
            Country
            <input value={search.country} onChange={(event) => onSearchChange({ ...search, country: event.target.value })} placeholder="Canada" />
          </label>
          <label>
            Program
            <input value={search.program} onChange={(event) => onSearchChange({ ...search, program: event.target.value })} placeholder="Computer Science" />
          </label>
          <label>
            Min ranking
            <input value={search.ranking} onChange={(event) => onSearchChange({ ...search, ranking: event.target.value })} type="number" placeholder="1" />
          </label>
          <label>
            Max ranking
            <input value={search.maxRanking} onChange={(event) => onSearchChange({ ...search, maxRanking: event.target.value })} type="number" placeholder="200" />
          </label>
          <label>
            Sort by
            <select value={search.sort} onChange={(event) => onSearchChange({ ...search, sort: event.target.value })}>
              <option value="ranking">Ranking</option>
              <option value="roi">ROI</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        <div className="results-row">
          <Badge tone="neutral">{filteredUniversities.length} universities</Badge>
          <Badge tone="neutral">{recommendations.length} recommendations</Badge>
          <Badge tone="neutral">{shortlistIds.length} shortlisted</Badge>
        </div>

        <div className="stack-list university-list">
          {filteredUniversities.map((university) => {
            const shortlisted = shortlistIds.includes(university.id);
            return (
              <button key={university.id} type="button" className={`university-card ${selectedUniversity?.id === university.id ? 'selected' : ''}`} onClick={() => onSelect(university)}>
                <div className="stack-title-row">
                  <div>
                    <div className="stack-title">{university.name}</div>
                    <div className="stack-body">{university.country} · {university.location}</div>
                  </div>
                  <div className="university-score">#{university.ranking}</div>
                </div>
                <div className="meta-row">
                  <span>Programs: {formatValue(university.programs)}</span>
                  <span>Tuition: {formatCurrency(university.tuition_usd)}</span>
                  <span>ROI: {formatPercent(university.roi_pct)}</span>
                </div>
                <p className="stack-body">{university.description}</p>
                <div className="row-actions">
                  <Badge tone={shortlisted ? 'success' : 'neutral'}>{shortlisted ? 'Shortlisted' : 'Tap to shortlist'}</Badge>
                </div>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="University detail" subtitle="Open a card to see the detailed view and shortlist action.">
        {selectedUniversity ? (
          <div className="detail-card">
            <div className="stack-title-row">
              <div>
                <h3>{selectedUniversity.name}</h3>
                <p className="section-subtitle">{selectedUniversity.country} · {selectedUniversity.location}</p>
              </div>
              <Badge tone="accent">#{selectedUniversity.ranking}</Badge>
            </div>
            <SummaryGrid
              data={{
                tuition_usd: formatCurrency(selectedUniversity.tuition_usd),
                placement_salary_usd: formatCurrency(selectedUniversity.placement_salary_usd),
                roi_pct: formatPercent(selectedUniversity.roi_pct),
                admission_rate_pct: formatPercent(selectedUniversity.admission_rate_pct),
              }}
            />
            <div className="detail-links">
              <a href={selectedUniversity.website} target="_blank" rel="noreferrer">Visit website</a>
            </div>
            <div className="row-actions">
              <button type="button" className="primary-button inline-button" onClick={() => onShortlist(selectedUniversity, shortlistIds.includes(selectedUniversity.id))}>
                {shortlistIds.includes(selectedUniversity.id) ? 'Remove from shortlist' : 'Add to shortlist'}
              </button>
            </div>
          </div>
        ) : (
          <EmptyState>Select a university to inspect programs, ROI, and website details.</EmptyState>
        )}

        <div className="divider" />

        <h3>Recommendations</h3>
        {recommendations.length ? (
          <div className="stack-list">
            {recommendations.map((item) => (
              <div key={item.id} className="stack-item recommendation-card">
                <div className="stack-title-row">
                  <div>
                    <div className="stack-title">{item.university}</div>
                    <div className="stack-body">{item.reason}</div>
                  </div>
                  <Badge tone="accent">{formatPercent(item.fit_score)} fit</Badge>
                </div>
                <div className="meta-row">
                  <span>ROI {formatPercent(item.roi_estimate_pct)}</span>
                  <span>Tuition {formatCurrency(item.estimated_tuition_usd)}</span>
                  <span>Admit {formatPercent(item.admit_chance_pct)}</span>
                </div>
                <div className="chips-row">
                  {item.key_drivers?.map((driver: string) => (
                    <Badge key={driver} tone="neutral">{driver}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Generate recommendations from your current profile to populate this section.</EmptyState>
        )}
      </Panel>
    </div>
  );
}

function FinanceTab({
  eligibilityForm,
  setEligibilityForm,
  eligibilityResult,
  offers,
  onRunEligibility,
  onAcceptOffer,
  acceptingOfferId,
}: {
  eligibilityForm: AnyRecord;
  setEligibilityForm: (next: AnyRecord) => void;
  eligibilityResult: AnyRecord | null;
  offers: AnyRecord[];
  onRunEligibility: (event: FormEvent<HTMLFormElement>) => void;
  onAcceptOffer: (offerId: string) => void;
  acceptingOfferId: string | null;
}) {
  return (
    <div className="grid finance-grid">
      <Panel title="Eligibility check" subtitle="Estimate whether your profile can support the requested amount.">
        <form className="form-grid finance-form" onSubmit={onRunEligibility}>
          {[
            ['annual_family_income_usd', 'Annual family income USD'],
            ['collateral_available_usd', 'Collateral available USD'],
            ['credit_score', 'Credit score'],
            ['target_country', 'Target country'],
            ['total_required_usd', 'Total required USD'],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input value={eligibilityForm[key] ?? ''} onChange={(event) => setEligibilityForm({ ...eligibilityForm, [key]: event.target.value })} placeholder={label} />
            </label>
          ))}
          <button type="submit" className="primary-button span-2">Run eligibility check</button>
        </form>

        {eligibilityResult && (
          <div className="result-card">
            <div className="stack-title-row">
              <h3>{eligibilityResult.eligible ? 'Eligible' : 'Review needed'}</h3>
              <Badge tone={eligibilityResult.eligible ? 'success' : 'warning'}>{formatPercent(eligibilityResult.likely_interest_pct)} likely rate</Badge>
            </div>
            <SummaryGrid
              data={{
                max_loan_amount_usd: formatCurrency(eligibilityResult.max_loan_amount_usd),
                reason: eligibilityResult.reason,
              }}
            />
          </div>
        )}
      </Panel>

      <Panel title="Loan offers" subtitle="Accept an offer and watch the dashboard update immediately.">
        <div className="stack-list">
          {offers.map((offer) => (
            <div className="stack-item offer-card" key={offer.id}>
              <div className="stack-title-row">
                <div>
                  <div className="stack-title">{offer.lender}</div>
                  <div className="stack-body">{offer.status === 'accepted' ? 'Accepted' : 'Available'}</div>
                </div>
                <Badge tone={offer.status === 'accepted' ? 'success' : 'neutral'}>{formatPercent(offer.interest_rate_pct)}</Badge>
              </div>
              <div className="meta-row">
                <span>Amount {formatCurrency(offer.amount_usd)}</span>
                <span>Tenor {offer.tenor_months} months</span>
                <span>EMI {formatCurrency(offer.monthly_emi_usd)}</span>
              </div>
              <div className="row-actions">
                <button type="button" className="secondary-button inline-button" disabled={offer.status === 'accepted' || acceptingOfferId === offer.id} onClick={() => onAcceptOffer(offer.id)}>
                  {acceptingOfferId === offer.id ? 'Updating...' : offer.status === 'accepted' ? 'Accepted' : 'Accept offer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function GrowthTab({ nudges, dashboard, onMarkRead, workingId }: { nudges: AnyRecord[]; dashboard: AnyRecord | null; onMarkRead: (nudgeId: string) => void; workingId: string | null; }) {
  return (
    <div className="grid growth-grid">
      <Panel title="Progress" subtitle="Unread nudges and recent activity live together here.">
        <div className="metric-grid compact">
          <StatCard label="Unread nudges" value={dashboard?.stats?.unread_nudges ?? nudges.filter((item) => !item.read).length} />
          <StatCard label="Streak" value={`${dashboard?.stats?.streak_days ?? 0} days`} />
        </div>
        <div className="stack-list">
          {nudges.length ? nudges.map((nudge) => (
            <div className="stack-item nudge-card" key={nudge.id}>
              <div className="stack-title-row">
                <div>
                  <div className="stack-title">{nudge.title}</div>
                  <div className="stack-body">{nudge.message}</div>
                </div>
                <Badge tone={nudge.read ? 'neutral' : 'warning'}>{nudge.read ? 'Read' : 'Unread'}</Badge>
              </div>
              <div className="row-actions">
                <button type="button" className="secondary-button inline-button" disabled={nudge.read || workingId === nudge.id} onClick={() => onMarkRead(nudge.id)}>
                  {workingId === nudge.id ? 'Saving...' : nudge.read ? 'Marked read' : nudge.action_text}
                </button>
              </div>
            </div>
          )) : <EmptyState>No nudges yet.</EmptyState>}
        </div>
      </Panel>

      <Panel title="Recent activity" subtitle="Every action updates the activity feed.">
        {dashboard?.recent_activity?.length ? (
          <div className="stack-list">
            {dashboard.recent_activity.map((item: AnyRecord, index: number) => (
              <div className="stack-item" key={`${item.title}-${index}`}>
                <div className="stack-title">{item.title}</div>
                <div className="stack-body">{item.message}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No recent activity.</EmptyState>
        )}
      </Panel>
    </div>
  );
}

function CopilotTab({
  messages,
  input,
  setInput,
  busy,
  onSend,
  onPickPrompt,
  user,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  busy: boolean;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  onPickPrompt: (value: string) => void;
  user: AnyRecord | null;
}) {
  const promptChips = [
    'Which universities fit my profile best?',
    'How should I balance budget and ROI?',
    'What should I do before deadlines?',
    'Summarize the strongest funding option.',
  ];

  return (
    <div className="grid copilot-grid">
      <Panel title="Help chat" subtitle="Single-request-at-a-time chat with profile-aware context.">
        <div className="chips-row">
          {promptChips.map((prompt) => (
            <button key={prompt} type="button" className="prompt-chip" onClick={() => onPickPrompt(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <div className="chat-window">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
              <div className="chat-role">{message.role === 'user' ? 'You' : 'Guide'}</div>
              <div className="chat-text">{message.text}</div>
            </div>
          ))}
        </div>

        <form className="chat-form" onSubmit={onSend}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={4} placeholder="Ask about universities, loan options, deadlines, or next steps." />
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </Panel>

      <Panel title="Context" subtitle="The guide uses the current profile and recent conversation as context.">
        <SummaryGrid
          data={{
            name: user?.name,
            program: user?.program,
            stage: user?.stage,
            budget_usd: formatCurrency(user?.budget_usd),
            funding_need_usd: formatCurrency(user?.funding_need_usd),
            preferred_countries: formatValue(user?.preferred_countries),
          }}
        />
      </Panel>
    </div>
  );
}

function AdminTab({ admin, personas, onReset, resetting }: { admin: AnyRecord | null; personas: AnyRecord[]; onReset: () => void; resetting: boolean; }) {
  const [crudTab, setCrudTab] = useState<'universities' | 'loans' | 'nudges' | 'overview'>('overview');
  const [universities, setUniversities] = useState<AnyRecord[]>([]);
  const [loans, setLoans] = useState<AnyRecord[]>([]);
  const [nudges, setNudges] = useState<AnyRecord[]>([]);
  const [uniForm, setUniForm] = useState({ id: '', name: '', country: '', ranking: 0, tuition_usd: 0, website: '' });
  const [loanForm, setLoanForm] = useState({ id: '', lender: '', amount_usd: 0, interest_rate_pct: 0 });
  const [nudgeForm, setNudgeForm] = useState({ id: '', title: '', message: '' });

  useEffect(() => {
    if (crudTab === 'universities') {
      api.adminUniversities(1, 50).then((data: any) => setUniversities(data.items || [])).catch(() => {});
    } else if (crudTab === 'loans') {
      api.adminLoanOffers(1, 50).then((data: any) => setLoans(data.items || [])).catch(() => {});
    } else if (crudTab === 'nudges') {
      api.adminNudges(1, 50).then((data: any) => setNudges(data.items || [])).catch(() => {});
    }
  }, [crudTab]);

  const handleUniSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (uniForm.id) {
        await api.adminUpdateUniversity(uniForm.id, uniForm);
      } else {
        await api.adminCreateUniversity(uniForm);
      }
      setUniversities((prev) => [...prev.filter((u) => u.id !== uniForm.id), uniForm]);
      setUniForm({ id: '', name: '', country: '', ranking: 0, tuition_usd: 0, website: '' });
    } catch (e) {}
  };

  const handleUniDelete = async (id: string) => {
    try {
      await api.adminDeleteUniversity(id);
      setUniversities((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {}
  };

  const handleLoanSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (loanForm.id) {
        await api.adminUpdateLoanOffer(loanForm.id, loanForm);
      } else {
        await api.adminCreateLoanOffer(loanForm);
      }
      setLoans((prev) => [...prev.filter((l) => l.id !== loanForm.id), loanForm]);
      setLoanForm({ id: '', lender: '', amount_usd: 0, interest_rate_pct: 0 });
    } catch (e) {}
  };

  const handleLoanDelete = async (id: string) => {
    try {
      await api.adminDeleteLoanOffer(id);
      setLoans((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {}
  };

  const handleNudgeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (nudgeForm.id) {
        await api.adminUpdateNudge(nudgeForm.id, nudgeForm);
      } else {
        await api.adminCreateNudge(nudgeForm);
      }
      setNudges((prev) => [...prev.filter((n) => n.id !== nudgeForm.id), nudgeForm]);
      setNudgeForm({ id: '', title: '', message: '' });
    } catch (e) {}
  };

  const handleNudgeDelete = async (id: string) => {
    try {
      await api.adminDeleteNudge(id);
      setNudges((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {}
  };

  return (
    <div className="grid admin-grid">
      {crudTab === 'overview' && (
        <>
          <Panel title="Admin dashboard" subtitle="Demo controls and aggregate state for the seeded workspace." action={<button type="button" className="primary-button" onClick={onReset} disabled={resetting} aria-label="Reset demo data">{resetting ? 'Resetting...' : 'Reset demo data'}</button>}>
            <div className="metric-grid">
              <StatCard label="Active students" value={admin?.stats?.active_students ?? 0} />
              <StatCard label="Universities" value={admin?.stats?.universities ?? 0} />
              <StatCard label="Unread nudges" value={admin?.stats?.unread_nudges ?? 0} />
              <StatCard label="Accepted offers" value={admin?.stats?.accepted_offers ?? 0} />
              <StatCard label="Recommendations" value={admin?.stats?.recommendations_generated ?? 0} />
            </div>

            <div className="divider" />

            <h3>Demo personas</h3>
            <div className="persona-grid compact">
              {personas.map((persona) => (
                <div key={persona.id} className="persona-card readonly">
                  <strong>{persona.name}</strong>
                  <span>{persona.program}</span>
                  <small>{persona.stage} · {persona.intake}</small>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Release checks" subtitle="Quick view of the demo readiness checklist.">
            <div className="stack-list">
              {[
                'Auth token persists across page reloads.',
                'Profile updates regenerate recommendations.',
                'Loan acceptance updates dashboard state.',
                'Unread nudges can be marked read.',
                'Guidance accepts one message at a time.',
              ].map((item) => (
                <div className="stack-item" key={item}>
                  <div className="stack-title">{item}</div>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {crudTab === 'universities' && (
        <Panel title="Manage universities" subtitle="Add, edit, or delete universities from the catalog.">
          <form onSubmit={handleUniSubmit} className="form-stack">
            <input type="text" placeholder="University ID" value={uniForm.id} onChange={(e) => setUniForm({ ...uniForm, id: e.target.value })} aria-label="University ID" />
            <input type="text" placeholder="Name" value={uniForm.name} onChange={(e) => setUniForm({ ...uniForm, name: e.target.value })} aria-label="University name" />
            <input type="text" placeholder="Country" value={uniForm.country} onChange={(e) => setUniForm({ ...uniForm, country: e.target.value })} aria-label="Country" />
            <input type="number" placeholder="Ranking" value={uniForm.ranking} onChange={(e) => setUniForm({ ...uniForm, ranking: Number(e.target.value) })} aria-label="Ranking" />
            <input type="number" placeholder="Tuition (USD)" value={uniForm.tuition_usd} onChange={(e) => setUniForm({ ...uniForm, tuition_usd: Number(e.target.value) })} aria-label="Tuition USD" />
            <input type="url" placeholder="Website" value={uniForm.website} onChange={(e) => setUniForm({ ...uniForm, website: e.target.value })} aria-label="Website URL" />
            <button type="submit" className="primary-button">Save university</button>
          </form>
          <div className="divider" />
          <h4>Universities</h4>
          <div className="compact-list">
            {universities.map((uni: any) => (
              <div key={uni.id} className="list-item">
                <div>
                  <strong>{uni.name}</strong>
                  <small>{uni.country} · Ranking {uni.ranking}</small>
                </div>
                <button type="button" onClick={() => handleUniDelete(uni.id)} className="secondary-button">Delete</button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {crudTab === 'loans' && (
        <Panel title="Manage loan offers" subtitle="Add, edit, or delete loan offer templates.">
          <form onSubmit={handleLoanSubmit} className="form-stack">
            <input type="text" placeholder="Offer ID" value={loanForm.id} onChange={(e) => setLoanForm({ ...loanForm, id: e.target.value })} aria-label="Loan offer ID" />
            <input type="text" placeholder="Lender" value={loanForm.lender} onChange={(e) => setLoanForm({ ...loanForm, lender: e.target.value })} aria-label="Lender name" />
            <input type="number" placeholder="Amount (USD)" value={loanForm.amount_usd} onChange={(e) => setLoanForm({ ...loanForm, amount_usd: Number(e.target.value) })} aria-label="Amount USD" />
            <input type="number" placeholder="Interest rate (%)" value={loanForm.interest_rate_pct} onChange={(e) => setLoanForm({ ...loanForm, interest_rate_pct: Number(e.target.value) })} aria-label="Interest rate percent" />
            <button type="submit" className="primary-button">Save offer</button>
          </form>
          <div className="divider" />
          <h4>Loan offers</h4>
          <div className="compact-list">
            {loans.map((loan: any) => (
              <div key={loan.id} className="list-item">
                <div>
                  <strong>{loan.lender}</strong>
                  <small>{formatCurrency(loan.amount_usd)} at {loan.interest_rate_pct}%</small>
                </div>
                <button type="button" onClick={() => handleLoanDelete(loan.id)} className="secondary-button">Delete</button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {crudTab === 'nudges' && (
        <Panel title="Manage nudges" subtitle="Add, edit, or delete nudge templates.">
          <form onSubmit={handleNudgeSubmit} className="form-stack">
            <input type="text" placeholder="Nudge ID" value={nudgeForm.id} onChange={(e) => setNudgeForm({ ...nudgeForm, id: e.target.value })} aria-label="Nudge ID" />
            <input type="text" placeholder="Title" value={nudgeForm.title} onChange={(e) => setNudgeForm({ ...nudgeForm, title: e.target.value })} aria-label="Nudge title" />
            <textarea placeholder="Message" value={nudgeForm.message} onChange={(e) => setNudgeForm({ ...nudgeForm, message: e.target.value })} aria-label="Nudge message" rows={3} />
            <button type="submit" className="primary-button">Save nudge</button>
          </form>
          <div className="divider" />
          <h4>Nudges</h4>
          <div className="compact-list">
            {nudges.map((nudge: any) => (
              <div key={nudge.id} className="list-item">
                <div>
                  <strong>{nudge.title}</strong>
                  <small>{nudge.message}</small>
                </div>
                <button type="button" onClick={() => handleNudgeDelete(nudge.id)} className="secondary-button">Delete</button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="admin-tabs">
        <button type="button" className={crudTab === 'overview' ? 'active' : ''} onClick={() => setCrudTab('overview')} aria-label="Overview tab">Overview</button>
        <button type="button" className={crudTab === 'universities' ? 'active' : ''} onClick={() => setCrudTab('universities')} aria-label="Universities management">Universities</button>
        <button type="button" className={crudTab === 'loans' ? 'active' : ''} onClick={() => setCrudTab('loans')} aria-label="Loan offers management">Loans</button>
        <button type="button" className={crudTab === 'nudges' ? 'active' : ''} onClick={() => setCrudTab('nudges')} aria-label="Nudges management">Nudges</button>
      </div>
    </div>
  );
}


export default function App() {
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [notice, setNotice] = useState<string | null>(null);

  const [personas, setPersonas] = useState<AnyRecord[]>([]);
  const [user, setUser] = useState<AnyRecord | null>(null);
  const [dashboard, setDashboard] = useState<AnyRecord | null>(null);
  const [universities, setUniversities] = useState<AnyRecord[]>([]);
  const [recommendations, setRecommendations] = useState<AnyRecord[]>([]);
  const [offers, setOffers] = useState<AnyRecord[]>([]);
  const [nudges, setNudges] = useState<AnyRecord[]>([]);
  const [admin, setAdmin] = useState<AnyRecord | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<AnyRecord | null>(null);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [markingNudgeId, setMarkingNudgeId] = useState<string | null>(null);
  const [workspaceRefreshing, setWorkspaceRefreshing] = useState(false);

  const [authForm, setAuthForm] = useState<AnyRecord>({
    name: '',
    email: '',
    password: 'demo1234',
    program: 'MS Computer Science',
  });

  const [profileForm, setProfileForm] = useState<AnyRecord>({
    name: '',
    program: '',
    cgpa: '',
    ielts: '',
    work_experience_years: '',
    budget_usd: '',
    funding_need_usd: '',
    stage: '',
    intake: '',
    preferred_countries: [],
    gre: '',
  });

  const [searchForm, setSearchForm] = useState<AnyRecord>({
    query: '',
    country: '',
    program: '',
    ranking: '1',
    maxRanking: '200',
    sort: 'ranking',
  });

  const [eligibilityForm, setEligibilityForm] = useState<AnyRecord>({
    annual_family_income_usd: '18000',
    collateral_available_usd: '25000',
    credit_score: '760',
    target_country: 'Canada',
    total_required_usd: '50000',
  });

  const [eligibilityResult, setEligibilityResult] = useState<AnyRecord | null>(null);
  const [copilotInput, setCopilotInput] = useState('What should I prioritize for Fall 2027 applications?');
  const [copilotBusy, setCopilotBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Ask me about universities, funding, deadlines, or how to improve your shortlist.' },
  ]);

  async function bootstrapWorkspace(token?: string | null) {
    if (token) {
      setSessionToken(token);
      setSessionTokenState(token);
      localStorage.setItem(SESSION_KEY, token);
    }

    setWorkspaceRefreshing(true);
    try {
      const [me, workspace, universityData, recommendationData, offerData, nudgeData, adminData, personaData] = await Promise.all([
        api.me(),
        api.studentDashboard(),
        api.universities({}),
        api.myRecommendations(),
        api.loanOffers(),
        api.nudgesMe(),
        api.adminDashboard(),
        api.demoPersonas(),
      ]);

      setUser(me);
      setDashboard(workspace);
      setUniversities(universityData || []);
      setRecommendations(recommendationData.items || []);
      setOffers(offerData.offers || []);
      setNudges(nudgeData.items || []);
      setAdmin(adminData);
      setPersonas(personaData || []);
      setSelectedUniversity((current) => current ?? universityData?.[0] ?? null);
      setProfileForm({
        name: me.name || '',
        program: me.program || '',
        cgpa: me.cgpa ?? '',
        ielts: me.ielts ?? '',
        work_experience_years: me.work_experience_years ?? '',
        budget_usd: me.budget_usd ?? '',
        funding_need_usd: me.funding_need_usd ?? '',
        stage: me.stage || '',
        intake: me.intake || '',
        preferred_countries: me.preferred_countries || [],
        gre: me.gre ?? '',
      });
      setNotice(token ? 'Session restored.' : 'Demo workspace loaded.');
    } finally {
      setWorkspaceRefreshing(false);
      setBooting(false);
    }
  }

  useEffect(() => {
    api.demoPersonas().then(setPersonas).catch(() => setPersonas([]));
    const savedToken = localStorage.getItem(SESSION_KEY);
    if (savedToken) {
      bootstrapWorkspace(savedToken).catch(() => {
        clearSessionToken();
        setSessionTokenState(null);
        localStorage.removeItem(SESSION_KEY);
        setBooting(false);
      });
    } else {
      setBooting(false);
    }
  }, []);

  async function refreshWorkspace() {
    await bootstrapWorkspace(sessionToken);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const payload = authMode === 'register'
        ? { name: authForm.name, email: authForm.email, password: authForm.password, program: authForm.program }
        : { email: authForm.email, password: authForm.password };
      const response = authMode === 'register' ? await api.register(payload) : await api.login(payload);
      await bootstrapWorkspace(response.token);
      setNotice(authMode === 'register' ? 'Account created.' : 'Logged in successfully.');
      setActiveTab('overview');
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setAuthError(detail ? String(detail) : 'Unable to authenticate right now. Make sure the backend is running on port 8000.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handlePersona(personaId: string) {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const response = await api.activatePersona(personaId);
      await bootstrapWorkspace(response.token);
      setActiveTab('overview');
      setNotice(`Loaded persona ${response.user.name}.`);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setAuthError(detail ? String(detail) : 'Unable to load the demo persona right now. Start the backend on port 8000.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        ...profileForm,
        cgpa: Number(profileForm.cgpa),
        ielts: Number(profileForm.ielts),
        work_experience_years: Number(profileForm.work_experience_years),
        budget_usd: Number(profileForm.budget_usd),
        funding_need_usd: Number(profileForm.funding_need_usd),
        gre: Number(profileForm.gre),
      };
      await api.updateMe(payload);
      await api.generateRecommendations();
      await refreshWorkspace();
      setNotice('Profile saved and recommendations refreshed.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleGenerateRecommendations() {
    await api.generateRecommendations();
    await refreshWorkspace();
    setNotice('Recommendations refreshed.');
    setActiveTab('discover');
  }

  async function handleShortlist(university: AnyRecord, shortlisted: boolean) {
    if (shortlisted) {
      await api.unshortlistUniversity(university.id);
      setNotice(`${university.name} removed from shortlist.`);
    } else {
      await api.shortlistUniversity(university.id);
      setNotice(`${university.name} added to shortlist.`);
    }
    await refreshWorkspace();
  }

  async function handleAcceptOffer(offerId: string) {
    setAcceptingOfferId(offerId);
    try {
      await api.acceptLoanOffer(offerId);
      await refreshWorkspace();
      setNotice('Loan offer accepted.');
    } finally {
      setAcceptingOfferId(null);
    }
  }

  async function handleMarkRead(nudgeId: string) {
    setMarkingNudgeId(nudgeId);
    try {
      await api.markNudgeRead(nudgeId);
      await refreshWorkspace();
      setNotice('Nudge marked read.');
    } finally {
      setMarkingNudgeId(null);
    }
  }

  async function handleEligibilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await api.loanEligibility({
      annual_family_income_usd: Number(eligibilityForm.annual_family_income_usd),
      collateral_available_usd: Number(eligibilityForm.collateral_available_usd),
      credit_score: Number(eligibilityForm.credit_score),
      target_country: eligibilityForm.target_country,
      total_required_usd: Number(eligibilityForm.total_required_usd),
    });
    setEligibilityResult(result);
    setNotice('Eligibility check complete.');
  }

  async function handleCopilotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!copilotInput.trim() || copilotBusy) {
      return;
    }

    const nextMessages = [...messages, { role: 'user' as const, text: copilotInput.trim() }];
    setMessages(nextMessages);
    setCopilotInput('');
    setCopilotBusy(true);
    try {
      const response = await api.mentor({
        message: copilotInput.trim(),
        context: {
          profile: user,
          stage: user?.stage,
          program: user?.program,
          budget: user?.budget_usd,
          preferred_countries: user?.preferred_countries,
          history: nextMessages.slice(-4),
        },
      });
      setMessages((current) => [...current, { role: 'assistant', text: response.reply }]);
      setNotice('Guidance responded with profile-aware context.');
    } finally {
      setCopilotBusy(false);
    }
  }

  async function handleResetDemo() {
    setWorkspaceRefreshing(true);
    try {
      await api.resetDemo();
      await refreshWorkspace();
      setNotice('Demo data refreshed.');
    } finally {
      setWorkspaceRefreshing(false);
    }
  }

  function handleLogout() {
    clearSessionToken();
    setSessionTokenState(null);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setDashboard(null);
    setUniversities([]);
    setRecommendations([]);
    setOffers([]);
    setNudges([]);
    setAdmin(null);
    setSelectedUniversity(null);
    setNotice('Logged out.');
    setActiveTab('overview');
  }

  if (booting) {
    return (
      <div className="container">
        <div className="card loading-state">Loading GradPath workspace...</div>
      </div>
    );
  }

  if (!sessionToken) {
    return (
      <div className="container">
        <AuthLanding
          mode={authMode}
          onModeChange={setAuthMode}
          authForm={authForm}
          setAuthForm={setAuthForm}
          personas={personas}
          loading={authBusy}
          onSubmit={handleAuthSubmit}
          onPersona={handlePersona}
          error={authError}
        />
      </div>
    );
  }

  return (
    <div className="container app-shell">
      <TopNav activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} user={user} notice={notice} />

      <div className="workspace-meta">
        <Badge tone="neutral">{workspaceRefreshing ? 'Refreshing...' : 'Live session'}</Badge>
        <Badge tone="neutral">{user?.stage || 'Onboarding'}</Badge>
        <Badge tone="neutral">{user?.intake || 'No intake set'}</Badge>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
            <OverviewTab
              dashboard={dashboard}
              recommendations={recommendations}
              offers={offers}
              nudges={nudges}
              universities={universities}
              user={user}
              onTabChange={setActiveTab}
            />
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
            <ProfileTab profileForm={profileForm} setProfileForm={setProfileForm} onSave={handleProfileSave} saving={savingProfile} />
          </motion.div>
        )}

        {activeTab === 'discover' && (
          <motion.div key="discover" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
            <DiscoverTab
              universities={universities}
              recommendations={recommendations}
              shortlistIds={user?.shortlist || []}
              search={searchForm}
              onSearchChange={setSearchForm}
              onGenerate={handleGenerateRecommendations}
              onSelect={setSelectedUniversity}
              selectedUniversity={selectedUniversity}
              onShortlist={handleShortlist}
            />
          </motion.div>
        )}

        {activeTab === 'finance' && (
          <motion.div key="finance" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
            <FinanceTab
              eligibilityForm={eligibilityForm}
              setEligibilityForm={setEligibilityForm}
              eligibilityResult={eligibilityResult}
              offers={offers}
              onRunEligibility={handleEligibilitySubmit}
              onAcceptOffer={handleAcceptOffer}
              acceptingOfferId={acceptingOfferId}
            />
          </motion.div>
        )}

        {activeTab === 'growth' && (
          <motion.div key="growth" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
            <GrowthTab nudges={nudges} dashboard={dashboard} onMarkRead={handleMarkRead} workingId={markingNudgeId} />
          </motion.div>
        )}

        {activeTab === 'copilot' && (
          <motion.div key="copilot" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
            <CopilotTab messages={messages} input={copilotInput} setInput={setCopilotInput} busy={copilotBusy} onSend={handleCopilotSubmit} onPickPrompt={setCopilotInput} user={user} />
          </motion.div>
        )}

        {activeTab === 'admin' && (
          <motion.div key="admin" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}>
            <AdminTab admin={admin} personas={personas} onReset={handleResetDemo} resetting={workspaceRefreshing} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}