from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.base import Base


class InventoryCategory(Base):
    __tablename__ = "inventory_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    procurement_type = Column(String(30), default="LOCAL_ALLOWED", nullable=False)  # LOCAL_ALLOWED, ADMIN_ONLY
    active = Column(Boolean, default=True, nullable=False)
    return_required = Column(Boolean, default=True, nullable=False)
    consumable = Column(Boolean, default=False, nullable=False)
    requires_refill = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    master_items = relationship("InventoryMaster", back_populates="category_rel")


class InventoryMaster(Base):
    __tablename__ = "inventory_master"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String(100), unique=True, index=True, nullable=False)
    item_code = Column(String(50), unique=True, index=True, nullable=True)
    category = Column(String(50), nullable=False)  # Legacy string category fallback
    category_id = Column(Integer, ForeignKey("inventory_categories.id", ondelete="RESTRICT"), nullable=True)
    item_type = Column(String(30), default="PERSONAL", nullable=False)  # PERSONAL, CONSUMABLE, KIT
    item_usage_type = Column(String(20), default="RETURNABLE", nullable=False)  # RETURNABLE, CONSUMABLE
    unit = Column(String(20), nullable=False, default="Units")
    minimum_stock = Column(Integer, default=0, nullable=False)
    minimum_stock_default = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=5, nullable=False)
    is_refillable = Column(Boolean, default=False, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    manufacture_date = Column(DateTime, nullable=True)
    batch_number = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    total_quantity = Column(Integer, default=100, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    category_rel = relationship("InventoryCategory", back_populates="master_items", lazy="joined")
    creator = relationship("User", foreign_keys=[created_by], lazy="joined")
    updater = relationship("User", foreign_keys=[updated_by], lazy="joined")
    station_inventories = relationship("StationInventory", back_populates="master_item", cascade="all, delete-orphan")
    kits = relationship("KitMaster", back_populates="master_item", cascade="all, delete-orphan")


class StationInventory(Base):
    __tablename__ = "station_inventory"
    __table_args__ = (
        UniqueConstraint("station_id", "inventory_master_id", name="uq_station_master_item"),
    )

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_master_id = Column(Integer, ForeignKey("inventory_master.id", ondelete="CASCADE"), nullable=False, index=True)

    total_quantity = Column(Integer, default=0, nullable=False)
    current_quantity = Column(Integer, default=0, nullable=False)
    available_quantity = Column(Integer, default=0, nullable=False)
    issued_quantity = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0, nullable=False)
    damaged_quantity = Column(Integer, default=0, nullable=False)
    minimum_stock = Column(Integer, default=0, nullable=False)

    expiry_date = Column(DateTime, nullable=True)
    manufacture_date = Column(DateTime, nullable=True)
    batch_number = Column(String(50), nullable=True)

    status = Column(String(30), default="Available")  # Available, Issued, Returned, Needs Inspection, Needs Refill, Damaged, Under Repair, Disposed, Lost, Consumed, Low Stock
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    station = relationship("MonitoringStation", lazy="joined")
    master_item = relationship("InventoryMaster", back_populates="station_inventories", lazy="joined")
    updater = relationship("User", foreign_keys=[updated_by], lazy="joined")
    transactions = relationship("InventoryTransaction", back_populates="station_inventory", cascade="all, delete-orphan")
    requests = relationship("EquipmentRequest", back_populates="station_inventory", cascade="all, delete-orphan")
    assignments = relationship("EquipmentAssignment", back_populates="station_inventory", cascade="all, delete-orphan")
    damaged_records = relationship("DamagedEquipment", back_populates="station_inventory", cascade="all, delete-orphan")
    adjustments = relationship("InventoryAdjustment", back_populates="station_inventory", cascade="all, delete-orphan")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    station_inventory_id = Column(Integer, ForeignKey("station_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(30), nullable=False)  # STOCK_IN, ISSUE, RETURN, CONSUME, REFILL, TRANSFER, DAMAGE, REPAIR, ADJUSTMENT
    quantity_before = Column(Integer, nullable=True)
    quantity_changed = Column(Integer, nullable=True)
    quantity_after = Column(Integer, nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    reference_table = Column(String(50), nullable=True)
    reference_id = Column(Integer, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    supplier = Column(String(100), nullable=True)
    vendor_name = Column(String(100), nullable=True)
    invoice_number = Column(String(100), nullable=True)
    purchase_date = Column(DateTime, nullable=True)
    purchase_cost = Column(Float, nullable=True)
    gst_tax = Column(Float, nullable=True)
    allocation_reference = Column(String(100), nullable=True)
    received_date = Column(DateTime, nullable=True)
    admin_dispatch_number = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    station_inventory = relationship("StationInventory", back_populates="transactions")
    performer = relationship("User", foreign_keys=[performed_by], lazy="joined")
    assignee = relationship("User", foreign_keys=[assigned_to], lazy="joined")


class EquipmentRequest(Base):
    __tablename__ = "equipment_requests"

    id = Column(Integer, primary_key=True, index=True)
    guard_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    station_inventory_id = Column(Integer, ForeignKey("station_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_master_id = Column(Integer, ForeignKey("inventory_master.id", ondelete="CASCADE"), nullable=True)
    request_type = Column(String(30), default="GUARD_REQUEST", nullable=False)  # GUARD_REQUEST, HQ_STOCK_REQUEST
    quantity = Column(Integer, nullable=False)
    purpose = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH
    status = Column(String(30), default="PENDING")  # PENDING, APPROVED, REJECTED, CANCELLED, ISSUED, ALLOCATED
    expected_date = Column(DateTime, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    # Relationships
    guard = relationship("User", foreign_keys=[guard_id], lazy="joined")
    approver = relationship("User", foreign_keys=[approved_by], lazy="joined")
    station_inventory = relationship("StationInventory", back_populates="requests", lazy="joined")
    master_item = relationship("InventoryMaster", lazy="joined")


class EquipmentAssignment(Base):
    __tablename__ = "equipment_assignments"

    id = Column(Integer, primary_key=True, index=True)
    station_inventory_id = Column(Integer, ForeignKey("station_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    guard_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    issued_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    issue_date = Column(DateTime, default=datetime.utcnow)
    expected_return_date = Column(DateTime, nullable=True)
    returned_date = Column(DateTime, nullable=True)
    assignment_type = Column(String(20), default="MISSION", nullable=False)  # PERSONAL, MISSION
    item_usage_type = Column(String(20), default="RETURNABLE", nullable=False)  # RETURNABLE, CONSUMABLE
    status = Column(String(30), default="ISSUED")  # ISSUED, RETURNED, LOST, DAMAGED, CONSUMED, TRANSFERRED
    purpose = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    # Relationships
    station_inventory = relationship("StationInventory", back_populates="assignments", lazy="joined")
    guard = relationship("User", foreign_keys=[guard_id], lazy="joined")
    issuer = relationship("User", foreign_keys=[issued_by], lazy="joined")
    damaged_reports = relationship("DamagedEquipment", back_populates="assignment", cascade="all, delete-orphan")
    loss_reports = relationship("EquipmentLossReport", back_populates="assignment", cascade="all, delete-orphan")
    returns = relationship("EquipmentReturn", back_populates="assignment", cascade="all, delete-orphan")


class EquipmentReturn(Base):
    __tablename__ = "equipment_returns"

    id = Column(Integer, primary_key=True, index=True)
    equipment_assignment_id = Column(Integer, ForeignKey("equipment_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    condition = Column(String(30), default="Good", nullable=False)  # Excellent, Good, Repair Needed, Broken, Lost
    reason = Column(String(50), default="Normal Return", nullable=False)  # Normal Return, Damaged, Lost, Consumed
    remarks = Column(Text, nullable=True)
    photos = Column(String(255), nullable=True)
    status = Column(String(30), default="Pending Verification", nullable=False)  # Pending Verification, Accepted, Repair Sent, Written Off, Rejected
    submitted_date = Column(DateTime, default=datetime.utcnow)
    verified_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    # Relationships
    assignment = relationship("EquipmentAssignment", back_populates="returns", lazy="joined")
    verifier = relationship("User", foreign_keys=[verified_by], lazy="joined")


class DamagedEquipment(Base):
    __tablename__ = "damaged_equipment"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("equipment_assignments.id", ondelete="SET NULL"), nullable=True)
    station_inventory_id = Column(Integer, ForeignKey("station_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    damage_type = Column(String(50), nullable=True)  # Wear & Tear, Accidental, Water Damage, Impact
    damage_severity = Column(String(30), default="Minor", nullable=False)  # Minor, Repairable, Major, Beyond Repair
    damage_description = Column(Text, nullable=True)
    photo = Column(String(255), nullable=True)
    repairable = Column(Boolean, default=True, nullable=False)
    repair_cost = Column(Integer, default=0, nullable=False)
    repair_status = Column(String(30), default="Waiting", nullable=False)  # Waiting, Repairing, Completed, Scrapped
    remarks = Column(Text, nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    repaired_at = Column(DateTime, nullable=True)

    # Relationships
    assignment = relationship("EquipmentAssignment", back_populates="damaged_reports")
    station_inventory = relationship("StationInventory", back_populates="damaged_records")
    reporter = relationship("User", foreign_keys=[reported_by], lazy="joined")


class EquipmentLossReport(Base):
    __tablename__ = "equipment_loss_reports"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("equipment_assignments.id", ondelete="SET NULL"), nullable=True)
    station_inventory_id = Column(Integer, ForeignKey("station_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reason = Column(Text, nullable=False)
    mission = Column(String(100), nullable=True)
    photo = Column(String(255), nullable=True)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED, INVESTIGATING
    remarks = Column(Text, nullable=True)
    reported_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    assignment = relationship("EquipmentAssignment", back_populates="loss_reports")
    station_inventory = relationship("StationInventory", lazy="joined")
    reporter = relationship("User", foreign_keys=[reported_by], lazy="joined")
    processor = relationship("User", foreign_keys=[processed_by], lazy="joined")


class InventoryAdjustment(Base):
    __tablename__ = "inventory_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    station_inventory_id = Column(Integer, ForeignKey("station_inventory.id", ondelete="CASCADE"), nullable=False, index=True)
    current_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    difference = Column(Integer, nullable=False)
    reason = Column(String(50), nullable=False)  # Issued, Damaged, Lost, Expired, Transferred, Correction, Maintenance, Return, Purchase, Write-off
    remarks = Column(Text, nullable=True)
    submitted_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    station_inventory = relationship("StationInventory", back_populates="adjustments")
    submitter = relationship("User", foreign_keys=[submitted_by], lazy="joined")


# ==========================================
# INTER-STATION TRANSFERS
# ==========================================

class InventoryTransfer(Base):
    __tablename__ = "inventory_transfers"

    id = Column(Integer, primary_key=True, index=True)
    transfer_number = Column(String(50), unique=True, index=True, nullable=False)
    source_station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(30), default="PENDING_APPROVAL", nullable=False)  # PENDING_APPROVAL, APPROVED, DISPATCHED, COMPLETED, REJECTED
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)

    # Relationships
    source_station = relationship("MonitoringStation", foreign_keys=[source_station_id], lazy="joined")
    destination_station = relationship("MonitoringStation", foreign_keys=[destination_station_id], lazy="joined")
    requester = relationship("User", foreign_keys=[requested_by], lazy="joined")
    approver = relationship("User", foreign_keys=[approved_by], lazy="joined")
    items = relationship("TransferItem", back_populates="transfer", cascade="all, delete-orphan")


class TransferItem(Base):
    __tablename__ = "transfer_items"

    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("inventory_transfers.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_master_id = Column(Integer, ForeignKey("inventory_master.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)

    # Relationships
    transfer = relationship("InventoryTransfer", back_populates="items")
    master_item = relationship("InventoryMaster", lazy="joined")


# ==========================================
# REFILLABLE KITS & REFILL REQUEST MODELS
# ==========================================

class KitMaster(Base):
    __tablename__ = "kit_masters"

    id = Column(Integer, primary_key=True, index=True)
    kit_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g., "First Aid Kit #004"
    kit_name = Column(String(100), nullable=True)
    inventory_master_id = Column(Integer, ForeignKey("inventory_master.id", ondelete="CASCADE"), nullable=False)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="CASCADE"), nullable=False)

    current_status = Column(String(30), default="Available")  # Available, Issued, Needs Inspection, Needs Refill, Under Repair, Damaged, Disposed
    last_refilled_date = Column(DateTime, default=datetime.utcnow)
    next_inspection_date = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    master_item = relationship("InventoryMaster", back_populates="kits", lazy="joined")
    station = relationship("MonitoringStation", lazy="joined")
    kit_items = relationship("KitItem", back_populates="kit", cascade="all, delete-orphan")
    inspections = relationship("KitInspection", back_populates="kit", cascade="all, delete-orphan")
    refills = relationship("KitRefillHistory", back_populates="kit", cascade="all, delete-orphan")
    guard_assignments = relationship("GuardKitAssignment", back_populates="kit", cascade="all, delete-orphan")


class KitItem(Base):
    __tablename__ = "kit_items"

    id = Column(Integer, primary_key=True, index=True)
    kit_id = Column(Integer, ForeignKey("kit_masters.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_master_id = Column(Integer, ForeignKey("inventory_master.id", ondelete="CASCADE"), nullable=True)
    item_name = Column(String(100), nullable=False)  # e.g., "Bandages", "Gauze", "Painkillers"
    default_quantity = Column(Integer, nullable=False, default=1)
    required_quantity = Column(Integer, nullable=False, default=1)
    current_quantity = Column(Integer, nullable=False, default=1)
    unit = Column(String(20), default="Units")

    # Relationships
    kit = relationship("KitMaster", back_populates="kit_items")
    master_item = relationship("InventoryMaster", lazy="joined")


class KitInspection(Base):
    __tablename__ = "kit_inspections"

    id = Column(Integer, primary_key=True, index=True)
    kit_id = Column(Integer, ForeignKey("kit_masters.id", ondelete="CASCADE"), nullable=False, index=True)
    inspected_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    inspection_date = Column(DateTime, default=datetime.utcnow)
    status_result = Column(String(30), nullable=False)  # Available, Needs Refill, Damaged
    missing_components = Column(Text, nullable=True)  # Summary of missing items
    remarks = Column(Text, nullable=True)

    # Relationships
    kit = relationship("KitMaster", back_populates="inspections")
    inspector = relationship("User", lazy="joined")


class KitRefillHistory(Base):
    __tablename__ = "kit_refill_history"

    id = Column(Integer, primary_key=True, index=True)
    kit_id = Column(Integer, ForeignKey("kit_masters.id", ondelete="CASCADE"), nullable=False, index=True)
    refilled_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    refill_date = Column(DateTime, default=datetime.utcnow)
    items_refilled = Column(Text, nullable=False)  # Summary of items refilled
    remarks = Column(Text, nullable=True)

    # Relationships
    kit = relationship("KitMaster", back_populates="refills")
    refiller = relationship("User", lazy="joined")


class GuardKitAssignment(Base):
    __tablename__ = "guard_kit_assignment"

    id = Column(Integer, primary_key=True, index=True)
    guard_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kit_id = Column(Integer, ForeignKey("kit_masters.id", ondelete="CASCADE"), nullable=False, index=True)
    issued_date = Column(DateTime, default=datetime.utcnow)
    issued_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String(30), default="ISSUED")  # ISSUED, RETURNED, NEEDS_REFILL

    # Relationships
    guard = relationship("User", foreign_keys=[guard_id], lazy="joined")
    issuer = relationship("User", foreign_keys=[issued_by], lazy="joined")
    kit = relationship("KitMaster", back_populates="guard_assignments", lazy="joined")
    item_statuses = relationship("GuardKitItemStatus", back_populates="guard_kit_assignment", cascade="all, delete-orphan")
    refill_requests = relationship("KitRefillRequest", back_populates="guard_kit_assignment", cascade="all, delete-orphan")


class GuardKitItemStatus(Base):
    __tablename__ = "guard_kit_item_status"

    id = Column(Integer, primary_key=True, index=True)
    guard_kit_assignment_id = Column(Integer, ForeignKey("guard_kit_assignment.id", ondelete="CASCADE"), nullable=False, index=True)
    inventory_master_id = Column(Integer, ForeignKey("inventory_master.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_quantity = Column(Integer, nullable=False, default=1)
    remaining_quantity = Column(Integer, nullable=False, default=1)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    guard_kit_assignment = relationship("GuardKitAssignment", back_populates="item_statuses")
    master_item = relationship("InventoryMaster", lazy="joined")


class KitRefillRequest(Base):
    __tablename__ = "kit_refill_requests"

    id = Column(Integer, primary_key=True, index=True)
    guard_kit_assignment_id = Column(Integer, ForeignKey("guard_kit_assignment.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, APPROVED, PARTIAL, REJECTED
    items_requested = Column(Text, nullable=True)  # Summary of items requested
    remarks = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    processed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    guard_kit_assignment = relationship("GuardKitAssignment", back_populates="refill_requests", lazy="joined")
    requester = relationship("User", foreign_keys=[requested_by], lazy="joined")
    processor = relationship("User", foreign_keys=[processed_by], lazy="joined")


# ==========================================
# AUDIT LOG MODEL (PART 13)
# ==========================================

class InventoryAuditLog(Base):
    __tablename__ = "inventory_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_role = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)  # Create, Update, Delete, Approve, Reject, Issue, Return, Refill, Transfer, Repair, Write Off
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", lazy="joined")
