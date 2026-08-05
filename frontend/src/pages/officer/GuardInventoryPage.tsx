import React, { useEffect, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import type {
  StationInventory,
  EquipmentRequest,
  EquipmentAssignment,
} from "@/types/inventory";
import { PageHeader } from "@/components/common/PageHeader";
import {
  ShieldCheck,
  Plus,
  Send,
  RotateCcw,
  AlertTriangle,
  Package,
  Clock,
  Warehouse,
} from "lucide-react";

export const GuardInventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"assigned" | "requests">("assigned");
  const [, setLoading] = useState<boolean>(true);
  const [, setError] = useState<string | null>(null);

  // Data States
  const [myAssignments, setMyAssignments] = useState<EquipmentAssignment[]>([]);
  const [myRequests, setMyRequests] = useState<EquipmentRequest[]>([]);
  const [stationInventory, setStationInventory] = useState<StationInventory[]>([]);

  // Modals
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [showDamageModal, setShowDamageModal] = useState<boolean>(false);
  const [selectedAssignment, setSelectedAssignment] = useState<EquipmentAssignment | null>(null);

  // Request Form
  const [requestForm, setRequestForm] = useState({
    station_inventory_id: 0,
    quantity: 1,
    purpose: "",
  });

  // Damage Form
  const [damageForm, setDamageForm] = useState({
    quantity: 1,
    remarks: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [asgns, reqs, stInv] = await Promise.all([
        inventoryService.getMyAssignments(),
        inventoryService.getMyRequests(),
        inventoryService.getMyStationInventory(),
      ]);
      setMyAssignments(asgns);
      setMyRequests(reqs);
      setStationInventory(stInv);

      if (stInv.length > 0) {
        setRequestForm((prev) => ({ ...prev, station_inventory_id: stInv[0].id }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load guard equipment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryService.requestEquipment(requestForm);
      setShowRequestModal(false);
      setRequestForm({ station_inventory_id: stationInventory[0]?.id || 0, quantity: 1, purpose: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to submit equipment request");
    }
  };

  const handleReturnEquipment = async (asgn: EquipmentAssignment) => {
    if (!confirm(`Confirm return of ${asgn.quantity} ${asgn.unit || "units"} of ${asgn.item_name}?`)) return;
    try {
      await inventoryService.returnEquipment(asgn.id, "Guard initiated return");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to return equipment");
    }
  };

  const handleReportDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    try {
      await inventoryService.reportDamage(
        selectedAssignment.id,
        damageForm.quantity,
        damageForm.remarks
      );
      setShowDamageModal(false);
      setSelectedAssignment(null);
      setDamageForm({ quantity: 1, remarks: "" });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to report damage");
    }
  };

  const activeAssignments = myAssignments.filter((a) => a.status === "Issued");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Field Equipment & Requests"
        subtitle="View equipment assigned to you for operations, request new gear, and return finished items."
        icon={ShieldCheck}
        badge="Forest Guard Duty"
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-900 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Active Gear Assigned</p>
            <h3 className="text-2xl font-black text-emerald-950">{activeAssignments.length}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-2xl text-amber-900 shrink-0">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Pending Requests</p>
            <h3 className="text-2xl font-black text-emerald-950">
              {myRequests.filter((r) => r.status === "Pending").length}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-950/10 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-900 shrink-0">
            <Warehouse className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70">Available Station Gear</p>
            <h3 className="text-2xl font-black text-emerald-950">{stationInventory.length} Items</h3>
          </div>
        </div>
      </div>

      {/* Tabs Header & Actions */}
      <div className="flex justify-between items-center border-b border-emerald-950/10 gap-4 pb-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
              activeTab === "assigned"
                ? "bg-emerald-900 text-amber-300 shadow-md"
                : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            My Assigned Equipment ({activeAssignments.length})
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-xs ${
              activeTab === "requests"
                ? "bg-emerald-900 text-amber-300 shadow-md"
                : "bg-white text-emerald-950 hover:bg-emerald-900/10 border border-emerald-950/10"
            }`}
          >
            <Send className="w-4 h-4" />
            My Requests History ({myRequests.length})
          </button>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4 text-amber-300" /> Request Equipment
        </button>
      </div>

      {/* Tab 1: Assigned Equipment */}
      {activeTab === "assigned" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Issued By</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {myAssignments.map((asgn) => (
                  <tr key={asgn.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{asgn.item_name}</td>
                    <td className="px-6 py-4 font-mono font-black text-emerald-700">
                      {asgn.quantity} {asgn.unit}
                    </td>
                    <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                      {new Date(asgn.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs">{asgn.issuer_name || "Range Forest Officer"}</td>
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
                            onClick={() => handleReturnEquipment(asgn)}
                            className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all inline-flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Return Equipment
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssignment(asgn);
                              setDamageForm({ quantity: 1, remarks: "" });
                              setShowDamageModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-extrabold transition-all inline-flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Report Damage
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {myAssignments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-emerald-800/60 font-medium">
                      You currently have no active equipment assigned. Click "Request Equipment" to apply for field gear.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Requests History */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-3xl border border-emerald-950/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-950/10 text-emerald-950 font-black uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4">Requested At</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Purpose</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/5 text-emerald-950 text-xs font-semibold">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4 text-[11px] font-mono text-emerald-800/70">
                      {new Date(req.requested_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-950">{req.item_name}</td>
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
                    <td className="px-6 py-4 text-xs text-emerald-800/70">{req.approver_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-700" />
              Request Station Equipment
            </h3>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Select Available Item *
                </label>
                <select
                  value={requestForm.station_inventory_id}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, station_inventory_id: parseInt(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                >
                  {stationInventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item_name} (Available: {item.available_quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Quantity Needed *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={requestForm.quantity}
                  onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Purpose / Mission Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify patrol route, wildlife tracking mission, or field operation details..."
                  value={requestForm.purpose}
                  onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Modal */}
      {showDamageModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-950/10">
            <h3 className="text-lg font-extrabold text-emerald-950 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Report Damaged Equipment
            </h3>

            <form onSubmit={handleReportDamageSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Damaged Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedAssignment.quantity}
                  required
                  value={damageForm.quantity}
                  onChange={(e) => setDamageForm({ ...damageForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1">
                  Damage Description & Cause *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe damage sustained during field operations..."
                  value={damageForm.remarks}
                  onChange={(e) => setDamageForm({ ...damageForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-emerald-950/10 rounded-xl bg-emerald-950/5 text-xs font-semibold text-emerald-950 focus:ring-2 focus:ring-emerald-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDamageModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-extrabold rounded-xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
