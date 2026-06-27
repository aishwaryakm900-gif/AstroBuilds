from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator
from typing import List, Optional, Any, Dict
from datetime import datetime
import re

PHONE_PATTERN = re.compile(r'^\+?(\d[\s\-()]*){10,20}$')

def validate_phone_number(v: Optional[str]) -> Optional[str]:
    if v is None or v == "":
        return v
    if not PHONE_PATTERN.match(v):
        raise ValueError("Phone number must contain between 10 and 20 digits, and may only include digits, +, spaces, dashes, or parentheses.")
    return v

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileBase(BaseModel):
    phone: Optional[str] = None
    company: Optional[str] = None
    experience_years: Optional[int] = None
    license_number: Optional[str] = None
    address: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    first_time_login: Optional[bool] = True

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_phone_number(v)

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return v


class UserResponse(UserBase):
    id: int
    created_at: datetime
    profile: Optional[UserProfileResponse] = None
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# --- PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    name: str
    location: str
    building_type: Optional[str] = None
    address: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    contractor_name: Optional[str] = None
    contractor_email: Optional[str] = None
    contractor_phone: Optional[str] = None
    site_engineer_name: Optional[str] = None
    site_engineer_email: Optional[str] = None
    site_engineer_phone: Optional[str] = None
    budget: float
    start_date: datetime
    expected_completion_date: datetime
    status: Optional[str] = "Planning"
    progress: Optional[float] = 0.0

    @field_validator("owner_phone")
    @classmethod
    def check_owner_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_phone_number(v)

    @model_validator(mode='after')
    def validate_project_dates(self) -> 'ProjectBase':
        if self.expected_completion_date <= self.start_date:
            raise ValueError("Expected completion date must be strictly after the start date.")
        return self

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    building_type: Optional[str] = None
    address: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    contractor_name: Optional[str] = None
    contractor_email: Optional[str] = None
    contractor_phone: Optional[str] = None
    site_engineer_name: Optional[str] = None
    site_engineer_email: Optional[str] = None
    site_engineer_phone: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[datetime] = None
    expected_completion_date: Optional[datetime] = None
    status: Optional[str] = None
    progress: Optional[float] = None


class ProjectResponse(ProjectBase):
    id: int
    code: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @field_validator("owner_phone")
    @classmethod
    def check_owner_phone(cls, v: Optional[str]) -> Optional[str]:
        return v

    @model_validator(mode='after')
    def validate_project_dates(self) -> 'ProjectResponse':
        return self


# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "To Do"
    due_date: datetime
    assigned_to_id: Optional[int] = None

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: datetime) -> datetime:
        from datetime import datetime
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        v_naive = v.replace(tzinfo=None)
        if v_naive < today_start:
            raise ValueError("Due date cannot be in the past.")
        return v

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, v: datetime) -> datetime:
        return v


# --- VENDOR SCHEMAS ---
class VendorBase(BaseModel):
    name: str
    contact_details: Optional[str] = None
    reliability_score: Optional[float] = 100.0
    risk_score: Optional[float] = 0.0
    performance_score: Optional[float] = 100.0
    rating: Optional[float] = 5.0
    quality_score: Optional[float] = 100.0

class VendorCreate(BaseModel):
    name: str
    contact_details: Optional[str] = None

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    contact_details: Optional[str] = None

