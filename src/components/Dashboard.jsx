import { useState, useRef, useEffect } from 'react'

// ── Mock Garmin data (replaced with real API data later) ──────────────────────
const garmin = {
  readiness: 78,
  hrv: 52,
  hrvBaseline: 48,
  bodyBattery: 73,
  sleepScore: 81,
  sleepHours: '7h 22m',
  restingHR: 48,
  stress: 22,
  weeklyLoad: {
    swim: { value: 2.4, unit: 'km', pct: 62 },
    bike: { value: 85,  unit: 'km', pct: 48 },
    run:  { value: 18,  unit: 'km', pct: 38 },
    gym:  { value: 3,   unit: 'sess', pct: 75 },
    soccer: { value: 2, unit: 'sess', pct: 50 },
  },
  week: [
    { day: 'Mon', date: 28, sessions: ['rest'], done: true },
    { day: 'Tue', date: 29, sessions: ['swim', 'gym'], done: true },
    { day: 'Wed', date: 30, sessions: ['run', 'soccer'], done: true },
    { day: 'Thu', date: 1,  sessions: ['bike'], done: true },
    { day: 'Fri', date: 2,  sessions: ['swim', 'run'], today: true },
    { day: 'Sat', date: 3,  sessions: ['soccer', 'bike'], done: false },
    { day: 'Sun', date: 4,  sessions: ['recover'], done: false },
  ],
  todaySessions: [
    {
      id: 1, discipline: 'Swim', icon: '🏊', color: 'var(--accent2)',
      title: 'Technique + Endurance',
      detail: '1,800m total · 400m warm-up · 8×100m pull buoy · 200m cool-down · focus on stroke rate',
      duration: '~45 min', zone: 'Zone 2',
    },
    {
      id: 2, discipline: 'Run', icon: '🏃', color: 'var(--accent)',
      title: 'Easy Aerobic Run',
      detail: '8km easy pace · HR cap 145bpm · no tempo work · adjusted from 12km threshold',
      duration: '~50 min', zone: 'Zone 1–2',
    },
    {
      id: 3, discipline: 'Gym', icon: '💪', color: 'var(--purple)',
      title: 'Ironman Strength',
      detail: 'Core + hip stability · glute bridges · single-leg work · no heavy squats (legs pre-fatigued)',
      duration: '~35 min', zone: 'Optional',
    },
  ],
  alert: 'Soccer load on Wed was higher than expected. Run intensity reduced from threshold to easy aerobic. Ironman base building protected.',
}

// ── Coach system prompt ───────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Coach Pulse, an expert AI triathlon and multisport coach embedded in the Pulse training app.

Athlete profile:
- Training for their first Ironman triathlon (no plan yet — you ARE the plan)
- Also plays soccer 1–2x per week and does gym 3x per week
- Garmin data today: Readiness 78/100, HRV 52ms (baseline 48ms, trending up — good), Body Battery 73/100, Sleep score 81/100 (7h 22m), Resting HR 48bpm, Stress 22 (low)
- Weekly load: swim 2.4km, bike 85km, run 18km, 3 gym sessions, 2 soccer sessions
- Today's adaptive plan: swim 1,800m technique/endurance (Zone 2), easy 8km run with HR cap 145bpm (adjusted DOWN from planned threshold session because Wednesday soccer caused high leg load), optional gym strength (core + hip stability only)
- Adaptive adjustment made automatically: Wednesday soccer flagged as high-load, today's run reduced to protect Ironman base building

