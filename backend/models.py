from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # Project Owner, Contractor, Site Engineer, Procurement Manager, Vendor/Supplier, Admin
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="assignee")
    notifications = relationship("Notification", back_populates="user")
    chat_histories = relationship("ChatHistory", back_populates="user")
    reports = relationship("Report", back_populates="author")
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    building_type = Column(String, nullable=True)
    address = Column(String, nullable=True)
    owner_name = Column(String, nullable=True)
    owner_email = Column(String, nullable=True)
    owner_phone = Column(String, nullable=True)
    contractor_name = Column(String, nullable=True)
    contractor_email = Column(String, nullable=True)
    contractor_phone = Column(String, nullable=True)
    site_engineer_name = Column(String, nullable=True)
    site_engineer_email = Column(String, nullable=True)
    site_engineer_phone = Column(String, nullable=True)
    budget = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    expected_completion_date = Column(DateTime, nullable=False)
    status = Column(String, default="Planning") # Planning, Active, Suspended, Completed
    progress = Column(Float, default=0.0) # Percentage 0 to 100
    code = Column(String, unique=True, index=True, nullable=True) # e.g. PRJ-2026-0001
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workspace = relationship("ProjectWorkspace", back_populates="project", uselist=False, cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="project", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="project", cascade="all, delete-orphan")
    budgets = relationship("BudgetPlan", back_populates="project", cascade="all, delete-orphan")
    weather_logs = relationship("WeatherLog", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="project", cascade="all, delete-orphan")
    site_images = relationship("SiteImage", back_populates="project", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="project", cascade="all, delete-orphan")
    bills = relationship("ProjectBill", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="To Do") # To Do, In Progress, In Review, Completed
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_details = Column(String)
    reliability_score = Column(Float, default=100.0) # 0 to 100
    risk_score = Column(Float, default=0.0) # 0 to 100
    performance_score = Column(Float, default=100.0) # 0 to 100
    rating = Column(Float, default=5.0) # 0.0 to 5.0
    quality_score = Column(Float, default=100.0) # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    materials = relationship("Material", back_populates="vendor")
    invoices = relationship("Invoice", back_populates="vendor")

class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False) # Cement, Steel, Sand, etc.
    quantity = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    current_location = Column(String, default="Vendor Facility")
    eta = Column(DateTime, nullable=True)
    status = Column(String, default="Approved") # Approved -> Ordered -> Fabrication -> Dispatch -> In Transit -> Delivered -> Installed
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="materials")
    vendor = relationship("Vendor", back_populates="materials")
    deliveries = relationship("Delivery", back_populates="material", cascade="all, delete-orphan")

class Delivery(Base):
    __tablename__ = "deliveries"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False)
    current_location = Column(String, nullable=False)
    eta = Column(DateTime, nullable=True)
    tracking_history = Column(JSON, default=list) # List of events: [{"timestamp": "...", "location": "...", "status": "..."}]
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    material = relationship("Material", back_populates="deliveries")

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    material_name = Column(String, nullable=False)
    quantity_on_hand = Column(Float, default=0.0)
    unit = Column(String, nullable=False) # bags, tons, cu meters, etc.
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="inventory")

class BudgetPlan(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    building_type = Column(String, nullable=False) # Residential, Commercial, Industrial, Infrastructure
    budget_limit = Column(Float, nullable=False)
    plan_type = Column(String, nullable=False) # Premium, Standard, Economy
    details = Column(JSON, nullable=False) # {"breakdown": {"cement": 12000, ...}, "savings": 4500, "utilization": 82.5}
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="budgets")

class WeatherLog(Base):
    __tablename__ = "weather_logs"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    temp = Column(Float, nullable=False)
    condition = Column(String, nullable=False) # Sunny, Rainy, Stormy, Wind, etc.
    rain_prob = Column(Float, default=0.0)
    alerts_triggered = Column(JSON, default=list) # ["Concrete Delay Alert"]
    impact_assessment = Column(JSON, default=dict) # {"concrete": "High Risk", "painting": "Optimal"}

    # Relationships
    project = relationship("Project", back_populates="weather_logs")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="General") # Delay, Budget, Weather, Vendor, Task, General
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    daily_summary = Column(Text)
    weekly_summary = Column(Text)
    risks_detected = Column(JSON, default=list) # ["Material delay warning", "Concrete curing delay"]
    insights = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="reports")
    author = relationship("User", back_populates="reports")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="Pending") # Pending, Approved, Paid, Rejected
    date = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="invoices")
    vendor = relationship("Vendor", back_populates="invoices")

