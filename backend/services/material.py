from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from backend.models import MaterialOrder, MaterialStatus, MaterialConsumption, ProjectDocument, Inventory, Vendor
from backend.schemas import MaterialOrderCreate, MaterialOrderUpdate, ProjectDocumentCreate, MaterialConsumptionCreate

def get_materials(db: Session, project_id: Optional[int] = None):
    query = db.query(MaterialOrder)
    if project_id:
        query = query.filter(MaterialOrder.project_id == project_id)
    return query.all()

def update_material(db: Session, material_id: int, updates: MaterialOrderUpdate):
    db_material = db.query(MaterialOrder).filter(MaterialOrder.id == material_id).first()
    if not db_material:
        return None

    old_status = db_material.status
    data = updates.model_dump(exclude_unset=True)
    new_status = data.pop("status", None)

    for field, value in data.items():
        setattr(db_material, field, value)

    if new_status and new_status != old_status:
        db_material.status = new_status
        db_status = MaterialStatus(
            material_order_id=material_id,
            status=new_status,
            notes=f"Status transitioned from {old_status} to {new_status}."
        )
        db.add(db_status)

        if new_status == "Delivered":
            db_material.current_location = db_material.current_location or "Site Warehouse"
            inv_item = db.query(Inventory).filter(
                Inventory.project_id == db_material.project_id,
                Inventory.material_name == db_material.name
            ).first()
            if inv_item:
                inv_item.quantity_on_hand += db_material.quantity
            else:
                db.add(Inventory(
                    project_id=db_material.project_id,
                    material_name=db_material.name,
                    quantity_on_hand=db_material.quantity,
                    unit=db_material.unit
                ))
        elif new_status == "Installed":
            inv_item = db.query(Inventory).filter(
                Inventory.project_id == db_material.project_id,
                Inventory.material_name == db_material.name
            ).first()
            if inv_item:
                inv_item.quantity_on_hand = max(0.0, inv_item.quantity_on_hand - db_material.quantity)
            db.add(MaterialConsumption(
                project_id=db_material.project_id,
                material_name=db_material.name,
                quantity_used=db_material.quantity,
                unit=db_material.unit,
                consumed_date=datetime.utcnow()
            ))

    db.commit()
    db.refresh(db_material)
    return db_material

def create_material(db: Session, material: MaterialOrderCreate, project_id: int):
    db_material = MaterialOrder(
        project_id=project_id,
        vendor_id=material.vendor_id,
        name=material.name,
        category=material.category or "Other",
        quantity=material.quantity,
        unit=material.unit or "units",
        cost=material.cost,
        current_location=material.current_location or "Vendor Facility",
        eta=material.eta or (datetime.utcnow() + timedelta(days=7)),
        status=material.status or "Required",
        priority=material.priority or "Medium",
        delivery_date=material.delivery_date
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)

    # Add initial material status history
    db_status = MaterialStatus(
        material_order_id=db_material.id,
        status=db_material.status,
        notes=f"Material requirement created for {db_material.name}."
    )
    db.add(db_status)
    
    # Initialize inventory entry placeholder
    inv_item = db.query(Inventory).filter(
        Inventory.project_id == project_id,
        Inventory.material_name == material.name
    ).first()
    if not inv_item:
        db_inv = Inventory(
            project_id=project_id,
            material_name=material.name,
            quantity_on_hand=0.0,
            unit=db_material.unit
        )
        db.add(db_inv)
        
    db.commit()
    db.refresh(db_material)
    return db_material

def update_material_status(db: Session, material_id: int, status: str, location: Optional[str] = None):
    db_material = db.query(MaterialOrder).filter(MaterialOrder.id == material_id).first()
    if not db_material:
        return None
        
    old_status = db_material.status
    db_material.status = status
    if location:
        db_material.current_location = location
    elif status == "Delivered":
        db_material.current_location = "Site Warehouse"
    elif status == "Installed":
        db_material.current_location = "Constructed Area"
        
    # Append to status history
    db_status = MaterialStatus(
        material_order_id=material_id,
        status=status,
        notes=f"Status transitioned from {old_status} to {status}."
    )
    db.add(db_status)
    
    # If state transitions to "Delivered", add to Inventory
    if status == "Delivered":
        inv_item = db.query(Inventory).filter(
            Inventory.project_id == db_material.project_id,
            Inventory.material_name == db_material.name
        ).first()
        if inv_item:
            inv_item.quantity_on_hand += db_material.quantity
        else:
            db_inv = Inventory(
                project_id=db_material.project_id,
                material_name=db_material.name,
                quantity_on_hand=db_material.quantity,
                unit=db_material.unit
            )
            db.add(db_inv)
            
    # If state transitions to "Installed", subtract from Inventory & track Consumption
    elif status == "Installed":
        inv_item = db.query(Inventory).filter(
            Inventory.project_id == db_material.project_id,
            Inventory.material_name == db_material.name
        ).first()
        if inv_item:
            inv_item.quantity_on_hand = max(0.0, inv_item.quantity_on_hand - db_material.quantity)
            
        # Track Consumption
        db_cons = MaterialConsumption(
            project_id=db_material.project_id,
            material_name=db_material.name,
            quantity_used=db_material.quantity,
            unit=db_material.unit,
            consumed_date=datetime.utcnow()
        )
        db.add(db_cons)
            
    db.commit()
    db.refresh(db_material)
    return db_material

def get_inventory(db: Session, project_id: int):
    return db.query(Inventory).filter(Inventory.project_id == project_id).all()

# --- DOCUMENTS ---
def get_documents(db: Session, project_id: int) -> List[ProjectDocument]:
    return db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id).all()

def create_document(db: Session, doc: ProjectDocumentCreate, project_id: int) -> ProjectDocument:
    db_doc = ProjectDocument(
        project_id=project_id,
        name=doc.name,
        file_type=doc.file_type,
        file_url=doc.file_url
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

# --- CONSUMPTION ---
def get_consumption(db: Session, project_id: int) -> List[MaterialConsumption]:
    return db.query(MaterialConsumption).filter(MaterialConsumption.project_id == project_id).all()

def create_consumption(db: Session, cons: MaterialConsumptionCreate, project_id: int) -> MaterialConsumption:
    db_cons = MaterialConsumption(
        project_id=project_id,
        material_name=cons.material_name,
        quantity_used=cons.quantity_used,
        unit=cons.unit,
        consumed_date=cons.consumed_date or datetime.utcnow()
    )
    db.add(db_cons)
    db.commit()
    db.refresh(db_cons)
    return db_cons
