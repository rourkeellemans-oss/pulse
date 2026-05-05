import { useState, useEffect } from 'react'

const RACE_DATE = new Date('2027-11-07')
const CURRENT_DATE = new Date()
const WEEKS_TO_RACE = Math.ceil((RACE_DATE - CURRENT_DATE) / (1000 * 60 * 60 * 24 * 7))

const SYSTEM_PROMPT = `You are Coach Pulse, an expert AI triathlon coach and sports nutritionist.

Athlete profile:
- Goal: Ironman Melbourne, November 2027 (${WEEKS_TO_RACE} weeks away)
- Current training: Soccer (Thursday training, alternating Saturday/Sunday games — these are LOCKED and cannot be moved)
- Gym: 3x per week (strength and conditioning)
- Available training hours: 8-10 hours per week
- Body composition goal: Body recomposition — lose fat while gaining muscle
- Sports: Triathlon (swim/bike/run) + soccer + gym

When generating a weekly training plan, ALWAYS:
1. Lock Thursday as soccer training day
2. Account for Saturday OR Sunday as potential soccer game day
3. Distribute swim, bike, run across remaining days
4. Include gym 3x per week (can combine with swim/run days)
5. Include at least 1 full rest/recovery day
6. Consider Ironman progression — currently in BASE BUILDING phase
7. Keep total hours between 8-10 per week

When generating nutrition targets for body recomposition:
- Create a moderate calorie deficit (300-400 cal below TDEE)
- High protein (1.8-2.2g per kg bodyweight)
- Carb cycle around hard training days
- Account for soccer as HIGH carb day
- Account for long bike/run as HIGH carb day
- Rest days as LOWER carb

Always respond in valid JSON only — no markdown, no explanation, just the JSON object.`

const DAY_COLORS = {
  swim: '#00a8ff',
  bike: '#f59e0b', 
  run: '#00d4aa',
  gym: '#a855f7',
  soccer: '#22c55e',
  rest: '#5a6a7e',
  recover: '#5a6a7e',
}

const MACRO_COLORS = {
  protein: '#00d4aa',
  carbs: '#00a8ff',
  fat: '#f59e0b',
}

