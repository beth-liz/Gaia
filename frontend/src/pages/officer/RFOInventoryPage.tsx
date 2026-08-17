import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type {
  InventoryMaster,
  StationInventory,
  EquipmentRequest,
  EquipmentAssignment,
  InventoryTransaction,
} from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  Warehouse,
  Plus,
  XCircle,
  AlertTriangle,
  Send,
  ShieldAlert,
  Layers,
  History,
  User,
  Clock,
  PackageCheck,
} from "lucide-react";

export const RFOInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"stock" | "requests" | "assignments" | "history">("stock");
  const [, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);

  // Data States
  const [stationInventory, setStationInventory] = useState<StationInventory[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<InventoryMaster[]>([]);
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [showVerifyDamageModal, setShowVerifyDamageModal] = useState<boolean>(false);

  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<EquipmentAssignment | null>(null);

  // Form inputs
  const [addStockForm, setAddStockForm] = useState({
    inventory_master_id: 0,
    quantity: 1,
    remarks: "",
  });
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [issueRemarks, setIssueRemarks] = useState<string>("");
  const [damagedQtyInput, setDamagedQtyInput] = useState<number>(1);
  const [verifyRemarks, setVerifyRemarks] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stStock, masters, reqs, asgns, txs] = await Promise.all([
        inventoryService.getMyStationInventory(),
        inventoryService.getMasterItems({ active_only: true }),
        inventoryService.getStationRequests(),
        inventoryService.getStationAssignments(undefined, "ALL"),
        inventoryService.getTransactions(),
      ]);
      setStationInventory(stStock);
      setMasterCatalog(masters);
      setRequests(reqs);
      setAssignments(asgns);
      setTransactions(txs);

      if (masters.length > 0) {
        setAddStockForm((prev) => ({ ...prev, inventory_master_id: masters[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load station inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryService.addStockToStation(addStockForm);
      setShowAddStockModal(false);
      setAddStockForm({ inventory_master_id: masterCatalog[0]?.id || 0, quantity: 1, remarks: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to add stock");
    }
  };

  const handleApproveRequest = async (req: EquipmentRequest) => {
    try {
      await inventoryService.approveOrRejectRequest(req.id, "APPROVED");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to approve request");
    }
  };

  const handleRejectRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await inventoryService.approveOrRejectRequest(selectedRequest.id, "REJECTED", rejectionReason);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to reject request");
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      await inventoryService.issueEquipment(selectedRequest.id, issueRemarks);
      setShowIssueModal(false);
      setSelectedRequest(null);
      setIssueRemarks("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to issue equipment");
    }
  };

  const handleReceiveReturn = async (asgn: EquipmentAssignment) => {
    if (!confirm(`Confirm receipt of returned equipment: ${asgn.quantity} ${asgn.unit || "units"} of ${asgn.item_name}?`)) return;
    try {
      await inventoryService.returnEquipment(asgn.id, "Returned and verified by Range Forest Officer.");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to receive return");
    }
  };

  const handleVerifyDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      await inventoryService.verifyDamage(selectedAssignment.id, damagedQtyInput, verifyRemarks);
      setShowVerifyDamageModal(false);
      setSelectedAssignment(null);
      setVerifyRemarks("");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to record damaged equipment");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "Pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Range Station Inventory Manager"
        subtitle="Manage station stock levels, approve guard requests, issue equipment, and receive returns."
        icon={Warehouse}
        badge="RFO Station Operations"
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-900 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Station Items Stocked</p>
            <h3 className="text-2xl font-black text-emerald-950">{stationInventory.length}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-900 shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Pending Guard Requests</p>
            <h3 className="text-2xl font-black text-emerald-950">{pendingRequests.length}</h3>
            {pendingRequests.length > 0 && <p className="text-[11px] font-extrabold text-amber-700">Requires Approval</p>}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-900 shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Active Assignments</p>
            <h3 className="text-2xl font-black text-emerald-950">
              {assignments.filter((a) => a.status === "Issued").length}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-2xl text-red-900 shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Damaged Stock</p>
            <h3 className="text-2xl font-black text-emerald-950">
              {stationInventory.reduce((acc, curr) => acc + curr.damaged_quantity, 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-emerald-950/10 gap-4 pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
              activeTab === "stock"
                ? "bg-emerald-900 text-amber-300 shadow-md"
                : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
            }`}
          >
            <Warehouse className="w-4 h-4" />
            Station Stock
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
              activeTab === "requests"
                ? "bg-emerald-900 text-amber-300 shadow-md"
                : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
            }`}
          >
            <Clock className="w-4 h-4" />
            Equipment Requests
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-400 text-emerald-950 rounded-full text-[10px] font-black">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
              activeTab === "assignments"
                ? "bg-emerald-900 text-amber-300 shadow-md"
                : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            Active Assignments
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
              activeTab === "history"
                ? "bg-emerald-900 text-amber-300 shadow-md"
                : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
            }`}
          >
            <History className="w-4 h-4" />
            Station Log
          </button>
        </div>

        {activeTab === "stock" && (
          <button
            onClick={() => setShowAddStockModal(true)}
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" /> Add Station Stock
          </button>
        )}
      </div>

      {/* Tab 1: Station Stock */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Item Definition</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Current Total</th>
                  <th className="px-6 py-4">Available</th>
                  <th className="px-6 py-4">Reserved (Issued)</th>
                  <th className="px-6 py-4">Damaged</th>
                  <th className="px-6 py-4">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {stationInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{item.item_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-100/60 text-emerald-900 rounded-xl text-[11px] font-extrabold">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-extrabold">{item.current_quantity} {item.unit}</td>
                    <td className="px-6 py-4 font-mono text-emerald-700 font-extrabold">{item.available_quantity}</td>
                    <td className="px-6 py-4 font-mono text-blue-700 font-extrabold">{item.reserved_quantity}</td>
                    <td className="px-6 py-4 font-mono text-red-600 font-extrabold">{item.damaged_quantity}</td>
                    <td className="px-6 py-4">
                      {item.status === "In Stock" && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-black">
                          In Stock
                        </span>
                      )}
                      {item.status === "Low Stock" && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" /> Low Stock
                        </span>
                      )}
                      {item.status === "Out of Stock" && (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-xl text-[11px] font-black inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" /> Out of Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Equipment Requests */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Requested At</th>
                  <th className="px-6 py-4">Guard Name</th>
                  <th className="px-6 py-4">Requested Item</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Purpose</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                      {new Date(req.requested_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-950 flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-700" />
                      {req.guard_name || `Guard #${req.guard_id}`}
                    </td>
                    <td className="px-6 py-4 font-bold">{req.item_name}</td>
                    <td className="px-6 py-4 font-mono font-black">{req.quantity} {req.unit}</td>
                    <td className="px-6 py-4 text-[11px] text-emerald-800/70 max-w-xs truncate">{req.purpose}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                          req.status === "Pending"
                            ? "bg-amber-100 text-amber-900"
                            : req.status === "Approved"
                            ? "bg-blue-100 text-blue-900"
                            : req.status === "Issued"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {req.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleApproveRequest(req)}
                            className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-extrabold transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {(req.status === "Approved" || req.status === "Pending") && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowIssueModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all"
                        >
                          Issue Equipment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                      No equipment requests logged for this station.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Active Assignments */}
      {activeTab === "assignments" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Guard</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Issued Qty</th>
                  <th className="px-6 py-4">Issued By</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {assignments.map((asgn) => (
                  <tr key={asgn.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                      {new Date(asgn.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{asgn.guard_name}</td>
                    <td className="px-6 py-4 font-bold">{asgn.item_name}</td>
                    <td className="px-6 py-4 font-mono font-black">{asgn.quantity} {asgn.unit}</td>
                    <td className="px-6 py-4 text-xs text-emerald-800/70">{asgn.issuer_name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${
                          asgn.status === "Issued"
                            ? "bg-blue-100 text-blue-900"
                            : asgn.status === "Returned"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {asgn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {asgn.status === "Issued" && (
                        <>
                          <button
                            onClick={() => handleReceiveReturn(asgn)}
                            className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all"
                          >
                            Receive Return
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssignment(asgn);
                              setDamagedQtyInput(asgn.quantity);
                              setShowVerifyDamageModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-extrabold transition-all"
                          >
                            Record Damage
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Station History */}
      {activeTab === "history" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{tx.item_name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-100/60 text-emerald-900 rounded-xl text-[11px] font-black">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-black">{tx.quantity}</td>
                    <td className="px-6 py-4 text-xs font-bold">{tx.performer_name}</td>
                    <td className="px-6 py-4 text-xs text-emerald-800/70">{tx.assignee_name || "-"}</td>
                    <td className="px-6 py-4 text-[11px] text-emerald-800/70">{tx.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-700" />
              Add Stock to Station Inventory
            </h3>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Select Master Item *
                </label>
                <select
                  value={addStockForm.inventory_master_id}
                  onChange={(e) =>
                    setAddStockForm({ ...addStockForm, inventory_master_id: parseInt(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                >
                  {masterCatalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.item_name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addStockForm.quantity}
                  onChange={(e) => setAddStockForm({ ...addStockForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Stock Addition Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stock shipment received from Division"
                  value={addStockForm.remarks}
                  onChange={(e) => setAddStockForm({ ...addStockForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-blue-700" />
              Issue Equipment to Guard
            </h3>

            <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-xs space-y-1 text-blue-950">
              <p><strong>Guard:</strong> {selectedRequest.guard_name}</p>
              <p><strong>Item:</strong> {selectedRequest.item_name} ({selectedRequest.quantity} {selectedRequest.unit})</p>
              <p><strong>Purpose:</strong> {selectedRequest.purpose}</p>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">Issue Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Issued for sector patrol unit 4"
                  value={issueRemarks}
                  onChange={(e) => setIssueRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold rounded-xl shadow-md">
                  Confirm & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Equipment Request
            </h3>

            <form onSubmit={handleRejectRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify reason for request rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Damage Modal */}
      {showVerifyDamageModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Verify & Record Damaged Equipment
            </h3>

            <form onSubmit={handleVerifyDamageSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">Verified Damaged Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedAssignment.quantity}
                  required
                  value={damagedQtyInput}
                  onChange={(e) => setDamagedQtyInput(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">Remarks / Writeoff Note</label>
                <textarea
                  rows={3}
                  placeholder="Note assessment details or repair recommendation..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVerifyDamageModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md">
                  Verify & Move to Damaged Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
