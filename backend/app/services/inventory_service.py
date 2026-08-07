import math
import csv
import io
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
from app.models.district import District
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
        "procurement_type": getattr(cat, "procurement_type", "LOCAL_ALLOWED"),
        "active": getattr(cat, "active", True),
        "return_required": cat.return_required,
        "consumable": cat.consumable,
        "requires_refill": cat.requires_refill,
        "created_at": cat.created_at,
    }


def format_master_item(item: InventoryMaster) -> dict:
    cat_rel = item.category_rel
    item_type = item.item_type or "PERSONAL"
    if cat_rel:
        if cat_rel.consumable:
            item_type = "CONSUMABLE"
        elif cat_rel.requires_refill:
            item_type = "KIT"

    return {
        "id": item.id,
        "item_name": item.item_name,
        "item_code": item.item_code,
        "category": item.category,
        "category_id": item.category_id,
        "category_name": cat_rel.name if cat_rel else item.category,
        "procurement_type": getattr(cat_rel, "procurement_type", "LOCAL_ALLOWED") if cat_rel else "LOCAL_ALLOWED",
        "item_type": item_type,
        "item_usage_type": item.item_usage_type,
        "return_required": cat_rel.return_required if cat_rel else True,
        "consumable": cat_rel.consumable if cat_rel else False,
        "requires_refill": cat_rel.requires_refill if cat_rel else False,
        "unit": item.unit,
        "minimum_stock": item.minimum_stock,
        "minimum_stock_default": item.minimum_stock_default,
        "reorder_level": item.reorder_level,
        "description": item.description,
        "active": item.is_active,
        "is_active": item.is_active,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "created_by": item.created_by,
        "updated_by": item.updated_by,
        "creator_name": item.creator.full_name if item.creator else None,
        "updater_name": item.updater.full_name if item.updater else None,
    }


def format_station_inventory(inv: StationInventory) -> dict:
    district_id = inv.station.district_id if inv.station else None
    district_name = inv.station.district.district_name if (inv.station and inv.station.district) else None
    state_name = inv.station.district.state.state_name if (inv.station and inv.station.district and inv.station.district.state) else None

    master = inv.master_item
    cat_rel = master.category_rel if master else None
    item_type = master.item_type if master else "PERSONAL"
    item_usage_type = getattr(master, "item_usage_type", "CONSUMABLE" if item_type == "CONSUMABLE" else "RETURNABLE") if master else "RETURNABLE"

    avail = inv.available_quantity or 0
    reserved = inv.reserved_quantity or 0
    issued = inv.issued_quantity or 0
    damaged = inv.damaged_quantity or 0
    current_stock = avail + reserved + issued + damaged

    min_stock = inv.minimum_stock or (master.minimum_stock if master else 0)
    reorder_lvl = getattr(master, "reorder_level", 5) if master else 5
    max_cap = getattr(inv, "maximum_capacity", None) or getattr(master, "maximum_capacity", None) or (min_stock * 5 if min_stock > 0 else max(current_stock + 50, 100))

    proc_type = getattr(cat_rel, "procurement_type", "LOCAL_ALLOWED") if cat_rel else "LOCAL_ALLOWED"

    supplier_source = "HQ Allocation"
    if inv.transactions:
        last_tx = sorted(inv.transactions, key=lambda x: x.created_at, reverse=True)[0]
        if last_tx.vendor_name:
            supplier_source = f"Local: {last_tx.vendor_name}"
        elif last_tx.supplier:
            supplier_source = last_tx.supplier
        elif last_tx.allocation_reference:
            supplier_source = f"HQ: {last_tx.allocation_reference}"

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
        "procurement_type": proc_type,
        "return_required": cat_rel.return_required if cat_rel else (item_usage_type != "CONSUMABLE"),
        "consumable": cat_rel.consumable if cat_rel else (item_usage_type == "CONSUMABLE"),
        "requires_refill": cat_rel.requires_refill if cat_rel else (master.is_refillable if master else False),
        "unit": master.unit if master else "Units",
        "minimum_stock": min_stock,
        "maximum_capacity": max_cap,
        "reorder_level": reorder_lvl,
        "total_quantity": inv.total_quantity or current_stock,
        "current_quantity": current_stock,
        "current_stock": current_stock,
        "available_quantity": avail,
        "issued_quantity": issued,
        "reserved_quantity": reserved,
        "damaged_quantity": damaged,
        "supplier_source": supplier_source,
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
    category = "General"
    if asgn.station_inventory and asgn.station_inventory.master_item:
        item_name = asgn.station_inventory.master_item.item_name
        unit = asgn.station_inventory.master_item.unit
        category = asgn.station_inventory.master_item.category or "General"

    days_remaining = "Completed"
    if asgn.status in ["ISSUED", "PENDING_RETURN"]:
        if getattr(asgn, "item_usage_type", "RETURNABLE") == "PERSONAL" or not asgn.expected_return_date:
            days_remaining = "Permanent Issue"
        else:
            diff_days = (asgn.expected_return_date.date() - datetime.utcnow().date()).days
            if diff_days > 0:
                days_remaining = f"{diff_days} Days Remaining"
            elif diff_days == 0:
                days_remaining = "Due Today"
            else:
                days_remaining = f"Overdue {abs(diff_days)} Days"

    prev_returns = []
    if hasattr(asgn, "returns") and asgn.returns:
        for r in asgn.returns:
            prev_returns.append({
                "id": r.id,
                "return_date": r.return_date.isoformat() if r.return_date else None,
                "condition": getattr(r, "condition", "Good"),
                "remarks": r.remarks,
            })

    return {
        "id": asgn.id,
        "station_inventory_id": asgn.station_inventory_id,
        "item_name": item_name,
        "category": category,
        "unit": unit,
        "guard_id": asgn.guard_id,
        "guard_name": asgn.guard.full_name if asgn.guard else None,
        "guard_badge": getattr(asgn.guard, "badge_number", None) if asgn.guard else None,
        "quantity": asgn.quantity,
        "issued_by": asgn.issued_by,
        "issuer_name": asgn.issuer.full_name if asgn.issuer else "Officer",
        "issue_date": asgn.issue_date.isoformat() if asgn.issue_date else None,
        "expected_return": asgn.expected_return_date.isoformat() if asgn.expected_return_date else None,
        "actual_return": asgn.returned_date.isoformat() if asgn.returned_date else None,
        "assignment_type": getattr(asgn, "assignment_type", "MISSION"),
        "item_usage_type": getattr(asgn, "item_usage_type", "RETURNABLE"),
        "condition": getattr(asgn, "condition", "Good") or "Good",
        "status": asgn.status,
        "days_remaining": days_remaining,
        "purpose": asgn.purpose,
        "remarks": asgn.remarks,
        "previous_returns": prev_returns,
    }


