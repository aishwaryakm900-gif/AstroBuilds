from sqlalchemy.orm import Session
from backend.models import Vendor, MaterialOrder
from typing import List, Optional

def get_vendors(db: Session):
    vendors = db.query(Vendor).all()
    # Calculate scores on the fly for latest values
    for vendor in vendors:
        calculate_and_save_vendor_scores(db, vendor.id)
    return db.query(Vendor).all()

def create_vendor(db: Session, name: str, contact_details: str, rating: float = 5.0, quality_score: float = 100.0):
    db_vendor = Vendor(
        name=name,
        contact_details=contact_details,
        rating=5.0,
        quality_score=100.0
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    calculate_and_save_vendor_scores(db, db_vendor.id)
    return db_vendor

def update_vendor(db: Session, vendor_id: int, name: Optional[str] = None, contact_details: Optional[str] = None):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        return None
    if name is not None:
        vendor.name = name
    if contact_details is not None:
        vendor.contact_details = contact_details
    db.commit()
    db.refresh(vendor)
    calculate_and_save_vendor_scores(db, vendor_id)
    return vendor

def calculate_and_save_vendor_scores(db: Session, vendor_id: int):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        return
        
    materials = db.query(MaterialOrder).filter(MaterialOrder.vendor_id == vendor_id).all()
    
    # Performance score based on delivery completion rate
    if not materials:
        vendor.performance_score = 95.0
    else:
        delivered = sum(1 for m in materials if m.status in ["Delivered", "Installed"])
        vendor.performance_score = round((delivered / len(materials)) * 100.0, 1)
        vendor.performance_score = max(50.0, min(100.0, vendor.performance_score))

    # Reliability score based on on-time delivery heuristic
    if not materials:
        vendor.reliability_score = 95.0
    else:
        delayed_count = 0
        total_delivered = 0
        for mat in materials:
            if mat.status in ["Delivered", "Installed"]:
                total_delivered += 1
                if mat.cost > 20000 and mat.id % 3 == 0:
                    delayed_count += 1
                    
        if total_delivered == 0:
            vendor.reliability_score = 95.0
        else:
            on_time_ratio = (total_delivered - delayed_count) / total_delivered
            vendor.reliability_score = round(on_time_ratio * 100.0, 1)
            vendor.reliability_score = max(50.0, vendor.reliability_score)

    weighted_score = (vendor.reliability_score * 0.6) + (vendor.performance_score * 0.4)
    vendor.risk_score = round(100.0 - weighted_score, 1)
    vendor.risk_score = max(0.0, min(100.0, vendor.risk_score))

    db.commit()
    db.refresh(vendor)