Coaching style:
- Conversational, warm, direct — like a coach who knows you well
- Always reference their actual data numbers when relevant
- Keep responses concise: 2–4 sentences unless they ask for more detail
- If they ask about today's sessions, give specific actionable advice
- If they ask about Ironman planning, be realistic about the time commitment but encouraging
- You balance three competing demands: Ironman training, soccer, and gym — always consider all three
- Never give generic advice — make it specific to their numbers`

// ── Tag colour helper ─────────────────────────────────────────────────────────
const TAG_COLORS = {
  swim:    { bg: 'rgba(0,168,255,0.18)',   color: 'var(--accent2)' },
  run:     { bg: 'rgba(0,212,170,0.18)',   color: 'var(--accent)'  },
  bike:    { bg: 'rgba(245,158,11,0.18)',  color: 'var(--amber)'   },
  gym:     { bg: 'rgba(168,85,247,0.18)',  color: 'var(--purple)'  },
  soccer:  { bg: 'rgba(34,197,94,0.18)',   color: 'var(--green)'   },
  rest:    { bg: 'rgba(90,106,126,0.18)',  color: 'var(--muted)'   },
  recover: { bg: 'rgba(90,106,126,0.18)',  color: 'var(--muted)'   },
}

function Tag({ name }) {
  const c = TAG_COLORS[name] || TAG_COLORS.rest
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: 9, fontFamily: 'var(--font-mono)',
      borderRadius: 3, padding: '2px 5px', display: 'block',
      textAlign: 'center', marginBottom: 2,
    }}>
      {name}
    </span>
  )
}

// ── Readiness ring ────────────────────────────────────────────────────────────
function ReadinessRing({ score }) {
  const r = 54, circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const label = score >= 80 ? 'Go hard' : score >= 65 ? 'Moderate' : 'Take it easy'
  const col = score >= 80 ? 'var(--accent)' : score >= 65 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--subtle)" strokeWidth="8" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={col} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 36, fontWeight: 800, color: col, lineHeight: 1 }}>{score}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>READINESS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: col, marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ value, label, sub, color }) {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--subtle)' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 3, letterSpacing: '0.5px' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Load bar ──────────────────────────────────────────────────────────────────
function LoadBar({ name, value, unit, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', width: 46 }}>{name}</div>
      <div style={{ flex: 1, height: 5, background: 'var(--subtle)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text)', width: 42, textAlign: 'right' }}>{value}{unit}</div>
    </div>
  )
}

// ── Chat message ──────────────────────────────────────────────────────────────
function Message({ role, text, time }) {
  const isCoach = role === 'coach'
  return (
    <div style={{ display: 'flex', justifyContent: isCoach ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
      <div style={{ maxWidth: '88%' }}>
        <div style={{
          padding: '9px 13px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
          borderBottomLeftRadius: isCoach ? 3 : 12,
          borderBottomRightRadius: isCoach ? 12 : 3,
          background: isCoach ? 'var(--card2)' : 'rgba(0,212,170,0.1)',
          border: isCoach ? '1px solid var(--subtle)' : '1px solid rgba(0,212,170,0.25)',
          whiteSpace: 'pre-wrap',
        }}>
          {text}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 3, padding: '0 4px', textAlign: isCoach ? 'left' : 'right' }}>
          {isCoach ? 'Coach Pulse' : 'You'} · {time}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [messages, setMessages] = useState([
    {
      role: 'coach', time: 'now',
      text: `Hey! I've checked your overnight data 🙌\n\nYour HRV is up 4ms above baseline and Body Battery is 73 — solid green for today. One thing I adjusted: Wednesday's soccer session pushed your leg load higher than expected, so I've dialled today's run back from a threshold session to an easy 8km with a 145bpm HR cap.\n\nYour Ironman base is the priority — tap any session below to ask me about it.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiHistory, setApiHistory] = useState([
    { role: 'user', content: 'Hi coach, what should I know about today?' },
    { role: 'assistant', content: `Hey! I've checked your overnight data 🙌\n\nYour HRV is up 4ms above baseline and Body Battery is 73 — solid green for today. One thing I adjusted: Wednesday's soccer session pushed your leg load higher than expected, so I've dialled today's run back from a threshold session to an easy 8km with a 145bpm HR cap.\n\nYour Ironman base is the priority — tap any session below to ask me about it.` },
  ])
  const messagesEndRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const getTime = () => {
    const n = new Date()
    return `${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`
  }

  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', text, time: getTime() }
    const newHistory = [...apiHistory, { role: 'user', content: text }]
    setMessages(prev => [...prev, userMsg])
    setApiHistory(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newHistory,
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text ?? 'Connection issue — check your API key in .env'
      const coachMsg = { role: 'coach', text: reply, time: getTime() }
      setMessages(prev => [...prev, coachMsg])
      setApiHistory(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'coach', text: 'Could not reach Claude — check your VITE_ANTHROPIC_API_KEY in .env and restart the dev server.', time: getTime() }])
    }
    setLoading(false)
  }

  const askAboutSession = (s) => send(`Tell me more about today's ${s.discipline} session — what should I focus on?`)

  // ── Render ──
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--subtle)', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, letterSpacing: 3, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          PULSE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 20, padding: '5px 13px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
          Garmin synced · 8 min ago
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#000' }}>Y</div>
          Your Account
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gridTemplateRows: 'auto 1fr', flex: 1, gap: 1, background: 'var(--subtle)', overflow: 'hidden' }}>

        {/* ── Readiness ── */}
        <div style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '11px 18px', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--subtle)', flexShrink: 0 }}>Today's Readiness</div>
          <div style={{ padding: '16px 18px', flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              <ReadinessRing score={garmin.readiness} />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 6, letterSpacing: 1 }}>TRAINING STATUS</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Train — moderate</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>HRV trending up.<br />Legs need protection<br />from Wed soccer.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <MetricCard value={garmin.hrv}          label="HRV (ms)"      sub={`↑ ${garmin.hrv - garmin.hrvBaseline}ms vs baseline`} color="var(--accent)" />
              <MetricCard value={garmin.bodyBattery}  label="Body Battery"  sub="Good reserve"   color="var(--accent2)" />
              <MetricCard value={garmin.sleepScore}   label="Sleep score"   sub={garmin.sleepHours}  color="var(--amber)" />
              <MetricCard value={garmin.restingHR}    label="Resting HR"    sub="Excellent"      color="var(--purple)" />
            </div>
          </div>
        </div>

        {/* ── Weekly ── */}
        <div style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '11px 18px', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--subtle)', flexShrink: 0 }}>This Week</div>
          <div style={{ padding: '14px 16px', flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 16 }}>
              {garmin.week.map(d => (
                <div key={d.day} style={{
                  background: d.today ? 'rgba(0,212,170,0.06)' : 'var(--card)',
                  border: `1px solid ${d.today ? 'var(--accent)' : 'transparent'}`,
                  borderRadius: 6, padding: '7px 3px', textAlign: 'center',
                  opacity: d.done && !d.today ? 0.55 : 1,
                  cursor: 'pointer',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', textTransform: 'uppercase' }}>{d.day}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 19, fontWeight: 700, color: d.today ? 'var(--accent)' : 'var(--text)', lineHeight: 1.2 }}>{d.date}</div>
                  <div style={{ marginTop: 4 }}>{d.sessions.map(s => <Tag key={s} name={s} />)}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Weekly training load</div>
            <LoadBar name="Swim"   {...garmin.weeklyLoad.swim}   color="var(--accent2)" />
            <LoadBar name="Bike"   {...garmin.weeklyLoad.bike}   color="var(--amber)" />
            <LoadBar name="Run"    {...garmin.weeklyLoad.run}    color="var(--accent)" />
            <LoadBar name="Gym"    {...garmin.weeklyLoad.gym}    color="var(--purple)" />
            <LoadBar name="Soccer" {...garmin.weeklyLoad.soccer} color="var(--green)" />
          </div>
        </div>

        {/* ── Coach Chat ── */}
        <div style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column', gridRow: '1 / 3', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--subtle)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--card2)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>COACH PULSE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>AI · powered by Claude</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 4px' }}>
            {messages.map((m, i) => <Message key={i} {...m} />)}
            {loading && (
              <div style={{ display: 'flex', gap: 5, padding: '4px 0 10px 4px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.4, animation: `blink 1.2s infinite ${i*0.2}s` }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--subtle)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Ask your coach anything..."
              style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
            />
            <button onClick={() => send(input)} disabled={loading} style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: loading ? 0.5 : 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Today's Plan ── */}
        <div style={{ background: 'var(--surface)', gridColumn: '1 / 3', overflowY: 'auto' }}>
          <div style={{ padding: '11px 18px', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--subtle)' }}>Today's Training Plan</div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {/* Alert banner */}
            <div style={{ gridColumn: '1/-1', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <div style={{ fontSize: 12, color: '#fcd34d', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--amber)' }}>Adaptive adjustment: </strong>{garmin.alert}
              </div>
            </div>
            {garmin.todaySessions.map(s => (
              <div key={s.id} onClick={() => askAboutSession(s)}
                style={{ background: 'var(--card)', borderRadius: 10, padding: '14px', border: '1px solid var(--subtle)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--subtle)'}
              >
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: s.color, textTransform: 'uppercase', marginBottom: 6 }}>
                  {String(s.id).padStart(2,'0')} · {s.discipline}
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, lineHeight: 1.15, marginBottom: 7 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65 }}>{s.detail}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--subtle)', borderRadius: 4, padding: '3px 9px', fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 10 }}>
                  ⏱ {s.duration} · <span style={{ color: s.color }}>{s.zone}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginTop: 8 }}>tap to ask coach →</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes blink  { 0%,100%{opacity:0.2} 50%{opacity:1} }
      `}</style>
    </div>
  )
}
