from sqlalchemy.orm import Session
from datetime import datetime
from backend.models import Project, Task, User, ConstructionStage, ProjectWorkspace, ProjectAccess
from backend.schemas import ProjectCreate, TaskCreate

def generate_project_code(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"PRJ-{year}-"
    count = db.query(Project).filter(Project.code.like(f"{prefix}%")).count()
    next_num = count + 1
    return f"{prefix}{next_num:04d}"

def get_projects(db: Session, current_user: User):
    if current_user.role == "Project Owner":
        # Filter projects that this homeowner has access code for or owns
        accessed_project_ids = db.query(ProjectAccess.project_id).filter(ProjectAccess.user_id == current_user.id).all()
        accessed_ids = [r[0] for r in accessed_project_ids]
        return db.query(Project).filter(
            (Project.id.in_(accessed_ids)) | (Project.owner_email == current_user.email)
        ).all()
    return db.query(Project).all()

def get_project_by_id(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()

def user_has_project_access(db: Session, user: User, project_id: int) -> bool:
    if user.role != "Project Owner":
        return True
    proj = get_project_by_id(db, project_id)
    if not proj:
        return False
    if proj.owner_email == user.email:
        return True
    access = db.query(ProjectAccess).filter(
        ProjectAccess.project_id == project_id,
        ProjectAccess.user_id == user.id
    ).first()
    return access is not None

def create_project(db: Session, project: ProjectCreate):
    # 1. Generate unique project code
    proj_code = generate_project_code(db)
    
    # 2. Create the project
    db_project = Project(
        name=project.name,
        location=project.location,
        building_type=project.building_type,
        address=project.address,
        owner_name=project.owner_name,
        owner_email=project.owner_email,
        owner_phone=project.owner_phone,
        contractor_name=project.contractor_name,
        contractor_email=project.contractor_email,
        contractor_phone=project.contractor_phone,
        site_engineer_name=project.site_engineer_name,
        site_engineer_email=project.site_engineer_email,
        site_engineer_phone=project.site_engineer_phone,
        budget=project.budget,
        start_date=project.start_date,
        expected_completion_date=project.expected_completion_date,
        status=project.status or "Planning",
        progress=project.progress or 0.0,
        code=proj_code
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # 3. Auto-generate 17 Construction Stages
    stages_order = [
        "Site Preparation", "Excavation", "Foundation", "Plinth", "Column Work", 
        "Beam Work", "Brick Work", "Roofing", "Electrical Installation", 
        "Plumbing Installation", "Plastering", "Flooring", "Painting", 
        "Interior Work", "Exterior Work", "Final Inspection", "Completion"
    ]
    for stage_name in stages_order:
        db_stage = ConstructionStage(
            project_id=db_project.id,
            stage_name=stage_name,
            status="Not Started",
            completion_date=None,
            evidence_urls=[]
        )
        db.add(db_stage)

    # 4. Create ProjectWorkspace settings record
    db_workspace = ProjectWorkspace(
        project_id=db_project.id,
        settings={"active_modules": stages_order}
    )
    db.add(db_workspace)
    
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project_progress(db: Session, project_id: int):
    project = get_project_by_id(db, project_id)
    if not project:
        return None
    
    # Calculate progress based on tasks
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    if not tasks:
        return project
        
    completed_tasks = [t for t in tasks if t.status == "Completed"]
    progress = (len(completed_tasks) / len(tasks)) * 100
    project.progress = round(progress, 1)
    
    if progress == 100.0:
        project.status = "Completed"
    elif project.status == "Planning" and len(tasks) > 0:
        project.status = "Active"
        
    db.commit()
    db.refresh(project)
    return project

def get_tasks_by_project(db: Session, project_id: int):
    return db.query(Task).filter(Task.project_id == project_id).all()

def create_task(db: Session, task: TaskCreate, project_id: int):
    # Fetch project to validate due date boundaries
    proj = get_project_by_id(db, project_id)
    if proj:
        task_due_naive = task.due_date.replace(tzinfo=None)
        proj_start_naive = proj.start_date.replace(tzinfo=None)
        proj_end_naive = proj.expected_completion_date.replace(tzinfo=None)
        
        from fastapi import HTTPException
        if task_due_naive < proj_start_naive:
            raise HTTPException(
                status_code=400, 
                detail=f"Task due date cannot be before project start date ({proj.start_date.strftime('%Y-%m-%d')})"
            )
        if task_due_naive > proj_end_naive:
            raise HTTPException(
                status_code=400, 
                detail=f"Task due date cannot be after project expected completion date ({proj.expected_completion_date.strftime('%Y-%m-%d')})"
            )

    db_task = Task(
        project_id=project_id,
        title=task.title,
        description=task.description,
        status=task.status,
        due_date=task.due_date,
        assigned_to_id=task.assigned_to_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    update_project_progress(db, project_id)
    return db_task

def update_task_status(db: Session, task_id: int, status: str):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        return None
    db_task.status = status
    db.commit()
    db.refresh(db_task)
    
    update_project_progress(db, db_task.project_id)
    return db_task
