import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DISCIPLINES = ['Swim', 'Bike', 'Run', 'Gym', 'Soccer', 'Rest', 'Other']
const EFFORT = [
  { val: 1, label: 'Very easy', color: '#22c55e' },
  { val: 2, label: 'Easy', color: '#86efac' },
  { val: 3, label: 'Moderate', color: '#f59e0b' },
  { val: 4, label: 'Hard', color: '#f97316' },
  { val: 5, label: 'Max effort', color: '#ef4444' },
]

export default function CheckIn({ t, user }) {
  const [tab, setTab] = useState('stats')
  const [todayStats, setTodayStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [garminEmail, setGarminEmail] = useState(() => localStorage.getItem('garmin_email') || '')
  const [garminPass, setGarminPass] = useState('')
  const [showGarminLogin, setShowGarminLogin] = useState(false)

  const syncGarmin = async () => {
    if (!garminEmail || !garminPass) { setShowGarminLogin(true); return }
    setSyncing(true)
    try {
      const res = await fetch('/api/garmin-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: garminEmail, password: garminPass })
      })
      const data = await res.json()
      if (data.error) { alert('Garmin sync failed: ' + data.error); setSyncing(false); return }
      localStorage.setItem('garmin_email', garminEmail)
      setStats(p => ({...p,
        hrv: data.hrv ?? p.hrv,
        body_battery: data.body_battery ?? p.body_battery,
        sleep_score: data.sleep_score ?? p.sleep_score,
        resting_hr: data.resting_hr ?? p.resting_hr,
        stress: data.stress ?? p.stress,
        training_readiness: data.training_readiness ?? p.training_readiness,
      }))
      setShowGarminLogin(false)
    } catch(e) { alert('Sync error: ' + e.message) }
    setSyncing(false)
  }
  const [saved, setSaved] = useState(false)

  const [stats, setStats] = useState({ hrv: '', body_battery: '', sleep_score: '', sleep_hours: '', resting_hr: '', stress: '', training_readiness: '', notes: '' })
  const [session, setSession] = useState({ discipline: 'Run', duration_minutes: '', distance: '', distance_unit: 'km', perceived_effort: 3, notes: '', completed: true })

  useEffect(() => { if (user) { loadTodayStats(); loadSessions() } }, [user])

  const loadTodayStats = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('daily_stats').select('*').eq('user_id', user.id).eq('date', today).single()
    if (data) { setTodayStats(data); setStats(data) }
  }

  const loadSessions = async () => {
    const { data } = await supabase.from('session_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    if (data) setSessions(data)
  }

  const saveStats = async () => {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const payload = { user_id: user.id, date: today, ...stats }
    Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null })
    await supabase.from('daily_stats').upsert(payload, { onConflict: 'user_id,date' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    loadTodayStats()
  }

  const saveSession = async () => {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('session_logs').insert({ user_id: user.id, date: today, ...session })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSession({ discipline: 'Run', duration_minutes: '', distance: '', distance_unit: 'km', perceived_effort: 3, notes: '', completed: true })
    loadSessions()
  }

  const inp = (style) => ({ ...style, background: t.card2, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px', color: t.text, fontFamily: 'Barlow, sans-serif', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' })
  const lbl = { fontFamily: 'DM Mono, monospace', fontSize: 10, color: t.muted, textTransform: 'uppercase', marginBottom: 6, display: 'block' }
  const field = { marginBottom: 14 }
  const readinessColor = (val) => {
    if (!val) return t.muted
    if (val >= 80) return t.accent
    if (val >= 60) return t.amber
    return '#ef4444'
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.text, fontFamily: 'Barlow, sans-serif', padding: 16, paddingBottom: 100 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 24, fontWeight: 800, letterSpacing: 3, background: `linear-gradient(135deg,${t.accent},${t.accent2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PULSE</div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: t.muted }}>DAILY CHECK-IN</div>
      </div>

      {todayStats && (
        <div style={{ background: `${t.accent}10`, border: `1px solid ${t.accent}30`, borderRadius: 10, padding: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Readiness', value: todayStats.training_readiness, unit: '/100', color: readinessColor(todayStats.training_readiness) },
            { label: 'HRV', value: todayStats.hrv, unit: 'ms', color: readinessColor(todayStats.hrv) },
            { label: 'Body Battery', value: todayStats.body_battery, unit: '/100', color: readinessColor(todayStats.body_battery) },
            { label: 'Sleep', value: todayStats.sleep_score, unit: '/100', color: readinessColor(todayStats.sleep_score) },
            { label: 'Resting HR', value: todayStats.resting_hr, unit: 'bpm', color: t.accent2 },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 800, color: m.color }}>{m.value ?? '—'}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: t.muted }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', background: t.card2, borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
        {[{ id: 'stats', label: '📊 Daily Stats' }, { id: 'log', label: '✅ Log Session' }, { id: 'history', label: '📈 History' }].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, background: tab === tb.id ? t.surface : 'transparent', border: 'none', borderRadius: 8, padding: '10px 6px', color: tab === tb.id ? t.text : t.muted, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: tab === tb.id ? t.shadow : 'none' }}>
            {tb.label}
          </button>
        ))}
      </div>
      {tab === 'stats' && (
        <div>
          <div style={{ background: t.surface, borderRadius: 12, padding: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: t.text }}>Today's health metrics</div>
            <button onClick={() => showGarminLogin ? syncGarmin() : setShowGarminLogin(o=>!o)} disabled={syncing} style={{ background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: 8, padding: '6px 12px', color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{syncing ? '⏳ Syncing...' : '⚡ Sync Garmin'}</button>
          </div>
          {showGarminLogin && (
            <div style={{ background: t.card2, borderRadius: 10, padding: 12, marginBottom: 16, border: `1px solid ${t.border}` }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: t.muted, marginBottom: 8 }}>GARMIN CONNECT CREDENTIALS</div>
              <input type="email" value={garminEmail} onChange={e=>setGarminEmail(e.target.value)} placeholder="Garmin email" style={{ display: 'block', width: '100%', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: '8px 10px', color: t.text, fontFamily: 'Barlow, sans-serif', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
              <input type="password" value={garminPass} onChange={e=>setGarminPass(e.target.value)} placeholder="Garmin password" style={{ display: 'block', width: '100%', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: '8px 10px', color: t.text, fontFamily: 'Barlow, sans-serif', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: t.muted, marginBottom: 8 }}>⚠️ Credentials sent directly to Garmin. Not stored on our servers.</div>
              <button onClick={syncGarmin} disabled={syncing} style={{ width: '100%', background: `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: 8, padding: 10, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{syncing ? '⏳ Syncing...' : '⚡ Sync now'}</button>
            </div>
          )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={field}><label style={lbl}>Training Readiness</label><input type="number" value={stats.training_readiness || ''} onChange={e => setStats(p => ({...p, training_readiness: e.target.value}))} placeholder="0-100 (from Garmin)" style={inp({})} /></div>
              <div style={field}><label style={lbl}>HRV (ms)</label><input type="number" value={stats.hrv || ''} onChange={e => setStats(p => ({...p, hrv: e.target.value}))} placeholder="e.g. 52" style={inp({})} /></div>
              <div style={field}><label style={lbl}>Body Battery</label><input type="number" value={stats.body_battery || ''} onChange={e => setStats(p => ({...p, body_battery: e.target.value}))} placeholder="0-100" style={inp({})} /></div>
              <div style={field}><label style={lbl}>Sleep score</label><input type="number" value={stats.sleep_score || ''} onChange={e => setStats(p => ({...p, sleep_score: e.target.value}))} placeholder="0-100" style={inp({})} /></div>
              <div style={field}><label style={lbl}>Sleep hours</label><input type="text" value={stats.sleep_hours || ''} onChange={e => setStats(p => ({...p, sleep_hours: e.target.value}))} placeholder="e.g. 7h 30m" style={inp({})} /></div>
              <div style={field}><label style={lbl}>Resting HR</label><input type="number" value={stats.resting_hr || ''} onChange={e => setStats(p => ({...p, resting_hr: e.target.value}))} placeholder="bpm" style={inp({})} /></div>
              <div style={field}><label style={lbl}>Stress level</label><input type="number" value={stats.stress || ''} onChange={e => setStats(p => ({...p, stress: e.target.value}))} placeholder="0-100" style={inp({})} /></div>
            </div>
            <div style={field}><label style={lbl}>Notes</label><textarea value={stats.notes || ''} onChange={e => setStats(p => ({...p, notes: e.target.value}))} placeholder="How are you feeling today?" style={{...inp({}), height: 80, resize: 'none'}} /></div>
            <button onClick={saveStats} disabled={saving} style={{ width: '100%', background: saved ? t.accent : `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: 10, padding: 13, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {saved ? '✅ Saved!' : saving ? 'Saving...' : 'Save today\'s stats'}
            </button>
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: t.muted, textAlign: 'center', lineHeight: 1.6 }}>
            Read these numbers from your Garmin watch each morning.<br/>Once Garmin API is connected, this fills automatically.
          </div>
        </div>
      )}
      {tab === 'log' && (
        <div style={{ background: t.surface, borderRadius: 12, padding: 16, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 16 }}>Log a session</div>
          <div style={field}>
            <label style={lbl}>Discipline</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
              {DISCIPLINES.map(d => (
                <button key={d} onClick={() => setSession(p => ({...p, discipline: d}))} style={{ background: session.discipline === d ? `${t.accent}20` : t.card2, border: `1px solid ${session.discipline === d ? t.accent : t.border}`, borderRadius: 8, padding: '8px 4px', color: session.discipline === d ? t.accent : t.muted, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{d}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={field}><label style={lbl}>Duration (mins)</label><input type="number" value={session.duration_minutes} onChange={e => setSession(p => ({...p, duration_minutes: e.target.value}))} placeholder="45" style={inp({})} /></div>
            <div style={field}><label style={lbl}>Distance (km)</label><input type="number" value={session.distance} onChange={e => setSession(p => ({...p, distance: e.target.value}))} placeholder="10" style={inp({})} /></div>
          </div>
          <div style={field}>
            <label style={lbl}>Perceived effort</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {EFFORT.map(e => (
                <button key={e.val} onClick={() => setSession(p => ({...p, perceived_effort: e.val}))} style={{ flex: 1, background: session.perceived_effort === e.val ? `${e.color}20` : t.card2, border: `1px solid ${session.perceived_effort === e.val ? e.color : t.border}`, borderRadius: 8, padding: '10px 4px', color: session.perceived_effort === e.val ? e.color : t.muted, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{e.val}</button>
              ))}
            </div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: EFFORT[session.perceived_effort-1]?.color, marginTop: 6, textAlign: 'center' }}>{EFFORT[session.perceived_effort-1]?.label}</div>
          </div>
          <div style={field}><label style={lbl}>Notes</label><textarea value={session.notes} onChange={e => setSession(p => ({...p, notes: e.target.value}))} placeholder="How did it go?" style={{...inp({}), height: 70, resize: 'none'}} /></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setSession(p => ({...p, completed: v}))} style={{ flex: 1, background: session.completed === v ? `${t.accent}20` : t.card2, border: `1px solid ${session.completed === v ? t.accent : t.border}`, borderRadius: 8, padding: 10, color: session.completed === v ? t.accent : t.muted, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {v ? '✅ Completed' : '⏭ Skipped'}
              </button>
            ))}
          </div>
          <button onClick={saveSession} disabled={saving} style={{ width: '100%', background: saved ? t.accent : `linear-gradient(135deg,${t.accent},${t.accent2})`, border: 'none', borderRadius: 10, padding: 13, color: '#000', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {saved ? '✅ Logged!' : saving ? 'Saving...' : 'Log this session'}
          </button>
        </div>
      )}
      {tab === 'history' && (
        <div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: t.muted, fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
              No sessions logged yet.<br/>Start logging your training above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map((s, i) => (
                <div key={i} style={{ background: t.surface, borderRadius: 12, padding: 14, border: `1px solid ${t.border}`, boxShadow: t.shadow }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: t.text }}>{s.discipline}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: t.muted }}>{new Date(s.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                      <div style={{ background: s.completed ? `${t.accent}20` : `${t.amber}20`, border: `1px solid ${s.completed ? t.accent : t.amber}40`, borderRadius: 4, padding: '2px 8px', fontFamily: 'DM Mono, monospace', fontSize: 9, color: s.completed ? t.accent : t.amber }}>{s.completed ? 'Done' : 'Skipped'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {s.duration_minutes && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: t.muted }}>⏱ {s.duration_minutes} min</div>}
                    {s.distance && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: t.muted }}>📍 {s.distance} {s.distance_unit}</div>}
                    {s.perceived_effort && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: EFFORT[s.perceived_effort-1]?.color }}>RPE {s.perceived_effort}/5 · {EFFORT[s.perceived_effort-1]?.label}</div>}
                  </div>
                  {s.notes && <div style={{ fontSize: 12, color: t.muted, marginTop: 6, fontStyle: 'italic' }}>{s.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
