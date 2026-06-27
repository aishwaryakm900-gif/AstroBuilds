import os
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models import WeatherLog

# OpenWeatherMap API Integration Placeholder
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")

def get_weather_forecast(project_location: str) -> List[Dict[str, Any]]:
    """
    Fetches 7-day weather forecast. If WEATHER_API_KEY is not set, 
    returns a simulated forecast tailored to the project location.
    """
    if WEATHER_API_KEY:
        try:
            # Call OpenWeatherMap Geocoding + 5 Day/3 Hour forecast or OneCall
            geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={project_location}&limit=1&appid={WEATHER_API_KEY}"
            geo_res = requests.get(geo_url, timeout=5).json()
            if geo_res:
                lat, lon = geo_res[0]["lat"], geo_res[0]["lon"]
                forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={WEATHER_API_KEY}"
                res = requests.get(forecast_url, timeout=5).json()
                
                # Parse days
                daily_forecast = []
                # Group by day
                seen_dates = set()
                for item in res.get("list", []):
                    dt_str = item.get("dt_txt", "").split(" ")[0]
                    if dt_str and dt_str not in seen_dates:
                        seen_dates.add(dt_str)
                        daily_forecast.append({
                            "date": dt_str,
                            "temp": item["main"]["temp"],
                            "condition": item["weather"][0]["main"],
                            "rain_prob": item.get("pop", 0.0) * 100.0,
                            "humidity": item["main"]["humidity"],
                            "wind_speed": item["wind"]["speed"]
                        })
                return daily_forecast[:7]
        except Exception:
            pass # Fallback to simulation

    # Simulation fallback (dynamic weather based on location hash and current date)
    base_temp = 22.0
    if "texas" in project_location.lower() or "miami" in project_location.lower() or "dubai" in project_location.lower():
        base_temp = 32.0
    elif "london" in project_location.lower() or "seattle" in project_location.lower():
        base_temp = 14.0

    conditions = ["Sunny", "Partly Cloudy", "Rainy", "Thunderstorm", "Windy", "Sunny", "Overcast"]
    forecast = []
    
    # Generate 7 days starting from today
    for i in range(7):
        date_val = datetime.utcnow() + timedelta(days=i)
        day_idx = (date_val.day + i) % len(conditions)
        cond = conditions[day_idx]
        
        # Determine temperature and rain probability
        temp_offset = (i * 1.5 - 3)
        temp = base_temp + temp_offset
        rain_prob = 0.0
        humidity = 50
        wind_speed = 5.0
        
        if "rain" in cond.lower():
            rain_prob = 80.0
            temp -= 4.0
            humidity = 90
        elif "thunder" in cond.lower():
            rain_prob = 95.0
            temp -= 5.0
            humidity = 95
            wind_speed = 15.0
        elif "wind" in cond.lower():
            wind_speed = 18.0
            humidity = 40
            
        forecast.append({
            "date": date_val.strftime("%Y-%m-%d"),
            "temp": round(temp, 1),
            "condition": cond,
            "rain_prob": rain_prob,
            "humidity": humidity,
            "wind_speed": round(wind_speed, 1)
        })
    return forecast

