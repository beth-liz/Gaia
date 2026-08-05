from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.deps import get_db
from app.models.user import User
from app.utils.deps import (
    get_current_user,
    get_current_admin,
    get_current_rfo,
    get_current_guard,
    get_current_officer_or_admin,
)
from app.schemas.inventory import (
    InventoryCategoryCreate,
    InventoryCategoryResponse,
    InventoryMasterCreate,
    InventoryMasterUpdate,
    InventoryMasterResponse,
    StationInventoryAddStock,
    StationInventoryUpdateQuantity,
    StationInventoryResponse,
    InventoryTransactionResponse,
    EquipmentRequestCreate,
    EquipmentRequestAction,
    DirectIssueEquipmentRequest,
    EquipmentRequestResponse,
    ReturnEquipmentRequest,
    ReturnVerificationRequest,
    DamagedEquipmentCreate,
    DamagedActionRequest,
    DamagedEquipmentResponse,
    EquipmentAssignmentResponse,
    KitMasterResponse,
    KitInspectionCreate,
    KitInspectionResponse,
    KitRefillCreate,
    KitRefillResponse,
    InventoryAdjustmentCreate,
    EquipmentLossReportCreate,
    EquipmentLossReportAction,
    EquipmentLossReportResponse,
    EquipmentReturnCreate,
    EquipmentReturnVerifyAction,
    EquipmentReturnResponse,
    RepairStatusUpdate,
    InventoryTransferCreate,
    InventoryTransferAction,
    InventoryTransferResponse,
    InventoryAuditLogResponse,
    InventorySummaryReportResponse,
)
from app.services import inventory_service

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory Management"]
)


# ==========================================
# CATEGORY MANAGEMENT (PART 2)
# ==========================================

