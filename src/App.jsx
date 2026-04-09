import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import _ from "lodash";
import { TrendingUp, TrendingDown, Check, AlertTriangle, Clock } from "lucide-react";
import { SAMPLE_CLIENTS, SAMPLE } from "./data";
import "./styles.css";

const R = "#E4002B";
const RL = "#FFF1F3";
const RF = "#FFF8F9";
const BK = "#141414";
const G = { 50:"#F7F7F7",100:"#F0F0F0",200:"#E4E4E4",300:"#D1D1D1",400:"#A8A8A8",500:"#878787",600:"#6B6B6B",700:"#4A4A4A" };
const GR = "#0D7C3F";
const AM = "#B45309";

const PLATFORMS_LIST = [
  { id: "google_ads", name: "Google Ads", icon: "G", color: "#4285F4" },
  { id: "dv360", name: "DV360", icon: "D", color: "#0F9D58" },
  { id: "meta", name: "Meta Ads", icon: "M", color: "#1877F2" },
  { id: "tiktok", name: "TikTok", icon: "T", color: "#010101" },
  { id: "snapchat", name: "Snapchat", icon: "S", color: "#FFFC00", textColor: "#333" },
  { id: "cm360", name: "CM360", icon: "C", color: "#F4B400" },
  { id: "ga4", name: "GA4", icon: "A", color: "#E37400" },
  { id: "teads", name: "Teads", icon: "Te", color: "#00C9A7" },
];

function parseD(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") { const d = XLSX.SSF.parse_date_code(v); return d ? new Date(d.y, d.m - 1, d.d) : null; }
  const d = new Date(v); return isNaN(d) ? null : d;
}
function daysBtw(a, b) { return (!a || !b) ? 0 : Math.max(Math.round((b - a) / 864e5), 0); }
function $k(n) { if (n == null || isNaN(n)) return "—"; if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M"; if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K"; return "$" + n.toFixed(0); }
function pct(n) { return (n == null || isNaN(n)) ? "—" : (n * 100).toFixed(1) + "%"; }
function mk(c, p) { return (c || "").toLowerCase().trim() + "||" + (p || "").toLowerCase().trim(); }

function pStat(b, t) {
  if (!t || isNaN(t)) return { l: "Not Started", c: G[500], bg: G[100], icon: Clock };
  if (t >= 1) {
    if (b > 1.05) return { l: "Over Budget", c: R, bg: RL, icon: AlertTriangle };
    if (b < 0.9) return { l: "Under Budget", c: AM, bg: "#FFF9EB", icon: AlertTriangle };
    return { l: "Completed", c: G[600], bg: G[100], icon: Check };
  }
  const r = b / t;
  if (r > 1.15) return { l: "Overpacing", c: R, bg: RL, icon: TrendingUp };
  if (r < 0.8) return { l: "Underpacing", c: AM, bg: "#FFF9EB", icon: TrendingDown };
  return { l: "On Track", c: GR, bg: "#EEFBF3", icon: Check };
}

const FIELD_ALIASES = {
  campaign: ["campaign", "campaign name", "campaignname", "ga campaign name", "campaign name\n(ga campaign name)"],
  country: ["country", "country\n(lower case)", "market"],
  platform: ["platform", "platform\n(lower case / taxonomy)", "channel"],
  startDate: ["start date", "startdate", "flight start"],
  endDate: ["end date", "enddate", "flight end"],
  budget: ["budget", "budget\n(media cost)", "budget \n(media cost)", "media cost", "net cost"],
  buyingUnit: ["buying unit", "buyingunit", "unit"],
  currency: ["currency"],
  hiredUnits: ["hired units", "hiredunits", "hired", "booked units"],
  lead: ["lead", "owner"],
};

function matchHeaders(headers, aliases) {
  const fl = {};
  for (const [f, al] of Object.entries(aliases)) {
    for (const h of headers) { if (al.includes(h.toLowerCase().trim().replace(/\s+/g, " "))) { fl[f] = h; break; } }
  }
  return fl;
}

