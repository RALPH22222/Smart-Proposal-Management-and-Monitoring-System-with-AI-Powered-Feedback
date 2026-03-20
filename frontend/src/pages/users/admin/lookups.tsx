import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, ChevronDown, ChevronRight, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import { fetchDepartments, fetchDisciplines, fetchSectors, type LookupItem } from "../../../services/proposal.api";
import { LookupApi, type LookupTable, type AgencyAddress } from "../../../services/admin/LookupApi";
import { api } from "../../../utils/axios";
import PageLoader from "../../../components/shared/PageLoader";

type TabConfig = {
  key: LookupTable;
  label: string;
  description: string;
};

const TABS: TabConfig[] = [
  { key: "departments", label: "Departments", description: "University colleges and units (e.g., College of Engineering)" },
  { key: "sectors", label: "Sectors", description: "Research sectors aligned with DOST classification (e.g., Agriculture, Health)" },
  { key: "disciplines", label: "Disciplines", description: "Academic/scientific fields (e.g., Computer Science, Marine Biology)" },
  { key: "priorities", label: "Priorities", description: "National R&D priority areas and SDGs" },
  { key: "agencies", label: "Agencies", description: "Implementing and cooperating organizations (click to manage addresses)" },
  { key: "tags", label: "Tags", description: "Keyword tags for proposal classification" },
];