class VendorSummary(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class VendorResponse(VendorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- MATERIAL SCHEMAS ---
class MaterialBase(BaseModel):
    name: str
    quantity: float
    cost: float
    current_location: Optional[str] = "Vendor Facility"
    eta: Optional[datetime] = None
    status: Optional[str] = "Approved"
    vendor_id: Optional[int] = None

    @field_validator("eta")
    @classmethod
    def validate_eta(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return v
        from datetime import datetime
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        v_naive = v.replace(tzinfo=None)
        if v_naive < today_start:
            raise ValueError("ETA target date cannot be in the past.")
        return v

class MaterialCreate(MaterialBase):
    pass

class MaterialResponse(MaterialBase):
    id: int
    project_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

    @field_validator("eta")
    @classmethod
    def validate_eta(cls, v: Optional[datetime]) -> Optional[datetime]:
        return v


# --- DELIVERY SCHEMAS ---
class DeliveryBase(BaseModel):
    status: str
    current_location: str
    eta: Optional[datetime] = None
    tracking_history: Optional[List[Dict[str, Any]]] = []

class DeliveryResponse(DeliveryBase):
    id: int
    material_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- INVENTORY SCHEMAS ---
class InventoryBase(BaseModel):
    material_name: str
    quantity_on_hand: float
    unit: str

class InventoryResponse(InventoryBase):
    id: int
    project_id: int
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)

# --- BUDGET SCHEMAS ---
class BudgetPlanCreate(BaseModel):
    building_type: str
    budget_limit: float

class BudgetPlanResponse(BaseModel):
    id: int
    project_id: int
    building_type: str
    budget_limit: float
    plan_type: str
    details: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- WEATHER SCHEMAS ---
class WeatherLogResponse(BaseModel):
    id: int
    project_id: int
    date: datetime
    temp: float
    condition: str
    rain_prob: float
    alerts_triggered: List[str]
    impact_assessment: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)

# --- NOTIFICATION SCHEMAS ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    category: str
    read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- REPORT SCHEMAS ---
class ReportCreate(BaseModel):
    daily_summary: Optional[str] = None
    weekly_summary: Optional[str] = None
    risks_detected: Optional[List[str]] = []
    insights: Optional[str] = None

class ReportResponse(BaseModel):
    id: int
    project_id: int
    author_id: Optional[int]
    date: datetime
    daily_summary: Optional[str]
    weekly_summary: Optional[str]
    risks_detected: List[str]
    insights: Optional[str]
    model_config = ConfigDict(from_attributes=True)

# --- SITE IMAGE SCHEMAS ---
class SiteImageResponse(BaseModel):
    id: int
    project_id: int
    image_url: str
    description: Optional[str]
    analysis_results: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- PREDICTION SCHEMAS ---
class PredictionResponse(BaseModel):
    id: int
    project_id: int
    prediction_type: str
    input_data: Dict[str, Any]
    output_result: Dict[str, Any]
    probability: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- CHAT SCHEMAS ---
class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    message: str
    response: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- HOMEOWNER TRANSPARENCY SCHEMAS ---
class ProjectJoinRequest(BaseModel):
    project_code: str = Field(..., placeholder="PRJ-2026-0001")

class DailyUpdateUpload(BaseModel):
    raw_input: str

class ConstructionStageUpdate(BaseModel):
    status: str # Not Started, In Progress, Completed
    completion_date: Optional[datetime] = None
    evidence_url: Optional[str] = None

class ConstructionStageResponse(BaseModel):
    id: int
    project_id: int
    stage_name: str
    status: str
    completion_date: Optional[datetime]
    evidence_urls: List[str]
    model_config = ConfigDict(from_attributes=True)

class ProjectTimelineResponse(BaseModel):
    id: int
    project_id: int
    date: datetime
    activity: str
    materials_used: Dict[str, str]
    expense: float
    labor_wages: float
    ai_summary: Optional[str]
    photos_urls: List[str]
    model_config = ConfigDict(from_attributes=True)

class DailyReportResponse(BaseModel):
    id: int
    project_id: int
    date: datetime
    work_completed: Optional[str]
    materials_used: Dict[str, str]
    labor_count: int
    expense: float
    labor_wages: float
    progress_update: Optional[str]
    next_activity: Optional[str]
    risk_assessment: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class OwnerNotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    details: Dict[str, Any]
    read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HomeownerDashboardResponse(BaseModel):
    project_name: str
    project_id: str # The custom string PRJ-2026-0001
    overall_progress: float
    current_stage: str
    budget_utilized: float
    remaining_budget: float
    latest_photos: List[str]
    recent_activities: List[Dict[str, Any]]
    upcoming_tasks: List[Dict[str, Any]]
    expected_completion_date: str
    delay_alerts: List[str]
    ai_recommendations: List[str]
    contractor_name: Optional[str] = None
    contractor_email: Optional[str] = None
    contractor_phone: Optional[str] = None
    site_engineer_name: Optional[str] = None
    site_engineer_email: Optional[str] = None
    site_engineer_phone: Optional[str] = None

# --- NEW SCHEMAS FOR DATABASE ENHANCEMENTS ---

class MaterialRequirementBase(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str
    estimated_cost: float
    priority: Optional[str] = "Medium"

class MaterialRequirementCreate(MaterialRequirementBase):
    status: Optional[str] = "Pending approval"
    requested_by: Optional[str] = None

class MaterialRequirementUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    estimated_cost: Optional[float] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    requested_by: Optional[str] = None

class MaterialRequirementResponse(MaterialRequirementBase):
    id: int
    project_id: int
    status: Optional[str] = "Pending approval"
    requested_by: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MaterialOrderBase(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str
    cost: float
    vendor_id: Optional[int] = None
    current_location: Optional[str] = "Vendor Facility"
    eta: Optional[datetime] = None
    status: Optional[str] = "Required"
    priority: Optional[str] = "Medium"
    delivery_date: Optional[datetime] = None

class MaterialOrderCreate(MaterialOrderBase):
    pass

class MaterialOrderUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    cost: Optional[float] = None
    vendor_id: Optional[int] = None
    current_location: Optional[str] = None
    eta: Optional[datetime] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    delivery_date: Optional[datetime] = None

class MaterialOrderResponse(MaterialOrderBase):
    id: int
    project_id: int
    created_at: datetime
    vendor: Optional[VendorSummary] = None
    model_config = ConfigDict(from_attributes=True)

class MaterialStatusBase(BaseModel):
    material_order_id: int
    status: str
    notes: Optional[str] = None

class MaterialStatusResponse(MaterialStatusBase):
    id: int
    changed_at: datetime
    model_config = ConfigDict(from_attributes=True)

class MaterialConsumptionBase(BaseModel):
    material_name: str
    quantity_used: float
    unit: str
    consumed_date: Optional[datetime] = None

class MaterialConsumptionCreate(MaterialConsumptionBase):
    pass

class MaterialConsumptionResponse(MaterialConsumptionBase):
    id: int
    project_id: int
    model_config = ConfigDict(from_attributes=True)

class ProjectDocumentBase(BaseModel):
    name: str
    file_type: str
    file_url: str

class ProjectDocumentCreate(ProjectDocumentBase):
    pass

class ProjectDocumentResponse(ProjectDocumentBase):
    id: int
    project_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProjectBillBase(BaseModel):
    amount: Optional[float] = None
    vendor_name: Optional[str] = None
    bill_date: Optional[datetime] = None
    tags: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None

class ProjectBillCreate(ProjectBillBase):
    pass

class ProjectBillUpdate(BaseModel):
    vendor_name: Optional[str] = None
    amount: Optional[float] = None
    tags: Optional[str] = None

class ProjectBillResponse(ProjectBillBase):
    id: int
    project_id: int
    uploaded_by_id: Optional[int] = None
    image_url: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderBase(BaseModel):
    po_number: str
    vendor_id: Optional[int] = None
    description: str
    amount: Optional[float] = 0.0
    eta: Optional[str] = None
    status: Optional[str] = "Created"

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrderUpdate(BaseModel):
    po_number: Optional[str] = None
    vendor_id: Optional[int] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    eta: Optional[str] = None
    status: Optional[str] = None

class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    project_id: int
    created_at: datetime
    vendor: Optional[VendorSummary] = None
    model_config = ConfigDict(from_attributes=True)

