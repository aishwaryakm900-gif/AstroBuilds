from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import shutil
import os

from backend.database import get_db, engine, Base
from backend import models, schemas
from backend.services import auth, project, material, vendor, weather, prediction, vision, notification, ai, owner, procurement
from backend.database import get_db, engine, Base, run_migrations

# Initialize DB tables (SQLite auto-creation)
Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="AstroBuilds AI Backend", version="1.0.0")

# Setup CORS for frontend communication (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all. In production, target localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTICATION ---

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_pwd,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Automatically create user profile
    profile = models.UserProfile(user_id=new_user.id, first_time_login=True)
    db.add(profile)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(user_creds: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_creds.email).first()
    if not db_user or not auth.verify_password(user_creds.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Ensure profile exists
    if not db_user.profile:
        profile = models.UserProfile(user_id=db_user.id, first_time_login=True)
        db.add(profile)
        db.commit()
        db.refresh(db_user)
        
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": db_user}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_current_user_profile(user: models.User = Depends(auth.get_current_user)):
    return user

# --- PROJECTS & TASKS ---

@app.get("/api/projects", response_model=List[schemas.ProjectResponse])
def get_all_projects(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return project.get_projects(db, current_user)

@app.post("/api/projects", response_model=schemas.ProjectResponse)
def create_new_project(proj: schemas.ProjectCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return project.create_project(db, proj)

@app.get("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_project_details(project_id: int, db: Session = Depends(get_db)):
    proj = project.get_project_by_id(db, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@app.put("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project_status_details(project_id: int, proj_update: schemas.ProjectUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_proj = project.get_project_by_id(db, project_id)
    if not db_proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update fields
    for field, value in proj_update.model_dump(exclude_unset=True).items():
        setattr(db_proj, field, value)
    
    # If the user completed it, force progress to 100
    if proj_update.status == "Completed":
        db_proj.status = "Completed"
        db_proj.progress = 100.0
        
    db.commit()
    db.refresh(db_proj)
    return db_proj


@app.get("/api/projects/{project_id}/tasks", response_model=List[schemas.TaskResponse])
def get_project_tasks(project_id: int, db: Session = Depends(get_db)):
    return project.get_tasks_by_project(db, project_id)

@app.post("/api/projects/{project_id}/tasks", response_model=schemas.TaskResponse)
def create_project_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db)):
    pass # removed frozen check
    return project.create_task(db, task, project_id)

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task_progress(task_id: int, status_update: Dict[str, str], db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        pass # removed frozen check
    status = status_update.get("status", "To Do")
    db_task = project.update_task_status(db, task_id, status)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

# --- MATERIALS & SUPPLY CHAIN ---

@app.get("/api/materials", response_model=List[schemas.MaterialOrderResponse])
def get_all_materials(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    return material.get_materials(db, project_id)

@app.post("/api/projects/{project_id}/materials", response_model=schemas.MaterialOrderResponse)
def order_new_material(project_id: int, mat: schemas.MaterialOrderCreate, db: Session = Depends(get_db)):
    pass # removed frozen check
    return material.create_material(db, mat, project_id)

@app.put("/api/materials/{material_id}", response_model=schemas.MaterialOrderResponse)
def update_material_order(
    material_id: int,
    body: schemas.MaterialOrderUpdate,
    db: Session = Depends(get_db),
):
    db_mat = db.query(models.MaterialOrder).filter(models.MaterialOrder.id == material_id).first()
    if not db_mat:
        raise HTTPException(status_code=404, detail="Material not found")
    pass # removed frozen check

    db_mat = material.update_material(db, material_id, body)
    if not db_mat:
        raise HTTPException(status_code=404, detail="Material not found")

    if body.status in ["In Transit", "Transit"]:
        notification.notify_all_stakeholders(
            db,
            "Material In Transit Alert",
            f"{db_mat.name} has been dispatched. ETA is {db_mat.eta.strftime('%Y-%m-%d') if db_mat.eta else 'N/A'}.",
            category="Delay",
        )
    elif body.status == "Delivered":
        notification.notify_all_stakeholders(
            db,
            "Material Delivered Alert",
            f"{db_mat.name} ({db_mat.quantity} units) has arrived at the construction site warehouse.",
            category="General",
        )

    return db_mat

# --- PURCHASE REQUESTS ---

@app.get("/api/purchase-requests", response_model=List[schemas.MaterialRequirementResponse])
def get_purchase_requests(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    return procurement.get_purchase_requests(db, project_id)

@app.post("/api/projects/{project_id}/purchase-requests", response_model=schemas.MaterialRequirementResponse)
def create_purchase_request(
    project_id: int,
    req: schemas.MaterialRequirementCreate,
    db: Session = Depends(get_db),
):
    pass # removed frozen check
    return procurement.create_purchase_request(db, req, project_id)

@app.put("/api/purchase-requests/{request_id}", response_model=schemas.MaterialRequirementResponse)
def update_purchase_request(
    request_id: int,
    body: schemas.MaterialRequirementUpdate,
    db: Session = Depends(get_db),
):
    db_req = db.query(models.MaterialRequirement).filter(models.MaterialRequirement.id == request_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    pass # removed frozen check
    updated = procurement.update_purchase_request(db, request_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return updated

# --- PURCHASE ORDERS ---

@app.get("/api/purchase-orders", response_model=List[schemas.PurchaseOrderResponse])
def get_purchase_orders(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    return procurement.get_purchase_orders(db, project_id)

@app.post("/api/projects/{project_id}/purchase-orders", response_model=schemas.PurchaseOrderResponse)
def create_purchase_order(
    project_id: int,
    order: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
):
    pass # removed frozen check
    return procurement.create_purchase_order(db, order, project_id)

@app.put("/api/purchase-orders/{order_id}", response_model=schemas.PurchaseOrderResponse)
def update_purchase_order(
    order_id: int,
    body: schemas.PurchaseOrderUpdate,
    db: Session = Depends(get_db),
):
    db_order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    pass # removed frozen check
    updated = procurement.update_purchase_order(db, order_id, body)
    if not updated:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return updated

@app.get("/api/projects/{project_id}/inventory", response_model=List[schemas.InventoryResponse])
def get_project_inventory(project_id: int, db: Session = Depends(get_db)):
    return material.get_inventory(db, project_id)

# --- DOCUMENTS & CONSUMPTION ---

@app.get("/api/projects/{project_id}/documents", response_model=List[schemas.ProjectDocumentResponse])
def get_project_documents(project_id: int, db: Session = Depends(get_db)):
    return material.get_documents(db, project_id)

@app.post("/api/projects/{project_id}/documents", response_model=schemas.ProjectDocumentResponse)
def add_project_document(project_id: int, doc: schemas.ProjectDocumentCreate, db: Session = Depends(get_db)):
    return material.create_document(db, doc, project_id)

@app.get("/api/projects/{project_id}/consumption", response_model=List[schemas.MaterialConsumptionResponse])
def get_project_consumption(project_id: int, db: Session = Depends(get_db)):
    return material.get_consumption(db, project_id)

@app.post("/api/projects/{project_id}/consumption", response_model=schemas.MaterialConsumptionResponse)
def record_project_consumption(project_id: int, cons: schemas.MaterialConsumptionCreate, db: Session = Depends(get_db)):
    return material.create_consumption(db, cons, project_id)

# --- VENDORS ---

@app.get("/api/vendors", response_model=List[schemas.VendorResponse])
def get_all_vendors(db: Session = Depends(get_db)):
    return vendor.get_vendors(db)

@app.post("/api/vendors", response_model=schemas.VendorResponse)
def create_new_vendor(vnd: schemas.VendorCreate, db: Session = Depends(get_db)):
    return vendor.create_vendor(db, name=vnd.name, contact_details=vnd.contact_details)

@app.put("/api/vendors/{vendor_id}", response_model=schemas.VendorResponse)
def update_vendor(vendor_id: int, body: schemas.VendorUpdate, db: Session = Depends(get_db)):
    updated = vendor.update_vendor(
        db,
        vendor_id,
        name=body.name,
        contact_details=body.contact_details,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return updated

# --- BUDGET & PLANS ---

@app.post("/api/projects/{project_id}/budget/optimize", response_model=schemas.BudgetPlanResponse)
def optimize_project_budget(project_id: int, body: schemas.BudgetPlanCreate, db: Session = Depends(get_db)):
    proj = project.get_project_by_id(db, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Generate the tier options via AI
    plans = ai.generate_budget_plans(body.budget_limit, proj.location, body.building_type)
    
    # Store standard plan as initial in budgets database
    standard_details = plans["plans"]["Standard"]
    db_budget = models.BudgetPlan(
        project_id=project_id,
        building_type=body.building_type,
        budget_limit=body.budget_limit,
        plan_type="Standard",
        details=plans
    )
    # Check if budget plan already exists
    existing = db.query(models.BudgetPlan).filter(models.BudgetPlan.project_id == project_id).first()
    if existing:
        existing.building_type = body.building_type
        existing.budget_limit = body.budget_limit
        existing.details = plans
        db_budget = existing
    else:
        db.add(db_budget)
        
    db.commit()
    db.refresh(db_budget)
    return db_budget

@app.get("/api/projects/{project_id}/budget", response_model=Optional[schemas.BudgetPlanResponse])
def get_project_budget(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.BudgetPlan).filter(models.BudgetPlan.project_id == project_id).first()

# --- MARKET PRICE TRENDS ---

@app.get("/api/market/trends")
def get_market_price_trends(material: str):
    return ai.forecast_material_prices(material)

# --- WEATHER INTELLIGENCE ---

@app.get("/api/projects/{project_id}/weather")
def get_project_weather_intelligence(project_id: int, db: Session = Depends(get_db)):
    proj = project.get_project_by_id(db, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    log, forecast = weather.generate_weather_logs_and_alerts(db, project_id, proj.location)
    
    # Send notifications for weather issues
    if log.alerts_triggered:
        for alert in log.alerts_triggered:
            notification.notify_all_stakeholders(
                db,
                "Weather Alert Triggered",
                f"{alert}: Weather conditions at {proj.name} ({proj.location}) present hazards. Recommended actions: {log.impact_assessment}",
                category="Weather"
            )
            
    return {
        "log": log,
        "forecast": forecast
    }

# --- PREDICTIONS MODULE ---

@app.get("/api/projects/{project_id}/predictions")
def get_project_predictive_metrics(project_id: int, db: Session = Depends(get_db)):
    proj = project.get_project_by_id(db, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Delay prediction calculations
    # Fetch today's weather rain prob
    weather_info = db.query(models.WeatherLog).filter(models.WeatherLog.project_id == project_id).first()
    rain_prob = weather_info.rain_prob if weather_info else 15.0
    
    # Run predictions
    delay_prob = prediction.predict_material_delay(
        rain_prob=rain_prob,
        distance_km=150.0,
        vendor_reliability=90.0,
        traffic_level=2
    )
    
    budget_risk = prediction.predict_budget_risk(db, project_id)
    est_completion, success_prob = prediction.predict_project_completion(db, project_id)
    
    # Generate overall system recommendations
    recommendations = []
    if delay_prob > 0.5:
        recommendations.append("High delay probability for materials in transit. Contact Ironclad Steel to reroute logistics.")
    if budget_risk > 60:
        recommendations.append("Budget Risk exceeds 60%. Economy plan adjustments recommended for pending plumbing contracts.")
    if success_prob < 0.8:
        recommendations.append("Project completion success probability is declining. Double manpower shifts on framing milestones.")
    if not recommendations:
        recommendations.append("Timeline, budget, and supply chain schedules are running at optimal metrics. Continue standard pacing.")

    return {
        "delay_probability": delay_prob,
        "budget_risk_score": budget_risk,
        "expected_completion": est_completion.strftime("%Y-%m-%d"),
        "success_probability": success_prob,
        "recommendations": recommendations
    }

@app.get("/api/procurement/overview")
def get_procurement_overview(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    proj = project.get_project_by_id(db, project_id) if project_id is not None else db.query(models.Project).first()
    if not proj:
        return {
            "project_name": "No active project",
            "pending_requests": 0,
            "active_purchase_orders": 0,
            "delayed_deliveries": 0,
            "vendor_performance": 0,
            "spend": 0,
            "invoice_verified": 0,
            "invoice_total": 0,
            "risk_score": 0,
            "confidence": 100,
            "recommendations": ["Create a project and add procurement data to unlock AI insights."],
            "workflow": [
                {"name": "Requisition Submitted", "status": "Complete"},
                {"name": "Vendor Review", "status": "Pending"},
                {"name": "PO Issued", "status": "Pending"},
                {"name": "Invoice Verified", "status": "Pending"}
            ]
        }

    materials = db.query(models.Material).filter(models.Material.project_id == proj.id).all()
    vendors = db.query(models.Vendor).all()
    invoices = db.query(models.Invoice).filter(models.Invoice.project_id == proj.id).all()

    pending_requests = sum(1 for item in materials if item.status in {"Approved", "Ordered", "Fabrication"})
    active_purchase_orders = sum(1 for item in materials if item.status in {"Ordered", "Fabrication", "Dispatch", "In Transit"})
    delayed_deliveries = sum(1 for item in materials if item.status in {"Dispatch", "In Transit"} and item.eta and item.eta < datetime.utcnow())
    spend = round(sum(item.cost for item in materials), 2)
    spend_ratio = round((spend / proj.budget) * 100, 1) if proj.budget and proj.budget > 0 else 0.0
    invoice_verified = sum(1 for invoice in invoices if invoice.status == "Approved")
    invoice_total = len(invoices)
    vendor_performance = round(sum(v.performance_score for v in vendors) / len(vendors), 1) if vendors else 0.0
    risk_score = min(100, round(max(15, 25 + delayed_deliveries * 8 + max(0.0, spend_ratio - 50.0) / 2), 1))
    confidence = max(50, min(98, round(100 - risk_score * 0.6, 1)))

    recommendations = []
    if delayed_deliveries:
        recommendations.append(f"{delayed_deliveries} delivery(s) are at risk and need immediate attention.")
    if vendor_performance < 85:
        recommendations.append("Consider prioritizing higher-reliability vendors for high-value materials.")
    if spend_ratio > 80:
        recommendations.append("Spend is above the planned budget; review remaining commitments.")
    if not recommendations:
        recommendations.append("Procurement outlook is stable; maintain the current supplier cadence.")

    return {
        "project_name": proj.name,
        "pending_requests": pending_requests,
        "active_purchase_orders": active_purchase_orders,
        "delayed_deliveries": delayed_deliveries,
        "vendor_performance": vendor_performance,
        "spend": spend,
        "invoice_verified": invoice_verified,
        "invoice_total": invoice_total,
        "risk_score": risk_score,
        "confidence": confidence,
        "recommendations": recommendations,
        "workflow": [
            {"name": "Requisition Submitted", "status": "Complete"},
            {"name": "Vendor Review", "status": "In Progress"},
            {"name": "Purchase Order Issued", "status": "In Progress"},
            {"name": "Invoice Verified", "status": "Pending"}
        ]
    }

# --- AI CONSTRUCTION CHAT ASSISTANT ---

@app.post("/api/assistant/chat", response_model=schemas.ChatResponse)
def chat_with_construction_brain(msg: schemas.ChatMessage, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    response = ai.query_ai_assistant(db, msg.message)
    
    # Save chat history
    db_chat = models.ChatHistory(
        user_id=user.id,
        message=msg.message,
        response=response
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@app.get("/api/assistant/history", response_model=List[schemas.ChatResponse])
def get_user_chat_history(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user.id).order_by(models.ChatHistory.created_at.asc()).all()

# --- SITE REPORTS ---

@app.get("/api/projects/{project_id}/reports", response_model=List[schemas.ReportResponse])
def get_project_reports(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.Report).filter(models.Report.project_id == project_id).order_by(models.Report.date.desc()).all()

@app.post("/api/projects/{project_id}/reports", response_model=schemas.ReportResponse)
def upload_daily_report(project_id: int, rpt: schemas.ReportCreate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    pass # removed frozen check
    db_rpt = models.Report(
        project_id=project_id,
        author_id=user.id,
        daily_summary=rpt.daily_summary,
        weekly_summary=rpt.weekly_summary,
        risks_detected=rpt.risks_detected,
        insights=rpt.insights
    )
    db.add(db_rpt)
    
    # Trigger notifications if risks are detected in report
    if rpt.risks_detected:
        notification.notify_all_stakeholders(
            db,
            "Site Risk Logged",
            f"Daily report flags risks: {', '.join(rpt.risks_detected)}",
            category="Delay"
        )
        
    db.commit()
    db.refresh(db_rpt)
    return db_rpt

# --- NOTIFICATIONS CENTRAL ---

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_notifications(unread_only: bool = False, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return notification.get_user_notifications(db, user.id, unread_only)

@app.put("/api/notifications/{notification_id}/read")
def read_notification(notification_id: int, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    success = notification.mark_notification_as_read(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success"}

# --- COMPUTER VISION ---

@app.get("/api/projects/{project_id}/images", response_model=List[schemas.SiteImageResponse])
def get_project_site_images(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.SiteImage).filter(models.SiteImage.project_id == project_id).order_by(models.SiteImage.created_at.desc()).all()

@app.post("/api/projects/{project_id}/images", response_model=schemas.SiteImageResponse)
def upload_site_image_for_cv(project_id: int, description: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    pass # removed frozen check
    # Save the file locally in mock path
    upload_dir = os.path.join("frontend", "public", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Store filename based on time
    filename = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Run the CV analyser on file metadata
    web_url = f"/uploads/{filename}"
    db_img = vision.analyze_site_image(db, project_id, web_url, description)
    
    # Notify if safety violations were detected
    violations = db_img.analysis_results.get("safety_violations", [])
    if violations:
        notification.notify_all_stakeholders(
            db,
            "Safety Compliance Alert",
            f"AI detected visual violations: {', '.join(violations)}",
            category="Weather" # Safety categorised under safety/weather priority
        )
        
    return db_img

# --- HOMEOWNER TRANSPARENCY ENDPOINTS ---

@app.post("/api/homeowner/join", response_model=schemas.ProjectResponse)
def join_project_by_id(req: schemas.ProjectJoinRequest, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.code == req.project_code).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project ID not found. Verify format e.g. PRJ-2026-0001")
    
    # Check if access already exists
    existing = db.query(models.ProjectAccess).filter(
        models.ProjectAccess.project_id == proj.id,
        models.ProjectAccess.user_id == user.id
    ).first()
    if not existing:
        access = models.ProjectAccess(
            project_id=proj.id,
            user_id=user.id,
            access_code=req.project_code
        )
        db.add(access)
        db.commit()
    return proj

@app.post("/api/projects/{project_id}/updates", response_model=schemas.DailyReportResponse)
def upload_daily_update_nlp(project_id: int, body: schemas.DailyUpdateUpload, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    pass # removed frozen check
    # Triggers raw input NLP extraction
    report = owner.parse_raw_site_update(db, project_id, body.raw_input, author_id=user.id)
    
    # Send a notification to homeowner
    # Find homeowner joined to this project
    accesses = db.query(models.ProjectAccess).filter(models.ProjectAccess.project_id == project_id).all()
    for access in accesses:
        owner_notif = models.OwnerNotification(
            user_id=access.user_id,
            title="Milestone Update Triggered",
            message=f"Work update logged: {report.work_completed}",
            details={
                "expense": report.expense,
                "materials": report.materials_used,
                "labor": report.labor_count,
                "progress_update": report.progress_update or ""
            }
        )
        db.add(owner_notif)
    db.commit()
    return report

@app.get("/api/projects/{project_id}/stages", response_model=List[schemas.ConstructionStageResponse])
def get_construction_stages(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.ConstructionStage).filter(models.ConstructionStage.project_id == project_id).all()

@app.put("/api/projects/{project_id}/stages/{stage_id}", response_model=schemas.ConstructionStageResponse)
def update_stage_status(project_id: int, stage_id: int, body: schemas.ConstructionStageUpdate, db: Session = Depends(get_db)):
    proj = project.get_project_by_id(db, project_id)
    # allow updates if they made a mistake
    db_stage = db.query(models.ConstructionStage).filter(
        models.ConstructionStage.project_id == project_id,
        models.ConstructionStage.id == stage_id
    ).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Stage not found")
        
    db_stage.status = body.status
    if body.completion_date:
        db_stage.completion_date = body.completion_date
    if body.evidence_url:
        evidence = list(db_stage.evidence_urls) if db_stage.evidence_urls else []
        evidence.append(body.evidence_url)
        db_stage.evidence_urls = evidence
        
    db.commit()
    db.refresh(db_stage)
    return db_stage

@app.get("/api/projects/{project_id}/timeline", response_model=List[schemas.ProjectTimelineResponse])
def get_project_timeline_logs(project_id: int, db: Session = Depends(get_db)):
    return db.query(models.ProjectTimeline).filter(models.ProjectTimeline.project_id == project_id).order_by(models.ProjectTimeline.date.desc()).all()

@app.get("/api/projects/{project_id}/owner-dashboard")
def get_owner_dashboard_summary(project_id: int, db: Session = Depends(get_db)):
    return owner.get_homeowner_dashboard(db, project_id)

@app.get("/api/projects/{project_id}/reports/monthly")
def get_monthly_ai_rollup(project_id: int, db: Session = Depends(get_db)):
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    reports = db.query(models.DailyReport).filter(models.DailyReport.project_id == project_id).all()
    materials = db.query(models.Material).filter(models.Material.project_id == project_id).all()
    
    total_spent = sum([r.expense for r in reports]) + sum([m.cost for m in materials])
    
    # Calculate cement and steel sums
    cement_total = 0.0
    steel_total = 0.0
    for r in reports:
        if r.materials_used:
            cem_str = r.materials_used.get("Cement", "0 Bags")
            st_str = r.materials_used.get("Steel", "0 Kg")
            try:
                cement_total += float(cem_str.split(" ")[0])
            except Exception:
                pass
            try:
                steel_total += float(st_str.split(" ")[0])
            except Exception:
                pass
                
    return {
        "project_name": proj.name,
        "progress_percentage": proj.progress,
        "total_cost": total_spent,
        "material_summary": {
            "cement_bags": cement_total,
            "steel_kg": steel_total
        },
        "stage_completion_ratio": f"{db.query(models.ConstructionStage).filter(models.ConstructionStage.project_id == project_id, models.ConstructionStage.status == 'Completed').count()} / 17 Stages",
        "predicted_completion_date": proj.expected_completion_date.strftime("%Y-%m-%d"),
        "budget_forecast": f"On track with ₹{proj.budget - total_spent:,.0f} margin remaining."
    }

@app.post("/api/projects/{project_id}/images/cv-tag", response_model=schemas.SiteImageResponse)
def upload_and_tag_cv_photo(project_id: int, description: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    pass # removed frozen check
    upload_dir = os.path.join("frontend", "public", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    web_url = f"/uploads/{filename}"
    photo = owner.tag_uploaded_site_photo(db, project_id, web_url, description)
    
    # Register as site image
    db_img = models.SiteImage(
        project_id=project_id,
        image_url=web_url,
        description=description,
        analysis_results={
            "materials_counted": {"detected_stage_evidence": photo.detected_stage},
            "safety_violations": ["No safety violations detected"],
            "progress_match": 95.0
        }
    )
    db.add(db_img)
    db.commit()
    db.refresh(db_img)
    return db_img

# --- USER PROFILE ROUTES ---

@app.get("/api/auth/profile", response_model=schemas.UserProfileResponse)
def get_user_profile(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if not current_user.profile:
        profile = models.UserProfile(user_id=current_user.id, first_time_login=True)
        db.add(profile)
        db.commit()
        db.refresh(current_user)
    return current_user.profile

@app.put("/api/auth/profile", response_model=schemas.UserProfileResponse)
def update_user_profile(
    profile_data: schemas.UserProfileBase,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.profile:
        profile = models.UserProfile(user_id=current_user.id)
        db.add(profile)
    else:
        profile = current_user.profile
    
    # Update fields
    for field, value in profile_data.model_dump(exclude_unset=True).items():
        if field != "first_time_login":
            setattr(profile, field, value)
    
    profile.first_time_login = False
        
    db.commit()
    db.refresh(profile)
    return profile

# --- PROJECT BILLS ROUTES ---

@app.get("/api/projects/{project_id}/bills", response_model=List[schemas.ProjectBillResponse])
def get_project_bills(
    project_id: int,
    q: Optional[str] = None,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not project.user_has_project_access(db, user, project_id):
        raise HTTPException(status_code=403, detail="You do not have access to this project")
    query = db.query(models.ProjectBill).filter(models.ProjectBill.project_id == project_id)
    if q:
        search_filter = f"%{q}%"
        query = query.filter(
            (models.ProjectBill.vendor_name.like(search_filter)) |
            (models.ProjectBill.tags.like(search_filter))
        )
    return query.order_by(models.ProjectBill.bill_date.desc()).all()

@app.post("/api/projects/{project_id}/bills", response_model=schemas.ProjectBillResponse)
def upload_project_bill(
    project_id: int,
    file: UploadFile = File(...),
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if user.role == "Project Owner":
        raise HTTPException(status_code=403, detail="Project owners can view bills but cannot upload them")
    if not project.user_has_project_access(db, user, project_id):
        raise HTTPException(status_code=403, detail="You do not have access to this project")
    pass # removed frozen check
    upload_dir = os.path.join("frontend", "public", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{int(datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    web_url = f"/uploads/{filename}"
    db_bill = vision.analyze_bill_photo(db, project_id, user.id, web_url, file.filename)
    return db_bill

@app.put("/api/projects/{project_id}/bills/{bill_id}", response_model=schemas.ProjectBillResponse)
def update_project_bill(
    project_id: int,
    bill_id: int,
    bill_update: schemas.ProjectBillUpdate,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not project.user_has_project_access(db, user, project_id):
        raise HTTPException(status_code=403, detail="You do not have access to this project")
    
    db_bill = db.query(models.ProjectBill).filter(
        models.ProjectBill.id == bill_id,
        models.ProjectBill.project_id == project_id
    ).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    for field, value in bill_update.model_dump(exclude_unset=True).items():
        setattr(db_bill, field, value)
        
    db.commit()
    db.refresh(db_bill)
    return db_bill
