import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { api } from './api';

type AnyRecord = Record<string, unknown>;

function formatLabel(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return '—';
  return String(value);
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

function NotificationList({ items }: { items: Array<AnyRecord> }) {
  if (!items.length) return <p className="empty-state">No notifications yet.</p>;

  return (
    <div className="stack-list">
      {items.map((item) => (
        <div className="stack-item" key={String(item.id ?? item.title)}>
          <div className="stack-title">{formatValue(item.title)}</div>
          <div className="stack-body">{formatValue(item.message)}</div>
        </div>
      ))}
    </div>
  );
}

function OfferList({ items }: { items: Array<AnyRecord> }) {
  if (!items.length) return <p className="empty-state">No loan offers loaded.</p>;

  return (
    <div className="stack-list">
      {items.map((item) => (
        <div className="stack-item" key={String(item.bank ?? item.max_amount_usd)}>
          <div className="stack-title">{formatValue(item.bank)}</div>
          <div className="meta-row">
            <span>Interest: {formatValue(item.interest_pct)}%</span>
            <span>Max: ${formatValue(item.max_amount_usd)}</span>
          </div>
          <div className="stack-body">Fee: {formatValue(item.processing_fee_pct)}%</div>
        </div>
      ))}
    </div>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <div className="header">
        <div className="brand">GradPath</div>
        <nav className="nav">
          <Link to="/">Overview</Link>
          <Link to="/student">Student Dashboard</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/tools">AI Tools</Link>
          <Link to="/mentor">Mentor</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

function Overview() {
  const [health, setHealth] = useState('Checking...');
  useEffect(() => {
    api.health().then((d: { status: string; env: string }) => setHealth(`${d.status} (${d.env})`)).catch(() => setHealth('offline'));
  }, []);

  const highlights = [
    {
      title: 'Admissions',
      body: 'Shortlist universities with fit, budget, and profile-aware scoring.',
    },
    {
      title: 'Financing',
      body: 'Compare ROI, loan eligibility, EMI plans, and lender options in one place.',
    },
    {
      title: 'Mentorship',
      body: 'Draft SOPs and ask the AI mentor for application strategy at any stage.',
    },
  ];

  return (
    <div className="page-stack">
      <section className="hero card">
        <div className="hero-copy">
          <span className="eyebrow">Postgraduate planning workspace</span>
          <h1>Plan admissions, funding, and applications in one clean flow.</h1>
          <p>
            GradPath combines university recommendations, loan analysis, SOP support, and AI mentoring
            into a single workspace that stays readable on desktop, tablet, and mobile.
          </p>
          <div className="hero-actions">
            <Link to="/tools" className="button-link primary-link">Open AI Tools</Link>
            <Link to="/mentor" className="button-link secondary-link">Ask Mentor</Link>
          </div>
        </div>

        <div className="hero-status">
          <div className="status-card">
            <span className="summary-label">API Status</span>
            <strong className="summary-value">{health}</strong>
          </div>
          <div className="status-card">
            <span className="summary-label">Core Services</span>
            <strong className="summary-value">Recommender, ROI, SOP, mentor</strong>
          </div>
          <div className="status-card">
            <span className="summary-label">Primary Use</span>
            <strong className="summary-value">Plan and compare applications</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {highlights.map((item) => (
          <article className="card feature-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    api.studentDashboard().then(setData);
    api.gamification().then(setGame);
    api.loanOffers().then((d) => setOffers(d.offers));
  }, []);

  return (
    <div className="grid">
      <div className="card">
        <h3>Progress</h3>
        <SummaryGrid data={data?.progress ?? {}} />
      </div>
      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={data?.notifications ?? []} />
      </div>
      <div className="card">
        <h3>Gamification</h3>
        <SummaryGrid data={game ?? {}} />
      </div>
      <div className="card">
        <h3>Loan Offers</h3>
        <OfferList items={offers} />
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api.adminDashboard().then(setData);
  }, []);

  return (
    <div className="card">
      <h2>Admin Analytics</h2>
      <SummaryGrid data={data?.stats ?? {}} />
      <div className="divider" />
      <SummaryGrid data={data?.funnels ?? {}} />
    </div>
  );
}

function Tools() {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [roi, setRoi] = useState<any>(null);
  const [admit, setAdmit] = useState<any>(null);
  const [sop, setSop] = useState('');
  const [emi, setEmi] = useState<any>(null);
  const [loanEligibility, setLoanEligibility] = useState<any>(null);
  const [ocrPreview, setOcrPreview] = useState('');

  async function runDemo() {
    const rec = await api.recommendations({
      name: 'Aarav',
      degree_target: 'MS Computer Science',
      preferred_countries: ['Canada', 'Germany'],
      gpa: 8.4,
      gre: 321,
      ielts: 7.5,
      work_ex_years: 2,
      budget_usd: 45000,
      risk_appetite: 'balanced',
    });
    setRecommendations(rec.items);

    setRoi(await api.roi({
      tuition_usd: 32000,
      living_usd: 15000,
      loan_interest_pct: 9.2,
      expected_salary_usd: 82000,
      salary_growth_pct: 8,
      horizon_years: 5,
    }));

    setAdmit(await api.admit({
      gpa: 8.4,
      gre: 321,
      ielts: 7.5,
      work_ex_years: 2,
      sop_quality_score: 7.8,
    }));

    const sopResponse = await api.sop({
      name: 'Aarav Sharma',
      program: 'MS Computer Science',
      university_type: 'Research-intensive university',
      achievements: ['Published final-year paper', 'Built ML startup internship project'],
      motivation: 'I want to build inclusive AI tools for education.',
      long_term_goal: 'Launch an edtech AI company for global learners.',
    });
    setSop(sopResponse.sop || 'No response');

    setEmi(await api.emi({ principal_usd: 45000, annual_interest_pct: 9.1, tenure_months: 120 }));

    setLoanEligibility(await api.loanEligibility({
      annual_family_income_usd: 18000,
      collateral_available_usd: 25000,
      credit_score: 760,
      target_country: 'Canada',
      total_required_usd: 50000,
    }));
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('doc') as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const out = await api.uploadDocument(file);
    setOcrPreview(out.ocr_text_preview);
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>AI Utilities</h2>
        <p>Run all recommendation and planning engines with one click.</p>
        <button onClick={runDemo}>Run Demo Pipeline</button>
      </div>
      <div className="card"><h3>Recommendations</h3><pre>{JSON.stringify(recommendations ?? [], null, 2)}</pre></div>
      <div className="card"><h3>ROI</h3><pre>{JSON.stringify(roi ?? {}, null, 2)}</pre></div>
      <div className="card"><h3>Admit Predictor</h3><pre>{JSON.stringify(admit ?? {}, null, 2)}</pre></div>
      <div className="card"><h3>EMI</h3><pre>{JSON.stringify(emi ?? {}, null, 2)}</pre></div>
      <div className="card"><h3>Loan Eligibility</h3><pre>{JSON.stringify(loanEligibility ?? {}, null, 2)}</pre></div>
      <div className="card"><h3>SOP Preview</h3><pre>{sop}</pre></div>
      <div className="card">
        <h3>Document OCR Upload</h3>
        <form onSubmit={handleUpload}>
          <input name="doc" type="file" accept=".txt,.pdf,.doc,.docx" />
          <button type="submit">Upload & OCR</button>
        </form>
        <pre>{ocrPreview}</pre>
      </div>
    </div>
  );
}

function Mentor() {
  const [message, setMessage] = useState('What should I prioritize for Fall 2027 applications?');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await api.mentor({
      message,
      context: { stage: 'shortlisting', budget: 50000, target: 'MS CS' },
    });
    setReply(res.reply);
    setLoading(false);
  }

  return (
    <div className="card">
      <h2>AI Mentor (Gemini)</h2>
      <form onSubmit={ask}>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        <button type="submit">{loading ? 'Thinking...' : 'Ask Mentor'}</button>
      </form>
      <pre>{reply}</pre>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/mentor" element={<Mentor />} />
      </Routes>
    </Layout>
  );
}
