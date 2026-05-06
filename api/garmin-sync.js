import { GarminConnect } from 'garmin-connect'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })

  try {
    const client = new GarminConnect({ username: email, password })
    await client.login()
    
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]

    const [sleep, hr, steps] = await Promise.allSettled([
      client.getSleepData(today),
      client.getHeartRate(today),
      client.getSteps(today),
    ])

    // Try wellness and HRV via direct get with correct base
    const [wellness, hrv, readiness] = await Promise.allSettled([
      client.get(`https://connect.garmin.com/wellness-service/wellness/dailySummary/${dateStr}`),
      client.get(`https://connect.garmin.com/hrv-service/hrv/${dateStr}`),
      client.get(`https://connect.garmin.com/training-readiness-service/training-readiness/${dateStr}`),
    ])

    res.json({
      debug: {
        sleep: sleep.status === 'fulfilled' ? sleep.value : sleep.reason?.message,
        hr: hr.status === 'fulfilled' ? hr.value : hr.reason?.message,
        wellness: wellness.status === 'fulfilled' ? wellness.value : wellness.reason?.message,
        hrv: hrv.status === 'fulfilled' ? hrv.value : hrv.reason?.message,
        readiness: readiness.status === 'fulfilled' ? readiness.value : readiness.reason?.message,
      }
    })
  } catch(e) {
    res.status(401).json({ error: e.message })
  }
}
