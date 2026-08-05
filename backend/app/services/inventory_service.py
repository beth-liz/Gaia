from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from typing import List, Optional

from app.models.inventory import (
    InventoryCategory,
    InventoryMaster,
    StationInventory,
    InventoryTransaction,
    EquipmentRequest,
    EquipmentAssignment,
    EquipmentReturn,
    DamagedEquipment,
    EquipmentLossReport,
    InventoryAdjustment,
    InventoryTransfer,
    TransferItem,
    KitMaster,
    KitItem,
    KitInspection,
    KitRefillHistory,
    GuardKitAssignment,
    GuardKitItemStatus,
    KitRefillRequest,
    InventoryAuditLog,
)
from app.models.monitoring_station import MonitoringStation
from app.models.user import User
from app.models.notification import Notification
from app.schemas.inventory import (
    InventoryCategoryCreate,
    InventoryMasterCreate,
    InventoryMasterUpdate,
    StationInventoryAddStock,
    StationInventoryUpdateQuantity,
    InventoryAdjustmentCreate,
    EquipmentRequestCreate,
    EquipmentRequestAction,
    DirectIssueEquipmentRequest,
    EquipmentReturnCreate,
    EquipmentReturnVerifyAction,
    DamagedEquipmentCreate,
    DamagedActionRequest,
    RepairStatusUpdate,
    EquipmentLossReportCreate,
    EquipmentLossReportAction,
    InventoryTransferCreate,
    InventoryTransferAction,
    KitInspectionCreate,
    KitRefillCreate,
    KitRefillRequestCreate,
    KitRefillRequestAction,
)


def calculate_stock_status(available: int, minimum_stock: int, reorder_level: int = 5) -> str:
    threshold = max(minimum_stock, reorder_level)
    if available <= 0:
        return "Out of Stock"
    elif available <= threshold:
        return "Low Stock"
    else:
        return "Available"


def log_audit(
    db: Session,
    user: User,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1"
) -> InventoryAuditLog:
    log_entry = InventoryAuditLog(
        user_id=user.id,
        user_role=user.role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        timestamp=datetime.utcnow(),
    )
    db.add(log_entry)
    return log_entry


def format_category(cat: InventoryCategory) -> dict:
    return {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "active": getattr(cat, "active", True),
        "return_required": cat.return_required,
        "consumable": cat.consumable,
        "requires_refill": cat.requires_refill,
        "created_at": cat.created_at,
    }


