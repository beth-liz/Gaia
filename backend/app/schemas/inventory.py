from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ==========================================
# CATEGORY SCHEMAS
# ==========================================

class InventoryCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    procurement_type: str = Field("LOCAL_ALLOWED", description="LOCAL_ALLOWED or ADMIN_ONLY")
    active: bool = True
    return_required: bool = True
    consumable: bool = False
    requires_refill: bool = False


class InventoryCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    procurement_type: str = "LOCAL_ALLOWED"
    active: bool = True
    return_required: bool = True
    consumable: bool = False
    requires_refill: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# MASTER CATALOG SCHEMAS
# ==========================================

class InventoryMasterCreate(BaseModel):
    item_name: str = Field(..., min_length=2, max_length=100)
    item_code: Optional[str] = Field(None, max_length=50)
    category: str = Field("Electronics", min_length=2, max_length=50)
    category_id: Optional[int] = None
    item_type: str = Field("PERSONAL", description="PERSONAL, CONSUMABLE, KIT")
    item_usage_type: str = Field("RETURNABLE", description="RETURNABLE, CONSUMABLE")
    unit: str = Field("Units", min_length=1, max_length=20)
    minimum_stock: int = Field(0, ge=0)
    minimum_stock_default: int = Field(0, ge=0)
    reorder_level: int = Field(5, ge=0)
    is_refillable: bool = False
    expiry_date: Optional[datetime] = None
    manufacture_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    description: Optional[str] = None
    active: bool = True


class InventoryMasterUpdate(BaseModel):
    item_name: Optional[str] = None
    item_code: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[int] = None
    item_type: Optional[str] = None
    item_usage_type: Optional[str] = None
    unit: Optional[str] = None
    minimum_stock: Optional[int] = None
    minimum_stock_default: Optional[int] = None
    reorder_level: Optional[int] = None
    is_refillable: Optional[bool] = None
    expiry_date: Optional[datetime] = None
    manufacture_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    is_active: Optional[bool] = None


class InventoryMasterResponse(BaseModel):
    id: int
    item_name: str
    item_code: Optional[str] = None
    category: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    item_type: str = "PERSONAL"
    item_usage_type: str = "RETURNABLE"
    return_required: bool = True
    consumable: bool = False
    requires_refill: bool = False
    is_refillable: bool = False
    expiry_date: Optional[datetime] = None
    manufacture_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    unit: str
    minimum_stock: int
    minimum_stock_default: int = 0
    reorder_level: int = 5
    description: Optional[str] = None
    active: bool = True
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    creator_name: Optional[str] = None
    updater_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# STATION INVENTORY & ADJUSTMENT SCHEMAS
# ==========================================

class StationInventoryAddStock(BaseModel):
    station_id: Optional[int] = None
    inventory_master_id: int
    quantity: int = Field(..., gt=0, le=100000)
    procurement_source: str = Field("LOCAL_PURCHASE", description="LOCAL_PURCHASE or HQ_ALLOCATION")
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    purchase_date: Optional[datetime] = None
    purchase_cost: Optional[float] = None
    gst_tax: Optional[float] = None
    allocation_reference: Optional[str] = None
    received_date: Optional[datetime] = None
    admin_dispatch_number: Optional[str] = None
    supplier: Optional[str] = None
    remarks: Optional[str] = None


class HQStockRequestCreate(BaseModel):
    inventory_master_id: int
    station_id: Optional[int] = None
    quantity: int = Field(..., gt=0, le=100000)
    priority: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH")
    reason: str = Field(..., min_length=3)
    expected_date: Optional[datetime] = None
    remarks: Optional[str] = None


class StationInventoryUpdateQuantity(BaseModel):
    available_quantity: int = Field(..., ge=0)
    reason: str = Field("Correction", description="Issued, Damaged, Lost, Expired, Transferred, Correction, Maintenance, Return, Purchase, Write-off")
    remarks: str = Field(..., min_length=3)


class InventoryAdjustmentCreate(BaseModel):
    station_inventory_id: int
    new_quantity: int = Field(..., ge=0)
    reason: str = Field(..., description="Issued, Damaged, Lost, Expired, Transferred, Correction, Maintenance, Return, Purchase, Write-off")
    remarks: Optional[str] = None


