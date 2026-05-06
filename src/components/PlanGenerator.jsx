import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
const RACE_DATE = new Date('2027-11-07')
const CURRENT_DATE = new Date()
const WEEKS_TO_RACE = Math.ceil((RACE_DATE - CURRENT_DATE) / (1000 * 60 * 60 * 24 * 7))
const DAY_COLORS = { swim:'#00a8ff',bike:'#f59e0b',run:'#00d4aa',gym:'#a855f7',soccer:'#22c55e',rest:'#94a3b8',recover:'#94a3b8' }
const DEFAULT_T = { bg:'#080b10',surface:'#0e1219',card:'#141920',card2:'#1a2130',text:'#e8eef5',muted:'#5a6a7e',border:'#1e2a38',accent:'#00d4aa',accent2:'#00a8ff',amber:'#f59e0b',purple:'#a855f7',green:'#22c55e',shadow:'0 2px 12px rgba(0,0,0,0.4)' }
function WeekCalendar({plan,t}){if(!plan?.days)return null;return(<div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,overflowX:'auto'}}>{plan.days.map((day,i)=>(<div key={i} style={{background:day.isLocked?`${t.green}12`:t.card,border:`1px solid ${day.isLocked?t.green:t.border}`,borderRadius:8,padding:'8px 4px',textAlign:'center',minWidth:40}}><div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:t.muted,textTransform:'uppercase'}}>{day.name?.slice(0,3)}</div>{day.isLocked&&<div style={{fontSize:7,color:t.green}}>🔒</div>}<div style={{display:'flex',flexDirection:'column',gap:3,marginTop:4}}>{day.sessions?.map((s,j)=>(<div key={j} style={{background:`${DAY_COLORS[s.type]||'#94a3b8'}18`,border:`1px solid ${DAY_COLORS[s.type]||'#94a3b8'}40`,borderRadius:4,padding:'3px 4px'}}><div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:700,color:DAY_COLORS[s.type]||'#94a3b8',textTransform:'uppercase'}}>{s.type}</div><div style={{fontSize:9,color:t.muted}}>{s.duration}</div></div>))}</div><div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:t.amber,marginTop:4}}>{day.calories?day.calories+'cal':''}</div></div>))}</div>)}
function NutritionCard({nutrition,t}){if(!nutrition)return null;return(<div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:8}}>{[{label:'Training day',data:nutrition.trainingDay,color:t.accent},{label:'Soccer day',data:nutrition.soccerDay,color:t.green},{label:'Long session',data:nutrition.longSessionDay,color:t.accent2},{label:'Rest day',data:nutrition.restDay,color:t.muted}].map((d,i)=>(<div key={i} style={{background:t.card,border:`1px solid ${d.color}30`,borderRadius:10,padding:12}}><div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:d.color,textTransform:'uppercase',marginBottom:6}}>{d.label}</div><div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:24,fontWeight:800,color:d.color}}>{d.data?.calories}</div><div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:t.muted,marginBottom:8}}>kcal/day</div>{['protein','carbs','fat'].map(m=>(<div key={m} style={{marginBottom:4}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}><span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:t.muted}}>{m}</span><span style={{fontFamily:'DM Mono, monospace',fontSize:9,color:t.text}}>{d.data?.[m]}g</span></div><div style={{height:3,background:t.border,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:m==='protein'?t.accent:m==='carbs'?t.accent2:t.amber,width:Math.min(100,(d.data?.[m]/(m==='protein'?200:m==='carbs'?400:100))*100)+'%'}}/></div></div>))}</div>))}</div>)}
function WeeklyGoals({goals,t}){if(!goals?.length)return null;return(<div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:8}}>{goals.map((g,i)=>(<div key={i} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,padding:12}}><div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:10,fontWeight:600,letterSpacing:2,color:t.muted,textTransform:'uppercase',marginBottom:4}}>{g.category}</div><div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:16,fontWeight:700,color:t.text,marginBottom:2}}>{g.target}</div><div style={{fontSize:11,color:t.muted,lineHeight:1.5}}>{g.description}</div></div>))}</div>)}
function CoachBubble({plan,t}){const [open,setOpen]=useState(false);const [messages,setMessages]=useState([{role:'coach',text:"Hey! Your plan is ready.\n\nAsk me anything about your sessions, nutrition, or how to adapt if you're tired."}]);const [input,setInput]=useState('');const [loading,setLoading]=useState(false);const [history,setHistory]=useState([{role:'user',content:'Hi'},{role:'assistant',content:"Hey! Your plan is ready.\n\nAsk me anything about your sessions, nutrition, or how to adapt if you're tired."}]);const endRef=useRef(null);useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[messages,loading,open]);const send=async(text)=>{if(!text.trim()||loading)return;const h=[...history,{role:'user',content:text}];setMessages(p=>[...p,{role:'user',text}]);setHistory(h);setInput('');setLoading(true);try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:800,system:`You are Coach Pulse, expert triathlon coach. Current plan: ${JSON.stringify(plan)}. Be warm, specific, 3-4 sentences.`,messages:h})});const data=await res.json();const reply=data.content?.[0]?.text??'Connection issue.';setMessages(p=>[...p,{role:'coach',text:reply}]);setHistory(p=>[...p,{role:'assistant',content:reply}])}catch{setMessages(p=>[...p,{role:'coach',text:'Connection issue.'}])};setLoading(false)};const quick=["My legs are heavy, swap anything?","What to eat before soccer?","How hard should today's run feel?","Explain my nutrition targets"];return(<><button onClick={()=>setOpen(o=>!o)} style={{position:'fixed',bottom:90,right:16,width:52,height:52,borderRadius:'50%',background:`linear-gradient(135deg,${t.accent},${t.accent2})`,border:'none',cursor:'pointer',fontSize:20,zIndex:1000,boxShadow:`0 4px 20px ${t.accent}40`}}>{open?'✕':'⚡'}</button>{open&&(<div style={{position:'fixed',bottom:150,right:16,width:Math.min(340,window.innerWidth-32),height:460,background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,display:'flex',flexDirection:'column',zIndex:1000,boxShadow:'0 8px 40px rgba(0,0,0,0.3)'}}><div style={{padding:'12px 14px',borderBottom:`1px solid ${t.border}`,display:'flex',alignItems:'center',gap:8,flexShrink:0}}><div style={{width:30,height:30,borderRadius:'50%',background:`${t.accent}18`,border:`1px solid ${t.accent}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>⚡</div><div><div style={{fontFamily:'Barlow Condensed, sans-serif',fontSize:13,fontWeight:700,color:t.text,letterSpacing:1}}>COACH PULSE</div><div style={{fontFamily:'DM Mono, monospace',fontSize:9,color:t.accent}}>Knows your plan</div></div></div><div style={{flex:1,overflowY:'auto',padding:'10px 12px 4px'}}>{messages.map((m,i)=>(<div key={i} style={{display:'flex',justifyContent:m.role==='coach'?'flex-start':'flex-end',marginBottom:8}}><div style={{maxWidth:'90%',padding:'8px 12px',borderRadius:10,fontSize:12,lineHeight:1.6,color:t.text,borderBottomLeftRadius:m.role==='coach'?2:10,borderBottomRightRadius:m.role==='coach'?10:2,background:m.role==='coach'?t.card2:`${t.accent}18`,border:`1px solid ${m.role==='coach'?t.border:t.accent+'40'}`,whiteSpace:'pre-wrap'}}>{m.text}</div></div>))}{loading&&<div style={{display:'flex',gap:4,padding:8}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:'50%',background:t.accent,opacity:0.4,animation:`blink 1.2s infinite ${i*0.2}s`}}/>)}</div>}<div ref={endRef}/></div>{messages.length<3&&<div style={{padding:'0 10px 8px',display:'flex',flexDirection:'column',gap:4}}>{quick.map((q,i)=><button key={i} onClick={()=>send(q)} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:6,padding:'5px 8px',color:t.muted,fontSize:11,textAlign:'left',cursor:'pointer'}}>{q}</button>)}</div>}<div style={{padding:'8px 10px',borderTop:`1px solid ${t.border}`,display:'flex',gap:6,flexShrink:0}}><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(input)} placeholder="Ask about your plan..." style={{flex:1,background:t.card,border:`1px solid ${t.border}`,borderRadius:8,padding:'7px 10px',color:t.text,fontFamily:'Barlow, sans-serif',fontSize:12,outline:'none'}}/><button onClick={()=>send(input)} disabled={loading} style={{background:`linear-gradient(135deg,${t.accent},${t.accent2})`,border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:loading?0.5:1,flexShrink:0}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div></div>)}<style>{`@keyframes blink{0%,100%{opacity:0.2}50%{opacity:1}}`}</style></>)}
export default function PlanGenerator({ user }) {
  const DARK = DEFAULT_T
  const LIGHT = { bg:'#f5f6fa',surface:'#ffffff',card:'#ffffff',card2:'#f0f4f8',text:'#1a1a2e',muted:'#6b7a8d',border:'#e2e8f0',accent:'#00a67e',accent2:'#0066cc',amber:'#d97706',purple:'#7c3aed',green:'#059669',shadow:'0 2px 12px rgba(0,0,0,0.08)' }
  const [isDark, setIsDark] = useState(() => localStorage.getItem('pulse_theme') !== 'light')
  const t = isDark ? DARK : LIGHT
  useEffect(() => {
    const handler = () => setIsDark(localStorage.getItem('pulse_theme') !== 'light')
    window.addEventListener('storage', handler)
    window.addEventListener('themechange', handler)
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('themechange', handler) }
  }, [])
  const [plan, setPlan] = useState(() => { try { const s=localStorage.getItem('pulse_weekly_plan'); return s?JSON.parse(s):null } catch { return null } })
  const [loading, setLoading] = useState(false)
  const [soccerGameDay, setSoccerGameDay] = useState('saturday')
  const [bodyWeight, setBodyWeight] = useState(80)
  const [phase, setPhase] = useState('base')
  const [weekNumber, setWeekNumber] = useState(1)
  const [readiness, setReadiness] = useState(null)

  useEffect(() => { if (user) fetchReadiness() }, [user])

  const fetchReadiness = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('daily_stats').select('training_readiness,hrv,body_battery').eq('user_id', user.id).eq('date', today).single()
    if (data?.training_readiness) setReadiness(data)
  }

  useEffect(() => { if (user) loadSavedPlan() }, [user])
  const loadSavedPlan = async () => {
    if (user) {
      setUserId(user.id)
      const { data } = await supabase.from('weekly_plans').select('plan').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).single()
      if (data && data.plan) { setPlan(data.plan); return }
    } else {
      try { const s = localStorage.getItem('pulse_weekly_plan'); if (s) { setPlan(JSON.parse(s)); return } } catch {}
    }
    // no plan found, user clicks generate manually
  }

  const generatePlan = async () => {
    setLoading(true)
    setPlan(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5', max_tokens: 4000,
          system: 'You are Coach Pulse, expert triathlon coach. Return ONLY valid JSON, no markdown, no explanation.',
          messages: [{ role: 'user', content: `Generate weekly training plan. IMPORTANT: today readiness context (inject only if available): use variable readiness from state. Generate weekly training plan: Ironman Melbourne Nov 2027 (${WEEKS_TO_RACE} weeks away), ${phase} phase, week ${weekNumber}, ${bodyWeight}kg, body recomposition, ${profile?.sports?.includes("soccer") ? `soccer Thursday + ${soccerGameDay} locked,` : ""} gym ${profile?.sports?.includes("gym") ? "3x," : ""} 8-10hrs/week. Sports this athlete does: ${profile?.sports?.join(", ") || "swim, bike, run"}. Return JSON: {weekTheme,totalHours,keyFocus,coachNote,days:[{name,isLocked,sessions:[{type,duration,focus}],calories}],nutrition:{trainingDay,soccerDay,longSessionDay,restDay each:{calories,protein,carbs,fat}},weeklyGoals:[{category,target,description}]}` }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      setPlan(parsed)
      localStorage.setItem('pulse_weekly_plan', JSON.stringify(parsed))
      if (userId) {
        await supabase.from('weekly_plans').upsert({ user_id: userId, plan: parsed, week_number: weekNumber, phase, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      }
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const daysToRace = Math.ceil((RACE_DATE - CURRENT_DATE) / (1000 * 60 * 60 * 24))

  return (
    <div style={{ minHeight:'100vh', background:t.bg, color:t.text, fontFamily:'Barlow, sans-serif', padding:16, paddingBottom:100 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:24, fontWeight:800, letterSpacing:3, background:`linear-gradient(135deg,${t.accent},${t.accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PULSE</div>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:t.muted }}>WEEKLY PLAN</div>
        </div>
        <div style={{ textAlign:'center', background:t.card, border:`1px solid ${t.border}`, borderRadius:10, padding:'8px 14px' }}>
          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:28, fontWeight:800, color:t.accent }}>{daysToRace}</div>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:8, color:t.muted }}>DAYS TO IRONMAN</div>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:8, color:t.muted }}>{WEEKS_TO_RACE} WEEKS</div>
        </div>
      </div>

      {readiness && (
        <div style={{ background: readiness.training_readiness >= 70 ? '#22c55e18' : readiness.training_readiness >= 50 ? '#f59e0b18' : '#ef444418', border: '1px solid ' + (readiness.training_readiness >= 70 ? '#22c55e40' : readiness.training_readiness >= 50 ? '#f59e0b40' : '#ef444440'), borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: readiness.training_readiness >= 70 ? '#22c55e' : readiness.training_readiness >= 50 ? '#f59e0b' : '#ef4444', textTransform: 'uppercase', marginBottom: 2 }}>Today's Training Readiness</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: t.text }}>{readiness.training_readiness >= 70 ? '✅ You are good to go — full intensity today' : readiness.training_readiness >= 50 ? '⚠️ Moderate readiness — keep effort controlled' : '🔴 Low readiness — consider recovery or easy session only'}</div>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 36, fontWeight: 800, color: readiness.training_readiness >= 70 ? '#22c55e' : readiness.training_readiness >= 50 ? '#f59e0b' : '#ef4444' }}>{readiness.training_readiness}</div>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
        {[
          ...(profile?.sports?.includes('soccer') ? [{ label:'Soccer game day', el:<select value={soccerGameDay} onChange={e=>setSoccerGameDay(e.target.value)} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:6,padding:'6px 8px',color:t.text,fontFamily:'DM Mono, monospace',fontSize:11,width:'100%'}}><option value="saturday">Saturday</option><option value="sunday">Sunday</option></select> }] : []),
          { label:'Training phase', el:<select value={phase} onChange={e=>setPhase(e.target.value)} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:6,padding:'6px 8px',color:t.text,fontFamily:'DM Mono, monospace',fontSize:11,width:'100%'}}><option value="base">Base building</option><option value="build">Build phase</option><option value="peak">Peak training</option><option value="taper">Race taper</option></select> },
          { label:'Body weight (kg)', el:<input type="number" value={bodyWeight} onChange={e=>setBodyWeight(Number(e.target.value))} style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:6,padding:'6px 8px',color:t.text,fontFamily:'DM Mono, monospace',fontSize:11,width:'100%'}}/> },
          { label:'Training week', el:<input type="number" value={weekNumber} onChange={e=>setWeekNumber(Number(e.target.value))} min="1" style={{background:t.card2,border:`1px solid ${t.border}`,borderRadius:6,padding:'6px 8px',color:t.text,fontFamily:'DM Mono, monospace',fontSize:11,width:'100%'}}/> },
        ].map((item,i)=>(
          <div key={i} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,padding:10}}>
            <div style={{fontFamily:'DM Mono, monospace',fontSize:8,color:t.muted,marginBottom:5,textTransform:'uppercase'}}>{item.label}</div>
            {item.el}
          </div>
        ))}
      </div>

      <button onClick={generatePlan} disabled={loading} style={{ background:loading?t.card:`linear-gradient(135deg,${t.accent},${t.accent2})`, border:'none', borderRadius:8, padding:'12px', color:loading?t.muted:'#000', fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', marginBottom:16, width:'100%' }}>
        {loading ? '⚡ Building your plan...' : "⚡ Generate This Week's Plan"}
      </button>

      {plan && (
        <div>
          <div style={{ background:`${t.accent}08`, border:`1px solid ${t.accent}25`, borderRadius:10, padding:14, marginBottom:16, display:'flex', gap:12 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:`${t.accent}18`, border:`1px solid ${t.accent}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>⚡</div>
            <div>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:12, fontWeight:700, color:t.accent, letterSpacing:1, marginBottom:4 }}>COACH PULSE · WEEK {weekNumber}</div>
              <div style={{ fontSize:13, color:t.text, lineHeight:1.6 }}>{plan.coachNote}</div>
              <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'DM Mono, monospace', fontSize:9, color:t.muted }}>📅 {plan.weekTheme}</span>
                <span style={{ fontFamily:'DM Mono, monospace', fontSize:9, color:t.accent }}>⏱ {plan.totalHours}</span>
                <span style={{ fontFamily:'DM Mono, monospace', fontSize:9, color:t.amber }}>🎯 {plan.keyFocus}</span>
              </div>
            </div>
          </div>

          <div style={{ fontFamily:'DM Mono, monospace', fontSize:9, color:t.muted, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Weekly schedule</div>
          <WeekCalendar plan={plan} t={t} />

          <div style={{ fontFamily:'DM Mono, monospace', fontSize:9, color:t.muted, letterSpacing:1, textTransform:'uppercase', marginTop:16, marginBottom:8 }}>Weekly targets</div>
          <WeeklyGoals goals={plan.weeklyGoals} t={t} />

          <div style={{ fontFamily:'DM Mono, monospace', fontSize:9, color:t.muted, letterSpacing:1, textTransform:'uppercase', marginTop:16, marginBottom:8 }}>Nutrition · body recomposition</div>
          <NutritionCard nutrition={plan.nutrition} t={t} />
        </div>
      )}
      <CoachBubble plan={plan} t={t} />
    </div>
  )
}
