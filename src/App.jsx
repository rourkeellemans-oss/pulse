import './index.css'
import { useState } from 'react'
import Dashboard from './components/Dashboard'
import PlanGenerator from './components/PlanGenerator'
import Onboarding from './components/Onboarding'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [profile, setProfile] = useState(() => {
    try { const s = localStorage.getItem('pulse_profile'); return s ? JSON.parse(s) : null } catch { return null }
  })

  const handleOnboardingComplete = (p) => {
    localStorage.setItem('pulse_profile', JSON.stringify(p))
    setProfile(p)
    setPage('plan')
  }

  const resetProfile = () => {
    localStorage.removeItem('pulse_profile')
    setProfile(null)
  }

  if (!profile) return <Onboarding onComplete={handleOnboardingComplete} />

  return (
    <div style={{ paddingBottom: 70 }}>
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:999, display:'flex', background:'#0e1219', borderTop:'1px solid #1e2a38', padding:'8px 16px', gap:8 }}>
        <button onClick={() => setPage('dashboard')}
          style={{ flex:1, background: page==='dashboard' ? 'linear-gradient(135deg,#00d4aa,#00a8ff)' : '#141920', border:'1px solid #1e2a38', borderRadius:8, padding:'10px 16px', color: page==='dashboard' ? '#000' : '#e8eef5', fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Dashboard
        </button>
        <button onClick={() => setPage('plan')}
          style={{ flex:1, background: page==='plan' ? 'linear-gradient(135deg,#00d4aa,#00a8ff)' : '#141920', border:'1px solid #1e2a38', borderRadius:8, padding:'10px 16px', color: page==='plan' ? '#000' : '#e8eef5', fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          Weekly Plan
        </button>
        <button onClick={resetProfile}
          style={{ background:'transparent', border:'1px solid #1e2a38', borderRadius:8, padding:'10px 14px', color:'#5a6a7e', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, cursor:'pointer' }}>
          ↺
        </button>
      </div>
      {page === 'dashboard' ? <Dashboard /> : <PlanGenerator profile={profile} />}
    </div>
  )
}