def format_master_item(item: InventoryMaster) -> dict:
    cat_rel = item.category_rel
    item_type = item.item_type or "PERSONAL"
    item_usage_type = getattr(item, "item_usage_type", "CONSUMABLE" if item_type == "CONSUMABLE" else "RETURNABLE")

    return {
        "id": item.id,
        "item_name": item.item_name,
        "item_code": item.item_code,
        "category": item.category,
        "category_id": item.category_id,
        "category_name": cat_rel.name if cat_rel else item.category,
        "item_type": item_type,
        "item_usage_type": item_usage_type,
        "return_required": cat_rel.return_required if cat_rel else (item_usage_type != "CONSUMABLE"),
        "consumable": cat_rel.consumable if cat_rel else (item_usage_type == "CONSUMABLE"),
        "requires_refill": cat_rel.requires_refill if cat_rel else item.is_refillable,
        "is_refillable": item.is_refillable,
        "expiry_date": item.expiry_date,
        "manufacture_date": item.manufacture_date,
        "batch_number": item.batch_number,
        "unit": item.unit,
        "minimum_stock": item.minimum_stock,
        "minimum_stock_default": item.minimum_stock_default,
        "reorder_level": item.reorder_level,
        "description": item.description,
        "active": item.active if hasattr(item, "active") else item.is_active,
        "is_active": item.is_active,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def format_station_inventory(inv: StationInventory) -> dict:
    district_id = inv.station.district_id if inv.station else None
    district_name = inv.station.district.district_name if (inv.station and inv.station.district) else None
    state_name = inv.station.district.state.state_name if (inv.station and inv.station.district and inv.station.district.state) else None

    master = inv.master_item
    cat_rel = master.category_rel if master else None
    item_type = master.item_type if master else "PERSONAL"
    item_usage_type = getattr(master, "item_usage_type", "CONSUMABLE" if item_type == "CONSUMABLE" else "RETURNABLE") if master else "RETURNABLE"

    return {
        "id": inv.id,
        "station_id": inv.station_id,
        "station_name": inv.station.station_name if inv.station else None,
        "district_id": district_id,
        "district_name": district_name,
        "state_name": state_name,
        "inventory_master_id": inv.inventory_master_id,
        "item_name": master.item_name if master else None,
        "item_code": master.item_code if master else None,
        "item_type": item_type,
        "item_usage_type": item_usage_type,
        "category": master.category if master else None,
        "category_id": master.category_id if master else None,
        "return_required": cat_rel.return_required if cat_rel else (item_usage_type != "CONSUMABLE"),
        "consumable": cat_rel.consumable if cat_rel else (item_usage_type == "CONSUMABLE"),
        "requires_refill": cat_rel.requires_refill if cat_rel else (master.is_refillable if master else False),
        "unit": master.unit if master else "Units",
        "minimum_stock": inv.minimum_stock or (master.minimum_stock if master else 0),
        "reorder_level": getattr(master, "reorder_level", 5) if master else 5,
        "total_quantity": inv.total_quantity or inv.current_quantity,
        "current_quantity": inv.current_quantity,
        "available_quantity": inv.available_quantity,
        "issued_quantity": inv.issued_quantity or inv.reserved_quantity,
        "reserved_quantity": inv.reserved_quantity,
        "damaged_quantity": inv.damaged_quantity,
        "expiry_date": inv.expiry_date or (master.expiry_date if master else None),
        "manufacture_date": inv.manufacture_date or (master.manufacture_date if master else None),
        "batch_number": inv.batch_number or (master.batch_number if master else None),
        "status": inv.status,
        "last_updated": inv.last_updated,
        "updated_by": inv.updated_by,
        "updater_name": inv.updater.full_name if inv.updater else None,
    }


def format_transaction(tx: InventoryTransaction) -> dict:
    item_name = None
    station_name = None
    if tx.station_inventory:
        if tx.station_inventory.master_item:
            item_name = tx.station_inventory.master_item.item_name
        if tx.station_inventory.station:
            station_name = tx.station_inventory.station.station_name

    return {
        "id": tx.id,
        "station_inventory_id": tx.station_inventory_id,
        "item_name": item_name,
        "station_name": station_name,
        "transaction_type": tx.transaction_type,
        "quantity_before": tx.quantity_before,
        "quantity_changed": tx.quantity_changed,
        "quantity_after": tx.quantity_after,
        "quantity": tx.quantity or abs(tx.quantity_changed or 0),
        "reference_table": tx.reference_table,
        "reference_id": tx.reference_id,
        "performed_by": tx.performed_by,
        "performer_name": tx.performer.full_name if tx.performer else None,
        "assigned_to": tx.assigned_to,
        "assignee_name": tx.assignee.full_name if tx.assignee else None,
        "supplier": getattr(tx, "supplier", None),
        "remarks": tx.remarks,
        "created_at": tx.created_at,
    }


def format_assignment(asgn: EquipmentAssignment) -> dict:
    item_name = None
    unit = None
    if asgn.station_inventory and asgn.station_inventory.master_item:
        item_name = asgn.station_inventory.master_item.item_name
        unit = asgn.station_inventory.master_item.unit

    return {
        "id": asgn.id,
        "station_inventory_id": asgn.station_inventory_id,
        "item_name": item_name,
        "unit": unit,
        "guard_id": asgn.guard_id,
        "guard_name": asgn.guard.full_name if asgn.guard else None,
        "quantity": asgn.quantity,
        "issued_by": asgn.issued_by,
        "issuer_name": asgn.issuer.full_name if asgn.issuer else None,
        "issue_date": asgn.issue_date,
        "expected_return": asgn.expected_return_date,
        "actual_return": asgn.returned_date,
        "assignment_type": getattr(asgn, "assignment_type", "MISSION"),
        "item_usage_type": getattr(asgn, "item_usage_type", "RETURNABLE"),
        "status": asgn.status,
        "purpose": asgn.purpose,
        "remarks": asgn.remarks,
    }


def format_return(ret: EquipmentReturn) -> dict:
    item_name = None
    unit = None
    guard_id = None
    guard_name = None
    if ret.assignment:
        guard_id = ret.assignment.guard_id
        if ret.assignment.guard:
            guard_name = ret.assignment.guard.full_name
        if ret.assignment.station_inventory and ret.assignment.station_inventory.master_item:
            item_name = ret.assignment.station_inventory.master_item.item_name
            unit = ret.assignment.station_inventory.master_item.unit

    return {
        "id": ret.id,
        "equipment_assignment_id": ret.equipment_assignment_id,
        "item_name": item_name,
        "unit": unit,
        "guard_id": guard_id,
        "guard_name": guard_name,
        "condition": ret.condition,
        "reason": ret.reason,
        "remarks": ret.remarks,
        "photos": ret.photos,
        "status": ret.status,
        "submitted_date": ret.submitted_date,
        "verified_by": ret.verified_by,
        "verifier_name": ret.verifier.full_name if ret.verifier else None,
        "verified_at": ret.verified_at,
    }


def format_transfer(trans: InventoryTransfer) -> dict:
    return {
        "id": trans.id,
        "transfer_number": trans.transfer_number,
        "source_station_id": trans.source_station_id,
        "source_station_name": trans.source_station.station_name if trans.source_station else None,
        "destination_station_id": trans.destination_station_id,
        "destination_station_name": trans.destination_station.station_name if trans.destination_station else None,
        "requested_by": trans.requested_by,
        "requester_name": trans.requester.full_name if trans.requester else None,
        "approved_by": trans.approved_by,
        "approver_name": trans.approver.full_name if trans.approver else None,
        "status": trans.status,
        "remarks": trans.remarks,
        "created_at": trans.created_at,
        "dispatched_at": trans.dispatched_at,
        "received_at": trans.received_at,
        "items": [
            {
                "id": item.id,
                "transfer_id": item.transfer_id,
                "inventory_master_id": item.inventory_master_id,
                "item_name": item.master_item.item_name if item.master_item else None,
                "quantity": item.quantity,
            }
            for item in trans.items
        ],
    }


def format_audit(log: InventoryAuditLog) -> dict:
    return {
        "id": log.id,
        "user_id": log.user_id,
        "user_name": log.user.full_name if log.user else None,
        "user_role": log.user_role,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "old_value": log.old_value,
        "new_value": log.new_value,
        "ip_address": log.ip_address,
        "timestamp": log.timestamp,
    }


def log_inventory_transaction(
    db: Session,
    st_inv: StationInventory,
    tx_type: str,
    qty_before: int,
    qty_changed: int,
    qty_after: int,
    performed_by: int,
    assigned_to: Optional[int] = None,
    ref_table: Optional[str] = None,
    ref_id: Optional[int] = None,
    supplier: Optional[str] = None,
    remarks: Optional[str] = None
) -> InventoryTransaction:
    tx = InventoryTransaction(
        station_inventory_id=st_inv.id,
        transaction_type=tx_type,
        quantity_before=qty_before,
        quantity_changed=qty_changed,
        quantity_after=qty_after,
        quantity=abs(qty_changed),
        reference_table=ref_table,
        reference_id=ref_id,
        performed_by=performed_by,
        assigned_to=assigned_to,
        supplier=supplier,
        remarks=remarks,
    )
    db.add(tx)
    return tx


# ==========================================
# REFILLABLE KITS SERVICES
# ==========================================

def get_station_kits_list(db: Session, station_id: Optional[int] = None) -> List[dict]:
    query = db.query(KitMaster)
    if station_id:
        query = query.filter(KitMaster.station_id == station_id)
    kits = query.order_by(KitMaster.kit_number.asc()).all()
    return [format_kit(k) for k in kits]


def inspect_refillable_kit(
    kit_id: int,
    data: KitInspectionCreate,
    inspector_user: User,
    db: Session
) -> dict:
    if inspector_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot perform kit inspections.")

    kit = db.query(KitMaster).filter(KitMaster.id == kit_id).first()
    if not kit:
        raise HTTPException(status_code=404, detail="Refillable kit not found.")

    if inspector_user.role == "Range Forest Officer" and inspector_user.station_id != kit.station_id:
        raise HTTPException(status_code=403, detail="Officers can only inspect kits for their assigned station.")

    has_missing = bool(data.missing_components and data.missing_components.strip())
    result_status = "Needs Refill" if has_missing else "Available"

    kit.current_status = result_status
    kit.next_inspection_date = datetime.utcnow()
    kit.updated_at = datetime.utcnow()

    inspection = KitInspection(
        kit_id=kit.id,
        inspected_by=inspector_user.id,
        inspection_date=datetime.utcnow(),
        status_result=result_status,
        missing_components=data.missing_components,
        remarks=data.remarks,
    )
    db.add(inspection)
    db.commit()
    db.refresh(kit)
    return format_kit(kit)


def refill_refillable_kit(
    kit_id: int,
    data: KitRefillCreate,
    refiller_user: User,
    db: Session
) -> dict:
    if refiller_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot refill kits directly.")

    kit = db.query(KitMaster).filter(KitMaster.id == kit_id).first()
    if not kit:
        raise HTTPException(status_code=404, detail="Refillable kit not found.")

    if refiller_user.role == "Range Forest Officer" and refiller_user.station_id != kit.station_id:
        raise HTTPException(status_code=403, detail="Officers can only refill kits for their assigned station.")

    kit.current_status = "Available"
    kit.last_refilled_date = datetime.utcnow()
    kit.updated_at = datetime.utcnow()

    for ki in kit.kit_items:
        ki.current_quantity = ki.required_quantity

    refill_entry = KitRefillHistory(
        kit_id=kit.id,
        refilled_by=refiller_user.id,
        refill_date=datetime.utcnow(),
        items_refilled=data.items_refilled,
        remarks=data.remarks,
    )
    db.add(refill_entry)

    st_inv = db.query(StationInventory).filter(
        StationInventory.station_id == kit.station_id,
        StationInventory.inventory_master_id == kit.inventory_master_id,
    ).first()

    if st_inv:
        log_inventory_transaction(
            db=db,
            st_inv=st_inv,
            tx_type="REFILL",
            qty_before=st_inv.available_quantity,
            qty_changed=0,
            qty_after=st_inv.available_quantity,
            performed_by=refiller_user.id,
            ref_table="kit_masters",
            ref_id=kit.id,
            remarks=f"Refilled kit {kit.kit_number}. Items: {data.items_refilled}",
        )

    db.commit()
    db.refresh(kit)
    return format_kit(kit)


def format_kit(kit: KitMaster) -> dict:
    return {
        "id": kit.id,
        "kit_number": kit.kit_number,
        "kit_name": kit.kit_name or kit.kit_number,
        "inventory_master_id": kit.inventory_master_id,
        "item_name": kit.master_item.item_name if kit.master_item else None,
        "station_id": kit.station_id,
        "station_name": kit.station.station_name if kit.station else None,
        "current_status": kit.current_status,
        "last_refilled_date": kit.last_refilled_date,
        "next_inspection_date": kit.next_inspection_date,
        "description": kit.description or kit.notes,
        "notes": kit.notes,
        "active": getattr(kit, "active", True),
        "created_at": kit.created_at,
        "updated_at": kit.updated_at,
        "kit_items": [
            {
                "id": ki.id,
                "kit_id": ki.kit_id,
                "inventory_master_id": ki.inventory_master_id,
                "item_name": ki.item_name,
                "default_quantity": ki.default_quantity or ki.required_quantity,
                "required_quantity": ki.required_quantity,
                "current_quantity": ki.current_quantity,
                "unit": ki.unit,
            }
            for ki in kit.kit_items
        ],
        "inspections": [
            {
                "id": inspire.id,
                "kit_id": inspire.kit_id,
                "inspected_by": inspire.inspected_by,
                "inspector_name": inspire.inspector.full_name if inspire.inspector else None,
                "inspection_date": inspire.inspection_date,
                "status_result": inspire.status_result,
                "missing_components": inspire.missing_components,
                "remarks": inspire.remarks,
            }
            for inspire in kit.inspections
        ],
        "refills": [
            {
                "id": rf.id,
                "kit_id": rf.kit_id,
                "refilled_by": rf.refilled_by,
                "refilled_date": rf.refill_date,
                "items_refilled": rf.items_refilled,
                "remarks": rf.remarks,
            }
            for rf in kit.refills
        ],
    }

def get_categories_list(db: Session) -> List[dict]:
    cats = db.query(InventoryCategory).all()
    return [format_category(c) for c in cats]


def create_category(data: InventoryCategoryCreate, db: Session) -> dict:
    existing = db.query(InventoryCategory).filter(
        func.lower(InventoryCategory.name) == data.name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Category '{data.name}' already exists.")

    cat = InventoryCategory(
        name=data.name.strip(),
        description=data.description,
        active=data.active,
        return_required=data.return_required,
        consumable=data.consumable,
        requires_refill=data.requires_refill,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return format_category(cat)


def create_inventory_master(data: InventoryMasterCreate, db: Session) -> dict:
    existing = db.query(InventoryMaster).filter(
        func.lower(InventoryMaster.item_name) == data.item_name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Item name '{data.item_name}' already exists in catalog.")

    master = InventoryMaster(
        item_name=data.item_name.strip(),
        item_code=data.item_code.strip() if data.item_code else None,
        category=data.category.strip(),
        category_id=data.category_id,
        item_type=data.item_type.upper().strip() if data.item_type else "PERSONAL",
        item_usage_type=data.item_usage_type.upper().strip() if data.item_usage_type else "RETURNABLE",
        unit=data.unit.strip(),
        minimum_stock=data.minimum_stock,
        minimum_stock_default=data.minimum_stock_default or data.minimum_stock,
        reorder_level=data.reorder_level,
        is_refillable=data.is_refillable,
        expiry_date=data.expiry_date,
        manufacture_date=data.manufacture_date,
        batch_number=data.batch_number,
        description=data.description,
        active=data.active,
        is_active=data.active,
    )
    db.add(master)
    db.commit()
    db.refresh(master)
    return format_master_item(master)


def update_inventory_master(master_id: int, data: InventoryMasterUpdate, db: Session) -> dict:
    master = db.query(InventoryMaster).filter(InventoryMaster.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master item not found.")

    if data.item_name:
        master.item_name = data.item_name.strip()
    if data.item_code:
        master.item_code = data.item_code.strip()
    if data.category:
        master.category = data.category.strip()
    if data.category_id is not None:
        master.category_id = data.category_id
    if data.item_type:
        master.item_type = data.item_type.upper().strip()
    if data.item_usage_type:
        master.item_usage_type = data.item_usage_type.upper().strip()
    if data.unit:
        master.unit = data.unit.strip()
    if data.minimum_stock is not None:
        master.minimum_stock = data.minimum_stock
    if data.expiry_date:
        master.expiry_date = data.expiry_date
    if data.manufacture_date:
        master.manufacture_date = data.manufacture_date
    if data.batch_number:
        master.batch_number = data.batch_number
    if data.active is not None:
        master.active = data.active
        master.is_active = data.active

    master.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(master)
    return format_master_item(master)


def list_inventory_masters(
    db: Session,
    category: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = False
) -> List[dict]:
    query = db.query(InventoryMaster)
    if active_only:
        query = query.filter(InventoryMaster.is_active == True)
    if category and category != "ALL":
        query = query.filter(InventoryMaster.category == category)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InventoryMaster.item_name.ilike(term),
                InventoryMaster.item_code.ilike(term),
                InventoryMaster.description.ilike(term),
            )
        )
    masters = query.order_by(InventoryMaster.item_name.asc()).all()
    return [format_master_item(m) for m in masters]


# ==========================================
# STATION INVENTORY SERVICES
# ==========================================

def get_station_inventory_list(db: Session, station_id: Optional[int] = None) -> List[dict]:
    query = db.query(StationInventory)
    if station_id:
        query = query.filter(StationInventory.station_id == station_id)
    inventories = query.order_by(StationInventory.last_updated.desc()).all()
    return [format_station_inventory(inv) for inv in inventories]


def add_stock_to_station(data: StationInventoryAddStock, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot directly add station stock.")

    target_station_id = data.station_id or current_user.station_id
    if not target_station_id:
        raise HTTPException(status_code=400, detail="Station ID is required.")

    master = db.query(InventoryMaster).filter(InventoryMaster.id == data.inventory_master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master inventory item not found.")

    st_inv = db.query(StationInventory).filter(
        StationInventory.station_id == target_station_id,
        StationInventory.inventory_master_id == data.inventory_master_id,
    ).first()

    qty_before = st_inv.available_quantity if st_inv else 0

    if not st_inv:
        st_inv = StationInventory(
            station_id=target_station_id,
            inventory_master_id=data.inventory_master_id,
            total_quantity=data.quantity,
            current_quantity=data.quantity,
            available_quantity=data.quantity,
            issued_quantity=0,
            reserved_quantity=0,
            damaged_quantity=0,
            minimum_stock=master.minimum_stock,
            status=calculate_stock_status(data.quantity, master.minimum_stock, getattr(master, "reorder_level", 5)),
            updated_by=current_user.id,
        )
        db.add(st_inv)
        db.flush()
    else:
        st_inv.total_quantity += data.quantity
        st_inv.current_quantity += data.quantity
        st_inv.available_quantity += data.quantity
        st_inv.status = calculate_stock_status(st_inv.available_quantity, master.minimum_stock, getattr(master, "reorder_level", 5))
        st_inv.updated_by = current_user.id
        st_inv.last_updated = datetime.utcnow()

    qty_after = st_inv.available_quantity

    log_inventory_transaction(
        db=db,
        st_inv=st_inv,
        tx_type="STOCK_IN",
        qty_before=qty_before,
        qty_changed=data.quantity,
        qty_after=qty_after,
        performed_by=current_user.id,
        supplier=data.supplier,
        remarks=data.remarks or f"Added {data.quantity} {master.unit} to stock.",
    )

    log_audit(
        db=db,
        user=current_user,
        action="Stock Added",
        entity_type="station_inventory",
        entity_id=st_inv.id,
        old_value=str(qty_before),
        new_value=str(qty_after),
    )

    db.commit()
    db.refresh(st_inv)
    return format_station_inventory(st_inv)


def create_stock_adjustment(data: InventoryAdjustmentCreate, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot adjust stock.")

    st_inv = db.query(StationInventory).filter(StationInventory.id == data.station_inventory_id).first()
    if not st_inv:
        raise HTTPException(status_code=404, detail="Station inventory item not found.")

    qty_before = st_inv.available_quantity
    diff = data.new_quantity - qty_before

    st_inv.available_quantity = data.new_quantity
    st_inv.current_quantity = max(0, st_inv.current_quantity + diff)
    st_inv.total_quantity = max(0, st_inv.total_quantity + diff)
    st_inv.status = calculate_stock_status(st_inv.available_quantity, st_inv.minimum_stock, 5)
    st_inv.updated_by = current_user.id
    st_inv.last_updated = datetime.utcnow()

    qty_after = st_inv.available_quantity

    adj = InventoryAdjustment(
        station_inventory_id=st_inv.id,
        current_quantity=qty_before,
        new_quantity=data.new_quantity,
        difference=diff,
        reason=data.reason,
        remarks=data.remarks,
        submitted_by=current_user.id,
    )
    db.add(adj)
    db.flush()

    log_inventory_transaction(
        db=db,
        st_inv=st_inv,
        tx_type="ADJUSTMENT",
        qty_before=qty_before,
        qty_changed=diff,
        qty_after=qty_after,
        performed_by=current_user.id,
        ref_table="inventory_adjustments",
        ref_id=adj.id,
        remarks=f"Stock adjusted ({data.reason}). Diff: {diff:+d}. {data.remarks or ''}".strip(),
    )

    log_audit(
        db=db,
        user=current_user,
        action="Stock Adjusted",
        entity_type="station_inventory",
        entity_id=st_inv.id,
        old_value=str(qty_before),
        new_value=str(qty_after),
    )

    db.commit()
    db.refresh(st_inv)
    return format_station_inventory(st_inv)


def direct_issue_equipment(data: DirectIssueEquipmentRequest, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot directly issue equipment.")

    st_inv = db.query(StationInventory).filter(StationInventory.id == data.station_inventory_id).first()
    if not st_inv:
        raise HTTPException(status_code=404, detail="Station inventory item not found.")

    if st_inv.available_quantity < data.quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient available stock ({st_inv.available_quantity} available).")

    guard = db.query(User).filter(User.id == data.guard_id, User.role == "Forest Guard").first()
    if not guard:
        raise HTTPException(status_code=404, detail="Forest Guard not found.")

    qty_before = st_inv.available_quantity
    st_inv.available_quantity -= data.quantity
    st_inv.issued_quantity = (st_inv.issued_quantity or 0) + data.quantity
    st_inv.reserved_quantity = st_inv.issued_quantity
    st_inv.status = calculate_stock_status(st_inv.available_quantity, st_inv.minimum_stock, 5)

    asgn = EquipmentAssignment(
        station_inventory_id=st_inv.id,
        guard_id=guard.id,
        quantity=data.quantity,
        issued_by=current_user.id,
        issue_date=datetime.utcnow(),
        expected_return_date=data.expected_return_date,
        assignment_type=data.assignment_type.upper(),
        item_usage_type=data.item_usage_type.upper(),
        status="ISSUED",
        purpose=data.purpose,
        remarks=data.remarks,
    )
    db.add(asgn)
    db.flush()

    log_inventory_transaction(
        db=db,
        st_inv=st_inv,
        tx_type="ISSUE",
        qty_before=qty_before,
        qty_changed=-data.quantity,
        qty_after=st_inv.available_quantity,
        performed_by=current_user.id,
        assigned_to=guard.id,
        ref_table="equipment_assignments",
        ref_id=asgn.id,
        remarks=data.remarks or f"Issued {data.quantity} units to Guard {guard.full_name}.",
    )

    log_audit(
        db=db,
        user=current_user,
        action="Issued Equipment",
        entity_type="equipment_assignments",
        entity_id=asgn.id,
    )

    db.commit()
    db.refresh(asgn)
    return format_assignment(asgn)


def format_equipment_request(req: EquipmentRequest) -> dict:
    item_name = None
    unit = None
    station_name = None
    if req.station_inventory:
        if req.station_inventory.master_item:
            item_name = req.station_inventory.master_item.item_name
            unit = req.station_inventory.master_item.unit
        if req.station_inventory.station:
            station_name = req.station_inventory.station.station_name
    elif req.master_item:
        item_name = req.master_item.item_name
        unit = req.master_item.unit

    return {
        "id": req.id,
        "guard_id": req.guard_id,
        "guard_name": req.guard.full_name if req.guard else None,
        "station_inventory_id": req.station_inventory_id,
        "inventory_master_id": req.inventory_master_id,
        "item_name": item_name,
        "unit": unit,
        "station_name": station_name,
        "requested_quantity": req.quantity,
        "quantity": req.quantity,
        "reason": req.purpose,
        "purpose": req.purpose,
        "priority": req.priority,
        "status": req.status,
        "requested_at": req.requested_at,
        "approved_at": req.approved_at,
        "approved_by": req.approved_by,
        "approver_name": req.approver.full_name if req.approver else None,
        "rejection_reason": req.rejection_reason,
        "remarks": req.remarks,
    }


def create_equipment_request(data: EquipmentRequestCreate, current_guard: User, db: Session) -> dict:
    if current_guard.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot submit equipment requests.")

    qty = data.requested_quantity or data.quantity or 1
    st_inv_id = data.station_inventory_id

    if not st_inv_id and data.inventory_master_id and current_guard.station_id:
        st_inv = db.query(StationInventory).filter(
            StationInventory.station_id == current_guard.station_id,
            StationInventory.inventory_master_id == data.inventory_master_id
        ).first()
        if st_inv:
            st_inv_id = st_inv.id

    if not st_inv_id:
        raise HTTPException(status_code=400, detail="Station inventory item not found.")

    req = EquipmentRequest(
        guard_id=current_guard.id,
        station_inventory_id=st_inv_id,
        inventory_master_id=data.inventory_master_id,
        quantity=qty,
        purpose=data.purpose or data.reason or "Field Duty",
        priority=data.priority,
        status="PENDING",
        requested_at=datetime.utcnow(),
    )
    db.add(req)

    log_audit(
        db=db,
        user=current_guard,
        action="Submitted Request",
        entity_type="equipment_requests",
    )

    db.commit()
    db.refresh(req)
    return format_equipment_request(req)


def list_equipment_requests(
    db: Session,
    station_id: Optional[int] = None,
    guard_id: Optional[int] = None,
    status_filter: Optional[str] = None
) -> List[dict]:
    query = db.query(EquipmentRequest).join(StationInventory)
    if station_id:
        query = query.filter(StationInventory.station_id == station_id)
    if guard_id:
        query = query.filter(EquipmentRequest.guard_id == guard_id)
    if status_filter and status_filter != "ALL":
        query = query.filter(EquipmentRequest.status == status_filter)

    reqs = query.order_by(EquipmentRequest.requested_at.desc()).all()
    return [format_equipment_request(r) for r in reqs]


def approve_or_reject_equipment_request(
    request_id: int,
    data: EquipmentRequestAction,
    current_user: User,
    db: Session
) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot approve/reject requests.")

    req = db.query(EquipmentRequest).filter(EquipmentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Equipment request not found.")

    act = data.action.upper().strip()
    req.status = act
    req.approved_at = datetime.utcnow()
    req.approved_by = current_user.id
    if data.rejection_reason:
        req.rejection_reason = data.rejection_reason

    if act == "APPROVED":
        st_inv = req.station_inventory
        if st_inv and st_inv.available_quantity >= req.quantity:
            qty_before = st_inv.available_quantity
            st_inv.available_quantity -= req.quantity
            st_inv.issued_quantity = (st_inv.issued_quantity or 0) + req.quantity
            st_inv.reserved_quantity = st_inv.issued_quantity

            asgn = EquipmentAssignment(
                station_inventory_id=st_inv.id,
                guard_id=req.guard_id,
                quantity=req.quantity,
                issued_by=current_user.id,
                issue_date=datetime.utcnow(),
                assignment_type="MISSION",
                item_usage_type="RETURNABLE",
                status="ISSUED",
                purpose=req.purpose,
            )
            db.add(asgn)

            log_inventory_transaction(
                db=db,
                st_inv=st_inv,
                tx_type="ISSUE",
                qty_before=qty_before,
                qty_changed=-req.quantity,
                qty_after=st_inv.available_quantity,
                performed_by=current_user.id,
                assigned_to=req.guard_id,
                ref_table="equipment_requests",
                ref_id=req.id,
                remarks=f"Approved request #{req.id} and issued {req.quantity} units.",
            )

    log_audit(
        db=db,
        user=current_user,
        action=f"Processed Request ({act})",
        entity_type="equipment_requests",
        entity_id=req.id,
    )

    db.commit()
    db.refresh(req)
    return format_equipment_request(req)


def list_equipment_assignments(
    db: Session,
    station_id: Optional[int] = None,
    guard_id: Optional[int] = None,
    status_filter: Optional[str] = None
) -> List[dict]:
    query = db.query(EquipmentAssignment).join(StationInventory)
    if station_id:
        query = query.filter(StationInventory.station_id == station_id)
    if guard_id:
        query = query.filter(EquipmentAssignment.guard_id == guard_id)
    if status_filter and status_filter != "ALL":
        query = query.filter(EquipmentAssignment.status == status_filter)

    asgns = query.order_by(EquipmentAssignment.issue_date.desc()).all()
    return [format_assignment(a) for a in asgns]


# ==========================================
# RETURN & REPAIR WORKFLOW SERVICES (PARTS 4, 5, 6)
# ==========================================

def submit_equipment_return(data: EquipmentReturnCreate, current_user: User, db: Session) -> dict:
    asgn = db.query(EquipmentAssignment).filter(EquipmentAssignment.id == data.equipment_assignment_id).first()
    if not asgn:
        raise HTTPException(status_code=404, detail="Equipment assignment not found.")

    ret = EquipmentReturn(
        equipment_assignment_id=asgn.id,
        condition=data.condition,
        reason=data.reason,
        remarks=data.remarks,
        photos=data.photos,
        status="Pending Verification",
        submitted_date=datetime.utcnow(),
    )
    db.add(ret)

    log_audit(
        db=db,
        user=current_user,
        action="Submitted Return",
        entity_type="equipment_returns",
        entity_id=asgn.id,
    )

    db.commit()
    db.refresh(ret)
    return format_return(ret)


def verify_equipment_return(return_id: int, data: EquipmentReturnVerifyAction, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot verify equipment returns.")

    ret = db.query(EquipmentReturn).filter(EquipmentReturn.id == return_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Equipment return submission not found.")

    asgn = ret.assignment
    st_inv = asgn.station_inventory
    qty_before = st_inv.available_quantity

    act = data.action.upper().strip()
    ret.status = act
    ret.verified_by = current_user.id
    ret.verified_at = datetime.utcnow()

    if act == "ACCEPT":
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        st_inv.reserved_quantity = st_inv.issued_quantity
        st_inv.available_quantity += asgn.quantity
        st_inv.status = calculate_stock_status(st_inv.available_quantity, st_inv.minimum_stock, 5)
        st_inv.updated_by = current_user.id

        asgn.status = "RETURNED"
        asgn.returned_date = datetime.utcnow()

        log_inventory_transaction(
            db=db,
            st_inv=st_inv,
            tx_type="RETURN",
            qty_before=qty_before,
            qty_changed=asgn.quantity,
            qty_after=st_inv.available_quantity,
            performed_by=current_user.id,
            assigned_to=asgn.guard_id,
            ref_table="equipment_returns",
            ref_id=ret.id,
            remarks=data.remarks or "Verified and accepted return.",
        )

    elif act == "REPAIR":
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        st_inv.current_quantity = max(0, st_inv.current_quantity - asgn.quantity)
        st_inv.damaged_quantity += asgn.quantity
        st_inv.status = "Needs Inspection"

        asgn.status = "DAMAGED"
        asgn.returned_date = datetime.utcnow()

        dmg = DamagedEquipment(
            assignment_id=asgn.id,
            station_inventory_id=st_inv.id,
            reported_by=current_user.id,
            damage_type="Return Repair",
            damage_description=data.remarks or ret.remarks,
            repair_status="Waiting",
        )
        db.add(dmg)

        log_inventory_transaction(
            db=db,
            st_inv=st_inv,
            tx_type="DAMAGE",
            qty_before=qty_before,
            qty_changed=-asgn.quantity,
            qty_after=st_inv.available_quantity,
            performed_by=current_user.id,
            ref_table="equipment_returns",
            ref_id=ret.id,
            remarks="Return verified: Sent to Repair Management.",
        )

    elif act == "WRITE_OFF":
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        st_inv.current_quantity = max(0, st_inv.current_quantity - asgn.quantity)

        asgn.status = "DAMAGED"

        log_inventory_transaction(
            db=db,
            st_inv=st_inv,
            tx_type="ADJUSTMENT",
            qty_before=qty_before,
            qty_changed=-asgn.quantity,
            qty_after=st_inv.available_quantity,
            performed_by=current_user.id,
            ref_table="equipment_returns",
            ref_id=ret.id,
            remarks="Return verified: Written off.",
        )

    log_audit(
        db=db,
        user=current_user,
        action=f"Verified Return ({act})",
        entity_type="equipment_returns",
        entity_id=ret.id,
    )

    db.commit()
    db.refresh(ret)
    return format_return(ret)


def list_equipment_returns(db: Session, station_id: Optional[int] = None) -> List[dict]:
    query = db.query(EquipmentReturn).join(EquipmentAssignment).join(StationInventory)
    if station_id:
        query = query.filter(StationInventory.station_id == station_id)
    returns = query.order_by(EquipmentReturn.submitted_date.desc()).all()
    return [format_return(r) for r in returns]


def update_repair_status(damaged_id: int, data: RepairStatusUpdate, current_user: User, db: Session) -> dict:
    dmg = db.query(DamagedEquipment).filter(DamagedEquipment.id == damaged_id).first()
    if not dmg:
        raise HTTPException(status_code=404, detail="Damaged equipment record not found.")

    st_inv = dmg.station_inventory
    qty_before = st_inv.available_quantity

    status_str = data.status.capitalize().strip()
    dmg.repair_status = status_str
    dmg.repair_cost = data.repair_cost or 0
    if data.remarks:
        dmg.remarks = data.remarks

    if status_str == "Completed":
        dmg.repaired_at = datetime.utcnow()
        st_inv.damaged_quantity = max(0, st_inv.damaged_quantity - 1)
        st_inv.current_quantity += 1
        st_inv.available_quantity += 1
        st_inv.status = calculate_stock_status(st_inv.available_quantity, st_inv.minimum_stock, 5)

        log_inventory_transaction(
            db=db,
            st_inv=st_inv,
            tx_type="REPAIR",
            qty_before=qty_before,
            qty_changed=1,
            qty_after=st_inv.available_quantity,
            performed_by=current_user.id,
            ref_table="damaged_equipment",
            ref_id=dmg.id,
            remarks=f"Repair completed. Restored 1 unit to available stock. Cost: ₹{data.repair_cost}",
        )

    log_audit(
        db=db,
        user=current_user,
        action=f"Repair Status ({status_str})",
        entity_type="damaged_equipment",
        entity_id=dmg.id,
    )

    db.commit()
    db.refresh(dmg)
    return {
        "id": dmg.id,
        "assignment_id": dmg.assignment_id,
        "station_inventory_id": dmg.station_inventory_id,
        "item_name": st_inv.master_item.item_name if st_inv and st_inv.master_item else None,
        "reported_by": dmg.reported_by,
        "reporter_name": dmg.reporter.full_name if dmg.reporter else None,
        "damage_type": dmg.damage_type,
        "damage_severity": dmg.damage_severity,
        "damage_description": dmg.damage_description,
        "photo": dmg.photo,
        "repairable": dmg.repairable,
        "repair_cost": dmg.repair_cost,
        "repair_status": dmg.repair_status,
        "remarks": dmg.remarks,
        "reported_at": dmg.reported_at,
        "repaired_at": dmg.repaired_at,
    }


def list_damaged_repairs(db: Session, station_id: Optional[int] = None) -> List[dict]:
    query = db.query(DamagedEquipment).join(StationInventory)
    if station_id:
        query = query.filter(StationInventory.station_id == station_id)
    damages = query.order_by(DamagedEquipment.reported_at.desc()).all()
    return [
        {
            "id": dmg.id,
            "assignment_id": dmg.assignment_id,
            "station_inventory_id": dmg.station_inventory_id,
            "item_name": dmg.station_inventory.master_item.item_name if dmg.station_inventory and dmg.station_inventory.master_item else None,
            "station_name": dmg.station_inventory.station.station_name if dmg.station_inventory and dmg.station_inventory.station else None,
            "reported_by": dmg.reported_by,
            "reporter_name": dmg.reporter.full_name if dmg.reporter else None,
            "damage_type": dmg.damage_type,
            "damage_severity": dmg.damage_severity,
            "damage_description": dmg.damage_description,
            "photo": dmg.photo,
            "repairable": dmg.repairable,
            "repair_cost": dmg.repair_cost,
            "repair_status": dmg.repair_status,
            "remarks": dmg.remarks,
            "reported_at": dmg.reported_at,
            "repaired_at": dmg.repaired_at,
        }
        for dmg in damages
    ]


# ==========================================
# INTER-STATION TRANSFERS SERVICES (PART 11)
# ==========================================

def create_inventory_transfer(data: InventoryTransferCreate, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot initiate station inventory transfers.")

    if not current_user.station_id:
        raise HTTPException(status_code=400, detail="User is not assigned to a station.")

    transfer_num = f"TRF-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    transfer = InventoryTransfer(
        transfer_number=transfer_num,
        source_station_id=current_user.station_id,
        destination_station_id=data.destination_station_id,
        requested_by=current_user.id,
        status="PENDING_APPROVAL",
        remarks=data.remarks,
    )
    db.add(transfer)
    db.flush()

    for item in data.items:
        ti = TransferItem(
            transfer_id=transfer.id,
            inventory_master_id=item.inventory_master_id,
            quantity=item.quantity,
        )
        db.add(ti)

    log_audit(
        db=db,
        user=current_user,
        action="Initiated Transfer",
        entity_type="inventory_transfers",
        entity_id=transfer.id,
    )

    db.commit()
    db.refresh(transfer)
    return format_transfer(transfer)


def process_inventory_transfer(transfer_id: int, data: InventoryTransferAction, current_user: User, db: Session) -> dict:
    transfer = db.query(InventoryTransfer).filter(InventoryTransfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer record not found.")

    act = data.action.upper().strip()
    transfer.status = act
    if data.remarks:
        transfer.remarks = data.remarks

    if act == "DISPATCH":
        transfer.dispatched_at = datetime.utcnow()
        # Deduct stock from source station upon dispatch
        for item in transfer.items:
            src_inv = db.query(StationInventory).filter(
                StationInventory.station_id == transfer.source_station_id,
                StationInventory.inventory_master_id == item.inventory_master_id,
            ).first()

            if src_inv:
                qty_before = src_inv.available_quantity
                src_inv.available_quantity = max(0, src_inv.available_quantity - item.quantity)
                src_inv.current_quantity = max(0, src_inv.current_quantity - item.quantity)
                src_inv.total_quantity = max(0, src_inv.total_quantity - item.quantity)

                log_inventory_transaction(
                    db=db,
                    st_inv=src_inv,
                    tx_type="TRANSFER",
                    qty_before=qty_before,
                    qty_changed=-item.quantity,
                    qty_after=src_inv.available_quantity,
                    performed_by=current_user.id,
                    ref_table="inventory_transfers",
                    ref_id=transfer.id,
                    remarks=f"Dispatched transfer #{transfer.transfer_number} to destination station.",
                )

    elif act == "RECEIVE" or act == "COMPLETED":
        transfer.status = "COMPLETED"
        transfer.received_at = datetime.utcnow()
        # Add stock to destination station upon receipt
        for item in transfer.items:
            dest_inv = db.query(StationInventory).filter(
                StationInventory.station_id == transfer.destination_station_id,
                StationInventory.inventory_master_id == item.inventory_master_id,
            ).first()

            master = db.query(InventoryMaster).filter(InventoryMaster.id == item.inventory_master_id).first()

            qty_before = dest_inv.available_quantity if dest_inv else 0
            if not dest_inv:
                dest_inv = StationInventory(
                    station_id=transfer.destination_station_id,
                    inventory_master_id=item.inventory_master_id,
                    total_quantity=item.quantity,
                    current_quantity=item.quantity,
                    available_quantity=item.quantity,
                    minimum_stock=master.minimum_stock if master else 0,
                    status="Available",
                )
                db.add(dest_inv)
                db.flush()
            else:
                dest_inv.total_quantity += item.quantity
                dest_inv.current_quantity += item.quantity
                dest_inv.available_quantity += item.quantity
                dest_inv.status = calculate_stock_status(dest_inv.available_quantity, dest_inv.minimum_stock, 5)

            log_inventory_transaction(
                db=db,
                st_inv=dest_inv,
                tx_type="TRANSFER",
                qty_before=qty_before,
                qty_changed=item.quantity,
                qty_after=dest_inv.available_quantity,
                performed_by=current_user.id,
                ref_table="inventory_transfers",
                ref_id=transfer.id,
                remarks=f"Received transfer #{transfer.transfer_number} from source station.",
            )

    log_audit(
        db=db,
        user=current_user,
        action=f"Processed Transfer ({act})",
        entity_type="inventory_transfers",
        entity_id=transfer.id,
    )

    db.commit()
    db.refresh(transfer)
    return format_transfer(transfer)


def list_inventory_transfers(db: Session, station_id: Optional[int] = None) -> List[dict]:
    query = db.query(InventoryTransfer)
    if station_id:
        query = query.filter(
            or_(
                InventoryTransfer.source_station_id == station_id,
                InventoryTransfer.destination_station_id == station_id,
            )
        )
    transfers = query.order_by(InventoryTransfer.created_at.desc()).all()
    return [format_transfer(t) for t in transfers]


# ==========================================
# AUDIT LOG SERVICES (PART 13)
# ==========================================

def get_inventory_transactions_list_filtered(
    db: Session,
    station_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    officer_id: Optional[int] = None,
    equipment_id: Optional[int] = None,
    search_term: Optional[str] = None
) -> List[dict]:
    query = db.query(InventoryTransaction).join(StationInventory)

    if station_id:
        query = query.filter(StationInventory.station_id == station_id)
    if transaction_type and transaction_type != "ALL":
        query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    if start_date:
        query = query.filter(InventoryTransaction.created_at >= start_date)
    if end_date:
        query = query.filter(InventoryTransaction.created_at <= end_date)
    if officer_id:
        query = query.filter(InventoryTransaction.performed_by == officer_id)
    if equipment_id:
        query = query.filter(StationInventory.inventory_master_id == equipment_id)
    if search_term:
        term = f"%{search_term.strip()}%"
        query = query.filter(
            or_(
                InventoryTransaction.remarks.ilike(term),
                InventoryTransaction.transaction_type.ilike(term),
            )
        )

    txs = query.order_by(InventoryTransaction.created_at.desc()).all()
    return [format_transaction(tx) for tx in txs]


def get_inventory_summary_report(
    db: Session,
    station_id: Optional[int] = None
) -> dict:
    total_master_items = db.query(InventoryMaster).filter(InventoryMaster.is_active == True).count()
    total_stations = db.query(MonitoringStation).count()

    st_query = db.query(StationInventory)
    if station_id:
        st_query = st_query.filter(StationInventory.station_id == station_id)
    station_items = st_query.all()

    total_in_stock = sum(i.available_quantity for i in station_items)
    total_reserved = sum(i.issued_quantity or i.reserved_quantity for i in station_items)
    total_damaged = sum(i.damaged_quantity for i in station_items)

    perm_count = 0
    cons_count = 0
    refill_count = 0
    for i in station_items:
        master = i.master_item
        item_type = master.item_type if master else "PERSONAL"
        cat_rel = master.category_rel if master else None
        if item_type == "CONSUMABLE" or (cat_rel and cat_rel.consumable):
            cons_count += i.current_quantity
        elif item_type == "KIT" or (cat_rel and cat_rel.requires_refill):
            refill_count += i.current_quantity
        else:
            perm_count += i.current_quantity

    kit_query = db.query(KitMaster)
    if station_id:
        kit_query = kit_query.filter(KitMaster.station_id == station_id)
    pending_refills_count = kit_query.filter(KitMaster.current_status == "Needs Refill").count()

    items_under_repair_count = sum(1 for i in station_items if i.status == "Under Repair")
    low_stock_count = sum(1 for i in station_items if i.status == "Low Stock" or i.available_quantity <= i.minimum_stock)
    out_of_stock_count = sum(1 for i in station_items if i.status == "Out of Stock" or i.available_quantity == 0)

    now = datetime.utcnow()
    expiring_soon_count = sum(1 for i in station_items if i.expiry_date and now <= i.expiry_date <= (now + timedelta(days=30)))
    expired_count = sum(1 for i in station_items if i.expiry_date and i.expiry_date < now)

    tx_query = db.query(InventoryTransaction)
    if station_id:
        tx_query = tx_query.join(StationInventory).filter(StationInventory.station_id == station_id)
    disposed_assets_count = tx_query.filter(InventoryTransaction.transaction_type == "ADJUSTMENT").count()
    lost_equipment_count = tx_query.filter(InventoryTransaction.transaction_type == "DAMAGE").count()

    req_query = db.query(EquipmentRequest).filter(EquipmentRequest.status == "PENDING")
    if station_id:
        req_query = req_query.join(StationInventory).filter(StationInventory.station_id == station_id)
    pending_requests_count = req_query.count()

    asgn_query = db.query(EquipmentAssignment).filter(EquipmentAssignment.status == "ISSUED")
    if station_id:
        asgn_query = asgn_query.join(StationInventory).filter(StationInventory.station_id == station_id)
    pending_returns_count = asgn_query.count()

    transfer_query = db.query(InventoryTransfer).filter(InventoryTransfer.status == "PENDING_APPROVAL")
    if station_id:
        transfer_query = transfer_query.filter(
            or_(
                InventoryTransfer.source_station_id == station_id,
                InventoryTransfer.destination_station_id == station_id
            )
        )
    pending_transfers_count = transfer_query.count()

    recent_txs = get_inventory_transactions_list_filtered(db, station_id=station_id)[:20]

    return {
        "total_master_items": total_master_items,
        "total_stations": total_stations,
        "total_items_in_stock": total_in_stock,
        "total_items_reserved": total_reserved,
        "total_items_damaged": total_damaged,
        "permanent_assets_count": perm_count,
        "consumables_count": cons_count,
        "refillable_kits_count": refill_count,
        "pending_refills_count": pending_refills_count,
        "items_under_repair_count": items_under_repair_count,
        "low_stock_items_count": low_stock_count,
        "out_of_stock_items_count": out_of_stock_count,
        "disposed_assets_count": disposed_assets_count,
        "lost_equipment_count": lost_equipment_count,
        "pending_requests_count": pending_requests_count,
        "pending_returns_count": pending_returns_count,
        "expiring_soon_count": expiring_soon_count,
        "expired_count": expired_count,
        "pending_transfers_count": pending_transfers_count,
        "recent_transactions": recent_txs,
    }


def get_audit_logs_list(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None
) -> List[dict]:
    query = db.query(InventoryAuditLog)
    if user_id:
        query = query.filter(InventoryAuditLog.user_id == user_id)
    if action and action != "ALL":
        query = query.filter(InventoryAuditLog.action == action)
    if entity_type:
        query = query.filter(InventoryAuditLog.entity_type == entity_type)

    logs = query.order_by(InventoryAuditLog.timestamp.desc()).all()
    return [format_audit(l) for l in logs]