class InventoryAdjustmentResponse(BaseModel):
    id: int
    station_inventory_id: int
    item_name: Optional[str] = None
    current_quantity: int
    new_quantity: int
    difference: int
    reason: str
    remarks: Optional[str] = None
    submitted_by: int
    submitter_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StationInventoryResponse(BaseModel):
    id: int
    station_id: int
    station_name: Optional[str] = None
    district_id: Optional[int] = None
    district_name: Optional[str] = None
    state_name: Optional[str] = None
    inventory_master_id: int
    item_name: Optional[str] = None
    item_code: Optional[str] = None
    item_type: Optional[str] = "PERSONAL"
    item_usage_type: Optional[str] = "RETURNABLE"
    category: Optional[str] = None
    category_id: Optional[int] = None
    return_required: bool = True
    consumable: bool = False
    requires_refill: bool = False
    unit: Optional[str] = None
    minimum_stock: int = 0
    maximum_capacity: int = 100
    reorder_level: int = 5
    total_quantity: int = 0
    current_quantity: int = 0
    current_stock: int = 0
    available_quantity: int = 0
    issued_quantity: int = 0
    reserved_quantity: int = 0
    damaged_quantity: int = 0
    supplier_source: Optional[str] = "HQ Allocation"
    procurement_type: str = "LOCAL_ALLOWED"
    expiry_date: Optional[datetime] = None
    manufacture_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    status: str
    last_updated: datetime
    updated_by: Optional[int] = None
    updater_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# INVENTORY TRANSACTION SCHEMAS
# ==========================================

class InventoryTransactionResponse(BaseModel):
    id: int
    station_inventory_id: int
    item_name: Optional[str] = None
    station_name: Optional[str] = None
    transaction_type: str
    quantity_before: Optional[int] = None
    quantity_changed: Optional[int] = None
    quantity_after: Optional[int] = None
    quantity: int = 0
    reference_table: Optional[str] = None
    reference_id: Optional[int] = None
    performed_by: int
    performer_name: Optional[str] = None
    assigned_to: Optional[int] = None
    assignee_name: Optional[str] = None
    supplier: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# EQUIPMENT REQUEST & ISSUE SCHEMAS
# ==========================================

class EquipmentRequestCreate(BaseModel):
    station_inventory_id: Optional[int] = None
    inventory_master_id: Optional[int] = None
    requested_quantity: Optional[int] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, gt=0)
    reason: Optional[str] = None
    purpose: Optional[str] = None
    priority: str = Field("MEDIUM", description="LOW, MEDIUM, HIGH")


class EquipmentRequestAction(BaseModel):
    action: str = Field(..., description="APPROVED or REJECTED")
    rejection_reason: Optional[str] = None


class DirectIssueEquipmentRequest(BaseModel):
    guard_id: int
    station_inventory_id: int
    quantity: int = Field(..., gt=0)
    assignment_type: str = Field("MISSION", description="PERSONAL, MISSION")
    item_usage_type: str = Field("RETURNABLE", description="RETURNABLE, CONSUMABLE")
    expected_return_date: Optional[datetime] = None
    purpose: Optional[str] = None
    remarks: Optional[str] = None


class IssueEquipmentItemSchema(BaseModel):
    station_inventory_id: int
    quantity: int = Field(..., gt=0)
    usage_type: str = Field("Temporary", description="Temporary or Permanent")
    expected_return_date: Optional[datetime] = None
    purpose: Optional[str] = None
    remarks: Optional[str] = None


class BatchIssueEquipmentSchema(BaseModel):
    guard_id: int
    items: List[IssueEquipmentItemSchema] = Field(..., min_items=1)
    mission_name: Optional[str] = None
    overall_purpose: Optional[str] = None
    remarks: Optional[str] = None


class EquipmentRequestResponse(BaseModel):
    id: int
    guard_id: int
    guard_name: Optional[str] = None
    station_inventory_id: Optional[int] = None
    inventory_master_id: Optional[int] = None
    item_name: Optional[str] = None
    unit: Optional[str] = None
    station_name: Optional[str] = None
    requested_quantity: int
    quantity: int
    reason: Optional[str] = None
    purpose: Optional[str] = None
    priority: str = "MEDIUM"
    status: str
    requested_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    approver_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# EQUIPMENT ASSIGNMENT & RETURN SCHEMAS
