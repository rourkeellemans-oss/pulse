import './index.css'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import PlanGenerator from './components/PlanGenerator'
import CheckIn from './components/CheckIn'


const THEMES = {
  dark: { bg:'#080b10',surface:'#0e1219',card:'#141920',card2:'#1a2130',text:'#e8eef5',muted:'#5a6a7e',subtle:'#1e2a38',border:'#1e2a38',accent:'#00d4aa',accent2:'#00a8ff',amber:'#f59e0b',purple:'#a855f7',green:'#22c55e',shadow:'0 2px 12px rgba(0,0,0,0.4)' },
  light: { bg:'#f5f6fa',surface:'#ffffff',card:'#ffffff',card2:'#f0f4f8',text:'#1a1a2e',muted:'#6b7a8d',subtle:'#e2e8f0',border:'#e2e8f0',accent:'#00a67e',accent2:'#0066cc',amber:'#d97706',purple:'#7c3aed',green:'#059669',shadow:'0 2px 12px rgba(0,0,0,0.08)' }
}

export default function App() {
  const [step, setStep] = useState('loading')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(() => {
    try { const s = localStorage.getItem('pulse_profile'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [tempProfile, setTempProfile] = useState(null)
  const [page, setPage] = useState(() => localStorage.getItem('pulse_page') || 'dashboard')
  const [isDark, setIsDark] = useState(() => localStorage.getItem('pulse_theme') !== 'light')
  const navigateTo = (p) => { setPage(p); localStorage.setItem('pulse_page', p) }
  const t = isDark ? THEMES.dark : THEMES.light

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('pulse_theme', next ? 'dark' : 'light')
    window.dispatchEvent(new Event('themechange'))
  }

  useEffect(() => {
    // Check for cached profile first for instant load
    const cachedProfile = localStorage.getItem('pulse_profile')
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        if (cachedProfile) {
          // Use cached profile immediately, verify in background
          setProfile(JSON.parse(cachedProfile))
          setStep('app')
          loadProfile(session.user.id)
        } else {
          loadProfile(session.user.id)
        }
      } else {
        if (cachedProfile) {
          // Had a profile but no session — show onboarding
          localStorage.removeItem('pulse_profile')
        }
        setStep('onboarding')
      }
    })

    let initialLoadDone = false
    setTimeout(() => { initialLoadDone = true }, 2000)
    setTimeout(() => { initialLoadDone = true }, 2000)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialLoadDone) return
      if (!initialLoadDone) return
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
        setProfile(null)
        localStorage.removeItem('pulse_profile')
        setStep('onboarding')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setProfile(data)
      localStorage.setItem('pulse_profile', JSON.stringify(data))
      setStep('app')
    } else {
      setStep('onboarding')
    }
  }

  const handleOnboardingComplete = (p) => {
    setTempProfile(p)
    setStep('preview')
    navigateTo('plan')
  }

  const handleSavePlan = () => setStep('auth')

  const handleAuth = async (u) => {
    setUser(u)
    if (tempProfile) {
      await supabase.from('profiles').upsert({ id: u.id, email: u.email, ...tempProfile })
      setProfile(tempProfile)
      localStorage.setItem('pulse_profile', JSON.stringify(tempProfile))
    }
    setStep('app')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setTempProfile(null)
    localStorage.removeItem('pulse_profile')
    localStorage.removeItem('pulse_weekly_plan')
    localStorage.removeItem('pulse_page')
    localStorage.removeItem('pulse_page')
    setStep('onboarding')
  }

  const NavBar = () => (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:999, display:'flex', background:t.surface, borderTop:`1px solid ${t.border}`, padding:'8px 16px', gap:8 }}>
      <button onClick={() => navigateTo('dashboard')} style={{ flex:1, background: page==='dashboard' ? `linear-gradient(135deg,${t.accent},${t.accent2})` : t.card2, border:`1px solid ${t.border}`, borderRadius:8, padding:'10px 16px', color: page==='dashboard' ? '#fff' : t.text, fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>Dashboard</button>
      <button onClick={() => navigateTo('plan')} style={{ flex:1, background: page==='plan' ? `linear-gradient(135deg,${t.accent},${t.accent2})` : t.card2, border:`1px solid ${t.border}`, borderRadius:8, padding:'10px 16px', color: page==='plan' ? '#fff' : t.text, fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>Plan</button>
      <button onClick={() => navigateTo('checkin')} style={{ flex:1, background: page==='checkin' ? `linear-gradient(135deg,${t.accent},${t.accent2})` : t.card2, border:`1px solid ${t.border}`, borderRadius:8, padding:'10px 16px', color: page==='checkin' ? '#fff' : t.text, fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>Check In</button>
      <button onClick={toggleTheme} style={{ background:t.card2, border:`1px solid ${t.border}`, borderRadius:8, padding:'10px 14px', color:t.muted, fontSize:14, cursor:'pointer' }}>{isDark ? '☀️' : '🌙'}</button>
      {step === 'app' && <button onClick={handleSignOut} style={{ background:'transparent', border:`1px solid ${t.border}`, borderRadius:8, padding:'10px 14px', color:t.muted, fontFamily:'Barlow Condensed, sans-serif', fontSize:13, cursor:'pointer' }}>↩</button>}
      {step === 'preview' && <button onClick={handleSavePlan} style={{ background:`linear-gradient(135deg,${t.accent},${t.accent2})`, border:'none', borderRadius:8, padding:'10px 16px', color:'#fff', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>💾 Save</button>}
    </div>
  )

  if (step === 'loading') return (
    <div style={{ minHeight:'100vh', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:32, fontWeight:800, letterSpacing:4, background:`linear-gradient(135deg,${t.accent},${t.accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PULSE</div>
    </div>
  )

  if (step === 'onboarding') return <Onboarding onComplete={handleOnboardingComplete} t={t} />
  if (step === 'auth') return <Auth onAuth={handleAuth} t={t} />

  return (
    <div style={{ paddingBottom:70 }}>
      <NavBar />
      {page === 'dashboard'
        ? <Dashboard t={t} onToggleTheme={toggleTheme} isDark={isDark} user={user} />
        : page === 'plan' ? <PlanGenerator profile={profile || tempProfile} t={t} isDark={isDark} user={user} />
        : <CheckIn t={t} user={user} />
      }
    </div>
  )
}