// ==================== Agency Address Sub-Component ====================
const AgencyAddressPanel: React.FC<{ agencyId: number; agencyName: string }> = ({ agencyId, agencyName }) => {
  const [addresses, setAddresses] = useState<AgencyAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ city: "", barangay: "", street: "" });
  const [isSaving, setIsSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await LookupApi.getAddresses(agencyId);
      setAddresses(data);
    } catch {
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const handleSave = async () => {
    if (!form.city.trim()) return;
    setIsSaving(true);
    try {
      if (editingId) {
        await LookupApi.updateAddress(editingId, form);
      } else {
        await LookupApi.createAddress(agencyId, form);
      }
      setForm({ city: "", barangay: "", street: "" });
      setIsAdding(false);
      setEditingId(null);
      loadAddresses();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save address", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddr = async (addr: AgencyAddress) => {
    const result = await Swal.fire({
      title: "Delete this address?",
      text: `${addr.street ? addr.street + ", " : ""}${addr.barangay ? addr.barangay + ", " : ""}${addr.city}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C8102E",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await LookupApi.deleteAddress(addr.id);
      loadAddresses();
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete address", "error");
    }
  };

  const startEditAddr = (addr: AgencyAddress) => {
    setEditingId(addr.id);
    setForm({ city: addr.city, barangay: addr.barangay || "", street: addr.street || "" });
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ city: "", barangay: "", street: "" });
  };

  return (
    <div className="bg-slate-50 border-t border-slate-200 px-6 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Addresses for {agencyName}
        </span>
        {!isAdding && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setForm({ city: "", barangay: "", street: "" }); }}
            className="text-xs text-[#C8102E] hover:text-[#A00D26] font-medium flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Address
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-2 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="City *"
              autoFocus
              className="px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
            />
            <input
              type="text"
              value={form.barangay}
              onChange={e => setForm(p => ({ ...p, barangay: e.target.value }))}
              placeholder="Barangay"
              className="px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
            />
            <input
              type="text"
              value={form.street}
              onChange={e => setForm(p => ({ ...p, street: e.target.value }))}
              placeholder="Street"
              className="px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancelForm} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!form.city.trim() || isSaving} className="px-3 py-1 text-xs bg-[#C8102E] text-white rounded hover:bg-[#A00D26] disabled:opacity-50 transition-colors">
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Address List */}
      {isLoading ? (
        <p className="text-xs text-gray-400 py-2">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">No addresses yet</p>
      ) : (
        <div className="space-y-1">
          {addresses.map(addr => (
            <div key={addr.id} className="flex items-center justify-between bg-white border border-slate-100 rounded px-3 py-1.5 group">
              <span className="text-xs text-gray-700">
                {[addr.street, addr.barangay, addr.city].filter(Boolean).join(", ")}
              </span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditAddr(addr)} className="p-1 text-gray-400 hover:text-blue-600 rounded" title="Edit">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => handleDeleteAddr(addr)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Delete">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== Main Lookups Page ====================
const Lookups: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LookupTable>("departments");
  const [items, setItems] = useState<LookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Inline adding
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Expanded agency (for address management)
  const [expandedAgencyId, setExpandedAgencyId] = useState<number | null>(null);

  const fetchItems = useCallback(async (table: LookupTable) => {
    setIsLoading(true);
    try {
      let data: LookupItem[];
      switch (table) {
        case "departments":
          data = await fetchDepartments();
          break;
        case "disciplines":
          data = await fetchDisciplines();
          break;
        case "sectors":
          data = await fetchSectors();
          break;
        default: {
          const res = await api.get<LookupItem[]>(`/proposal/lookup/${table === "priorities" ? "priority" : table === "agencies" ? "agency" : "tag"}`, { withCredentials: true });
          data = res.data;
        }
      }
      setItems(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setEditingId(null);
    setIsAdding(false);
    setNewName("");
    setExpandedAgencyId(null);
    fetchItems(activeTab);
  }, [activeTab, fetchItems]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await LookupApi.create(activeTab, trimmed);
      setNewName("");
      setIsAdding(false);
      fetchItems(activeTab);
      Swal.fire({ icon: "success", title: "Created", text: `"${trimmed}" added to ${activeTab}`, timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create entry", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await LookupApi.update(activeTab, id, trimmed);
      setEditingId(null);
      fetchItems(activeTab);
      Swal.fire({ icon: "success", title: "Updated", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to update entry", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: LookupItem) => {
    const result = await Swal.fire({
      title: `Delete "${item.name}"?`,
      text: "This cannot be undone. If it's used by any proposal or user, deletion will fail.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C8102E",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;

    try {
      await LookupApi.delete(activeTab, item.id);
      fetchItems(activeTab);
      Swal.fire({ icon: "success", title: "Deleted", timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete entry", "error");
    }
  };

  const startEdit = (item: LookupItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const isAgencies = activeTab === "agencies";
  const activeConfig = TABS.find(t => t.key === activeTab)!;

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen">
        <PageLoader text="Loading lookups..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 h-full">
      <header className="flex-shrink-0 pt-12 lg:pt-0">
        <h1 className="text-2xl font-bold text-red-700">Lookup Management</h1>
        <p className="text-gray-600 mt-1">Manage dropdown options used in proposal submission forms</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white rounded-lg shadow-sm border border-gray-200 p-1.5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#C8102E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs ${activeTab === tab.key ? "text-white/80" : "text-gray-400"}`}>
              {activeTab === tab.key ? items.length : ""}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-800">{activeConfig.label}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{activeConfig.description}</p>
          </div>
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setNewName(""); }}
            disabled={isAdding}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C8102E] hover:bg-[#A00D26] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>

        {/* Add new row */}
        {isAdding && (
          <div className="px-4 py-3 border-b border-blue-100 bg-blue-50/50 flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setIsAdding(false); }}
              placeholder={`Enter new ${activeConfig.label.toLowerCase().replace(/s$/, "")} name...`}
              autoFocus
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
            />
            <button onClick={handleCreate} disabled={!newName.trim() || isSaving} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setIsAdding(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p className="text-sm">No entries yet</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {isAgencies && <th className="w-8"></th>}
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-16">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.map(item => (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      {isAgencies && (
                        <td className="pl-3 py-2.5">
                          <button
                            onClick={() => setExpandedAgencyId(expandedAgencyId === item.id ? null : item.id)}
                            className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            title="Manage addresses"
                          >
                            {expandedAgencyId === item.id
                              ? <ChevronDown className="w-4 h-4" />
                              : <ChevronRight className="w-4 h-4" />
                            }
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-sm text-gray-400 font-mono">{item.id}</td>
                      <td className="px-4 py-2.5">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleUpdate(item.id); if (e.key === "Escape") cancelEdit(); }}
                              autoFocus
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                            />
                            <button onClick={() => handleUpdate(item.id)} disabled={!editValue.trim() || isSaving} className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">{item.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {editingId !== item.id && (
                          <div className="flex items-center justify-end gap-1">
                            {isAgencies && (
                              <button
                                onClick={() => setExpandedAgencyId(expandedAgencyId === item.id ? null : item.id)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Manage addresses"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => startEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(item)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {/* Expanded address panel */}
                    {isAgencies && expandedAgencyId === item.id && (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <AgencyAddressPanel agencyId={item.id} agencyName={item.name} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <p className="text-xs text-gray-500">
            {items.length} {items.length === 1 ? "entry" : "entries"} — entries in use by proposals cannot be deleted
            {isAgencies && " — click the arrow or pin icon to manage addresses"}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Lookups;