# ==========================================

class EquipmentReturnCreate(BaseModel):
    equipment_assignment_id: int
    condition: str = Field("Good", description="Excellent, Good, Repair Needed, Broken, Lost")
    reason: str = Field("Normal Return", description="Normal Return, Damaged, Lost, Consumed")
    remarks: Optional[str] = None
    photos: Optional[str] = None


class ReturnEquipmentRequest(BaseModel):
    equipment_assignment_id: Optional[int] = None
    remarks: Optional[str] = None
    condition: Optional[str] = "Good"
    reason: Optional[str] = "Normal Return"


class EquipmentReturnVerifyAction(BaseModel):
    action: str = Field(..., description="ACCEPT, REPAIR, WRITE_OFF, or REJECT")
    remarks: Optional[str] = None


class ReturnVerificationRequest(BaseModel):
    condition: str = Field("Good", description="Good, Minor Damage, Major Damage, Lost")
    remarks: str = Field(..., min_length=2, description="Mandatory officer verification remarks")
    action: Optional[str] = Field("ACCEPT", description="ACCEPT, REPAIR, WRITE_OFF, or REJECT")
    damaged_quantity: Optional[int] = 0


class EquipmentReturnResponse(BaseModel):
    id: int
    equipment_assignment_id: int
    item_name: Optional[str] = None
    unit: Optional[str] = None
    guard_id: Optional[int] = None
    guard_name: Optional[str] = None
    condition: str
    reason: str
    remarks: Optional[str] = None
    photos: Optional[str] = None
    status: str
    submitted_date: datetime
    verified_by: Optional[int] = None
    verifier_name: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EquipmentAssignmentResponse(BaseModel):
    id: int
    station_inventory_id: int
    item_name: Optional[str] = None
    unit: Optional[str] = None
    guard_id: int
    guard_name: Optional[str] = None
    quantity: int
    issued_by: int
    issuer_name: Optional[str] = None
    issue_date: datetime
    expected_return: Optional[datetime] = None
    actual_return: Optional[datetime] = None
    assignment_type: str = "MISSION"
    item_usage_type: str = "RETURNABLE"
    status: str
    purpose: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# DAMAGED & REPAIR SCHEMAS
# ==========================================

class DamagedEquipmentCreate(BaseModel):
    assignment_id: Optional[int] = None
    station_inventory_id: int
    damage_type: Optional[str] = None
    damage_severity: str = Field("Minor", description="Minor, Repairable, Major, Beyond Repair")
    damage_description: Optional[str] = None
    photo: Optional[str] = None
    repairable: bool = True
    remarks: Optional[str] = None


class DamagedActionRequest(BaseModel):
    action: str = Field(..., description="REPAIR, REPLACE, or DISCARD")
    quantity: int = Field(..., gt=0)
    remarks: Optional[str] = None


class RepairStatusUpdate(BaseModel):
    status: str = Field(..., description="Waiting, Repairing, Completed, Scrapped")
    repair_cost: Optional[int] = Field(0, ge=0)
    remarks: Optional[str] = None


class EquipmentLossReportCreate(BaseModel):
    assignment_id: Optional[int] = None
    station_inventory_id: int
    reason: str = Field(..., min_length=3)
    mission: Optional[str] = None
    photo: Optional[str] = None
    remarks: Optional[str] = None


class EquipmentLossReportAction(BaseModel):
    action: str = Field(..., description="APPROVED or REJECTED")
    remarks: Optional[str] = None


class EquipmentLossReportResponse(BaseModel):
    id: int
    assignment_id: Optional[int] = None
    station_inventory_id: int
    item_name: Optional[str] = None
    reported_by: int
    reporter_name: Optional[str] = None
    reason: str
    mission: Optional[str] = None
    photo: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    reported_at: datetime
    processed_at: Optional[datetime] = None
    processed_by: Optional[int] = None
    processor_name: Optional[str] = None

    class Config:
        from_attributes = True


class KitInspectionCreate(BaseModel):
    missing_components: Optional[str] = None
    remarks: Optional[str] = None