def analyze_construction_impact(temp: float, condition: str, rain_prob: float, wind_speed: float, humidity: float) -> Dict[str, Any]:
    """
    AI assessment of weather on concrete pouring, painting, roofing, and exterior tasks.
    """
    assessments = {}
    
    # 1. Concrete Curing/Pouring (Risks: Temp < 4C or Temp > 35C, Heavy rain)
    if rain_prob > 60:
        assessments["concrete"] = {"status": "High Risk", "reason": "Heavy rain washes away cement paste before setup.", "action": "Postpone pouring; cover fresh concrete."}
    elif temp < 5:
        assessments["concrete"] = {"status": "High Risk", "reason": "Freezing prevents hydration process, damaging strength.", "action": "Use heated enclosures or accelerators."}
    elif temp > 38:
        assessments["concrete"] = {"status": "Medium Risk", "reason": "High heat causes rapid water loss, leading to shrinkage cracks.", "action": "Pour in early morning; use misting sprays."}
    else:
        assessments["concrete"] = {"status": "Optimal", "reason": "Temperatures and moisture are ideal for normal curing.", "action": "Proceed with regular hydration."}

    # 2. Painting (Exterior) (Risks: Humidity > 85%, rain, temperature < 10C)
    if rain_prob > 40:
        assessments["painting"] = {"status": "High Risk", "reason": "Water will dissolve and wash away uncured paint.", "action": "Suspend exterior painting."}
    elif humidity > 80:
        assessments["painting"] = {"status": "Medium Risk", "reason": "High humidity slows down water evaporation, delaying dry times.", "action": "Avoid thick coats; limit work to ventilated zones."}
    elif temp < 10:
        assessments["painting"] = {"status": "Medium Risk", "reason": "Low temperatures disrupt paint film formation.", "action": "Use low-temp formulas or paint indoors."}
    else:
        assessments["painting"] = {"status": "Optimal", "reason": "Clear skies, moderate temperatures, and low humidity.", "action": "Ideal day for painting."}

    # 3. Roofing (Risks: Rain, high wind > 15m/s, icy slopes)
    if rain_prob > 50:
        assessments["roofing"] = {"status": "High Risk", "reason": "Slippery wet surfaces create serious falling hazards; exposes interior structure.", "action": "Cease roofing operations."}
    elif wind_speed > 12.0:
        assessments["roofing"] = {"status": "High Risk", "reason": "Strong winds make carrying plywood/sheets dangerous.", "action": "Prohibit work at elevated heights."}
    else:
        assessments["roofing"] = {"status": "Optimal", "reason": "Low wind speed and dry weather support safe rooftop work.", "action": "Proceed with safety harnesses."}

    # 4. Exterior Activities (Scaffolding, grading, excavation)
    if "thunder" in condition.lower() or wind_speed > 16.0:
        assessments["exterior"] = {"status": "High Risk", "reason": "Severe storm or high wind hazards.", "action": "Move personnel indoors immediately."}
    elif rain_prob > 70:
        assessments["exterior"] = {"status": "Medium Risk", "reason": "Wet soil risks excavation wall collapse; muddy grading.", "action": "Conduct site inspection; halt heavy grading."}
    else:
        assessments["exterior"] = {"status": "Optimal", "reason": "Ideal weather conditions for heavy machinery operations.", "action": "Proceed with scheduled excavations."}

    return assessments

def generate_weather_logs_and_alerts(db: Session, project_id: int, location: str):
    """
    Computes weather forecast, records it to the DB, and returns alerts.
    """
    forecast = get_weather_forecast(location)
    today = forecast[0]
    
    # Check if we already logged weather for today
    today_dt = datetime.strptime(today["date"], "%Y-%m-%d")
    log = db.query(WeatherLog).filter(
        WeatherLog.project_id == project_id,
        WeatherLog.date >= today_dt,
        WeatherLog.date < today_dt + timedelta(days=1)
    ).first()
    
    assessments = analyze_construction_impact(
        today["temp"], today["condition"], today["rain_prob"], today["wind_speed"], today["humidity"]
    )
    
    alerts = []
    if assessments["concrete"]["status"] == "High Risk":
        alerts.append("Concrete Pouring Delay Alert")
    if assessments["painting"]["status"] == "High Risk":
        alerts.append("Painting Delay Alert")
    if assessments["roofing"]["status"] == "High Risk":
        alerts.append("Rooftops Safety Warning")
    if assessments["exterior"]["status"] == "High Risk":
        alerts.append("Exterior Operations High Risk Warning")

    if not log:
        log = WeatherLog(
            project_id=project_id,
            date=today_dt,
            temp=today["temp"],
            condition=today["condition"],
            rain_prob=today["rain_prob"],
            alerts_triggered=alerts,
            impact_assessment=assessments
        )
        db.add(log)
        db.commit()
        db.refresh(log)
    else:
        log.temp = today["temp"]
        log.condition = today["condition"]
        log.rain_prob = today["rain_prob"]
        log.alerts_triggered = alerts
        log.impact_assessment = assessments
        db.commit()
        db.refresh(log)
        
    return log, forecast
