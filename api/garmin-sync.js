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

    // Return raw data so we can see the structure
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