@router.get(
    "/categories",
    response_model=List[InventoryCategoryResponse],
    summary="List all inventory categories"
)
def list_categories(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return inventory_service.get_categories_list(db=db)


@router.post(
    "/categories",
    response_model=InventoryCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new inventory category (Admin Only)"
)
def create_category(
    data: InventoryCategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return inventory_service.create_category(data=data, db=db)


# ==========================================
# MASTER INVENTORY CATALOG (ADMIN WRITE, ALL READ)
# ==========================================

@router.post(
    "/master",
    response_model=InventoryMasterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new master inventory item definition (Admin Only)"
)
def create_master_item(
    data: InventoryMasterCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return inventory_service.create_inventory_master(data, db)


@router.put(
    "/master/{master_id}",
    response_model=InventoryMasterResponse,
    summary="Update a master inventory item definition (Admin Only)"
)
def update_master_item(
    master_id: int,
    data: InventoryMasterUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return inventory_service.update_inventory_master(master_id, data, db)


@router.patch(
    "/master/{master_id}/toggle",
    response_model=InventoryMasterResponse,
    summary="Toggle active/inactive status of a master inventory item (Admin Only)"
)
def toggle_master_item_status(
    master_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return inventory_service.toggle_inventory_master_status(master_id, db)


@router.get(
    "/master",
    response_model=List[InventoryMasterResponse],
    summary="List all master inventory catalog items"
)
def list_master_items(
    category: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return inventory_service.list_inventory_masters(
        db=db,
        category=category,
        search=search,
        active_only=active_only
    )


# ==========================================
# STATION INVENTORY MANAGEMENT (RFO WRITE, ADMIN READ)
# ==========================================

@router.get(
    "/station/{station_id}",
    response_model=List[StationInventoryResponse],
    summary="Get inventory stock levels for a specific station"
)
def get_station_inventory(
    station_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    return inventory_service.get_station_inventory_list(db=db, station_id=station_id)


@router.get(
    "/my-station",
    response_model=List[StationInventoryResponse],
    summary="Get inventory stock levels for current user's assigned station"
)
def get_my_station_inventory(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if not user.station_id:
        return []
    return inventory_service.get_station_inventory_list(db=db, station_id=user.station_id)


@router.get(
    "/all-stations",
    response_model=List[StationInventoryResponse],
    summary="Get inventory stock levels across all stations (Admin / RFO)"
)
def get_all_stations_inventory(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    return inventory_service.get_station_inventory_list(db=db, station_id=None)


@router.post(
    "/station/add-stock",
    response_model=StationInventoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add stock quantity to station inventory (Range Forest Officer Only)"
)
def add_station_stock(
    data: StationInventoryAddStock,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.add_stock_to_station(data=data, current_user=rfo, db=db)


@router.put(
    "/station-items/{station_inventory_id}/quantity",
    response_model=StationInventoryResponse,
    summary="Update available quantity for a station inventory item (Range Forest Officer Only)"
)
def update_stock_quantity(
    station_inventory_id: int,
    data: StationInventoryUpdateQuantity,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.update_station_inventory_quantity(
        station_inventory_id=station_inventory_id,
        data=data,
        current_user=rfo,
        db=db
    )


# ==========================================
# REFILLABLE KITS ENDPOINTS
# ==========================================

@router.get(
    "/kits",
    response_model=List[KitMasterResponse],
    summary="List station refillable kits (Admin / RFO)"
)
def get_kits(
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or (user.station_id if user.role != "Admin" else None)
    return inventory_service.get_station_kits_list(db=db, station_id=target_station)


@router.post(
    "/kits/{kit_id}/inspect",
    response_model=KitMasterResponse,
    summary="Inspect a refillable kit and mark missing components (RFO Only)"
)
def inspect_kit(
    kit_id: int,
    data: KitInspectionCreate,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.inspect_refillable_kit(
        kit_id=kit_id,
        data=data,
        inspector_user=rfo,
        db=db
    )


@router.post(
    "/kits/{kit_id}/refill",
    response_model=KitMasterResponse,
    summary="Refill missing components of a kit and restore Available status (RFO Only)"
)
def refill_kit(
    kit_id: int,
    data: KitRefillCreate,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.refill_refillable_kit(
        kit_id=kit_id,
        data=data,
        refiller_user=rfo,
        db=db
    )


# ==========================================
# EQUIPMENT REQUESTS & ASSIGNMENT WORKFLOW
# ==========================================

@router.post(
    "/requests",
    response_model=EquipmentRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Request equipment from station inventory (Forest Guard)"
)
def request_equipment(
    data: EquipmentRequestCreate,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_guard)
):
    return inventory_service.create_equipment_request(data=data, current_guard=guard, db=db)


@router.get(
    "/requests/my-requests",
    response_model=List[EquipmentRequestResponse],
    summary="Get equipment requests submitted by current guard"
)
def get_my_equipment_requests(
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_guard)
):
    return inventory_service.list_equipment_requests(db=db, guard_id=guard.id)


@router.get(
    "/requests/station",
    response_model=List[EquipmentRequestResponse],
    summary="Get station equipment requests (RFO / Admin)"
)
def get_station_equipment_requests(
    station_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or user.station_id if user.role != "Admin" else station_id
    return inventory_service.list_equipment_requests(
        db=db,
        station_id=target_station,
        status_filter=status_filter
    )


@router.post(
    "/requests/{request_id}/approve-reject",
    response_model=EquipmentRequestResponse,
    summary="Approve or Reject an equipment request (Range Forest Officer Only)"
)
def approve_or_reject_request(
    request_id: int,
    data: EquipmentRequestAction,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.approve_or_reject_equipment_request(
        request_id=request_id,
        data=data,
        current_user=rfo,
        db=db
    )


@router.post(
    "/assignments/direct-issue",
    summary="Directly issue equipment to a Forest Guard (Range Forest Officer Only)"
)
def direct_issue_equipment(
    data: DirectIssueEquipmentRequest,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.direct_issue_equipment(data=data, current_user=rfo, db=db)


# ==========================================
# ASSIGNMENTS, RETURNS & DAMAGED ACTIONS
# ==========================================

@router.get(
    "/assignments/my-assignments",
    response_model=List[EquipmentAssignmentResponse],
    summary="Get active equipment assignments for current guard"
)
def get_my_assignments(
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_guard)
):
    return inventory_service.list_equipment_assignments(db=db, guard_id=guard.id)


@router.get(
    "/assignments/station",
    response_model=List[EquipmentAssignmentResponse],
    summary="Get station equipment assignments (RFO / Admin)"
)
def get_station_assignments(
    station_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or user.station_id if user.role != "Admin" else station_id
    return inventory_service.list_equipment_assignments(
        db=db,
        station_id=target_station,
        status_filter=status_filter
    )


@router.put(
    "/assignments/{assignment_id}/verify-return",
    response_model=EquipmentAssignmentResponse,
    summary="Verify returned equipment with Accept, Mark Damaged, or Reject options (RFO Only)"
)
def verify_return_options(
    assignment_id: int,
    data: ReturnVerificationRequest,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.verify_returned_equipment_options(
        assignment_id=assignment_id,
        data=data,
        current_user=rfo,
        db=db
    )


@router.post(
    "/station-items/{station_inventory_id}/damaged-action",
    response_model=StationInventoryResponse,
    summary="Perform repair, replace, or discard action on damaged equipment (RFO Only)"
)
def damaged_equipment_action(
    station_inventory_id: int,
    data: DamagedActionRequest,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.handle_damaged_equipment_action(
        station_inventory_id=station_inventory_id,
        data=data,
        current_user=rfo,
        db=db
    )


@router.post(
    "/adjustments",
    response_model=StationInventoryResponse,
    summary="Create a formal stock adjustment with mandatory reason logging (RFO Only)"
)
def create_stock_adjustment(
    data: InventoryAdjustmentCreate,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.create_stock_adjustment(data=data, current_user=rfo, db=db)


@router.post(
    "/loss-reports",
    response_model=EquipmentLossReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report lost equipment (Guard / Officer)"
)
def report_loss(
    data: EquipmentLossReportCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return inventory_service.report_equipment_loss(
        assignment_id=data.assignment_id,
        reason=data.reason,
        mission=data.mission,
        current_user=user,
        db=db
    )


@router.post(
    "/returns",
    response_model=EquipmentReturnResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an equipment return (Forest Guard)"
)
def submit_return(
    data: EquipmentReturnCreate,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_guard)
):
    return inventory_service.submit_equipment_return(data=data, current_user=guard, db=db)


@router.get(
    "/returns/station",
    response_model=List[EquipmentReturnResponse],
    summary="Get station equipment return submissions (RFO / Admin)"
)
def list_returns(
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or (user.station_id if user.role != "Admin" else None)
    return inventory_service.list_equipment_returns(db=db, station_id=target_station)


@router.post(
    "/returns/{return_id}/verify",
    response_model=EquipmentReturnResponse,
    summary="Verify equipment return with Accept, Repair, or Write-Off (RFO Only)"
)
def verify_return(
    return_id: int,
    data: EquipmentReturnVerifyAction,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.verify_equipment_return(return_id=return_id, data=data, current_user=rfo, db=db)


@router.get(
    "/repairs",
    response_model=List[DamagedEquipmentResponse],
    summary="List damaged items in repair management"
)
def list_repairs(
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or (user.station_id if user.role != "Admin" else None)
    return inventory_service.list_damaged_repairs(db=db, station_id=target_station)


@router.patch(
    "/repairs/{damaged_id}/status",
    response_model=DamagedEquipmentResponse,
    summary="Update repair status (Waiting, Repairing, Completed, Scrapped) (RFO Only)"
)
def update_repair_status(
    damaged_id: int,
    data: RepairStatusUpdate,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.update_repair_status(damaged_id=damaged_id, data=data, current_user=rfo, db=db)


@router.post(
    "/transfers",
    response_model=InventoryTransferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate inter-station inventory transfer (RFO Only)"
)
def create_transfer(
    data: InventoryTransferCreate,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.create_inventory_transfer(data=data, current_user=rfo, db=db)


@router.get(
    "/transfers",
    response_model=List[InventoryTransferResponse],
    summary="List inter-station transfers"
)
def list_transfers(
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or (user.station_id if user.role != "Admin" else None)
    return inventory_service.list_inventory_transfers(db=db, station_id=target_station)


@router.post(
    "/transfers/{transfer_id}/process",
    response_model=InventoryTransferResponse,
    summary="Process transfer action (APPROVE, DISPATCH, RECEIVE, REJECT) (RFO Only)"
)
def process_transfer(
    transfer_id: int,
    data: InventoryTransferAction,
    db: Session = Depends(get_db),
    rfo: User = Depends(get_current_rfo)
):
    return inventory_service.process_inventory_transfer(transfer_id=transfer_id, data=data, current_user=rfo, db=db)


@router.get(
    "/audit-logs",
    response_model=List[InventoryAuditLogResponse],
    summary="Get system-wide inventory audit logs (Admin / RFO)"
)
def get_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    return inventory_service.get_audit_logs_list(db=db, user_id=user_id, action=action, entity_type=entity_type)

@router.get(
    "/transactions/filtered",
    response_model=List[InventoryTransactionResponse],
    summary="Get filtered inventory transaction audit logs (Admin / RFO)"
)
def get_transactions_filtered(
    station_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    officer_id: Optional[int] = None,
    equipment_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or user.station_id if user.role != "Admin" else station_id
    s_date = datetime.fromisoformat(start_date) if start_date else None
    e_date = datetime.fromisoformat(end_date) if end_date else None

    return inventory_service.get_inventory_transactions_list_filtered(
        db=db,
        station_id=target_station,
        transaction_type=transaction_type,
        start_date=s_date,
        end_date=e_date,
        officer_id=officer_id,
        equipment_id=equipment_id,
        search_term=search
    )


@router.get(
    "/reports/summary",
    response_model=InventorySummaryReportResponse,
    summary="Get overall inventory summary report and dashboard metrics"
)
def get_summary_report(
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_officer_or_admin)
):
    target_station = station_id or user.station_id if user.role != "Admin" else station_id
    return inventory_service.get_inventory_summary_report(db=db, station_id=target_station)
