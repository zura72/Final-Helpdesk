import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

const GRAPH_SCOPE = ["Sites.ReadWrite.All"];
const siteId = "waskitainfra-my.sharepoint.com,81711596-bf57-403c-8ef6-1cb25a538e52,43f60d09-3f38-4874-bf00-352549188508";
const listId = "467d78c3-7a1d-486f-8743-4a93c6b9ec91";
const ITEM_TYPE_OPTIONS = [
  "Input Device", "Kabel", "Media Penyimpanan",
  "Audio", "Jaringan", "Operating System", "Hub/Expander", "Item"
];

// Color mapping for item types
const TYPE_COLORS = {
  "Input Device": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Kabel": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Media Penyimpanan": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Audio": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Jaringan": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Operating System": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "Hub/Expander": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "Item": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function Peripheral() {
  const { instance, accounts } = useMsal();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal & form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formFields, setFormFields] = useState({
    Nomor: "",
    Title: "",
    Quantity: "",
    Tipe: "",
  });

  // Auto fetch data setelah login
  useEffect(() => {
    if (accounts.length > 0) fetchData();
    // eslint-disable-next-line
  }, [accounts.length]);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const account = accounts[0];
      if (!account) {
        setLoading(false);
        return;
      }
      const token = await instance.acquireTokenSilent({
        scopes: GRAPH_SCOPE,
        account,
      });
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`,
        { headers: { Authorization: `Bearer ${token.accessToken}` } }
      );
      if (!res.ok) throw new Error("Gagal fetch data");
      const json = await res.json();
      setData(json.value);
    } catch (err) {
      alert("Gagal mengambil data: " + err.message);
    }
    setLoading(false);
  };

  // Create
  const createItem = async () => {
    try {
      const account = accounts[0];
      const token = await instance.acquireTokenSilent({
        scopes: GRAPH_SCOPE,
        account,
      });

      // Cari nomor terakhir
      let lastNo = 0;
      data.forEach(d => {
        if (d.fields.Nomor && d.fields.Nomor > lastNo) lastNo = d.fields.Nomor;
      });

      const body = {
        fields: {
          Nomor: lastNo + 1,
          Title: formFields.Title,
          Quantity: parseInt(formFields.Quantity) || 0,
          Tipe: formFields.Tipe,
        },
      };

      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error("Gagal menambah data: " + errText);
      }
      alert("Data berhasil ditambahkan");
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Gagal menambah data: " + err.message);
    }
  };

  // Update
  const updateItem = async () => {
    try {
      const account = accounts[0];
      const token = await instance.acquireTokenSilent({
        scopes: GRAPH_SCOPE,
        account,
      });
      const body = {
        Title: formFields.Title,
        Quantity: parseInt(formFields.Quantity) || 0,
        Tipe: formFields.Tipe,
      };

      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${editingItem.id}/fields`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error("Gagal update data: " + errText);
      }
      alert("Data berhasil diupdate");
      setModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      alert("Gagal update data: " + err.message);
    }
  };

  // Delete
  const deleteItem = async (item) => {
    if (!window.confirm(`Hapus item "${item.fields.Title}"?`)) return;
    try {
      const account = accounts[0];
      const token = await instance.acquireTokenSilent({
        scopes: GRAPH_SCOPE,
        account,
      });
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items/${item.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token.accessToken}` },
        }
      );
      if (res.status !== 204) throw new Error("Gagal hapus data");
      alert("Data berhasil dihapus");
      fetchData();
    } catch (err) {
      alert("Gagal hapus data: " + err.message);
    }
  };

  // Modal & Form Handler
  const openAddModal = () => {
    setEditingItem(null);
    setFormFields({
      Nomor: "",
      Title: "",
      Quantity: "",
      Tipe: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormFields({
      Nomor: item.fields.Nomor,
      Title: item.fields.Title || "",
      Quantity: item.fields.Quantity ?? "",
      Tipe: item.fields.Tipe || "",
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormFields((prev) => ({ ...prev, [name]: value }));
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (editingItem) updateItem();
    else createItem();
  };

  // Filter data berdasarkan search term
  const filteredData = data.filter(item =>
    item.fields?.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fields?.Tipe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fields?.Nomor?.toString().includes(searchTerm)
  );

  // Sorting data by Nomor
  const sortedData = [...filteredData].sort((a, b) => (a.fields.Nomor ?? 0) - (b.fields.Nomor ?? 0));

  // UI
  return (
    <div className="relative min-h-screen flex flex-col items-center py-8 px-4">
      {/* --- BACKGROUND --- */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `
            linear-gradient(rgba(249, 248, 250, 0.92), rgba(45, 30, 90, 0.88)),
            url('/peripheral-bg.jpg') center center / cover no-repeat
          `,
          backdropFilter: 'blur(4px)'
        }}
      />
      
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Header Card */}
        <div className="bg-white/95 dark:bg-gray-900/95 shadow-2xl rounded-2xl w-full max-w-6xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Peripheral Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Kelola seluruh peripheral, kabel, media penyimpanan, dan perangkat tambahan
              </p>
            </div>
            {accounts.length > 0 && (
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Login sebagai: {accounts[0]?.name}
                </span>
              </div>
            )}
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  Authentication Required
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Silakan login dengan akun Microsoft untuk mengakses sistem
                </p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Login Microsoft
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold shadow-md transition-all duration-200 min-w-[120px]"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                      </>
                    )}
                  </button>
                  <button
                    onClick={openAddModal}
                    className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md transition-all duration-200 min-w-[140px]"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Data
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari peripheral..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.length}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Total Items
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-100 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.filter(item => item.fields?.Quantity > 0).length}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    In Stock
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {data.filter(item => item.fields?.Quantity === 0).length}
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    Out of Stock
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {new Set(data.map(item => item.fields?.Tipe)).size}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-200">
                    Categories
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center">
                            <div className="flex justify-center items-center">
                              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          </td>
                        </tr>
                      ) : sortedData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="text-gray-400 dark:text-gray-500">
                              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-16" />
                              </svg>
                              <p className="text-lg font-medium">No data found</p>
                              <p className="text-sm">Try adding some items or adjust your search</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortedData.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-bold">
                                {item.fields?.Nomor ?? "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.fields?.Title ?? "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <span className={`text-sm font-bold ${
                                  (item.fields?.Quantity || 0) > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {item.fields?.Quantity ?? 0}
                                </span>
                                {item.fields?.Quantity > 0 && (
                                  <span className="ml-2 text-xs text-green-500">in stock</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                TYPE_COLORS[item.fields?.Tipe] || TYPE_COLORS["Item"]
                              }`}>
                                {item.fields?.Tipe || "Uncategorized"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="inline-flex items-center px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-400 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteItem(item)}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-sm font-medium transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Form */}
        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingItem ? "Edit Item" : "Tambah Item Baru"}
                </h2>
              </div>
              
              <form onSubmit={submitForm} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nomor Item
                  </label>
                  <input
                    type="number"
                    name="Nomor"
                    value={formFields.Nomor}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Item *
                  </label>
                  <input
                    type="text"
                    name="Title"
                    value={formFields.Title}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="Masukkan nama item"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jumlah Stok *
                  </label>
                  <input
                    type="number"
                    name="Quantity"
                    value={formFields.Quantity}
                    onChange={handleFormChange}
                    required
                    min={0}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori *
                  </label>
                  <select
                    name="Tipe"
                    value={formFields.Tipe}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih Kategori</option>
                    {ITEM_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                  >
                    {editingItem ? "Update Item" : "Tambah Item"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}