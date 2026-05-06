import { GarminConnect } from 'garmin-connect'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })

  try {
    const client = new GarminConnect({ username: email, password })
    await client.login()
    
    const today = new Date().toISOString().split('T')[0]
    const [stats, hrv, readiness] = await Promise.allSettled([
      client.getUserStats(today),
      client.getHrvData(today),
      client.getTrainingReadiness(today),
    ])

    res.json({
      hrv: hrv.value?.hrvSummary?.lastNight ?? null,
      body_battery: stats.value?.bodyBatteryMostRecentValue ?? null,
      sleep_score: stats.value?.sleepingSeconds ? Math.round(stats.value.sleepingSeconds/3600*10) : null,
      resting_hr: stats.value?.restingHeartRate ?? null,
      stress: stats.value?.averageStressLevel ?? null,
      training_readiness: readiness.value?.[0]?.score ?? null,
    })
  } catch(e) {
    res.status(401).json({ error: e.message })
  }
}
