import express from 'express'
import cors from 'cors'
import session from 'express-session'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(session({
  secret: 'pulse-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}))

const GARMIN_CLIENT_ID = process.env.GARMIN_CLIENT_ID
const GARMIN_CLIENT_SECRET = process.env.GARMIN_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3001/auth/callback'

// Step 1 — redirect user to Garmin login
app.get('/auth/garmin', (req, res) => {
  const url = `https://connect.garmin.com/oauthConfirm?oauth_callback=${REDIRECT_URI}`
  res.redirect(url)
})

// Step 2 — Garmin redirects back here with token
app.get('/auth/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query
  req.session.garminToken = { oauth_token, oauth_verifier }
  console.log('✅ Garmin connected!', { oauth_token, oauth_verifier })
  res.redirect('http://localhost:5173?connected=true')
})

// Get today's data
app.get('/garmin/today', async (req, res) => {
  if (!req.session.garminToken) {
    return res.status(401).json({ error: 'Not connected to Garmin' })
  }
  // Once official API approved, real data goes here
  // For now return enhanced mock data
  res.json({
    readiness: 78,
    hrv: 52,
    bodyBattery: 73,
    sleepScore: 81,
    sleepHours: '7h 22m',
    restingHR: 48,
    stress: 22,
    connected: true
  })
})

app.listen(3001, () => {
  console.log('🚀 Pulse server running on http://localhost:3001')
})