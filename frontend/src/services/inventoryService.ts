import type {
  InventoryCategory,
  InventoryMaster,
  StationInventory,
  InventoryTransaction,
  EquipmentRequest,
  EquipmentAssignment,
  KitMaster,
  InventorySummaryReport,
} from "@/types/inventory";

const API_BASE = "http://127.0.0.1:8000";

const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("gaia_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = "An error occurred";
    try {
      const data = await response.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const inventoryService = {
  // --- CATEGORIES ---
  getCategories: async (): Promise<InventoryCategory[]> => {
    const res = await fetch(`${API_BASE}/inventory/categories`, {
      headers: getHeaders(),
    });
    return handleResponse<InventoryCategory[]>(res);
  },

  createCategory: async (data: {
    name: string;
    description?: string;
    return_required: boolean;
    consumable: boolean;
    requires_refill: boolean;
  }): Promise<InventoryCategory> => {
    const res = await fetch(`${API_BASE}/inventory/categories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryCategory>(res);
  },

  // --- MASTER CATALOG ---
  getMasterItems: async (params?: {
    category?: string;
    search?: string;
    active_only?: boolean;
  }): Promise<InventoryMaster[]> => {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.search) query.append("search", params.search);
    if (params?.active_only) query.append("active_only", "true");

    const res = await fetch(`${API_BASE}/inventory/master?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<InventoryMaster[]>(res);
  },

  createMasterItem: async (data: {
    item_name: string;
    category: string;
    category_id?: number;
    unit: string;
    minimum_stock: number;
    reorder_level?: number;
    description?: string;
  }): Promise<InventoryMaster> => {
    const res = await fetch(`${API_BASE}/inventory/master`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryMaster>(res);
  },

  updateMasterItem: async (
    id: number,
    data: {
      item_name?: string;
      category?: string;
      category_id?: number;
      unit?: string;
      minimum_stock?: number;
      reorder_level?: number;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<InventoryMaster> => {
    const res = await fetch(`${API_BASE}/inventory/master/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<InventoryMaster>(res);
  },

  toggleMasterItemStatus: async (id: number): Promise<InventoryMaster> => {
    const res = await fetch(`${API_BASE}/inventory/master/${id}/toggle`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    return handleResponse<InventoryMaster>(res);
  },

  // --- STATION STOCK ---
  getStationInventory: async (stationId: number): Promise<StationInventory[]> => {
    const res = await fetch(`${API_BASE}/inventory/station/${stationId}`, {
      headers: getHeaders(),
    });
    return handleResponse<StationInventory[]>(res);
  },

  getMyStationInventory: async (): Promise<StationInventory[]> => {
    const res = await fetch(`${API_BASE}/inventory/my-station`, {
      headers: getHeaders(),
    });
    return handleResponse<StationInventory[]>(res);
  },

  getAllStationsInventory: async (): Promise<StationInventory[]> => {
    const res = await fetch(`${API_BASE}/inventory/all-stations`, {
      headers: getHeaders(),
    });
    return handleResponse<StationInventory[]>(res);
  },

  addStockToStation: async (
    dataOrMasterId: any,
    quantityOrSupplier?: any,
    remarksParam?: string
  ): Promise<StationInventory> => {
    let payload: any;
    if (typeof dataOrMasterId === "object") {
      payload = dataOrMasterId;
    } else {
      payload = {
        inventory_master_id: dataOrMasterId,
        quantity: quantityOrSupplier || 0,
        remarks: remarksParam || "",
      };
    }

    const res = await fetch(`${API_BASE}/inventory/station/add-stock`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<StationInventory>(res);
  },

  updateStockQuantity: async (
    stationInventoryId: number,
    dataOrQty: any,
    remarksParam?: string
  ): Promise<StationInventory> => {
    let payload: any;
    if (typeof dataOrQty === "object") {
      payload = dataOrQty;
    } else {
      payload = {
        available_quantity: dataOrQty,
        remarks: remarksParam || "Updated",
      };
    }

    const res = await fetch(
      `${API_BASE}/inventory/station-items/${stationInventoryId}/quantity`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      }
    );
    return handleResponse<StationInventory>(res);
  },

  // --- REFILLABLE KITS ---
  getStationKits: async (stationId?: number): Promise<KitMaster[]> => {
    const query = stationId ? `?station_id=${stationId}` : "";
    const res = await fetch(`${API_BASE}/inventory/kits${query}`, {
      headers: getHeaders(),
    });
    return handleResponse<KitMaster[]>(res);
  },

  inspectKit: async (
    kitId: number,
    data: {
      missing_components?: string;
      remarks?: string;
    }
  ): Promise<KitMaster> => {
    const res = await fetch(`${API_BASE}/inventory/kits/${kitId}/inspect`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<KitMaster>(res);
  },

  refillKit: async (
    kitId: number,
    data: {
      items_refilled: string;
      remarks?: string;
    }
  ): Promise<KitMaster> => {
    const res = await fetch(`${API_BASE}/inventory/kits/${kitId}/refill`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<KitMaster>(res);
  },

  // --- REQUESTS & ASSIGNMENTS ---
  createEquipmentRequest: async (
    dataOrMasterId: any,
    quantity?: number,
    purpose?: string
  ): Promise<EquipmentRequest> => {
    let payload: any;
    if (typeof dataOrMasterId === "object") {
      payload = dataOrMasterId;
    } else {
      payload = {
        station_inventory_id: dataOrMasterId,
        quantity: quantity || 1,
        purpose: purpose || "Field Duty",
      };
    }
    const res = await fetch(`${API_BASE}/inventory/requests`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<EquipmentRequest>(res);
  },
  requestEquipment: async (
    dataOrId: any,
    quantity?: number,
    purpose?: string
  ) => {
    if (typeof dataOrId === "object") {
      return inventoryService.createEquipmentRequest(dataOrId);
    }
    return inventoryService.createEquipmentRequest({ station_inventory_id: dataOrId, quantity: quantity || 1, purpose: purpose || "Field Duty" });
  },

  getMyEquipmentRequests: async (): Promise<EquipmentRequest[]> => {
    const res = await fetch(`${API_BASE}/inventory/requests/my-requests`, {
      headers: getHeaders(),
    });
    return handleResponse<EquipmentRequest[]>(res);
  },
  getMyRequests: async () => inventoryService.getMyEquipmentRequests(),

  getStationEquipmentRequests: async (
    stationId?: number,
    statusFilter?: string
  ): Promise<EquipmentRequest[]> => {
    const query = new URLSearchParams();
    if (stationId) query.append("station_id", stationId.toString());
    if (statusFilter) query.append("status_filter", statusFilter);

    const res = await fetch(`${API_BASE}/inventory/requests/station?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<EquipmentRequest[]>(res);
  },
  getStationRequests: async (stationId?: number, statusFilter?: string) =>
    inventoryService.getStationEquipmentRequests(stationId, statusFilter),

  approveOrRejectRequest: async (
    requestId: number,
    dataOrAction: any,
    rejectionReason?: string
  ): Promise<EquipmentRequest> => {
    let payload: any;
    if (typeof dataOrAction === "object") {
      payload = dataOrAction;
    } else {
      payload = {
        action: dataOrAction,
        rejection_reason: rejectionReason,
      };
    }
    const res = await fetch(`${API_BASE}/inventory/requests/${requestId}/approve-reject`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<EquipmentRequest>(res);
  },

  issueEquipmentForRequest: async (
    requestId: number,
    dataOrReturnDate?: any,
    remarks?: string
  ): Promise<EquipmentRequest> => {
    let payload: any;
    if (typeof dataOrReturnDate === "object") {
      payload = dataOrReturnDate;
    } else {
      payload = {
        expected_return_date: dataOrReturnDate,
        remarks: remarks,
      };
    }
    const res = await fetch(`${API_BASE}/inventory/requests/${requestId}/issue`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<EquipmentRequest>(res);
  },
  issueEquipment: async (requestId: number, expectedReturnDate?: string, remarks?: string) =>
    inventoryService.issueEquipmentForRequest(requestId, expectedReturnDate, remarks),

  directIssueEquipment: async (data: {
    guard_id: number;
    station_inventory_id: number;
    quantity: number;
    assignment_type?: string;
    item_usage_type?: string;
    expected_return_date?: string;
    purpose?: string;
    remarks?: string;
  }): Promise<EquipmentAssignment> => {
    const res = await fetch(`${API_BASE}/inventory/assignments/direct-issue`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<EquipmentAssignment>(res);
  },

  getMyAssignments: async (): Promise<EquipmentAssignment[]> => {
    const res = await fetch(`${API_BASE}/inventory/assignments/my-assignments`, {
      headers: getHeaders(),
    });
    return handleResponse<EquipmentAssignment[]>(res);
  },

  getStationAssignments: async (
    stationId?: number,
    statusFilter?: string
  ): Promise<EquipmentAssignment[]> => {
    const query = new URLSearchParams();
    if (stationId) query.append("station_id", stationId.toString());
    if (statusFilter) query.append("status_filter", statusFilter);

    const res = await fetch(`${API_BASE}/inventory/assignments/station?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<EquipmentAssignment[]>(res);
  },

  returnEquipment: async (assignmentId: number, remarks?: string): Promise<EquipmentAssignment> => {
    const res = await fetch(`${API_BASE}/inventory/assignments/${assignmentId}/return`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ remarks }),
    });
    return handleResponse<EquipmentAssignment>(res);
  },

  verifyReturnOptions: async (
    assignmentId: number,
    data: {
      action: "ACCEPT" | "MARK_DAMAGED" | "REJECT";
      damaged_quantity?: number;
      remarks?: string;
    }
  ): Promise<EquipmentAssignment> => {
    const res = await fetch(
      `${API_BASE}/inventory/assignments/${assignmentId}/verify-return`,
      {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<EquipmentAssignment>(res);
  },

  reportDamage: async (
    assignmentId: number,
    quantityOrData: any,
    remarks?: string
  ): Promise<EquipmentAssignment> => {
    let payload: any;
    if (typeof quantityOrData === "object") {
      payload = quantityOrData;
    } else {
      payload = { quantity: quantityOrData, remarks: remarks || "Damaged" };
    }

    const res = await fetch(`${API_BASE}/inventory/assignments/${assignmentId}/report-damage`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<EquipmentAssignment>(res);
  },

  verifyDamage: async (stationInventoryId: number, damagedQuantity: number, remarks?: string) => {
    return inventoryService.handleDamagedAction(stationInventoryId, {
      action: "REPAIR",
      quantity: damagedQuantity,
      remarks,
    });
  },

  handleDamagedAction: async (
    stationInventoryId: number,
    data: {
      action: "REPAIR" | "REPLACE" | "DISCARD";
      quantity: number;
      remarks?: string;
    }
  ): Promise<StationInventory> => {
    const res = await fetch(
      `${API_BASE}/inventory/station-items/${stationInventoryId}/damaged-action`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<StationInventory>(res);
  },

  // --- TRANSACTIONS & REPORTS ---
  getTransactionsFiltered: async (params?: {
    station_id?: number;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    officer_id?: number;
    equipment_id?: number;
    search?: string;
  }): Promise<InventoryTransaction[]> => {
    const query = new URLSearchParams();
    if (params?.station_id) query.append("station_id", params.station_id.toString());
    if (params?.transaction_type) query.append("transaction_type", params.transaction_type);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.officer_id) query.append("officer_id", params.officer_id.toString());
    if (params?.equipment_id) query.append("equipment_id", params.equipment_id.toString());
    if (params?.search) query.append("search", params.search);

    const res = await fetch(`${API_BASE}/inventory/transactions/filtered?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<InventoryTransaction[]>(res);
  },
  getTransactions: async (stationId?: number, transactionType?: string) =>
    inventoryService.getTransactionsFiltered({ station_id: stationId, transaction_type: transactionType }),

  exportTransactionsCSV: (params?: {
    station_id?: number;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    officer_id?: number;
    equipment_id?: number;
    search?: string;
  }): void => {
    const query = new URLSearchParams();
    if (params?.station_id) query.append("station_id", params.station_id.toString());
    if (params?.transaction_type) query.append("transaction_type", params.transaction_type);
    if (params?.start_date) query.append("start_date", params.start_date);
    if (params?.end_date) query.append("end_date", params.end_date);
    if (params?.officer_id) query.append("officer_id", params.officer_id.toString());
    if (params?.equipment_id) query.append("equipment_id", params.equipment_id.toString());
    if (params?.search) query.append("search", params.search);

    window.open(`${API_BASE}/inventory/transactions/export?${query.toString()}`, "_blank");
  },

  getSummaryReport: async (stationId?: number): Promise<InventorySummaryReport> => {
    const query = stationId ? `?station_id=${stationId}` : "";
    const res = await fetch(`${API_BASE}/inventory/reports/summary${query}`, {
      headers: getHeaders(),
    });
    return handleResponse<InventorySummaryReport>(res);
  },

  // --- RETURNS & REPAIRS (PROMPT 3) ---
  submitReturn: async (data: {
    equipment_assignment_id: number;
    condition: string;
    reason: string;
    remarks?: string;
    photos?: string;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/inventory/returns`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getStationReturns: async (stationId?: number): Promise<any[]> => {
    const query = new URLSearchParams();
    if (stationId) query.append("station_id", stationId.toString());
    const res = await fetch(`${API_BASE}/inventory/returns/station?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  verifyReturn: async (returnId: number, data: { action: string; remarks?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/inventory/returns/${returnId}/verify`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getDamagedRepairs: async (stationId?: number): Promise<any[]> => {
    const query = new URLSearchParams();
    if (stationId) query.append("station_id", stationId.toString());
    const res = await fetch(`${API_BASE}/inventory/repairs?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  updateRepairStatus: async (damagedId: number, data: { status: string; repair_cost?: number; remarks?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/inventory/repairs/${damagedId}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // --- TRANSFERS & AUDIT (PROMPT 3) ---
  createTransfer: async (data: { destination_station_id: number; items: { inventory_master_id: number; quantity: number }[]; remarks?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/inventory/transfers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getTransfers: async (stationId?: number): Promise<any[]> => {
    const query = new URLSearchParams();
    if (stationId) query.append("station_id", stationId.toString());
    const res = await fetch(`${API_BASE}/inventory/transfers?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  processTransfer: async (transferId: number, data: { action: string; remarks?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/inventory/transfers/${transferId}/process`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getAuditLogs: async (params?: { user_id?: number; action?: string; entity_type?: string }): Promise<any[]> => {
    const query = new URLSearchParams();
    if (params?.user_id) query.append("user_id", params.user_id.toString());
    if (params?.action) query.append("action", params.action);
    if (params?.entity_type) query.append("entity_type", params.entity_type);
    const res = await fetch(`${API_BASE}/inventory/audit-logs?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  getKits: async (stationId?: number) => inventoryService.getStationKits(stationId),
};
