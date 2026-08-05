export interface InventoryCategory {
  id: number;
  name: string;
  description?: string;
  active?: boolean;
  return_required: boolean;
  consumable: boolean;
  requires_refill: boolean;
  created_at: string;
}

export interface InventoryMaster {
  id: number;
  item_name: string;
  item_code?: string;
  category: string;
  category_id?: number;
  category_name?: string;
  item_type?: string;
  item_usage_type?: string;
  return_required: boolean;
  consumable: boolean;
  requires_refill: boolean;
  is_refillable?: boolean;
  unit: string;
  minimum_stock: number;
  reorder_level: number;
  description?: string;
  is_active: boolean;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StationInventory {
  id: number;
  station_id: number;
  station_name?: string;
  district_id?: number;
  district_name?: string;
  state_name?: string;
  inventory_master_id: number;
  item_name?: string;
  item_code?: string;
  item_type?: string;
  item_usage_type?: string;
  category?: string;
  category_id?: number;
  return_required: boolean;
  consumable: boolean;
  requires_refill: boolean;
  unit?: string;
  minimum_stock: number;
  reorder_level: number;
  total_quantity?: number;
  current_quantity: number;
  available_quantity: number;
  issued_quantity?: number;
  reserved_quantity: number;
  damaged_quantity: number;
  status: string;
  last_updated: string;
  updated_by?: number;
  updater_name?: string;
}

export interface InventoryTransaction {
  id: number;
  station_inventory_id: number;
  item_name?: string;
  station_name?: string;
  transaction_type: string;
  quantity_before?: number;
  quantity_changed?: number;
  quantity_after?: number;
  quantity: number;
  reference_table?: string;
  reference_id?: number;
  performed_by: number;
  performer_name?: string;
  assigned_to?: number;
  assignee_name?: string;
  supplier?: string;
  remarks?: string;
  created_at: string;
}

export interface EquipmentRequest {
  id: number;
  guard_id: number;
  guard_name?: string;
  station_inventory_id: number;
  inventory_master_id?: number;
  item_name?: string;
  unit?: string;
  station_name?: string;
  quantity: number;
  requested_quantity?: number;
  purpose?: string;
  reason?: string;
  priority?: string;
  status: string;
  requested_at: string;
  approved_at?: string;
  approved_by?: number;
  approver_name?: string;
  rejection_reason?: string;
  remarks?: string;
}

export interface EquipmentAssignment {
  id: number;
  station_inventory_id: number;
  item_name?: string;
  unit?: string;
  guard_id: number;
  guard_name?: string;
  quantity: number;
  issued_by: number;
  issuer_name?: string;
  issue_date: string;
  expected_return_date?: string;
  returned_date?: string;
  assignment_type?: string;
  item_usage_type?: string;
  status: string;
  purpose?: string;
  remarks?: string;
}

export interface DamagedEquipment {
  id: number;
  assignment_id?: number;
  station_inventory_id: number;
  item_name?: string;
  reported_by: number;
  reporter_name?: string;
  damage_type?: string;
  damage_severity?: string;
  damage_description?: string;
  photo?: string;
  repairable: boolean;
  repair_status: string;
  remarks?: string;
  reported_at: string;
}

export interface EquipmentLossReport {
  id: number;
  assignment_id?: number;
  station_inventory_id: number;
  item_name?: string;
  reported_by: number;
  reporter_name?: string;
  reason: string;
  mission?: string;
  photo?: string;
  status: string;
  remarks?: string;
  reported_at: string;
  processed_at?: string;
  processed_by?: number;
  processor_name?: string;
}

export interface InventoryAdjustment {
  id: number;
  station_inventory_id: number;
  item_name?: string;
  current_quantity: number;
  new_quantity: number;
  difference: number;
  reason: string;
  remarks?: string;
  submitted_by: number;
  submitter_name?: string;
  created_at: string;
}

export interface KitItem {
  id: number;
  kit_id: number;
  inventory_master_id?: number;
  item_name: string;
  default_quantity?: number;
  required_quantity: number;
  current_quantity: number;
  unit: string;
}

export interface KitInspection {
  id: number;
  kit_id: number;
  inspected_by: number;
  inspector_name?: string;
  inspection_date: string;
  status_result: string;
  missing_components?: string;
  remarks?: string;
}

export interface KitRefillHistory {
  id: number;
  kit_id: number;
  refilled_by: number;
  refiller_name?: string;
  refill_date: string;
  items_refilled: string;
  remarks?: string;
}

export interface KitMaster {
  id: number;
  kit_number: string;
  kit_name?: string;
  inventory_master_id: number;
  item_name?: string;
  station_id: number;
  station_name?: string;
  current_status: string;
  last_refilled_date: string;
  next_inspection_date?: string;
  description?: string;
  notes?: string;
  active?: boolean;
  created_at: string;
  updated_at: string;
  kit_items: KitItem[];
  inspections: KitInspection[];
  refills: KitRefillHistory[];
}

export interface InventorySummaryReport {
  total_master_items: number;
  total_stations: number;
  total_items_in_stock: number;
  total_items_reserved: number;
  total_items_damaged: number;
  permanent_assets_count: number;
  consumables_count: number;
  refillable_kits_count: number;
  pending_refills_count: number;
  items_under_repair_count: number;
  low_stock_items_count: number;
  out_of_stock_items_count: number;
  disposed_assets_count: number;
  lost_equipment_count: number;
  pending_requests_count: number;
  pending_returns_count: number;
  recent_transactions: InventoryTransaction[];
}
