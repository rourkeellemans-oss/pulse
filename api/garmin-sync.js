import { GarminConnect } from 'garmin-connect'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })

  try {
    const client = new GarminConnect({ username: email, password })
    await client.login()
    const today = new Date()

    const [sleepRes, hrRes] = await Promise.allSettled([
      client.getSleepData(today),
      client.getHeartRate(today),
    ])

    const sleep = sleepRes.value
    const hr = hrRes.value
    const dto = sleep?.dailySleepDTO

    // Body battery at wake-up = last value in sleepBodyBattery array
    const bb = sleep?.sleepBodyBattery
    const bodyBattery = bb?.length ? bb[bb.length - 1].value : null

    // Sleep hours from seconds
    const secs = dto?.sleepTimeSeconds
    const sleepHours = secs ? `${Math.floor(secs/3600)}h ${Math.floor((secs%3600)/60)}m` : null

    res.json({
      hrv: sleep?.avgOvernightHrv ?? null,
      body_battery: bodyBattery,
      sleep_score: dto?.sleepScores?.overall?.value ?? null,
      sleep_hours: sleepHours,
      resting_hr: dto?.avgHeartRate ?? hr?.restingHeartRate ?? null,
      stress: dto?.avgSleepStress ?? null,
      training_readiness: null, // not available without official API
    })
  } catch(e) {
    res.status(401).json({ error: e.message })
  }
}