def format_return(ret: EquipmentReturn) -> dict:
    item_name = None
    unit = None
    category = "General"
    guard_id = None
    guard_name = None
    guard_badge = None
    issue_date = None

    if ret.assignment:
        guard_id = ret.assignment.guard_id
        issue_date = ret.assignment.issue_date.isoformat() if ret.assignment.issue_date else None
        if ret.assignment.guard:
            guard_name = ret.assignment.guard.full_name
            guard_badge = getattr(ret.assignment.guard, "badge_number", None)
        if ret.assignment.station_inventory and ret.assignment.station_inventory.master_item:
            item_name = ret.assignment.station_inventory.master_item.item_name
            unit = ret.assignment.station_inventory.master_item.unit
            category = ret.assignment.station_inventory.master_item.category or "General"

    return {
        "id": ret.id,
        "equipment_assignment_id": ret.equipment_assignment_id,
        "item_name": item_name,
        "category": category,
        "unit": unit,
        "guard_id": guard_id,
        "guard_name": guard_name,
        "guard_badge": guard_badge,
        "issue_date": issue_date,
        "condition": ret.condition,
        "reason": ret.reason,
        "remarks": ret.remarks,
        "photos": ret.photos,
        "status": ret.status,
        "submitted_date": ret.submitted_date.isoformat() if ret.submitted_date else None,
        "verified_by": ret.verified_by,
        "verifier_name": ret.verifier.full_name if ret.verifier else None,
        "verified_at": ret.verified_at.isoformat() if ret.verified_at else None,
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
    user_name = log.user.full_name if log.user else "System User"
    user_role = log.user_role or (log.user.role if log.user else "User")
    officer_str = f"{user_name} ({user_role})"
    equipment_str = f"{log.entity_type} #{log.entity_id}" if log.entity_id else log.entity_type
    reason_str = log.new_value or log.old_value or "Standard Operation"
    device_str = "Gaia Station Console (Windows / Web)"

    return {
        "id": log.id,
        "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        "action": log.action,
        "user_id": log.user_id,
        "officer": officer_str,
        "user_name": user_name,
        "user_role": user_role,
        "equipment": equipment_str,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "before_value": log.old_value or "N/A",
        "after_value": log.new_value or "N/A",
        "reason": reason_str,
        "ip_address": log.ip_address or "127.0.0.1",
        "device": device_str,
        "status": "SUCCESS",
    }


def get_audit_logs_filtered(
    db: Session,
    station_id: Optional[int] = None,
    search: Optional[str] = None,
    action: Optional[str] = None
) -> List[dict]:
    query = db.query(InventoryAuditLog)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            (InventoryAuditLog.action.ilike(term)) |
            (InventoryAuditLog.entity_type.ilike(term)) |
            (InventoryAuditLog.new_value.ilike(term)) |
            (InventoryAuditLog.old_value.ilike(term))
        )
    if action and action != "ALL":
        query = query.filter(InventoryAuditLog.action == action)

    logs = query.order_by(InventoryAuditLog.timestamp.desc()).all()
    return [format_audit(l) for l in logs]


def export_audit_logs_csv(db: Session, search: Optional[str] = None, action: Optional[str] = None) -> str:
    logs = get_audit_logs_filtered(db=db, search=search, action=action)
    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output)
    writer.writerow([
        "Timestamp",
        "Action",
        "Officer",
        "Equipment",
        "Before Value",
        "After Value",
        "Reason",
        "IP",
        "Device",
        "Status"
    ])

    for log in logs:
        writer.writerow([
            log.get("timestamp") or "",
            log.get("action") or "",
            log.get("officer") or "",
            log.get("equipment") or "",
            log.get("before_value") or "",
            log.get("after_value") or "",
            log.get("reason") or "",
            log.get("ip_address") or "127.0.0.1",
            log.get("device") or "Gaia Station Console",
            log.get("status") or "SUCCESS",
        ])

    return output.getvalue()


