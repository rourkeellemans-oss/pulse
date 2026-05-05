import { useState } from 'react'
const S = { bg:'#080b10',surface:'#0e1219',card:'#141920',card2:'#1a2130',accent:'#00d4aa',accent2:'#00a8ff',amber:'#f59e0b',purple:'#a855f7',green:'#22c55e',text:'#e8eef5',muted:'#5a6a7e',subtle:'#1e2a38' }
const GOALS = [{id:'ironman',icon:'🏊',label:'Ironman / triathlon',sub:'Train for a full or half Ironman'},{id:'running',icon:'🏃',label:'Running event',sub:'5k, 10k, half marathon or marathon'},{id:'cycling',icon:'🚴',label:'Cycling event',sub:'Sportive, gran fondo or race'},{id:'recompose',icon:'💪',label:'Body recomposition',sub:'Lose fat and build muscle'},{id:'weightloss',icon:'⚖️',label:'Lose weight',sub:'Sustainable fat loss with training'},{id:'fitness',icon:'❤️',label:'General fitness',sub:'Get fitter, feel better, live longer'}]
const SPORTS = [{id:'swim',icon:'🏊',label:'Swimming'},{id:'bike',icon:'🚴',label:'Cycling'},{id:'run',icon:'🏃',label:'Running'},{id:'soccer',icon:'⚽',label:'Soccer / football'},{id:'gym',icon:'🏋️',label:'Gym / weights'},{id:'yoga',icon:'🧘',label:'Yoga / mobility'}]
const HOURS = [{id:'3-5',label:'3-5 hrs',sub:'Beginner / busy'},{id:'6-8',label:'6-8 hrs',sub:'Recreational'},{id:'8-10',label:'8-10 hrs',sub:'Committed'},{id:'10-14',label:'10-14 hrs',sub:'Serious'},{id:'14+',label:'14+ hrs',sub:'Elite'}]
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ goal:'', sports:[], hours:'', lockedDays:[], eventDate:'', eventName:'' })
  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }))
  const toggle = (key, val) => setProfile(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(x=>x!==val) : [...p[key], val] }))
  const next = () => step < 5 ? setStep(s=>s+1) : onComplete(profile)
  const canNext = step === 0 || step === 5 || (step === 1 && profile.goal) || (step === 2 && profile.sports.length > 0) || (step === 3 && profile.hours) || step === 4
  const progress = ((step)/5)*100
  if (step === 0) return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:480 }}>
        <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:64, fontWeight:800, letterSpacing:4, background:'linear-gradient(135deg,#00d4aa,#00a8ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:8 }}>PULSE</div>
        <div style={{ fontFamily:'DM Mono, monospace', fontSize:12, color:S.muted, letterSpacing:2, marginBottom:32 }}>AI COACHING · BUILT FOR REAL LIFE</div>
        <div style={{ fontSize:18, color:S.text, lineHeight:1.7, marginBottom:16 }}>Your personal AI coach that builds around <strong style={{color:S.accent}}>your life</strong> — not the other way around.</div>
        <div style={{ fontSize:14, color:S.muted, lineHeight:1.7, marginBottom:40 }}>Soccer on Thursdays? Work until 7pm? Training for an Ironman while losing weight? Pulse builds your plan around all of it — and adjusts every day based on how your body responds.</div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:40 }}>
          {['Adaptive daily plans','Nutrition targets','Recovery-aware','Life-first scheduling'].map((f,i)=>(
            <div key={i} style={{ background:S.card, border:`1px solid ${S.subtle}`, borderRadius:8, padding:'8px 12px', fontFamily:'DM Mono, monospace', fontSize:10, color:S.accent }}>{f}</div>
          ))}
        </div>
        <button onClick={next} style={{ background:'linear-gradient(135deg,#00d4aa,#00a8ff)', border:'none', borderRadius:10, padding:'16px 48px', color:'#000', fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:700, letterSpacing:1, cursor:'pointer', width:'100%' }}>
          Build my plan →
        </button>
        <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:S.muted, marginTop:16 }}>5 quick questions · takes 60 seconds</div>
      </div>
    </div>
  )
  return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:640 }}>
        {/* Progress */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:40 }}>
          <div style={{ flex:1, height:3, background:S.subtle, borderRadius:2, overflow:'hidden' }}>
            <div style={{ width:`${progress}%`, height:'100%', background:'linear-gradient(135deg,#00d4aa,#00a8ff)', borderRadius:2, transition:'width 0.4s ease' }}/>
          </div>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:S.muted }}>{step}/5</div>
        </div>
        {/* Step 1: Goal */}
        {step===1 && (
          <div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:32, fontWeight:700, marginBottom:8 }}>What's your main goal?</div>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted, marginBottom:28 }}>Pick one — you can have multiple goals but let's start with the big one.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {GOALS.map(g=>(
                <button key={g.id} onClick={()=>update('goal',g.id)} style={{ background: profile.goal===g.id ? 'rgba(0,212,170,0.1)' : S.card, border:`1px solid ${profile.goal===g.id?S.accent:S.subtle}`, borderRadius:10, padding:'16px', textAlign:'left', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{g.icon}</div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:700, color:profile.goal===g.id?S.accent:S.text, marginBottom:4 }}>{g.label}</div>
                  <div style={{ fontSize:11, color:S.muted }}>{g.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Step 2: Sports */}
        {step===2 && (
          <div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:32, fontWeight:700, marginBottom:8 }}>Which sports do you do?</div>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted, marginBottom:28 }}>Select all that apply — Pulse will balance them all.</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {SPORTS.map(s=>(
                <button key={s.id} onClick={()=>toggle('sports',s.id)} style={{ background: profile.sports.includes(s.id)?'rgba(0,212,170,0.1)':S.card, border:`1px solid ${profile.sports.includes(s.id)?S.accent:S.subtle}`, borderRadius:10, padding:'16px 12px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:700, color:profile.sports.includes(s.id)?S.accent:S.text }}>{s.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Step 3: Hours */}
        {step===3 && (
          <div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:32, fontWeight:700, marginBottom:8 }}>How many hours per week can you train?</div>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted, marginBottom:28 }}>Be realistic — Pulse works best when the plan actually fits your life.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {HOURS.map(h=>(
                <button key={h.id} onClick={()=>update('hours',h.id)} style={{ background: profile.hours===h.id?'rgba(0,212,170,0.1)':S.card, border:`1px solid ${profile.hours===h.id?S.accent:S.subtle}`, borderRadius:10, padding:'16px 20px', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 0.15s' }}>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:700, color:profile.hours===h.id?S.accent:S.text }}>{h.label}</div>
                  <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted }}>{h.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Step 4: Locked days */}
        {step===4 && (
          <div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:32, fontWeight:700, marginBottom:8 }}>Any locked days in your week?</div>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted, marginBottom:28 }}>Work late? Soccer training? Kids pickup? Pulse plans around your life — not over it.</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:20 }}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>toggle('lockedDays',d)} style={{ background: profile.lockedDays.includes(d)?'rgba(245,158,11,0.1)':S.card, border:`1px solid ${profile.lockedDays.includes(d)?S.amber:S.subtle}`, borderRadius:8, padding:'12px 4px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:700, color:profile.lockedDays.includes(d)?S.amber:S.text }}>{d.slice(0,3)}</div>
                </button>
              ))}
            </div>
            {profile.lockedDays.length>0 && (
              <div style={{ background:'rgba(245,158,11,0.06)', border:`1px solid rgba(245,158,11,0.2)`, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.amber }}>🔒 Locked: {profile.lockedDays.join(', ')} — Pulse will never schedule hard training on these days.</div>
              </div>
            )}
            {profile.lockedDays.length===0 && (
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted, textAlign:'center', marginTop:12 }}>No locked days? Pulse has full flexibility — it'll optimise your whole week.</div>
            )}
          </div>
        )}
        {/* Step 5: Event */}
        {step===5 && (
          <div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:32, fontWeight:700, marginBottom:8 }}>Do you have a target event?</div>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.muted, marginBottom:28 }}>A race, a trip, a date — giving Pulse a deadline makes the plan sharper. Skip if you don't have one yet.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:S.card, border:`1px solid ${S.subtle}`, borderRadius:10, padding:16 }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:S.muted, marginBottom:8, textTransform:'uppercase' }}>Event name</div>
                <input value={profile.eventName} onChange={e=>update('eventName',e.target.value)} placeholder="e.g. Ironman Melbourne, Paris Marathon..." style={{ background:'transparent', border:'none', outline:'none', color:S.text, fontFamily:'Barlow, sans-serif', fontSize:15, width:'100%' }}/>
              </div>
              <div style={{ background:S.card, border:`1px solid ${S.subtle}`, borderRadius:10, padding:16 }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:S.muted, marginBottom:8, textTransform:'uppercase' }}>Event date</div>
                <input type="date" value={profile.eventDate} onChange={e=>update('eventDate',e.target.value)} style={{ background:'transparent', border:'none', outline:'none', color:S.text, fontFamily:'Barlow, sans-serif', fontSize:15, width:'100%' }}/>
              </div>
            </div>
            {profile.eventDate && (
              <div style={{ marginTop:16, background:'rgba(0,212,170,0.06)', border:`1px solid rgba(0,212,170,0.2)`, borderRadius:8, padding:'10px 14px' }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:S.accent }}>
                  🎯 {Math.ceil((new Date(profile.eventDate)-new Date())/(1000*60*60*24*7))} weeks to go — Pulse will build a progressive plan toward race day.
                </div>
              </div>
            )}
          </div>
        )}
        {/* Nav */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:32 }}>
          {step>1 ? (
            <button onClick={()=>setStep(s=>s-1)} style={{ background:'transparent', border:`1px solid ${S.subtle}`, borderRadius:8, padding:'12px 24px', color:S.muted, fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:600, cursor:'pointer' }}>← Back</button>
          ) : <div/>}
          <button onClick={next} disabled={!canNext} style={{ background: canNext?'linear-gradient(135deg,#00d4aa,#00a8ff)':'#1e2a38', border:'none', borderRadius:8, padding:'14px 36px', color: canNext?'#000':S.muted, fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:700, letterSpacing:1, cursor: canNext?'pointer':'not-allowed', transition:'all 0.2s' }}>
            {step===5 ? '⚡ Build my plan' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
