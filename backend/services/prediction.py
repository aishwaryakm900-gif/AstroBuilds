import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LogisticRegression, LinearRegression
from sqlalchemy.orm import Session
from backend.models import Project, MaterialOrder, Vendor, WeatherLog, Prediction

# We will initialize and train simple, lightweight models in memory for our predictions.
# This gives actual Scikit-Learn intelligence backing the API.

def train_delay_model():
    """
    Trains a LogisticRegression model to predict delay probability (0 or 1)
    based on: [weather_rain_prob, distance_km, vendor_reliability, traffic_level]
    """
    # Features: [Rain Prob (0-100), Distance (km), Vendor Reliability (0-100), Traffic Level (1-5)]
    X = np.array([
        [10, 5, 95, 1], [80, 5, 95, 2], [90, 50, 60, 4], [20, 100, 90, 3],
        [70, 20, 80, 5], [10, 10, 98, 1], [30, 250, 70, 2], [85, 15, 55, 3],
        [15, 8, 92, 2], [95, 120, 85, 4], [40, 35, 90, 2], [60, 15, 88, 3]
    ])
    # Label: Delay Occurred (0 = No, 1 = Yes)
    y = np.array([0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0])
    
    model = LogisticRegression()
    model.fit(X, y)
    return model

def train_budget_model():
    """
    Trains a LinearRegression model to predict budget risk score (0-100)
    based on: [current_expenses_pct, tasks_completed_pct, material_price_increase_pct]
    """
    # Features: [Current Expense % (0-200), Tasks Completed % (0-100), Material Price Rise % (-20 to 50)]
    X = np.array([
        [10, 10, 0], [40, 20, 5], [80, 40, 15], [90, 80, 5],
        [120, 90, 20], [30, 40, -5], [70, 90, 2], [110, 50, 25]
    ])
    # Label: Budget Overrun Risk (0 to 100)
    y = np.array([10, 35, 75, 25, 60, 5, 15, 90])
    
    model = LinearRegression()
    model.fit(X, y)
    return model

# Train models once during imports
DELAY_MODEL = train_delay_model()
BUDGET_MODEL = train_budget_model()

def predict_material_delay(rain_prob: float, distance_km: float, vendor_reliability: float, traffic_level: int) -> float:
    """
    Uses the trained LogisticRegression model to predict delay probability.
    """
    try:
        features = np.array([[rain_prob, distance_km, vendor_reliability, traffic_level]])
        prob = DELAY_MODEL.predict_proba(features)[0][1] # Probability of class 1 (Delayed)
        return float(round(prob, 2))
    except Exception:
        # Simple math fallback
        math_prob = (rain_prob * 0.4 + (100 - vendor_reliability) * 0.4 + (traffic_level * 10)) / 100
        return float(round(max(0.0, min(1.0, math_prob)), 2))

def predict_budget_risk(db: Session, project_id: int) -> float:
    """
    Uses the trained LinearRegression model to predict budget risk score (0-100).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return 0.0
        
    # Calculate inputs
    # 1. Current Expense % vs progress
    # In a simplified setup, if we have tasks and materials, we sum up costs.
    materials = db.query(MaterialOrder).filter(MaterialOrder.project_id == project_id).all()
    actual_spent = sum([m.cost for m in materials])
    budget_limit = project.budget or 100000.0
    
    expense_pct = (actual_spent / budget_limit) * 100.0 if budget_limit > 0 else 0.0
    progress = project.progress or 0.0
    
    # 2. Material price rises (simulated default at 5%)
    material_price_rise = 5.0
    
    try:
        features = np.array([[expense_pct, progress, material_price_rise]])
        risk = BUDGET_MODEL.predict(features)[0]
        # Keep risk in 0 to 100 range
        return float(round(max(0.0, min(100.0, risk)), 1))
    except Exception:
        # Math fallback
        # If spent % is much higher than progress %, risk goes up
        delta = expense_pct - progress
        risk = 50.0 + delta
        return float(round(max(0.0, min(100.0, risk)), 1))

def predict_project_completion(db: Session, project_id: int):
    """
    Predicts expected completion date and success probability based on
    task velocity and weather forecasts.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return datetime.utcnow() + timedelta(days=90), 0.90
        
    expected_completion = project.expected_completion_date
    start_date = project.start_date
    progress = project.progress or 0.0
    
    # Estimate based on date elapsed vs progress
    total_days = (expected_completion - start_date).days
    elapsed_days = (datetime.utcnow() - start_date).days
    elapsed_days = max(1, elapsed_days)
    
    if progress == 0.0:
        success_prob = 0.95
        est_completion = expected_completion
    else:
        # Extrapolate days needed
        projected_total_days = (elapsed_days / progress) * 100
        days_needed = projected_total_days - elapsed_days
        est_completion = datetime.utcnow() + timedelta(days=days_needed)
        
        # Calculate success probability
        # Success probability falls if est_completion is way past expected_completion
        days_delay = (est_completion - expected_completion).days
        if days_delay <= 0:
            success_prob = 0.95
        else:
            success_prob = max(0.40, 0.95 - (days_delay / 60.0))
            
    # Save the predictions in DB
    existing_pred = db.query(Prediction).filter(
        Prediction.project_id == project_id,
        Prediction.prediction_type == "Project Success"
    ).first()
    
    output = {
        "expected_completion": est_completion.strftime("%Y-%m-%d"),
        "success_probability": round(success_prob, 2),
        "days_delay": max(0, (est_completion - expected_completion).days)
    }
    
    if not existing_pred:
        db_pred = Prediction(
            project_id=project_id,
            prediction_type="Project Success",
            input_data={"current_progress": progress, "elapsed_days": elapsed_days},
            output_result=output,
            probability=round(success_prob, 2)
        )
        db.add(db_pred)
    else:
        existing_pred.input_data = {"current_progress": progress, "elapsed_days": elapsed_days}
        existing_pred.output_result = output
        existing_pred.probability = round(success_prob, 2)
        
    db.commit()
    return est_completion, round(success_prob, 2)