class SiteImage(Base):
    __tablename__ = "site_images"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    description = Column(String)
    analysis_results = Column(JSON, default=dict) # {"materials_counted": {"cement_bags": 12}, "safety_violations": ["No helmet"], "progress_match": 85.0}
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="site_images")

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    prediction_type = Column(String, nullable=False) # Delay, Budget Overrun, Completion
    input_data = Column(JSON, default=dict)
    output_result = Column(JSON, default=dict) # {"delay_probability": 0.35, "expected_completion": "...", "risk_score": 75}
    probability = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="predictions")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_histories")

class Homeowner(Base):
    __tablename__ = "homeowners"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    contact_details = Column(String)

class ProjectAccess(Base):
    __tablename__ = "project_access"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    access_code = Column(String, nullable=False)

class ProjectTimeline(Base):
    __tablename__ = "project_timeline"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    activity = Column(String, nullable=False)
    materials_used = Column(JSON, default=dict) # {"Cement": "30 Bags", ...}
    expense = Column(Float, default=0.0)
    labor_wages = Column(Float, default=0.0)
    ai_summary = Column(Text)
    photos_urls = Column(JSON, default=list) # List of image paths

class SiteUpdate(Base):
    __tablename__ = "site_updates"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    raw_input = Column(Text, nullable=False)
    audio_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DailyReport(Base):
    __tablename__ = "daily_reports"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    work_completed = Column(Text)
    materials_used = Column(JSON, default=dict)
    labor_count = Column(Integer, default=0)
    expense = Column(Float, default=0.0)
    labor_wages = Column(Float, default=0.0)
    progress_update = Column(Text)
    next_activity = Column(String)
    risk_assessment = Column(Text)

class ProjectPhoto(Base):
    __tablename__ = "project_photos"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    stage_id = Column(Integer, nullable=True)
    image_url = Column(String, nullable=False)
    tags = Column(JSON, default=list)
    detected_stage = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProjectVideo(Base):
    __tablename__ = "project_videos"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    video_url = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ConstructionStage(Base):
    __tablename__ = "construction_stages"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(String, nullable=False)
    status = Column(String, default="Not Started") # Not Started, In Progress, Completed
    completion_date = Column(DateTime, nullable=True)
    evidence_urls = Column(JSON, default=list)

class OwnerNotification(Base):
    __tablename__ = "owner_notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON, default=dict) # {"expense": 40000, "materials": ...}
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProjectWorkspace(Base):
    __tablename__ = "project_workspaces"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), unique=True, nullable=False)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="workspace")

class ProjectMember(Base):
    __tablename__ = "project_members"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

class ProjectOwner(Base):
    __tablename__ = "project_owners"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class MaterialRequirement(Base):
    __tablename__ = "material_requirements"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    priority = Column(String, default="Medium")
    status = Column(String, default="Pending approval")
    requested_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class MaterialOrder(Base):
    __tablename__ = "material_orders"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    cost = Column(Float, nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    current_location = Column(String, default="Vendor Facility")
    eta = Column(DateTime, nullable=True)
    status = Column(String, default="Required")
    priority = Column(String, default="Medium")
    delivery_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project")
    vendor = relationship("Vendor")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    po_number = Column(String, nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    description = Column(String, nullable=False)
    amount = Column(Float, default=0.0)
    eta = Column(String, nullable=True)
    status = Column(String, default="Created")
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("Vendor", foreign_keys=[vendor_id])

class MaterialStatus(Base):
    __tablename__ = "material_status"
    id = Column(Integer, primary_key=True, index=True)
    material_order_id = Column(Integer, ForeignKey("material_orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

class MaterialConsumption(Base):
    __tablename__ = "material_consumption"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    material_name = Column(String, nullable=False)
    quantity_used = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    consumed_date = Column(DateTime, default=datetime.utcnow)

class SupplierAssignment(Base):
    __tablename__ = "supplier_assignments"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

class ProjectDocument(Base):
    __tablename__ = "project_documents"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String, nullable=True)
    company = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=True)
    license_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    skills = Column(String, nullable=True)
    first_time_login = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")

class ProjectBill(Base):
    __tablename__ = "project_bills"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String, nullable=False)
    amount = Column(Float, nullable=True)
    vendor_name = Column(String, nullable=True)
    bill_date = Column(DateTime, nullable=True)
    ai_analysis = Column(JSON, default=dict)
    tags = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="bills")
    uploaded_by = relationship("User")