class KitMasterResponse(BaseModel):
    id: int
    kit_number: str
    kit_name: Optional[str] = None
    inventory_master_id: int
    item_name: Optional[str] = None
    station_id: int
    station_name: Optional[str] = None
    current_status: str
    last_refilled_date: Optional[datetime] = None
    next_inspection_date: Optional[datetime] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KitInspectionResponse(BaseModel):
    id: int
    kit_id: int
    inspected_by: int
    inspector_name: Optional[str] = None
    inspection_date: datetime
    status_result: str
    missing_components: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class KitRefillCreate(BaseModel):
    items_refilled: str = Field(..., min_length=3)
    remarks: Optional[str] = None


class KitRefillResponse(BaseModel):
    id: int
    kit_id: int
    refilled_by: int
    refiller_name: Optional[str] = None
    refill_date: datetime
    items_refilled: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class KitRefillRequestCreate(BaseModel):
    guard_kit_assignment_id: int
    items_requested: Optional[str] = None
    remarks: Optional[str] = None


class KitRefillRequestAction(BaseModel):
    action: str = Field(..., description="APPROVED, PARTIAL, or REJECTED")
    items_refilled: Optional[str] = None
    remarks: Optional[str] = None


class KitRefillRequestResponse(BaseModel):
    id: int
    guard_kit_assignment_id: int
    kit_name: Optional[str] = None
    requested_by: int
    requester_name: Optional[str] = None
    status: str
    items_requested: Optional[str] = None
    remarks: Optional[str] = None
    requested_at: datetime
    processed_at: Optional[datetime] = None
    processed_by: Optional[int] = None
    processor_name: Optional[str] = None

    class Config:
        from_attributes = True


class DamagedEquipmentResponse(BaseModel):
    id: int
    assignment_id: Optional[int] = None
    station_inventory_id: int
    item_name: Optional[str] = None
    reported_by: int
    reporter_name: Optional[str] = None
    damage_type: Optional[str] = None
    damage_severity: str = "Minor"
    damage_description: Optional[str] = None
    photo: Optional[str] = None
    repairable: bool
    repair_cost: int = 0
    repair_status: str
    remarks: Optional[str] = None
    reported_at: datetime
    repaired_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==========================================
# INTER-STATION TRANSFERS SCHEMAS
# ==========================================

class TransferItemCreate(BaseModel):
    inventory_master_id: int
    quantity: int = Field(..., gt=0)


class InventoryTransferCreate(BaseModel):
    destination_station_id: int
    items: List[TransferItemCreate]
    remarks: Optional[str] = None


class InventoryTransferAction(BaseModel):
    action: str = Field(..., description="APPROVE, DISPATCH, RECEIVE, or REJECT")
    remarks: Optional[str] = None


class TransferItemResponse(BaseModel):
    id: int
    transfer_id: int
    inventory_master_id: int
    item_name: Optional[str] = None
    quantity: int

    class Config:
        from_attributes = True


class InventoryTransferResponse(BaseModel):
    id: int
    transfer_number: str
    source_station_id: int
    source_station_name: Optional[str] = None
    destination_station_id: int
    destination_station_name: Optional[str] = None
    requested_by: int
    requester_name: Optional[str] = None
    approved_by: Optional[int] = None
    approver_name: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    created_at: datetime
    dispatched_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    items: List[TransferItemResponse] = []

    class Config:
        from_attributes = True


# ==========================================
# AUDIT LOG SCHEMAS
# ==========================================

class InventoryAuditLogResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_role: str
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


# ==========================================
# SUMMARY REPORT SCHEMA
# ==========================================

class InventorySummaryReportResponse(BaseModel):
    total_master_items: int
    total_stations: int
    total_items_in_stock: int
    total_items_reserved: int
    total_items_damaged: int
    permanent_assets_count: int = 0
    consumables_count: int = 0
    refillable_kits_count: int = 0
    pending_refills_count: int = 0
    items_under_repair_count: int = 0
    low_stock_items_count: int
    out_of_stock_items_count: int
    disposed_assets_count: int = 0
    lost_equipment_count: int = 0
    pending_requests_count: int
    pending_returns_count: int = 0
    expiring_soon_count: int = 0
    expired_count: int = 0
    pending_transfers_count: int = 0
    recent_transactions: List[InventoryTransactionResponse]

    class Config:
        from_attributes = True
