import json
import os
from http.server import BaseHTTPRequestHandler
from garminconnect import Garmin
from datetime import date

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length))
        
        email = body.get('email')
        password = body.get('password')
        
        if not email or not password:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Missing credentials'}).encode())
            return
        
        try:
            client = Garmin(email, password)
            client.login()
            
            today = date.today().isoformat()
            stats = client.get_stats(today)
            hrv = client.get_hrv_data(today)
            
            result = {
                'hrv': hrv.get('hrvSummary', {}).get('lastNight'),
                'body_battery': stats.get('bodyBatteryMostRecentValue'),
                'sleep_score': stats.get('sleepingSeconds'),
                'resting_hr': stats.get('restingHeartRate'),
                'stress': stats.get('averageStressLevel'),
            }
            
            # Get training readiness
            try:
                readiness = client.get_training_readiness(today)
                if readiness:
                    result['training_readiness'] = readiness[0].get('score')
            except:
                pass

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(401)
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
