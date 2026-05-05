import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const S = { bg:'#f5f6fa',surface:'#ffffff',text:'#1a1a2e',muted:'#6b7a8d',border:'#e2e8f0',accent:'#00a67e',accent2:'#0066cc' }

  const handle = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        setMessage('Check your email to confirm your account!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onAuth(data.user)
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:48, fontWeight:800, letterSpacing:4, background:`linear-gradient(135deg,${S.accent},${S.accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PULSE</div>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted, letterSpacing:2, marginTop:4 }}>AI COACHING · BUILT FOR REAL LIFE</div>
        </div>
        <div style={{ background:S.surface, borderRadius:16, padding:28, border:`1px solid ${S.border}`, boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', marginBottom:24, background:S.bg, borderRadius:8, padding:4 }}>
            {['login','signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, background: mode===m ? S.surface : 'transparent', border:'none', borderRadius:6, padding:'8px', fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:700, color: mode===m ? S.text : S.muted, cursor:'pointer', boxShadow: mode===m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>
          {mode === 'signup' && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:S.muted, marginBottom:6, textTransform:'uppercase' }}>Full name</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ width:'100%', background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 14px', color:S.text, fontFamily:'Barlow, sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' }} />
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:S.muted, marginBottom:6, textTransform:'uppercase' }}>Email</div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={{ width:'100%', background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 14px', color:S.text, fontFamily:'Barlow, sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:S.muted, marginBottom:6, textTransform:'uppercase' }}>Password</div>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" style={{ width:'100%', background:S.bg, border:`1px solid ${S.border}`, borderRadius:8, padding:'10px 14px', color:S.text, fontFamily:'Barlow, sans-serif', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
          {error && <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#dc2626', marginBottom:16 }}>{error}</div>}
          {message && <div style={{ background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#16a34a', marginBottom:16 }}>{message}</div>}
          <button onClick={handle} disabled={loading} onKeyDown={e => e.key === 'Enter' && handle()} style={{ width:'100%', background:`linear-gradient(135deg,${S.accent},${S.accent2})`, border:'none', borderRadius:10, padding:'13px', color:'#fff', fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in to Pulse' : 'Create my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