function loadStorage() { try { const r = localStorage.getItem("um_pacing_v5"); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveStorage(d) { try { localStorage.setItem("um_pacing_v5", JSON.stringify(d)); } catch {} }

/* ── Components ── */
function Badge({ stat }) {
  const Icon = stat.icon;
  return <span className="badge" style={{ color: stat.c, background: stat.bg }}><Icon size={11} strokeWidth={2.5} />{stat.l}</span>;
}

function SparkBar({ value, refVal, color }) {
  const p = Math.min((value || 0) * 100, 110);
  return (
    <div className="spark-bar">
      <div className="spark-track">
        {refVal > 0 && refVal < 1 && <div className="spark-marker" style={{ left: `${refVal * 100}%` }} />}
        <div className="spark-fill" style={{ width: `${Math.min(p, 100)}%`, background: color }} />
      </div>
      <span className="mono" style={{ color, fontWeight: 600, minWidth: 36, textAlign: "right", fontSize: 11 }}>{pct(value)}</span>
    </div>
  );
}

function WowSparkline({ wkKeys, wks, mm, campaignKey }) {
  const pts = wkKeys.map(k => { const r = wks[k]?.find(d => mk(mm[d.campaign] || d.campaign, d.platform) === campaignKey); return r ? r.cost : null; }).filter(v => v !== null);
  if (!pts.length) return <span style={{ color: G[400], fontSize: 11 }}>—</span>;
  const max = Math.max(...pts, 1); const w = 56, h = 18;
  const points = pts.map((v, i) => `${(i / Math.max(pts.length - 1, 1)) * w},${h - (v / max) * h}`).join(" ");
  const col = pts.length >= 2 ? (pts[pts.length - 1] > pts[pts.length - 2] ? GR : AM) : G[500];
  return <svg width={w} height={h}><polyline points={points} fill="none" stroke={col} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />{pts.map((v, i) => <circle key={i} cx={(i / Math.max(pts.length - 1, 1)) * w} cy={h - (v / max) * h} r={1.5} fill={col} />)}</svg>;
}

function Pill({ label, active, onClick }) {
  return <button onClick={onClick} className={`pill ${active ? "pill-active" : ""}`}>{label}</button>;
}

/* ════════════ MAIN ════════════ */
export default function App() {
  const [clients, setClients] = useState(SAMPLE_CLIENTS);
  const [ac, setAc] = useState(null);
  const [plans, setPlans] = useState({});
  const [weekly, setWeekly] = useState({});
  const [taxonomies, setTaxonomies] = useState({});
  const [manualMaps, setManualMaps] = useState({});
  const [view, setView] = useState("pacing");
  const [fPace, setFPace] = useState("All");
  const [fCountry, setFCountry] = useState("All");
  const [fPlat, setFPlat] = useState("All");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [showAdd, setShowAdd] = useState(false);
  const [nName, setNName] = useState("");
  const [nCode, setNCode] = useState("");
  const [txPattern, setTxPattern] = useState("");
  const [txSep, setTxSep] = useState("");
  const [txEx, setTxEx] = useState("");
  const [txFields, setTxFields] = useState("");
  const [mmPlatName, setMmPlatName] = useState("");
  const [mmPlanName, setMmPlanName] = useState("");
  const [showManualUpload, setShowManualUpload] = useState(false);
  const planRef = useRef(null);
  const actRef = useRef(null);

  useEffect(() => { const s = loadStorage(); if (s) { if (s.clients?.length) setClients(s.clients); if (s.plans) setPlans(s.plans); if (s.weekly) setWeekly(s.weekly); if (s.taxonomies) setTaxonomies(s.taxonomies); if (s.manualMaps) setManualMaps(s.manualMaps); if (s.activeClient) setAc(s.activeClient); } }, []);
  useEffect(() => { if (ac) saveStorage({ clients, plans, weekly, taxonomies, manualMaps, activeClient: ac }); }, [clients, plans, weekly, taxonomies, manualMaps, ac]);

  const loadSample = (id) => { const s = SAMPLE[id]; if (!s) return; if (s.plan.length) setPlans(p => ({ ...p, [id]: s.plan })); if (Object.keys(s.weeks).length) setWeekly(w => ({ ...w, [id]: s.weeks })); if (s.taxonomy) setTaxonomies(t => ({ ...t, [id]: s.taxonomy })); };
  const selectClient = (id) => { setAc(id); setFPace("All"); setFCountry("All"); setFPlat("All"); setSearch(""); setView("pacing"); const tx = taxonomies[id]; if (tx) { setTxPattern(tx.pattern || ""); setTxSep(tx.separator || ""); setTxEx(tx.example || ""); setTxFields((tx.fields || []).join("\n")); } else { setTxPattern(""); setTxSep(""); setTxEx(""); setTxFields(""); } };

  const plan = plans[ac] || [];
  const wks = weekly[ac] || {};
  const wkKeys = Object.keys(wks).sort();
  const latest = wks[wkKeys[wkKeys.length - 1]] || [];
  const mm = manualMaps[ac] || {};

  const aMap = useMemo(() => { const m = {}; latest.forEach(a => { const mc = mm[a.campaign] || a.campaign; const k = mk(mc, a.platform); if (!m[k]) m[k] = { cost: 0, delivered: 0 }; m[k].cost += Number(a.cost) || 0; m[k].delivered += Number(a.delivered) || 0; }); return m; }, [latest, mm]);

  const today = new Date();
  const rows = useMemo(() => plan.map(r => {
    const s = parseD(r.startDate), e = parseD(r.endDate);
    const td = daysBtw(s, e), el = s ? daysBtw(s, today) : 0;
    const pt = td > 0 ? Math.min(el / td, 1) : 0;
    const k = mk(r.campaign, r.platform);
    const a = aMap[k] || { cost: 0, delivered: 0 };
    const b = Number(r.budget) || 0, h = Number(r.hiredUnits) || 0;
    const pb = b > 0 ? a.cost / b : 0, ph = h > 0 ? a.delivered / h : 0;
    const rd = Math.max(td - el, 1), ed = b > 0 ? (b - a.cost) / rd : 0;
    return { ...r, budget: b, hired: h, spent: a.cost, delivered: a.delivered, pt, pb, ph, ed, stat: pStat(pb, pt), key: k, s, e };
  }), [plan, aMap, today]);

  // WoW data: for each campaign, get spend per week
  const wowData = useMemo(() => {
    if (wkKeys.length < 2) return [];
    return plan.map(r => {
      const k = mk(r.campaign, r.platform);
      const weekSpends = wkKeys.map(wk => {
        const rec = wks[wk]?.find(d => mk(mm[d.campaign] || d.campaign, d.platform) === k);
        return { week: wk, cost: rec ? rec.cost : null, delivered: rec ? rec.delivered : null };
      });
      const validWeeks = weekSpends.filter(w => w.cost !== null);
      if (validWeeks.length < 1) return null;
      // Calculate WoW change from second-to-last to last
      let wowChange = null;
      if (validWeeks.length >= 2) {
        const prev = validWeeks[validWeeks.length - 2].cost;
        const curr = validWeeks[validWeeks.length - 1].cost;
        wowChange = prev > 0 ? (curr - prev) / prev : null;
      }
      return { campaign: r.campaign, platform: r.platform, country: r.country, budget: Number(r.budget) || 0, weekSpends, wowChange, key: k };
    }).filter(Boolean);
  }, [plan, wkKeys, wks, mm]);

  const countries = useMemo(() => ["All", ..._.sortBy(_.uniq(plan.map(r => (r.country || "").toUpperCase()).filter(Boolean)))], [plan]);
  const plats = useMemo(() => ["All", ..._.sortBy(_.uniq(plan.map(r => (r.platform || "").toLowerCase()).filter(Boolean)))], [plan]);

  const filtered = useMemo(() => {
    let f = rows;
    if (fPace !== "All") f = f.filter(r => r.stat.l === fPace);
    if (fCountry !== "All") f = f.filter(r => (r.country || "").toUpperCase() === fCountry);
    if (fPlat !== "All") f = f.filter(r => (r.platform || "").toLowerCase() === fPlat);
    if (search) f = f.filter(r => (r.campaign || "").includes(search.toLowerCase()) || (r.lead || "").toLowerCase().includes(search.toLowerCase()));
    if (sortCol) f = _.orderBy(f, [sortCol], [sortDir]);
    return f;
  }, [rows, fPace, fCountry, fPlat, search, sortCol, sortDir]);

  const sum = useMemo(() => {
    const tb = rows.reduce((s, r) => s + r.budget, 0), ts = rows.reduce((s, r) => s + r.spent, 0);
    return { n: rows.length, tb, ts, ok: rows.filter(r => r.stat.l === "On Track").length, ov: rows.filter(r => r.stat.l === "Overpacing" || r.stat.l === "Over Budget").length, un: rows.filter(r => r.stat.l === "Underpacing" || r.stat.l === "Under Budget").length };
  }, [rows]);

  const handlePlan = useCallback((file) => {
    if (!file || !ac) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array", cellDates: true });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        const fl = matchHeaders(Object.keys(data[0] || {}), FIELD_ALIASES);
        const parsed = data.filter(r => r[fl.campaign] && String(r[fl.campaign]).trim()).map(r => ({
          lead: String(r[fl.lead] || "").trim(), campaign: String(r[fl.campaign] || "").trim().toLowerCase(),
          country: String(r[fl.country] || "").trim().toLowerCase(), platform: String(r[fl.platform] || "").trim().toLowerCase(),
          startDate: r[fl.startDate] || "", endDate: r[fl.endDate] || "", budget: Number(r[fl.budget]) || 0,
          buyingUnit: String(r[fl.buyingUnit] || "").trim(), currency: String(r[fl.currency] || "USD").trim(), hiredUnits: Number(r[fl.hiredUnits]) || 0,
        }));
        setPlans(p => ({ ...p, [ac]: parsed }));
      } catch (err) { alert("Parse error: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  }, [ac]);

  const handleActuals = useCallback((file) => {
    if (!file || !ac) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array", cellDates: true });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        const fl = matchHeaders(Object.keys(data[0] || {}), {
          campaign: ["campaign", "ga_campaignname", "campaign name", "campaignname"],
          platform: ["platform", "platformcampaign", "channel", "source"],
          cost: ["cost", "spend", "spends to date", "spendstodate", "amount spent"],
          delivered: ["delivered", "impressions", "impressionsdelivered"],
        });
        const agg = {};
        data.forEach(r => { const c = String(r[fl.campaign] || "").trim().toLowerCase(), p = String(r[fl.platform] || "").trim().toLowerCase(); if (!c) return; const k = mk(c, p); if (!agg[k]) agg[k] = { campaign: c, platform: p, cost: 0, delivered: 0 }; agg[k].cost += Number(r[fl.cost]) || 0; agg[k].delivered += Number(r[fl.delivered]) || 0; });
        const wl = "W" + (Object.keys(wks).length + 1);
        setWeekly(p => ({ ...p, [ac]: { ...(p[ac] || {}), [wl]: Object.values(agg) } }));
        setShowManualUpload(false);
      } catch (err) { alert("Parse error: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  }, [ac, wks]);

  const exportXl = useCallback(() => {
    const data = filtered.map(r => ({ Pacing: r.stat.l, Lead: r.lead, Campaign: r.campaign, Country: (r.country || "").toUpperCase(), Platform: r.platform, Start: r.s ? r.s.toISOString().split("T")[0] : "", End: r.e ? r.e.toISOString().split("T")[0] : "", Budget: r.budget, Hired: r.hired, Spent: Math.round(r.spent * 100) / 100, Delivered: r.delivered, "Exp Daily": Math.round(r.ed * 100) / 100, "% Time": Math.round(r.pt * 1e4) / 100, "% Budget": Math.round(r.pb * 1e4) / 100, "% Hired": Math.round(r.ph * 1e4) / 100 }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Pacing");
    XLSX.writeFile(wb, `Pacing_${clients.find(c => c.id === ac)?.code || "X"}_${new Date().toISOString().split("T")[0]}.xlsx`);
  }, [filtered, clients, ac]);

  const saveTaxonomy = () => { setTaxonomies(p => ({ ...p, [ac]: { pattern: txPattern, separator: txSep, example: txEx, fields: txFields.split("\n").filter(Boolean) } })); };
  const addManualMap = () => { if (!mmPlatName.trim() || !mmPlanName.trim()) return; setManualMaps(p => ({ ...p, [ac]: { ...(p[ac] || {}), [mmPlatName.toLowerCase().trim()]: mmPlanName.toLowerCase().trim() } })); setMmPlatName(""); setMmPlanName(""); };
  const addClient = () => { if (!nName.trim()) return; const id = nName.toLowerCase().replace(/[^a-z0-9]/g, "_"); setClients(p => [...p, { id, name: nName, code: nCode || nName.substring(0, 3).toUpperCase() }]); setNName(""); setNCode(""); setShowAdd(false); selectClient(id); };
  const hSort = (c) => { if (sortCol === c) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(c); setSortDir("asc"); } };

  const TABLE_COLS = [
    { k: "stat", l: "Pacing", w: 110 }, { k: "lead", l: "Lead", w: 65 },
    { k: "campaign", l: "Campaign", w: 200 }, { k: "country", l: "Mkt", w: 40 },
    { k: "platform", l: "Platform", w: 75 }, { k: "budget", l: "Budget", w: 80 },
    { k: "spent", l: "Spent", w: 80 }, { k: "pt", l: "% Time", w: 60 },
    { k: "pb", l: "% Budget", w: 140 }, { k: "ph", l: "% Hired", w: 60 },
    { k: "ed", l: "Exp Daily", w: 75 }, { k: "wow", l: "WoW", w: 80 },
  ];

  return (
    <div className="app">
      {/* CLIENT SELECTOR */}
      {!ac && (
        <div className="client-select fade-in">
          <div className="um-logo-lg"><span>UM</span></div>
          <h1 className="title">Budget Pacing</h1>
          <p className="subtitle">Select a client to view campaign pacing</p>
          <div className="client-grid">
            {clients.map(c => (
              <div key={c.id} className="client-card" onClick={() => selectClient(c.id)}>
                <div className="client-avatar">{c.code}</div>
                <div className="client-name">{c.name}</div>
                <div className="client-meta">{(plans[c.id] || []).length ? `${plans[c.id].length} items` : "No plan"}{Object.keys(weekly[c.id] || {}).length ? ` · ${Object.keys(weekly[c.id]).length}w` : ""}</div>
              </div>
            ))}
            <div className="client-card client-card-add" onClick={() => setShowAdd(true)}>
              <div style={{ fontSize: 22, color: G[400], marginBottom: 4 }}>+</div>
              <span style={{ fontSize: 12, color: G[500] }}>Add Client</span>
            </div>
          </div>
          {showAdd && (
            <div className="add-client-form">
              <input value={nName} onChange={e => setNName(e.target.value)} placeholder="Client name" />
              <input value={nCode} onChange={e => setNCode(e.target.value)} placeholder="Code (EK)" />
              <div className="add-client-actions">
                <button className="btn-primary" onClick={addClient}>Add</button>
                <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {ac && (<>
        <header className="header">
          <div className="header-left">
            <div className="um-logo-sm"><span>UM</span></div>
            <div className="divider" />
            <div className="client-tabs">
              {clients.map(c => <button key={c.id} onClick={() => selectClient(c.id)} className={`client-tab ${ac === c.id ? "active" : ""}`}>{c.code}</button>)}
            </div>
            <div className="divider" />
            <nav className="nav-tabs">
              {["pacing", "wow", "data", "taxonomy"].map(v => (
                <button key={v} onClick={() => setView(v)} className={`nav-tab ${view === v ? "active" : ""}`}>{v === "wow" ? "WoW" : v}</button>
              ))}
            </nav>
          </div>
          <div className="header-right">
            {wkKeys.length > 0 && <span className="week-badge">Latest: {wkKeys[wkKeys.length - 1]}</span>}
            {plan.length > 0 && <button className="btn-export" onClick={exportXl}>↓ Export</button>}
            <button className="btn-close" onClick={() => setAc(null)}>✕</button>
          </div>
        </header>

        <main className="main">
          {/* ── DATA VIEW (replaces upload) ── */}
          {view === "data" && (
            <div className="fade-in upload-view">
              <h2>Data Sources — {clients.find(c => c.id === ac)?.name}</h2>
              <p className="desc">Upload your media plan. Platform actuals will be pulled automatically once connectors are live.</p>

              <div className="upload-grid">
                {/* Media Plan - upload */}
                <div className="upload-zone" onClick={() => planRef.current?.click()}>
                  <input ref={planRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => handlePlan(e.target.files[0])} hidden />
                  <div className="upload-icon">📋</div>
                  <div className="upload-title">Media Plan</div>
                  <div className="upload-desc">Campaign, Country, Platform, Dates, Budget</div>
                  {plan.length > 0 && <div className="upload-ok">✓ {plan.length} line items loaded</div>}
                </div>

                {/* Platform Connections - coming soon */}
                <div className="platform-connections">
                  <div style={{ fontSize: 11, fontWeight: 700, color: G[700], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Platform Connections</div>
                  <div className="platform-list">
                    {PLATFORMS_LIST.map(p => (
                      <div key={p.id} className="platform-item">
                        <div className="platform-icon" style={{ background: p.color, color: p.textColor || "#fff" }}>{p.icon}</div>
                        <span className="platform-name">{p.name}</span>
                        <span className="platform-status">Coming Soon</span>
                      </div>
                    ))}
                  </div>
                  <div className="platform-footer">
                    <span style={{ fontSize: 11, color: G[500] }}>API connectors pull spend data automatically each week</span>
                  </div>
                </div>
              </div>

              {/* Manual upload fallback */}
              <div className="manual-section">
                <div className="manual-header" onClick={() => setShowManualUpload(!showManualUpload)}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: G[700] }}>Manual Actuals Upload</span>
                  <span style={{ fontSize: 11, color: G[500] }}>{showManualUpload ? "▲" : "▼"} For direct buys or until API connectors are live</span>
                </div>
                {showManualUpload && (
                  <div className="manual-body">
                    <div className="upload-zone upload-zone-sm" onClick={() => actRef.current?.click()}>
                      <input ref={actRef} type="file" accept=".xlsx,.xls,.csv" onChange={e => handleActuals(e.target.files[0])} hidden />
                      <div style={{ fontWeight: 600, fontSize: 12 }}>Upload platform export</div>
                      <div style={{ fontSize: 11, color: G[500] }}>Campaign, Platform, Cost, Impressions — each upload = 1 week</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Week snapshots */}
              {wkKeys.length > 0 && (
                <div className="snapshots">
                  <div className="snapshots-label">Weekly Snapshots</div>
                  <div className="snapshots-list">
                    {wkKeys.map(w => <span key={w} className={`snapshot ${w === wkKeys[wkKeys.length - 1] ? "latest" : ""}`}>{w} · {wks[w].length} records</span>)}
                  </div>
                </div>
              )}

              <button className="btn-outline" onClick={() => loadSample(ac)}>Load Sample Data</button>
            </div>
          )}

          {/* ── TAXONOMY ── */}
          {view === "taxonomy" && (
            <div className="fade-in upload-view">
              <h2>Taxonomy — {clients.find(c => c.id === ac)?.name}</h2>
              <p className="desc">Define how this client's campaign names are structured to help match platform data to the plan.</p>
              <div className="tax-section">
                <div className="tax-title">Naming Convention</div>
                <label className="field-label">Pattern</label>
                <input value={txPattern} onChange={e => setTxPattern(e.target.value)} placeholder="e.g. {country}{objective}{campaign}{monthYY}" className="mono-input full" />
                <div className="tax-row">
                  <div><label className="field-label">Separator</label><input value={txSep} onChange={e => setTxSep(e.target.value)} placeholder='e.g. _ or (none)' className="mono-input" /></div>
                  <div><label className="field-label">Example</label><input value={txEx} onChange={e => setTxEx(e.target.value)} placeholder="beconsummerdxbmar25" className="mono-input" /></div>
                </div>
                <label className="field-label">Fields (one per line)</label>
                <textarea value={txFields} onChange={e => setTxFields(e.target.value)} placeholder={"country (2-char ISO)\nobjective (con/awr/bra)\ncampaign name\nmonth + year"} rows={4} className="tax-textarea" />
                <div style={{ marginTop: 10 }}>
                  <button className="btn-primary" onClick={saveTaxonomy}>Save</button>
                  {taxonomies[ac] && <span className="save-ok">✓ Saved</span>}
                </div>
              </div>
              <div className="tax-section" style={{ marginTop: 16 }}>
                <div className="tax-title">Manual Campaign Mapper</div>
                <p className="tax-desc">When platform names don't match the plan, add a manual mapping.</p>
                <div className="mapper-row">
                  <div style={{ flex: 1 }}><label className="field-label">Platform name</label><input value={mmPlatName} onChange={e => setMmPlatName(e.target.value)} placeholder="From platform export" className="mono-input" /></div>
                  <div className="mapper-arrow">→</div>
                  <div style={{ flex: 1 }}><label className="field-label">Plan name</label><input value={mmPlanName} onChange={e => setMmPlanName(e.target.value)} placeholder="GA campaign name" className="mono-input" /></div>
                  <button className="btn-primary" style={{ alignSelf: "flex-end" }} onClick={addManualMap}>Add</button>
                </div>
                {Object.keys(mm).length > 0 && <div className="mapper-list">{Object.entries(mm).map(([from, to]) => (<div key={from} className="mapper-item"><span className="mono" style={{ color: G[600], flex: 1 }}>{from}</span><span style={{ color: G[400] }}>→</span><span className="mono" style={{ color: BK, flex: 1, fontWeight: 500 }}>{to}</span><button className="btn-remove" onClick={() => setManualMaps(p => { const n = { ...(p[ac] || {}) }; delete n[from]; return { ...p, [ac]: n }; })}>✕</button></div>))}</div>}
                {Object.keys(mm).length === 0 && <div className="empty-text">No mappings yet</div>}
              </div>
            </div>
          )}

          {/* ── WOW VIEW ── */}
          {view === "wow" && (
            <div className="fade-in">
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Week-over-Week Pacing</h2>
              <p className="desc">Track how spend is progressing across weekly snapshots. Each column shows cumulative spend at that week's snapshot.</p>

              {wkKeys.length < 2 && (
                <div className="empty-state">
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
                  <h2>Need at least 2 weekly snapshots</h2>
                  <p>Upload actuals each week via the Data tab to see WoW trends.</p>
                  <div className="empty-actions">
                    <button className="btn-primary" onClick={() => setView("data")}>Go to Data</button>
                    {!plan.length && <button className="btn-secondary" onClick={() => loadSample(ac)}>Try Sample</button>}
                  </div>
                </div>
              )}

              {wkKeys.length >= 2 && plan.length > 0 && (
                <div className="table-wrap">
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 180 }}>Campaign</th>
                          <th style={{ width: 40 }}>Mkt</th>
                          <th style={{ width: 70 }}>Platform</th>
                          <th style={{ width: 80 }}>Budget</th>
                          {wkKeys.map(wk => <th key={wk} style={{ width: 90 }}>{wk} Spend</th>)}
                          <th style={{ width: 80 }}>WoW Δ</th>
                          <th style={{ width: 80 }}>% Budget</th>
                          <th style={{ width: 70 }}>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wowData.map((r, i) => {
                          const latestCost = r.weekSpends.filter(w => w.cost !== null).slice(-1)[0]?.cost || 0;
                          const pctB = r.budget > 0 ? latestCost / r.budget : 0;
                          return (
                            <tr key={i}>
                              <td className="mono" style={{ fontWeight: 500, fontSize: 12 }}>{r.campaign}</td>
                              <td style={{ fontWeight: 700, textTransform: "uppercase", color: G[700], fontSize: 11 }}>{r.country}</td>
                              <td style={{ color: G[600], fontSize: 12 }}>{r.platform}</td>
                              <td className="mono" style={{ fontWeight: 500, fontSize: 12 }}>{$k(r.budget)}</td>
                              {r.weekSpends.map((ws, j) => (
                                <td key={j} className="mono" style={{ fontSize: 12, color: ws.cost !== null ? BK : G[400] }}>
                                  {ws.cost !== null ? $k(ws.cost) : "—"}
                                </td>
                              ))}
                              <td>
                                {r.wowChange !== null ? (
                                  <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: r.wowChange > 0 ? GR : r.wowChange < -0.1 ? AM : G[600] }}>
                                    {r.wowChange > 0 ? "+" : ""}{(r.wowChange * 100).toFixed(0)}%
                                  </span>
                                ) : <span style={{ color: G[400], fontSize: 11 }}>—</span>}
                              </td>
                              <td>
                                <SparkBar value={pctB} refVal={1} color={pctB > 1.05 ? R : pctB > 0.9 ? GR : AM} />
                              </td>
                              <td>
                                <WowSparkline wkKeys={wkKeys} wks={wks} mm={mm} campaignKey={r.key} />
                              </td>
                            </tr>
                          );
                        })}
                        {!wowData.length && <tr><td colSpan={wkKeys.length + 7} className="empty-row">No matching data</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PACING (empty) ── */}
          {view === "pacing" && plan.length === 0 && (
            <div className="fade-in empty-state">
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <h2>No media plan loaded</h2>
              <p>Upload a plan and actuals to see pacing.</p>
              <div className="empty-actions">
                <button className="btn-primary" onClick={() => setView("data")}>Upload Data</button>
                <button className="btn-secondary" onClick={() => loadSample(ac)}>Try Sample</button>
              </div>
            </div>
          )}

          {/* ── PACING (data) ── */}
          {view === "pacing" && plan.length > 0 && (
            <div className="fade-in">
              <div className="summary-grid">
                {[
                  { l: "Campaigns", v: sum.n, s: `${filtered.length} shown`, c: BK },
                  { l: "Total Budget", v: $k(sum.tb), s: clients.find(c => c.id === ac)?.name, c: BK },
                  { l: "Spent", v: $k(sum.ts), s: pct(sum.tb > 0 ? sum.ts / sum.tb : 0) + " used", c: R },
                  { l: "On Track", v: sum.ok, s: "campaigns", c: GR },
                  { l: "Overpacing", v: sum.ov, s: "attention", c: "#DC2626" },
                  { l: "Underpacing", v: sum.un, s: "attention", c: AM },
                ].map((c, i) => (
                  <div key={i} className="summary-card">
                    <div className="summary-label">{c.l}</div>
                    <div className="summary-value mono" style={{ color: c.c }}>{c.v}</div>
                    <div className="summary-sub">{c.s}</div>
                  </div>
                ))}
              </div>

              <div className="filters">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="search-input" />
                <div className="divider" />
                {["All", "On Track", "Overpacing", "Underpacing", "Not Started", "Completed"].map(s => <Pill key={s} label={s} active={fPace === s} onClick={() => setFPace(s)} />)}
                <div className="divider" />
                <select value={fCountry} onChange={e => setFCountry(e.target.value)} className="filter-select">{countries.map(c => <option key={c}>{c}</option>)}</select>
                <select value={fPlat} onChange={e => setFPlat(e.target.value)} className="filter-select">{plats.map(p => <option key={p}>{p}</option>)}</select>
                <div style={{ flex: 1 }} />
                <span className="row-count">{filtered.length} rows</span>
              </div>

              <div className="table-wrap">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>{TABLE_COLS.map(col => (
                        <th key={col.k} onClick={() => col.k !== "wow" && hSort(col.k)} style={{ width: col.w, cursor: col.k !== "wow" ? "pointer" : "default" }}>
                          {col.l}{col.k !== "wow" && <span className="sort-icon">{sortCol === col.k ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}</span>}
                        </th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={i}>
                          <td><Badge stat={r.stat} /></td>
                          <td style={{ color: G[600] }}>{r.lead}</td>
                          <td className="mono" style={{ fontWeight: 500 }}>{r.campaign}</td>
                          <td style={{ fontWeight: 700, textTransform: "uppercase", color: G[700], fontSize: 11 }}>{r.country}</td>
                          <td style={{ color: G[600] }}>{r.platform}</td>
                          <td className="mono" style={{ fontWeight: 500 }}>{$k(r.budget)}</td>
                          <td className="mono" style={{ fontWeight: 500, color: r.spent > r.budget ? R : BK }}>{$k(r.spent)}</td>
                          <td className="mono" style={{ color: G[600] }}>{pct(r.pt)}</td>
                          <td><SparkBar value={r.pb} refVal={r.pt} color={r.stat.c} /></td>
                          <td className="mono" style={{ color: G[600] }}>{pct(r.ph)}</td>
                          <td className="mono" style={{ color: G[600] }}>{r.pt < 1 ? $k(r.ed) : "—"}</td>
                          <td><WowSparkline wkKeys={wkKeys} wks={wks} mm={mm} campaignKey={r.key} /></td>
                        </tr>
                      ))}
                      {!filtered.length && <tr><td colSpan={12} className="empty-row">No campaigns match filters</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="table-footer">
                <span>{plan.length} items · {wkKeys.length} weeks · Latest: {wkKeys[wkKeys.length - 1] || "—"}</span>
                <button className="btn-small" onClick={() => setView("data")}>Update Data</button>
              </div>
            </div>
          )}
        </main>
      </>)}
    </div>
  );
}
