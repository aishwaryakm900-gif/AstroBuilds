from sqlalchemy.orm import Session
from typing import Optional, List
from backend.models import MaterialRequirement, PurchaseOrder
from backend.schemas import (
    MaterialRequirementCreate,
    MaterialRequirementUpdate,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
)


def get_purchase_requests(db: Session, project_id: Optional[int] = None) -> List[MaterialRequirement]:
    query = db.query(MaterialRequirement)
    if project_id:
        query = query.filter(MaterialRequirement.project_id == project_id)
    return query.order_by(MaterialRequirement.created_at.desc()).all()


def create_purchase_request(db: Session, req: MaterialRequirementCreate, project_id: int) -> MaterialRequirement:
    db_req = MaterialRequirement(
        project_id=project_id,
        name=req.name,
        category=req.category,
        quantity=req.quantity,
        unit=req.unit,
        estimated_cost=req.estimated_cost,
        priority=req.priority or "Medium",
        status=req.status or "Pending approval",
        requested_by=req.requested_by,
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req


def update_purchase_request(db: Session, request_id: int, updates: MaterialRequirementUpdate) -> Optional[MaterialRequirement]:
    db_req = db.query(MaterialRequirement).filter(MaterialRequirement.id == request_id).first()
    if not db_req:
        return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_req, field, value)
    db.commit()
    db.refresh(db_req)
    return db_req


def get_purchase_orders(db: Session, project_id: Optional[int] = None) -> List[PurchaseOrder]:
    query = db.query(PurchaseOrder)
    if project_id:
        query = query.filter(PurchaseOrder.project_id == project_id)
    return query.order_by(PurchaseOrder.created_at.desc()).all()


def create_purchase_order(db: Session, order: PurchaseOrderCreate, project_id: int) -> PurchaseOrder:
    db_order = PurchaseOrder(
        project_id=project_id,
        po_number=order.po_number,
        vendor_id=order.vendor_id,
        description=order.description,
        amount=order.amount or 0.0,
        eta=order.eta,
        status=order.status or "Created",
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def update_purchase_order(db: Session, order_id: int, updates: PurchaseOrderUpdate) -> Optional[PurchaseOrder]:
    db_order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not db_order:
        return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_order, field, value)
    db.commit()
    db.refresh(db_order)
    return db_order