def delete_audit_log(log_id: int, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot delete audit logs.")

    log_entry = db.query(InventoryAuditLog).filter(InventoryAuditLog.id == log_id).first()
    if not log_entry:
        raise HTTPException(status_code=404, detail="Audit log entry not found.")

    db.delete(log_entry)
    db.commit()
    return {"status": "success", "message": "Audit log entry deleted successfully."}


def delete_audit_logs_batch(log_ids: List[int], current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot delete audit logs.")

    if not log_ids:
        raise HTTPException(status_code=400, detail="No audit log IDs provided.")

    records = db.query(InventoryAuditLog).filter(InventoryAuditLog.id.in_(log_ids)).all()
    deleted_count = len(records)
    for r in records:
        db.delete(r)

    db.commit()
    return {"status": "success", "message": f"Deleted {deleted_count} audit log entries.", "deleted_count": deleted_count}


def delete_all_audit_logs(current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot delete audit logs.")

    records = db.query(InventoryAuditLog).all()
    deleted_count = len(records)
    for r in records:
        db.delete(r)

    db.commit()
    return {"status": "success", "message": f"Purged all {deleted_count} audit log entries.", "deleted_count": deleted_count}


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


def create_inventory_master(data: InventoryMasterCreate, current_user: Optional[User], db: Session) -> dict:
    name_clean = data.item_name.strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Item name cannot be empty.")

    if data.minimum_stock <= 0:
        raise HTTPException(status_code=400, detail="Minimum stock threshold must be greater than zero.")

    existing = db.query(InventoryMaster).filter(
        func.lower(InventoryMaster.item_name) == name_clean.lower()
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Inventory item already exists.")

    # Match or create category
    cat_id = data.category_id
    cat_name = data.category.strip() if data.category else "Electronics"
    if cat_id:
        cat_obj = db.query(InventoryCategory).filter(InventoryCategory.id == cat_id).first()
        if cat_obj:
            cat_name = cat_obj.name
    else:
        cat_obj = db.query(InventoryCategory).filter(
            func.lower(InventoryCategory.name) == cat_name.lower()
        ).first()
        if cat_obj:
            cat_id = cat_obj.id
        else:
            cat_obj = InventoryCategory(name=cat_name, active=True)
            db.add(cat_obj)
            db.flush()
            cat_id = cat_obj.id

    desc_clean = data.description.strip() if data.description and data.description.strip() else None
    unit_clean = data.unit.strip() if data.unit and data.unit.strip() else "Units"

    master = InventoryMaster(
        item_name=name_clean,
        item_code=data.item_code.strip() if data.item_code else None,
        category=cat_name,
        category_id=cat_id,
        item_type=data.item_type.upper().strip() if data.item_type else "PERSONAL",
        item_usage_type=data.item_usage_type.upper().strip() if data.item_usage_type else "RETURNABLE",
        unit=unit_clean,
        minimum_stock=data.minimum_stock,
        minimum_stock_default=data.minimum_stock_default or data.minimum_stock,
        reorder_level=data.reorder_level,
        is_refillable=data.is_refillable,
        expiry_date=data.expiry_date,
        manufacture_date=data.manufacture_date,
        batch_number=data.batch_number,
        description=desc_clean,
        active=data.active,
        is_active=data.active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        created_by=current_user.id if current_user else None,
        updated_by=current_user.id if current_user else None,
    )
    db.add(master)

    log_audit(
        db=db,
        user=current_user,
        action="Created Master Definition",
        entity_type="inventory_master",
    )

    db.commit()
    db.refresh(master)
    return format_master_item(master)


def update_inventory_master(master_id: int, data: InventoryMasterUpdate, current_user: Optional[User], db: Session) -> dict:
    master = db.query(InventoryMaster).filter(InventoryMaster.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master item not found.")

    if data.item_name is not None:
        name_clean = data.item_name.strip()
        if not name_clean:
            raise HTTPException(status_code=400, detail="Item name cannot be empty.")

        existing = db.query(InventoryMaster).filter(
            func.lower(InventoryMaster.item_name) == name_clean.lower(),
            InventoryMaster.id != master_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Inventory item already exists.")
        master.item_name = name_clean

    if data.minimum_stock is not None:
        if data.minimum_stock <= 0:
            raise HTTPException(status_code=400, detail="Minimum stock threshold must be greater than zero.")
        master.minimum_stock = data.minimum_stock

    if data.category_id is not None or data.category is not None:
        cat_id = data.category_id
        cat_name = data.category.strip() if data.category else None
        if cat_id:
            cat_obj = db.query(InventoryCategory).filter(InventoryCategory.id == cat_id).first()
            if cat_obj:
                master.category_id = cat_obj.id
                master.category = cat_obj.name
        elif cat_name:
            cat_obj = db.query(InventoryCategory).filter(
                func.lower(InventoryCategory.name) == cat_name.lower()
            ).first()
            if cat_obj:
                master.category_id = cat_obj.id
                master.category = cat_obj.name
            else:
                master.category = cat_name

    if data.unit is not None:
        unit_clean = data.unit.strip()
        if not unit_clean:
            raise HTTPException(status_code=400, detail="Unit cannot be empty.")
        master.unit = unit_clean

    if data.item_code is not None:
        master.item_code = data.item_code.strip() if data.item_code else None
    if data.item_type is not None:
        master.item_type = data.item_type.upper().strip()
    if data.item_usage_type is not None:
        master.item_usage_type = data.item_usage_type.upper().strip()
    if data.expiry_date is not None:
        master.expiry_date = data.expiry_date
    if data.manufacture_date is not None:
        master.manufacture_date = data.manufacture_date
    if data.batch_number is not None:
        master.batch_number = data.batch_number
    if data.description is not None:
        master.description = data.description.strip() if data.description and data.description.strip() else None

    target_active = data.is_active if data.is_active is not None else data.active
    if target_active is not None:
        master.active = target_active
        master.is_active = target_active

    master.updated_at = datetime.utcnow()
    if current_user:
        master.updated_by = current_user.id

    log_audit(
        db=db,
        user=current_user,
        action="Updated Master Definition",
        entity_type="inventory_master",
        entity_id=master.id,
    )

    db.commit()
    db.refresh(master)
    return format_master_item(master)


def delete_inventory_master(master_id: int, current_user: Optional[User], db: Session) -> dict:
    master = db.query(InventoryMaster).filter(InventoryMaster.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master item not found.")

    # Check references in StationInventory, EquipmentRequest, KitMaster
    st_inv_ref = db.query(StationInventory).filter(StationInventory.inventory_master_id == master_id).first()
    req_ref = db.query(EquipmentRequest).filter(EquipmentRequest.inventory_master_id == master_id).first()
    kit_ref = db.query(KitMaster).filter(KitMaster.inventory_master_id == master_id).first()

    if st_inv_ref or req_ref or kit_ref:
        raise HTTPException(status_code=400, detail="This inventory item is already in use and cannot be deleted.")

    item_name = master.item_name
    db.delete(master)

    log_audit(
        db=db,
        user=current_user,
        action=f"Deleted Master Definition '{item_name}'",
        entity_type="inventory_master",
        entity_id=master_id,
    )

    db.commit()
    return {"message": "Inventory item permanently deleted."}


def toggle_inventory_master_status(master_id: int, current_user: Optional[User], db: Session) -> dict:
    master = db.query(InventoryMaster).filter(InventoryMaster.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master item not found.")

    new_status = not master.is_active
    master.is_active = new_status
    master.active = new_status
    master.updated_at = datetime.utcnow()
    if current_user:
        master.updated_by = current_user.id

    action_label = "Enabled" if new_status else "Disabled"
    log_audit(
        db=db,
        user=current_user,
        action=f"{action_label} Master Definition",
        entity_type="inventory_master",
        entity_id=master.id,
    )

    db.commit()
    db.refresh(master)
    return format_master_item(master)


def get_master_catalog_summary(db: Session) -> dict:
    total_items = db.query(InventoryMaster).count()
    active_items = db.query(InventoryMaster).filter(InventoryMaster.is_active == True).count()
    disabled_items = db.query(InventoryMaster).filter(InventoryMaster.is_active == False).count()

    all_masters = db.query(InventoryMaster).all()

    refillable_kits = 0
    consumables = 0
    electronics = 0

    cats = db.query(InventoryCategory).all()
    categories_counts = {}

    for m in all_masters:
        cat_name = (m.category_rel.name if m.category_rel else m.category or "").strip()
        cat_lower = cat_name.lower()

        # Count Refillable Kits
        if "refill" in cat_lower or "kit" in cat_lower or m.is_refillable or (m.category_rel and m.category_rel.requires_refill) or (m.item_type and m.item_type.upper() == "KIT"):
            refillable_kits += 1
        # Count Consumables
        elif "consumable" in cat_lower or (m.category_rel and m.category_rel.consumable) or (m.item_type and m.item_type.upper() == "CONSUMABLE") or (m.item_usage_type and m.item_usage_type.upper() == "CONSUMABLE"):
            consumables += 1
        # Count Electronics / Tech
        elif any(k in cat_lower for k in ["electronic", "surveillance", "communication", "optics", "lighting", "tech", "device", "asset"]):
            electronics += 1

    # Exact/Fuzzy Category Counts Map
    for c in cats:
        cnt = 0
        c_stem = c.name.lower().rstrip('s')
        for m in all_masters:
            cat_name = (m.category_rel.name if m.category_rel else m.category or "").strip().lower()
            if cat_name == c.name.lower() or cat_name.rstrip('s') == c_stem:
                cnt += 1
        categories_counts[c.name] = cnt

    return {
        "total_items": total_items,
        "active_items": active_items,
        "disabled_items": disabled_items,
        "refillable_kits": refillable_kits,
        "consumables": consumables,
        "electronics": electronics,
        "categories_counts": categories_counts
    }


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
        query = query.filter(
            or_(
                InventoryMaster.category.ilike(category),
                InventoryMaster.category_rel.has(InventoryCategory.name.ilike(category))
            )
        )
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                InventoryMaster.item_name.ilike(term),
                InventoryMaster.item_code.ilike(term),
                InventoryMaster.unit.ilike(term),
                InventoryMaster.description.ilike(term),
                InventoryMaster.category.ilike(term),
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

    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Stock addition quantity must be a positive integer greater than zero.")

    target_station_id = data.station_id or current_user.station_id
    if not target_station_id:
        raise HTTPException(status_code=400, detail="Station ID is required.")

    master = db.query(InventoryMaster).filter(InventoryMaster.id == data.inventory_master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master inventory item not found.")

    cat_rel = master.category_rel
    procurement_type = getattr(cat_rel, "procurement_type", "LOCAL_ALLOWED") if cat_rel else "LOCAL_ALLOWED"

    # Enforce Procurement Source Rules
    if procurement_type == "ADMIN_ONLY" and data.procurement_source == "LOCAL_PURCHASE":
        raise HTTPException(
            status_code=400,
            detail=f"Category '{cat_rel.name if cat_rel else master.category}' is restricted to Headquarters Allocation only. Local purchase is prohibited."
        )

    if data.procurement_source == "LOCAL_PURCHASE":
        if not data.vendor_name or not data.vendor_name.strip():
            raise HTTPException(status_code=400, detail="Vendor Name is required for Local Purchase.")
        if not data.invoice_number or not data.invoice_number.strip():
            raise HTTPException(status_code=400, detail="Invoice Number is required for Local Purchase.")
        if not data.purchase_date:
            raise HTTPException(status_code=400, detail="Purchase Date is required for Local Purchase.")
    elif data.procurement_source == "HQ_ALLOCATION" or procurement_type == "ADMIN_ONLY":
        if not data.allocation_reference or not data.allocation_reference.strip():
            raise HTTPException(status_code=400, detail="Allocation Reference Number is required for Headquarters Allocation.")

    st_inv = db.query(StationInventory).filter(
        StationInventory.station_id == target_station_id,
        StationInventory.inventory_master_id == data.inventory_master_id,
    ).first()

    qty_before = st_inv.available_quantity if st_inv else 0
    min_stk = st_inv.minimum_stock if st_inv else master.minimum_stock
    max_capacity = min_stk * 5 if min_stk > 0 else 1000

    if st_inv:
        curr_stock = (st_inv.available_quantity or 0) + (st_inv.reserved_quantity or 0) + (st_inv.issued_quantity or 0) + (st_inv.damaged_quantity or 0)
        if curr_stock + data.quantity > max_capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock addition of {data.quantity} units exceeds maximum station capacity ({max_capacity} units). Current stock: {curr_stock}."
            )

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

    tx_type = "LOCAL_PURCHASE" if data.procurement_source == "LOCAL_PURCHASE" else "HQ_ALLOCATION"
    tx_remarks = data.remarks or f"Stock added via {tx_type}: +{data.quantity} {master.unit}"

    tx = InventoryTransaction(
        station_inventory_id=st_inv.id,
        transaction_type=tx_type,
        quantity_before=qty_before,
        quantity_changed=data.quantity,
        quantity_after=qty_after,
        quantity=data.quantity,
        performed_by=current_user.id,
        supplier=data.supplier or data.vendor_name,
        vendor_name=data.vendor_name,
        invoice_number=data.invoice_number,
        purchase_date=data.purchase_date,
        purchase_cost=data.purchase_cost,
        gst_tax=data.gst_tax,
        allocation_reference=data.allocation_reference,
        received_date=data.received_date or datetime.utcnow(),
        admin_dispatch_number=data.admin_dispatch_number,
        remarks=tx_remarks,
    )
    db.add(tx)

    log_audit(
        db=db,
        user=current_user,
        action=f"Stock Added ({tx_type})",
        entity_type="station_inventory",
        entity_id=st_inv.id,
        old_value=str(qty_before),
        new_value=str(qty_after),
    )

    db.commit()
    db.refresh(st_inv)
    return format_station_inventory(st_inv)


def create_hq_stock_request(data: HQStockRequestCreate, current_user: User, db: Session) -> dict:
    if data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Stock request quantity must be a positive integer.")

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

    if not st_inv:
        st_inv = StationInventory(
            station_id=target_station_id,
            inventory_master_id=data.inventory_master_id,
            total_quantity=0,
            current_quantity=0,
            available_quantity=0,
            issued_quantity=0,
            reserved_quantity=0,
            damaged_quantity=0,
            minimum_stock=master.minimum_stock,
            status="Out of Stock",
            updated_by=current_user.id,
        )
        db.add(st_inv)
        db.flush()

    req = EquipmentRequest(
        guard_id=current_user.id,
        station_inventory_id=st_inv.id,
        inventory_master_id=master.id,
        request_type="HQ_STOCK_REQUEST",
        quantity=data.quantity,
        purpose=data.reason,
        priority=data.priority.upper(),
        status="PENDING",
        expected_date=data.expected_date,
        remarks=data.remarks,
    )
    db.add(req)

    log_audit(
        db=db,
        user=current_user,
        action="HQ Stock Request Submitted",
        entity_type="equipment_request",
        entity_id=st_inv.id,
        new_value=f"Requested {data.quantity} units of {master.item_name}",
    )

    db.commit()
    db.refresh(req)
    return {
        "id": req.id,
        "item_name": master.item_name,
        "quantity": req.quantity,
        "priority": req.priority,
        "status": req.status,
        "requested_at": req.requested_at.isoformat() if req.requested_at else None,
        "message": "Stock request successfully submitted to Headquarters."
    }


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


def batch_issue_equipment(data: BatchIssueEquipmentSchema, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot directly issue equipment.")

    guard = db.query(User).filter(User.id == data.guard_id, User.role == "Forest Guard").first()
    if not guard:
        raise HTTPException(status_code=404, detail="Forest Guard not found.")

    if not data.items:
        raise HTTPException(status_code=400, detail="At least one equipment item must be selected for issuance.")

    created_assignments = []
    issued_item_names = []

    for item in data.items:
        st_inv = db.query(StationInventory).filter(StationInventory.id == item.station_inventory_id).first()
        if not st_inv:
            raise HTTPException(status_code=404, detail=f"Station inventory item #{item.station_inventory_id} not found.")

        if st_inv.available_quantity < item.quantity:
            item_name = st_inv.master_item.item_name if st_inv.master_item else f"Item #{st_inv.id}"
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient available stock for '{item_name}'. Requested: {item.quantity}, Available: {st_inv.available_quantity}."
            )

        qty_before = st_inv.available_quantity
        st_inv.available_quantity -= item.quantity
        st_inv.issued_quantity = (st_inv.issued_quantity or 0) + item.quantity
        st_inv.status = calculate_stock_status(st_inv.available_quantity, st_inv.minimum_stock, 5)

        master = st_inv.master_item
        item_name = master.item_name if master else "Equipment"
        issued_item_names.append(f"{item.quantity}x {item_name}")

        purpose_str = item.purpose or data.mission_name or data.overall_purpose or "Field Patrol Assignment"
        remarks_str = item.remarks or data.remarks

        asgn = EquipmentAssignment(
            station_inventory_id=st_inv.id,
            guard_id=guard.id,
            quantity=item.quantity,
            issued_by=current_user.id,
            issue_date=datetime.utcnow(),
            expected_return_date=item.expected_return_date,
            assignment_type="MISSION" if item.usage_type == "Temporary" else "PERSONAL",
            item_usage_type="RETURNABLE" if item.usage_type == "Temporary" else "PERSONAL",
            status="ISSUED",
            purpose=purpose_str,
            remarks=remarks_str,
        )
        db.add(asgn)
        db.flush()

        log_inventory_transaction(
            db=db,
            st_inv=st_inv,
            tx_type="ISSUE",
            qty_before=qty_before,
            qty_changed=-item.quantity,
            qty_after=st_inv.available_quantity,
            performed_by=current_user.id,
            assigned_to=guard.id,
            ref_table="equipment_assignments",
            ref_id=asgn.id,
            remarks=remarks_str or f"Issued {item.quantity} units to Guard {guard.full_name}.",
        )

        log_audit(
            db=db,
            user=current_user,
            action="Issued Equipment",
            entity_type="equipment_assignments",
            entity_id=asgn.id,
        )

        created_assignments.append(asgn)

    summary_list_str = ", ".join(issued_item_names)
    notif = Notification(
        user_id=guard.id,
        title="Equipment Issued",
        message=f"You have been issued: {summary_list_str} by Officer {current_user.full_name}.",
    )
    db.add(notif)

    db.commit()

    return {
        "status": "success",
        "message": "Equipment Issued Successfully",
        "issued_items_count": len(created_assignments),
        "guard_name": guard.full_name,
        "guard_id": guard.id,
    }


def verify_returned_equipment_options(
    assignment_id: int,
    data: ReturnVerificationRequest,
    current_user: User,
    db: Session
) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot verify equipment returns directly.")

    asgn = db.query(EquipmentAssignment).filter(EquipmentAssignment.id == assignment_id).first()
    if not asgn:
        raise HTTPException(status_code=404, detail="Equipment assignment record not found.")

    st_inv = db.query(StationInventory).filter(StationInventory.id == asgn.station_inventory_id).first()
    if not st_inv:
        raise HTTPException(status_code=404, detail="Station inventory item not found.")

    cond = (data.condition or "Good").strip()
    remarks_str = (data.remarks or "").strip()
    if not remarks_str:
        raise HTTPException(status_code=400, detail="Officer verification remarks are mandatory.")

    now = datetime.utcnow()
    asgn.returned_date = now
    asgn.verified_by = current_user.id
    asgn.condition = cond
    asgn.remarks = f"{asgn.remarks or ''} | Verified: {cond} - {remarks_str}".strip(" | ")

    qty_before = st_inv.available_quantity
    item_name = st_inv.master_item.item_name if st_inv.master_item else "Equipment"

    if cond == "Good":
        asgn.status = "RETURNED"
        st_inv.available_quantity += asgn.quantity
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        tx_type = "RETURN"
    elif cond == "Minor Damage":
        asgn.status = "RETURNED_DAMAGED"
        st_inv.available_quantity += asgn.quantity
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        tx_type = "RETURN_DAMAGED"
    elif cond == "Major Damage":
        asgn.status = "DAMAGED"
        st_inv.damaged_quantity = (st_inv.damaged_quantity or 0) + asgn.quantity
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        tx_type = "DAMAGED"
    elif cond == "Lost":
        asgn.status = "LOST"
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        tx_type = "LOST"
    else:
        asgn.status = "RETURNED"
        st_inv.available_quantity += asgn.quantity
        st_inv.issued_quantity = max(0, (st_inv.issued_quantity or 0) - asgn.quantity)
        tx_type = "RETURN"

    st_inv.status = calculate_stock_status(st_inv.available_quantity, st_inv.minimum_stock, 5)

    log_inventory_transaction(
        db=db,
        st_inv=st_inv,
        tx_type=tx_type,
        qty_before=qty_before,
        qty_changed=asgn.quantity if cond in ["Good", "Minor Damage"] else 0,
        qty_after=st_inv.available_quantity,
        performed_by=current_user.id,
        assigned_to=asgn.guard_id,
        ref_table="equipment_assignments",
        ref_id=asgn.id,
        remarks=f"Return Verified ({cond}): {remarks_str}",
    )

    log_audit(
        db=db,
        user=current_user,
        action=f"Return Verified ({cond})",
        entity_type="equipment_assignments",
        entity_id=asgn.id,
    )

    if asgn.guard_id:
        notif = Notification(
            user_id=asgn.guard_id,
            title="Equipment Return Verified",
            message=f"Your returned equipment ({asgn.quantity}x {item_name}) has been verified as '{cond}' by Officer {current_user.full_name}.",
        )
        db.add(notif)

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


def delete_equipment_return_history(return_id: int, current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot delete return history.")

    ret = db.query(EquipmentReturn).filter(EquipmentReturn.id == return_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Return history record not found.")

    db.delete(ret)
    log_audit(
        db=db,
        user=current_user,
        action="Deleted Return History Record",
        entity_type="equipment_returns",
        entity_id=return_id,
    )
    db.commit()
    return {"status": "success", "message": "Return history record deleted successfully."}


def delete_equipment_returns_batch(return_ids: List[int], current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot delete return history.")

    if not return_ids:
        raise HTTPException(status_code=400, detail="No return history IDs provided.")

    records = db.query(EquipmentReturn).filter(EquipmentReturn.id.in_(return_ids)).all()
    deleted_count = len(records)
    for r in records:
        db.delete(r)

    log_audit(
        db=db,
        user=current_user,
        action=f"Deleted {deleted_count} Return History Records",
        entity_type="equipment_returns",
        entity_id=0,
    )
    db.commit()
    return {"status": "success", "message": f"Deleted {deleted_count} return history records.", "deleted_count": deleted_count}


def delete_all_equipment_returns_history(station_id: Optional[int], current_user: User, db: Session) -> dict:
    if current_user.role == "Admin":
        raise HTTPException(status_code=403, detail="Admins cannot delete return history.")

    target_station = station_id or current_user.station_id
    query = db.query(EquipmentReturn).join(EquipmentAssignment).join(StationInventory)
    if target_station:
        query = query.filter(StationInventory.station_id == target_station)

    query = query.filter(EquipmentReturn.status != "Pending Verification", EquipmentReturn.status != "PENDING_RETURN")
    records = query.all()
    deleted_count = len(records)
    for r in records:
        db.delete(r)

    log_audit(
        db=db,
        user=current_user,
        action=f"Purged All Return History ({deleted_count} records)",
        entity_type="equipment_returns",
        entity_id=0,
    )
    db.commit()
    return {"status": "success", "message": f"Purged all {deleted_count} return history records.", "deleted_count": deleted_count}


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


def calculate_stock_status_badge(available: int, minimum_stock: int, reserved: int, damaged: int, total: int) -> str:
    if available == 0:
        return "Out Of Stock"
    elif available <= minimum_stock:
        return "Low Stock"
    elif damaged > 0 and (total == 0 or available < total * 0.3):
        return "Damaged"
    elif reserved > available:
        return "Critical"
    else:
        return "Optimal Stock"


def get_admin_inventory_overview(db: Session) -> dict:
    # 1. Total Stocked Items Card
    all_inventories = db.query(StationInventory).all()
    total_quantity_across_stations = sum(inv.total_quantity for inv in all_inventories)
    total_stations_count = db.query(MonitoringStation).count()
    stocked_stations_count = len(set(inv.station_id for inv in all_inventories))

    # 2. Low Stock Items Card
    low_stock_records = [inv for inv in all_inventories if inv.available_quantity <= inv.minimum_stock or inv.available_quantity == 0]
    low_stock_count = len(low_stock_records)
    low_stock_stations_count = len(set(inv.station_id for inv in low_stock_records))

    # 3. Equipment Assigned Card
    active_assignments = db.query(EquipmentAssignment).filter(EquipmentAssignment.status == "ISSUED").all()
    active_assignments_count = len(active_assignments)
    equipped_guards_count = len(set(asgn.guard_id for asgn in active_assignments if asgn.guard_id))

    # 4. Damaged Equipment Card
    total_damaged_quantity = sum(inv.damaged_quantity for inv in all_inventories)
    damaged_records = db.query(DamagedEquipment).all()
    under_repair_count = sum(1 for d in damaged_records if d.status in ["REPORTED", "UNDER_REPAIR", "SENT_FOR_REPAIR"])
    awaiting_disposal_count = sum(1 for d in damaged_records if d.status in ["UNREPAIRABLE", "PENDING_DISPOSAL"])

    # 5. Station Summaries (Inventory Balance by Station)
    stations = db.query(MonitoringStation).all()
    station_summaries = []
    for st in stations:
        st_items = [inv for inv in all_inventories if inv.station_id == st.id]
        st_avail = sum(i.available_quantity for i in st_items)
        st_res = sum(i.reserved_quantity for i in st_items)
        st_dam = sum(i.damaged_quantity for i in st_items)
        st_low = sum(1 for i in st_items if i.available_quantity <= i.minimum_stock or i.available_quantity == 0)
        st_total = sum(i.total_quantity for i in st_items)

        if st_low > 3 or (st_avail == 0 and len(st_items) > 0):
            health_status = "Critical"
        elif st_low > 0 or st_dam > 0:
            health_status = "Needs Attention"
        else:
            health_status = "Healthy"

        station_summaries.append({
            "station_id": st.id,
            "station_name": st.station_name,
            "district_id": st.district_id,
            "district_name": st.district.district_name if st.district else "Wayanad",
            "state_id": st.district.state_id if (st.district and hasattr(st.district, "state_id")) else 1,
            "state_name": st.district.state.state_name if (st.district and st.district.state) else "Kerala",
            "total_items": len(st_items),
            "total_quantity": st_total,
            "available_quantity": st_avail,
            "reserved_quantity": st_res,
            "damaged_quantity": st_dam,
            "low_stock_alerts": st_low,
            "health_status": health_status,
        })

    # 6. Inventory Distribution by Category
    categories = db.query(InventoryCategory).all()
    category_summary = []
    grand_total_qty = total_quantity_across_stations or 1

    for cat in categories:
        cat_items = [
            inv for inv in all_inventories
            if inv.master_item and (
                inv.master_item.category_id == cat.id or
                (inv.master_item.category and inv.master_item.category.lower().rstrip('s') == cat.name.lower().rstrip('s'))
            )
        ]
        master_item_ids = set(inv.inventory_master_id for inv in cat_items)
        cat_total_qty = sum(inv.total_quantity for inv in cat_items)
        share_percentage = round((cat_total_qty / grand_total_qty) * 100, 1)

        category_summary.append({
            "category_id": cat.id,
            "category_name": cat.name,
            "master_items_count": len(master_item_ids),
            "total_quantity": cat_total_qty,
            "share_percentage": share_percentage,
        })

    return {
        "cards": {
            "total_stocked_items": total_quantity_across_stations,
            "stocked_stations_count": stocked_stations_count,
            "total_stations_count": total_stations_count,
            "low_stock_items_count": low_stock_count,
            "low_stock_stations_count": low_stock_stations_count,
            "equipment_assigned_count": active_assignments_count,
            "guards_equipped_count": equipped_guards_count,
            "damaged_quantity": total_damaged_quantity,
            "under_repair_count": under_repair_count,
            "awaiting_disposal_count": awaiting_disposal_count,
        },
        "station_summaries": station_summaries,
        "category_summary": category_summary,
    }


def get_admin_paginated_station_inventory(
    db: Session,
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    station_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> dict:
    query = db.query(StationInventory).join(MonitoringStation).join(InventoryMaster)

    if station_id and station_id != 0:
        query = query.filter(StationInventory.station_id == station_id)
    elif district_id and district_id != 0:
        query = query.filter(MonitoringStation.district_id == district_id)
    elif state_id and state_id != 0:
        query = query.join(District, MonitoringStation.district_id == District.id).filter(District.state_id == state_id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MonitoringStation.station_name.ilike(term),
                InventoryMaster.item_name.ilike(term),
                InventoryMaster.category.ilike(term),
                InventoryMaster.description.ilike(term),
            )
        )

    total_records = query.count()
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 1
    offset = (page - 1) * page_size

    items = query.order_by(MonitoringStation.station_name.asc(), InventoryMaster.item_name.asc()).offset(offset).limit(page_size).all()

    formatted_items = []
    for inv in items:
        st = inv.station
        dt = st.district if st else None
        st_state = dt.state if dt else None
        master = inv.master_item

        status_badge = calculate_stock_status_badge(
            available=inv.available_quantity,
            minimum_stock=inv.minimum_stock,
            reserved=inv.reserved_quantity,
            damaged=inv.damaged_quantity,
            total=inv.total_quantity
        )

        formatted_items.append({
            "id": inv.id,
            "station_id": inv.station_id,
            "station_name": st.station_name if st else "Unknown Station",
            "district_id": st.district_id if st else None,
            "district_name": dt.district_name if dt else "Wayanad",
            "state_id": dt.state_id if dt else 1,
            "state_name": st_state.state_name if st_state else "Kerala",
            "inventory_master_id": inv.inventory_master_id,
            "item_name": master.item_name if master else "Unknown Item",
            "category": master.category if master else "General",
            "unit": master.unit if master else "Units",
            "total_quantity": inv.total_quantity,
            "available_quantity": inv.available_quantity,
            "reserved_quantity": inv.reserved_quantity,
            "damaged_quantity": inv.damaged_quantity,
            "minimum_stock": inv.minimum_stock,
            "stock_status": status_badge,
        })

    return {
        "items": formatted_items,
        "total_records": total_records,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_rfo_inventory_dashboard(db: Session, current_user: User) -> dict:
    station_id = current_user.station_id
    if not station_id:
        st = db.query(MonitoringStation).first()
        station_id = st.id if st else 1

    st_invs = db.query(StationInventory).filter(StationInventory.station_id == station_id).all()

    # 1. Total Inventory Items
    total_inventory_items = len(st_invs)

    # 2. Total Available Stock
    total_available_stock = sum(inv.available_quantity for inv in st_invs)

    # 3. Currently Issued Equipment
    issued_assignments = db.query(EquipmentAssignment).join(StationInventory).filter(
        StationInventory.station_id == station_id,
        EquipmentAssignment.status == "ISSUED"
    ).all()
    currently_issued_equipment = sum(asgn.quantity for asgn in issued_assignments)

    # 4. Pending Equipment Requests
    pending_equipment_requests = db.query(EquipmentRequest).join(StationInventory).filter(
        StationInventory.station_id == station_id,
        EquipmentRequest.status == "PENDING",
        EquipmentRequest.request_type != "HQ_STOCK_REQUEST"
    ).count()

    # 5. Low Stock Items
    low_stock_items = sum(1 for inv in st_invs if inv.available_quantity > 0 and inv.available_quantity <= inv.minimum_stock)

    # 6. Out of Stock Items
    out_of_stock_items = sum(1 for inv in st_invs if inv.available_quantity == 0)

    # 7. Returned Today
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    returned_today = db.query(EquipmentAssignment).join(StationInventory).filter(
        StationInventory.station_id == station_id,
        EquipmentAssignment.status == "RETURNED",
        EquipmentAssignment.returned_date >= start_of_today
    ).count()

    # 8. Locally Purchased Items (This Month)
    start_of_month = datetime(now.year, now.month, 1)
    local_txs = db.query(InventoryTransaction).join(StationInventory).filter(
        StationInventory.station_id == station_id,
        InventoryTransaction.transaction_type == "LOCAL_PURCHASE",
        InventoryTransaction.created_at >= start_of_month
    ).all()
    locally_purchased_this_month = sum(tx.quantity for tx in local_txs)

    # 9. HQ Requested Items Pending
    hq_requested_pending = db.query(EquipmentRequest).join(StationInventory).filter(
        StationInventory.station_id == station_id,
        EquipmentRequest.request_type == "HQ_STOCK_REQUEST",
        EquipmentRequest.status == "PENDING"
    ).count()

    # 10. Damaged Items
    damaged_items = sum(inv.damaged_quantity for inv in st_invs)

    # Grouped Inventory by Category
    categories = db.query(InventoryCategory).all()
    grouped_categories = []

    for cat in categories:
        cat_items = [
            inv for inv in st_invs
            if inv.master_item and (
                inv.master_item.category_id == cat.id or
                (inv.master_item.category and inv.master_item.category.lower().rstrip('s') == cat.name.lower().rstrip('s'))
            )
        ]

        if not cat_items:
            continue

        item_rows = []
        cat_available_sum = 0
        cat_total_sum = 0

        for inv in cat_items:
            master = inv.master_item
            cat_available_sum += inv.available_quantity
            cat_total_sum += inv.total_quantity

            item_issued_qty = sum(
                asgn.quantity for asgn in issued_assignments if asgn.station_inventory_id == inv.id
            )

            status_badge = calculate_stock_status_badge(
                available=inv.available_quantity,
                minimum_stock=inv.minimum_stock,
                reserved=inv.reserved_quantity,
                damaged=inv.damaged_quantity,
                total=inv.total_quantity
            )

            last_tx = db.query(InventoryTransaction).filter(
                InventoryTransaction.station_inventory_id == inv.id
            ).order_by(InventoryTransaction.created_at.desc()).first()

            supplier_source = "HQ Allocation"
            if last_tx:
                if last_tx.vendor_name:
                    supplier_source = f"Local: {last_tx.vendor_name}"
                elif last_tx.supplier:
                    supplier_source = last_tx.supplier
                elif last_tx.allocation_reference:
                    supplier_source = f"HQ: {last_tx.allocation_reference}"

            item_rows.append({
                "id": inv.id,
                "inventory_master_id": inv.inventory_master_id,
                "equipment_name": master.item_name if master else "Unknown Equipment",
                "category": master.category if master else cat.name,
                "unit": master.unit if master else "Units",
                "available": inv.available_quantity,
                "reserved": inv.reserved_quantity,
                "issued": item_issued_qty,
                "damaged": inv.damaged_quantity,
                "minimum_level": inv.minimum_stock,
                "current_stock": inv.current_quantity,
                "total_stock": inv.total_quantity,
                "stock_status": status_badge,
                "last_updated": inv.last_updated.isoformat() if inv.last_updated else None,
                "supplier_source": supplier_source,
            })

        grouped_categories.append({
            "category_id": cat.id,
            "category_name": cat.name,
            "procurement_type": getattr(cat, "procurement_type", "LOCAL_ALLOWED"),
            "items_count": len(cat_items),
            "total_available": cat_available_sum,
            "total_quantity": cat_total_sum,
            "items": item_rows,
        })

    recent_tx_records = db.query(InventoryTransaction).join(StationInventory).filter(
        StationInventory.station_id == station_id
    ).order_by(InventoryTransaction.created_at.desc()).limit(10).all()

    recent_updates = [format_transaction(tx) for tx in recent_tx_records]

    return {
        "cards": {
            "total_inventory_items": total_inventory_items,
            "total_available_stock": total_available_stock,
            "currently_issued_equipment": currently_issued_equipment,
            "pending_equipment_requests": pending_equipment_requests,
            "low_stock_items": low_stock_items,
            "out_of_stock_items": out_of_stock_items,
            "returned_today": returned_today,
            "locally_purchased_this_month": locally_purchased_this_month,
            "hq_requested_pending": hq_requested_pending,
            "damaged_items": damaged_items,
        },
        "grouped_categories": grouped_categories,
        "recent_updates": recent_updates,
    }
