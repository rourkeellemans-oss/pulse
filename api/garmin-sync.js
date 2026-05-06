import { GarminConnect } from 'garmin-connect'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })

  try {
    const client = new GarminConnect({ username: email, password })
    await client.login()
    const today = new Date()

    const [sleepRes, hrRes, stepsRes, activitiesRes, weightRes] = await Promise.allSettled([
      client.getSleepData(today),
      client.getHeartRate(today),
      client.getSteps(today),
      client.getActivities(0, 10),
      client.getDailyWeightData(today),
    ])

    const sleep = sleepRes.value
    const hr = hrRes.value
    const dto = sleep?.dailySleepDTO
    const bb = sleep?.sleepBodyBattery
    const bodyBattery = bb?.length ? bb[bb.length - 1].value : null
    const secs = dto?.sleepTimeSeconds
    const sleepHours = secs ? `${Math.floor(secs/3600)}h ${Math.floor((secs%3600)/60)}m` : null

    // Respiration
    const respEpochs = sleep?.wellnessEpochRespirationAveragesList?.filter(r => r.respirationAverageValue > 0)
    const avgResp = respEpochs?.length 
      ? Math.round(respEpochs.reduce((a,r) => a + r.respirationAverageValue, 0) / respEpochs.length * 10) / 10 
      : null

    // Steps
    const steps = stepsRes.value?.totalSteps ?? stepsRes.value?.[0]?.steps ?? null

    // Recent activities
    const activities = (activitiesRes.value || []).slice(0, 5).map(a => ({
      name: a.activityName,
      type: a.activityType?.typeKey,
      date: a.startTimeLocal,
      duration_minutes: a.duration ? Math.round(a.duration / 60) : null,
      distance_km: a.distance ? Math.round(a.distance / 10) / 100 : null,
      avg_hr: a.averageHR,
      max_hr: a.maxHR,
      calories: a.calories,
      avg_pace: a.averageSpeed,
      training_effect: a.aerobicTrainingEffect,
      anaerobic_effect: a.anaerobicTrainingEffect,
    }))

    // Weight
    const weight = weightRes.value?.dateWeightList?.[0]?.weight 
      ? Math.round(weightRes.value.dateWeightList[0].weight / 1000 * 10) / 10 
      : null

    res.json({
      // Core recovery metrics
      hrv: sleep?.avgOvernightHrv ?? null,
      hrv_status: sleep?.hrvStatus ?? null,
      body_battery: bodyBattery,
      body_battery_change: sleep?.bodyBatteryChange ?? null,
      sleep_score: dto?.sleepScores?.overall?.value ?? null,
      sleep_hours: sleepHours,
      sleep_deep_minutes: dto?.deepSleepSeconds ? Math.round(dto.deepSleepSeconds/60) : null,
      sleep_rem_minutes: dto?.remSleepSeconds ? Math.round(dto.remSleepSeconds/60) : null,
      sleep_light_minutes: dto?.lightSleepSeconds ? Math.round(dto.lightSleepSeconds/60) : null,
      sleep_awake_minutes: dto?.awakeSleepSeconds ? Math.round(dto.awakeSleepSeconds/60) : null,
      sleep_restlessness: sleep?.restlessMomentsCount ?? null,
      sleep_feedback: dto?.sleepScoreFeedback ?? null,
      resting_hr: hr?.restingHeartRate ?? dto?.avgHeartRate ?? null,
      avg_sleep_hr: dto?.avgHeartRate ?? null,
      stress: dto?.avgSleepStress ?? null,
      respiration_avg: avgResp,
      respiration_low: dto?.lowestRespirationValue ?? null,
      respiration_high: dto?.highestRespirationValue ?? null,
      // Activity
      steps: steps,
      weight_kg: weight,
      recent_activities: activities,
    })
  } catch(e) {
    res.status(401).json({ error: e.message })
  }
}
