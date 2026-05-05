import './index.css'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import PlanGenerator from './components/PlanGenerator'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  const handleOnboardingComplete = async (p) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({ id: user.id, email: user.email, ...p })
    setProfile(p)
    setPage('plan')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f5f6fa', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:32, fontWeight:800, letterSpacing:4, background:'linear-gradient(135deg,#00a67e,#0066cc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PULSE</div>
    </div>
  )

  if (!user) return <Auth onAuth={setUser} />
  if (!profile) return <Onboarding onComplete={handleOnboardingComplete} />

  return (
    <div style={{ paddingBottom: 70 }}>
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:999, display:'flex', background:'#ffffff', borderTop:'1px solid #e2e8f0', padding:'8px 16px', gap:8 }}>
        <button onClick={() => setPage('dashboard')}
          style={{ flex:1, background: page==='dashboard' ? 'linear-gradient(135deg,#00a67e,#0066cc)' : '#f5f6fa', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 16px', color: page==='dashboard' ? '#fff' : '#1a1a2e', fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Dashboard
        </button>
        <button onClick={() => setPage('plan')}
          style={{ flex:1, background: page==='plan' ? 'linear-gradient(135deg,#00a67e,#0066cc)' : '#f5f6fa', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 16px', color: page==='plan' ? '#fff' : '#1a1a2e', fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Weekly Plan
        </button>
        <button onClick={handleSignOut}
          style={{ background:'transparent', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', color:'#6b7a8d', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, cursor:'pointer' }}>
          ↩
        </button>
      </div>
      {page === 'dashboard' ? <Dashboard /> : <PlanGenerator profile={profile} />}
    </div>
  )
}