import { GarminConnect } from 'garmin-connect'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })

  try {
    const client = new GarminConnect({ username: email, password })
    await client.login()
    
    const today = new Date().toISOString().split('T')[0]

    const [sleep, hr, wellness, hrv, readiness] = await Promise.allSettled([
      client.getSleepData(today),
      client.getHeartRate(today),
      client.get(`/wellness-service/wellness/dailySummary/${today}`),
      client.get(`/hrv-service/hrv/${today}`),
      client.get(`/training-readiness-service/training-readiness/${today}`),
    ])

    const sleepVal = sleep.value?.dailySleepDTO
    const hrVal = hr.value
    const wellVal = wellness.value
    const hrvVal = hrv.value

    res.json({
      sleep_score: sleepVal?.sleepScores?.overall?.value ?? null,
      sleep_hours: sleepVal?.sleepTimeSeconds ? 
        `${Math.floor(sleepVal.sleepTimeSeconds/3600)}h ${Math.floor((sleepVal.sleepTimeSeconds%3600)/60)}m` : null,
      resting_hr: hrVal?.restingHeartRate ?? null,
      body_battery: wellVal?.bodyBatteryMostRecentValue ?? null,
      stress: wellVal?.averageStressLevel ?? null,
      hrv: hrvVal?.hrvSummary?.lastNight ?? null,
      training_readiness: readiness.value?.score ?? readiness.value?.[0]?.score ?? null,
    })
  } catch(e) {
    res.status(401).json({ error: e.message })
  }
}
