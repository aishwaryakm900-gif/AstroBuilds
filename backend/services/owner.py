import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from backend import models

def parse_raw_site_update(db: Session, project_id: int, raw_input: str, author_id: Optional[int] = None) -> models.DailyReport:
    """
    NLP/Regex parser that automatically extracts material quantities, expenses, 
    labor counts, completed stages, and creates a structured professional DailyReport.
    Also logs the activity into ProjectTimeline.
    """
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    proj_name = proj.name if proj else "Captain Residence"

    # Save the raw input first
    db_update = models.SiteUpdate(
        project_id=project_id,
        author_id=author_id,
        raw_input=raw_input
    )
    db.add(db_update)
    db.commit()

    # --- Regular Expression NLP Extraction ---
    
    # 1. Parse Cement (e.g., "30 bags cement", "cement: 40 bags", "50 bags of cement")
    cement_match = re.search(r"(\d+)\s*(?:bags?\s*(?:of\s*)?cement|cement\s*bags?)", raw_input, re.IGNORECASE)
    cement_qty = f"{cement_match.group(1)} Bags" if cement_match else "0 Bags"
    
    # 2. Parse Steel (e.g., "500 kg steel", "steel: 200kg", "3 tons steel")
    steel_match = re.search(r"(\d+)\s*(?:kg|kgs|tons?)\s*(?:of\s*)?steel|steel\s*(\d+)", raw_input, re.IGNORECASE)
    steel_qty = ""
    if steel_match:
        val = steel_match.group(1) or steel_match.group(2)
        unit = "Kg" if "kg" in raw_input.lower() or not any(x in raw_input.lower() for x in ["ton", "tn"]) else "Tons"
        steel_qty = f"{val} {unit}"
    else:
        steel_qty = "0 Kg"

    # Assemble materials dictionary
    materials_used = {}
    if cement_match:
        materials_used["Cement"] = cement_qty
    if steel_match:
        materials_used["Steel"] = steel_qty

    # 3. Parse Expense (e.g., "Expense 40000", "₹40,000", "cost 15000", "40000 spent")
    expense_match = re.search(r"(?:expense|cost|spent|spend|amount)\s*(?:rs\.?|₹)?\s*([\d,]+)|([\d,]+)\s*(?:spent|expense)", raw_input, re.IGNORECASE)
    expense_val = 0.0
    if expense_match:
        val_str = expense_match.group(1) or expense_match.group(2)
        val_str = val_str.replace(",", "")
        expense_val = float(val_str)

    wages_match = re.search(r"(?:wages?|pay|labor\s*cost)\s*(?:rs\.?|₹)?\s*([\d,]+)|([\d,]+)\s*(?:wages?)", raw_input, re.IGNORECASE)
    wages_val = 0.0
    if wages_match:
        val_str = wages_match.group(1) or wages_match.group(2)
        val_str = val_str.replace(",", "")
        wages_val = float(val_str)

    # 4. Parse Labor (e.g., "12 workers", "15 labor", "crew of 8")
    labor_match = re.search(r"(\d+)\s*(?:workers|laborers?|labor|men|crew)", raw_input, re.IGNORECASE)
    labor_count = int(labor_match.group(1)) if labor_match else 0

    # 5. Detect Completed Activity / Stage progress
    # Check if a stage keyword like foundation, excavation, roofing, brick work was "completed" or "done"
    stages_keywords = {
        "Site Preparation": ["site preparation", "site prep", "clearing"],
        "Excavation": ["excavation", "digging", "excavated"],
        "Foundation": ["foundation", "slab", "footing"],
        "Plinth": ["plinth"],
        "Column Work": ["column", "pillars"],
        "Beam Work": ["beam"],
        "Brick Work": ["brick", "masonry", "walling"],
        "Roofing": ["roofing", "roof", "shingles"],
        "Electrical Installation": ["electrical", "wiring", "power"],
        "Plumbing Installation": ["plumbing", "pipes", "water lines"],
        "Plastering": ["plastering", "plaster"],
        "Flooring": ["flooring", "tiles", "marble"],
        "Painting": ["painting", "paint"],
        "Interior Work": ["interior", "drywall", "cabinetry"],
        "Exterior Work": ["exterior", "landscaping", "cladding"],
        "Final Inspection": ["inspection", "handover"],
        "Completion": ["completed all", "finish project"]
    }

    detected_stage = None
    work_completed = "Daily construction maintenance."
    next_activity = "Scheduled construction staging."
    
    for stage_name, keywords in stages_keywords.items():
        for kw in keywords:
            if kw in raw_input.lower():
                detected_stage = stage_name
                # Look if completed
                if any(x in raw_input.lower() for x in ["completed", "done", "finished", "poured", "ready"]):
                    work_completed = f"{stage_name} work completed successfully."
                    # Set stage in DB to Completed
                    db_stage = db.query(models.ConstructionStage).filter(
                        models.ConstructionStage.project_id == project_id,
                        models.ConstructionStage.stage_name == stage_name
                    ).first()
                    if db_stage:
                        db_stage.status = "Completed"
                        db_stage.completion_date = datetime.utcnow()
                else:
                    work_completed = f"{stage_name} work currently in progress."
                    db_stage = db.query(models.ConstructionStage).filter(
                        models.ConstructionStage.project_id == project_id,
                        models.ConstructionStage.stage_name == stage_name
                    ).first()
                    if db_stage:
                        db_stage.status = "In Progress"
                break
        if detected_stage:
            break

    if not detected_stage:
        # Fallback keyword match
        work_completed = raw_input.strip()

    # Determine next activity dynamically based on completed stages order
    stages_order = list(stages_keywords.keys())
    if detected_stage and detected_stage in stages_order:
        curr_idx = stages_order.index(detected_stage)
        if curr_idx < len(stages_order) - 1:
            next_activity = f"{stages_order[curr_idx + 1]} preparations."

    db_report = models.DailyReport(
        project_id=project_id,
        work_completed=work_completed,
        materials_used=materials_used,
        labor_count=labor_count,
        expense=expense_val,
        labor_wages=wages_val,
        progress_update=f"{detected_stage or 'General'} stage update log.",
        next_activity=next_activity,
        risk_assessment="No major risks detected based on visual site verification."
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    db_timeline = models.ProjectTimeline(
        project_id=project_id,
        activity=work_completed,
        materials_used=materials_used,
        expense=expense_val,
        labor_wages=wages_val,
        ai_summary=f"AI Summary: {work_completed} Labor deployed: {labor_count} crew. Wages paid: ₹{wages_val:,.0f}. Cost spent ₹{expense_val:,.0f}."
    )
    db.add(db_timeline)

    # Auto push project progress slightly based on completed stages
    if proj:
        # Calculate how many stages are completed
        completed_stages = db.query(models.ConstructionStage).filter(
            models.ConstructionStage.project_id == project_id,
            models.ConstructionStage.status == "Completed"
        ).count()
        new_progress = (completed_stages / len(stages_order)) * 100.0
        proj.progress = round(max(proj.progress or 0.0, new_progress), 1)

    db.commit()
    return db_report

def tag_uploaded_site_photo(db: Session, project_id: int, image_url: str, description: str) -> models.ProjectPhoto:
    """
    Automatically detects the construction stage category based on description,
    registers it under project_photos and uploads to construction stages evidence.
    """
    desc_lower = description.lower()
    
    stages_keywords = ["foundation", "roofing", "brick", "painting", "interior", "excavation", "framing"]
    detected = "General"
    for stage in stages_keywords:
        if stage in desc_lower:
            detected = stage.capitalize()
            break
            
    # Create Photo Log
    db_photo = models.ProjectPhoto(
        project_id=project_id,
        image_url=image_url,
        tags=[detected, "AI Detected"],
        detected_stage=detected
    )
    db.add(db_photo)
    
    # Associate as evidence in ConstructionStage if matches
    stage_mapping = {
        "Foundation": "Foundation",
        "Roofing": "Roofing",
        "Brick": "Brick Work",
        "Painting": "Painting",
        "Interior": "Interior Work",
        "Excavation": "Excavation"
    }
    
    mapped_stage_name = stage_mapping.get(detected)
    if mapped_stage_name:
        db_stage = db.query(models.ConstructionStage).filter(
            models.ConstructionStage.project_id == project_id,
            models.ConstructionStage.stage_name == mapped_stage_name
        ).first()
        if db_stage:
            urls = list(db_stage.evidence_urls) if db_stage.evidence_urls else []
            urls.append(image_url)
            db_stage.evidence_urls = urls
            
            # Auto transition stage status to In Progress if it was Not Started
            if db_stage.status == "Not Started":
                db_stage.status = "In Progress"
                
    db.commit()
    db.refresh(db_photo)
    return db_photo

def get_homeowner_dashboard(db: Session, project_id: int) -> Dict[str, Any]:
    """
    Aggregates budget summaries, visual stage matrices, latest site photo log feeds, 
    and recent activity timeline journals for the homeowner dashboard.
    """
    proj = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not proj:
        return {}
        
    # 1. Budget utilized calculation
    materials = db.query(models.MaterialOrder).filter(models.MaterialOrder.project_id == project_id).all()
    invoices = db.query(models.Invoice).filter(models.Invoice.project_id == project_id).all()
    reports = db.query(models.DailyReport).filter(models.DailyReport.project_id == project_id).all()
    
    # Spent sum of materials and manual reports
    spent = sum([m.cost for m in materials]) + sum([r.expense for r in reports])
    budget_limit = proj.budget or 100000.0
    remaining = max(0.0, budget_limit - spent)
    
    # 2. Current construction stage
    stages = db.query(models.ConstructionStage).filter(models.ConstructionStage.project_id == project_id).all()
    in_progress_stages = [s for s in stages if s.status == "In Progress"]
    current_stage_name = in_progress_stages[0].stage_name if in_progress_stages else "Planning"
    if not in_progress_stages:
        completed = [s for s in stages if s.status == "Completed"]
        if len(completed) == len(stages):
            current_stage_name = "Completion"
        elif completed:
            # Recommend the next stage
            stages_order = ["Site Preparation", "Excavation", "Foundation", "Plinth", "Column Work", "Beam Work", "Brick Work", "Roofing", "Electrical Installation", "Plumbing Installation", "Plastering", "Flooring", "Painting", "Interior Work", "Exterior Work", "Final Inspection", "Completion"]
            last_idx = max([stages_order.index(c.stage_name) for c in completed])
            if last_idx < len(stages_order) - 1:
                current_stage_name = stages_order[last_idx + 1]

    # 3. Latest photos
    photos = db.query(models.ProjectPhoto).filter(models.ProjectPhoto.project_id == project_id).order_by(models.ProjectPhoto.created_at.desc()).limit(4).all()
    photo_urls = [p.image_url for p in photos]
    if not photo_urls:
        photo_urls = ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400"]

    # 4. Recent activities (Timeline feed)
    timeline = db.query(models.ProjectTimeline).filter(models.ProjectTimeline.project_id == project_id).order_by(models.ProjectTimeline.date.desc()).limit(5).all()
    activities_feed = []
    for item in timeline:
        activities_feed.append({
            "date": item.date.strftime("%Y-%m-%d"),
            "activity": item.activity,
            "ai_summary": item.ai_summary,
            "expense": item.expense,
            "labor_wages": item.labor_wages or 0.0,
            "materials": item.materials_used
        })

    # 5. Upcoming tasks
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id, models.Task.status != "Completed").order_by(models.Task.due_date.asc()).limit(3).all()
    upcoming_tasks = []
    for t in tasks:
        upcoming_tasks.append({
            "title": t.title,
            "due_date": t.due_date.strftime("%Y-%m-%d"),
            "status": t.status
        })

    # 6. Delay Alerts & recommendations
    delay_alerts = []
    ai_recommendations = []
    
    # Dynamic calculations
    weather_logs = db.query(models.WeatherLog).filter(models.WeatherLog.project_id == project_id).first()
    rain_prob = weather_logs.rain_prob if weather_logs else 10.0
    
    if rain_prob > 60:
        delay_alerts.append(f"Weather warning: Curing/painting work slowed down due to rain risk ({rain_prob}%).")
        ai_recommendations.append("AI advises halting exterior brick cladding and concrete pouring until skies clear.")
    
    if spent > budget_limit * 0.90:
        delay_alerts.append("Milestone budget limit exceeded 90%. Overrun warnings triggered.")
        ai_recommendations.append("Economy procurement configurations suggested for pending utility wiring packages.")
        
    if not delay_alerts:
        delay_alerts.append("No active delay threats. Construction is proceeding on timeline pace.")
        ai_recommendations.append("Continue daily progress monitoring. Stage framing is on schedule.")

    return {
        "project_name": proj.name,
        "project_id": proj.code or f"PRJ-2026-{proj.id:04d}",
        "overall_progress": proj.progress or 0.0,
        "current_stage": current_stage_name,
        "budget_utilized": round(spent, 2),
        "remaining_budget": round(remaining, 2),
        "latest_photos": photo_urls,
        "recent_activities": activities_feed,
        "upcoming_tasks": upcoming_tasks,
        "expected_completion_date": proj.expected_completion_date.strftime("%Y-%m-%d"),
        "delay_alerts": delay_alerts,
        "ai_recommendations": ai_recommendations,
        "contractor_name": proj.contractor_name,
        "contractor_email": proj.contractor_email,
        "contractor_phone": proj.contractor_phone,
        "site_engineer_name": proj.site_engineer_name,
        "site_engineer_email": proj.site_engineer_email,
        "site_engineer_phone": proj.site_engineer_phone
    }