function WeekCalendar({ plan, soccerGameDay }) {
  if (!plan?.days) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
      {plan.days.map((day, i) => (
        <div key={i} style={{
          background: day.isLocked ? 'rgba(34,197,94,0.08)' : '#141920',
          border: `1px solid ${day.isLocked ? 'rgba(34,197,94,0.3)' : '#1e2a38'}`,
          borderRadius: 10, padding: 12, minHeight: 180,
        }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e', textTransform: 'uppercase', marginBottom: 4 }}>{day.name}</div>
          {day.isLocked && <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: '#22c55e', marginBottom: 6 }}>🔒 locked</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {day.sessions?.map((s, j) => (
              <div key={j} style={{
                background: `${DAY_COLORS[s.type] || '#5a6a7e'}18`,
                border: `1px solid ${DAY_COLORS[s.type] || '#5a6a7e'}40`,
                borderRadius: 5, padding: '4px 7px',
              }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 700, color: DAY_COLORS[s.type] || '#5a6a7e', textTransform: 'uppercase' }}>{s.type}</div>
                <div style={{ fontSize: 10, color: '#8899aa', marginTop: 1 }}>{s.duration}</div>
                <div style={{ fontSize: 10, color: '#5a6a7e', marginTop: 1 }}>{s.focus}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#f59e0b', marginTop: 8 }}>
            {day.calories ? `${day.calories} kcal` : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

function NutritionCard({ nutrition }) {
  if (!nutrition) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
      {[
        { label: 'Training day', data: nutrition.trainingDay, color: '#00d4aa' },
        { label: 'Soccer day', data: nutrition.soccerDay, color: '#22c55e' },
        { label: 'Long session', data: nutrition.longSessionDay, color: '#00a8ff' },
        { label: 'Rest day', data: nutrition.restDay, color: '#5a6a7e' },
      ].map((d, i) => (
        <div key={i} style={{ background: '#141920', border: `1px solid ${d.color}30`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: d.color, textTransform: 'uppercase', marginBottom: 8 }}>{d.label}</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 800, color: d.color }}>{d.data?.calories}</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e', marginBottom: 10 }}>kcal / day</div>
          {['protein', 'carbs', 'fat'].map(macro => (
            <div key={macro} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e' }}>{macro}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#e8eef5' }}>{d.data?.[macro]}g</span>
              </div>
              <div style={{ height: 3, background: '#1e2a38', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, background: MACRO_COLORS[macro], width: `${Math.min(100, (d.data?.[macro] / (macro === 'protein' ? 200 : macro === 'carbs' ? 400 : 100)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function WeeklyGoals({ goals }) {
  if (!goals?.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
      {goals.map((g, i) => (
        <div key={i} style={{ background: '#141920', border: '1px solid #1e2a38', borderRadius: 10, padding: 14 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: '#5a6a7e', textTransform: 'uppercase', marginBottom: 6 }}>{g.category}</div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: '#e8eef5', marginBottom: 4 }}>{g.target}</div>
          <div style={{ fontSize: 11, color: '#5a6a7e', lineHeight: 1.5 }}>{g.description}</div>
        </div>
      ))}
    </div>
  )
}

export default function PlanGenerator() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [soccerGameDay, setSoccerGameDay] = useState('saturday')
  const [bodyWeight, setBodyWeight] = useState(80)
  const [phase, setPhase] = useState('base')
  const [weekNumber, setWeekNumber] = useState(1)

  const generatePlan = async () => {
    setLoading(true)
    setPlan(null)
    try {
      const prompt = `Generate a complete weekly training plan for an athlete with these details:
- Ironman Melbourne November 2027 (${WEEKS_TO_RACE} weeks away)
- Current phase: ${phase} building
- Week number: ${weekNumber} of training
- Body weight: ${bodyWeight}kg
- Body recomposition goal (lose fat, gain muscle)
- Soccer: Thursday training (locked), ${soccerGameDay} game (locked)
- Gym 3x per week
- 8-10 hours total training per week

Return ONLY a JSON object with this exact structure:
{
  "weekTheme": "string — theme for this week e.g. 'Aerobic base + technique'",
  "totalHours": "string e.g. '9.5 hours'",
  "keyFocus": "string — main coaching focus this week",
  "days": [
    {
      "name": "Monday",
      "isLocked": false,
      "sessions": [
        { "type": "swim|bike|run|gym|soccer|rest|recover", "duration": "45 min", "focus": "brief description", "intensity": "zone 1-2" }
      ],
      "calories": 2400
    }
  ],
  "nutrition": {
    "trainingDay": { "calories": 2600, "protein": 180, "carbs": 280, "fat": 75 },
    "soccerDay":   { "calories": 2800, "protein": 175, "carbs": 320, "fat": 70 },
    "longSessionDay": { "calories": 3000, "protein": 185, "carbs": 360, "fat": 72 },
    "restDay":     { "calories": 2100, "protein": 185, "carbs": 160, "fat": 72 }
  },
  "weeklyGoals": [
    { "category": "Swim", "target": "3.2km total", "description": "Focus on stroke efficiency" },
    { "category": "Bike", "target": "120km total", "description": "All Zone 2, aerobic base" },
    { "category": "Run", "target": "25km total", "description": "Easy pace, HR under 145" },
    { "category": "Strength", "target": "3 sessions", "description": "Hip stability and core" },
    { "category": "Nutrition", "target": "300 cal deficit", "description": "High protein on all days" },
    { "category": "Recovery", "target": "8h sleep", "description": "Prioritise sleep for adaptation" }
  ],
  "coachNote": "string — 2-3 sentence personal coaching note for this week"
}`

      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setPlan(parsed)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { generatePlan() }, [])

  const daysToRace = Math.ceil((RACE_DATE - CURRENT_DATE) / (1000 * 60 * 60 * 24))

  return (
    <div style={{ height: '100vh', background: '#080b10', color: '#e8eef5', fontFamily: 'Barlow, sans-serif', overflowY: 'auto', padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: 3, background: 'linear-gradient(135deg,#00d4aa,#00a8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PULSE</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#5a6a7e', marginTop: 2 }}>WEEKLY PLAN GENERATOR</div>
        </div>
        <div style={{ textAlign: 'center', background: '#141920', border: '1px solid #1e2a38', borderRadius: 10, padding: '10px 20px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 32, fontWeight: 800, color: '#00d4aa' }}>{daysToRace}</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e' }}>DAYS TO IRONMAN MELBOURNE</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e' }}>NOV 2027 · {WEEKS_TO_RACE} WEEKS</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#141920', border: '1px solid #1e2a38', borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e', marginBottom: 6 }}>SOCCER GAME DAY</div>
          <select value={soccerGameDay} onChange={e => setSoccerGameDay(e.target.value)}
            style={{ background: '#0e1219', border: '1px solid #1e2a38', borderRadius: 6, padding: '6px 10px', color: '#e8eef5', fontFamily: 'DM Mono, monospace', fontSize: 11, width: '100%' }}>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>
        <div style={{ background: '#141920', border: '1px solid #1e2a38', borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e', marginBottom: 6 }}>TRAINING PHASE</div>
          <select value={phase} onChange={e => setPhase(e.target.value)}
            style={{ background: '#0e1219', border: '1px solid #1e2a38', borderRadius: 6, padding: '6px 10px', color: '#e8eef5', fontFamily: 'DM Mono, monospace', fontSize: 11, width: '100%' }}>
            <option value="base">Base building</option>
            <option value="build">Build phase</option>
            <option value="peak">Peak training</option>
            <option value="taper">Race taper</option>
          </select>
        </div>
        <div style={{ background: '#141920', border: '1px solid #1e2a38', borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e', marginBottom: 6 }}>BODY WEIGHT (KG)</div>
          <input type="number" value={bodyWeight} onChange={e => setBodyWeight(Number(e.target.value))}
            style={{ background: '#0e1219', border: '1px solid #1e2a38', borderRadius: 6, padding: '6px 10px', color: '#e8eef5', fontFamily: 'DM Mono, monospace', fontSize: 11, width: '100%' }} />
        </div>
        <div style={{ background: '#141920', border: '1px solid #1e2a38', borderRadius: 8, padding: 12 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#5a6a7e', marginBottom: 6 }}>TRAINING WEEK</div>
          <input type="number" value={weekNumber} onChange={e => setWeekNumber(Number(e.target.value))} min="1" max={WEEKS_TO_RACE}
            style={{ background: '#0e1219', border: '1px solid #1e2a38', borderRadius: 6, padding: '6px 10px', color: '#e8eef5', fontFamily: 'DM Mono, monospace', fontSize: 11, width: '100%' }} />
        </div>
      </div>

      <button onClick={generatePlan} disabled={loading} style={{
        background: loading ? '#1e2a38' : 'linear-gradient(135deg,#00d4aa,#00a8ff)',
        border: 'none', borderRadius: 8, padding: '12px 28px', color: loading ? '#5a6a7e' : '#000',
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 15, fontWeight: 700, letterSpacing: 1,
        cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 24, width: '100%'
      }}>
        {loading ? '⚡ Coach Pulse is building your plan...' : '⚡ Generate This Week\'s Plan'}
      </button>

      {/* Plan output */}
      {plan && (
        <div>
          {/* Coach note */}
          <div style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#141920', border: '1px solid #00d4aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, color: '#00d4aa', letterSpacing: 1, marginBottom: 4 }}>COACH PULSE · WEEK {weekNumber} NOTE</div>
              <div style={{ fontSize: 13, color: '#e8eef5', lineHeight: 1.6 }}>{plan.coachNote}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#5a6a7e' }}>📅 {plan.weekTheme}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#00d4aa' }}>⏱ {plan.totalHours}</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#f59e0b' }}>🎯 {plan.keyFocus}</span>
              </div>
            </div>
          </div>

          {/* Weekly calendar */}
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: '#5a6a7e', textTransform: 'uppercase', marginBottom: 10 }}>Weekly schedule</div>
          <WeekCalendar plan={plan} soccerGameDay={soccerGameDay} />

          {/* Weekly goals */}
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: '#5a6a7e', textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>Weekly targets</div>
          <WeeklyGoals goals={plan.weeklyGoals} />

          {/* Nutrition */}
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: 2, color: '#5a6a7e', textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>Nutrition targets · body recomposition</div>
          <NutritionCard nutrition={plan.nutrition} />

          <div style={{ height: 40 }} />
        </div>
      )}
    </div>
  )
}
