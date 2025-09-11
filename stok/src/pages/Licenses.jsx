import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useTheme } from "../context/ThemeContext";

const GRAPH_SCOPE = ["Directory.Read.All"];

export default function Licenses() {
  const { instance, accounts } = useMsal();
  const { dark } = useTheme();
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const columns = [
    { title: "License Name", key: "productName" },
    { title: "Total", key: "enabled" },
    { title: "Terpakai", key: "assigned" },
    { title: "Tersedia", key: "available" },
    { title: "Peringatan", key: "warning" },
    { title: "Tipe", key: "type" },
    { title: "Status", key: "status" },
  ];

  // Auto-fetch data setelah login
  useEffect(() => {
    if (accounts.length > 0) fetchLicenses();
    // eslint-disable-next-line
  }, [accounts.length]);

  async function fetchLicenses() {
    setLoading(true);
    try {
      const account = accounts[0];
      const token = await instance.acquireTokenSilent({
        scopes: GRAPH_SCOPE,
        account,
      });
      const res = await fetch("https://graph.microsoft.com/v1.0/subscribedSkus", {
        headers: { Authorization: `Bearer ${token.accessToken}` },
      });
      const json = await res.json();
      let items = json.value || [];

      const productNames = {
        POWER_BI_PRO: "Power BI Pro",
        WINDOWS_STORE: "Windows Store",
        ENTERPRISEPACK: "Office 365 E3",
        FLOW_FREE: "Power Automate Free",
        CCIBOTS_PRIVPREV_VIRAL: "Copilot Studio Viral Trial",
        POWER_BI_STANDARD: "Power BI Standard",
        Power_Pages_vTrial_for_Makers: "Power Pages vTrial for Makers",
        STANDARDPACK: "Office 365 E1",
        EMSPREMIUM: "Microsoft 365 E5",
        O365_BUSINESS_PREMIUM: "Microsoft 365 Business Premium",
        PROJECTPROFESSIONAL: "Project Professional",
        VISIOCLIENT: "Visio Professional",
      };

      const mapped = items
        .filter((d) => d.skuPartNumber !== "WINDOWS_STORE" && d.skuPartNumber)
        .map((d) => ({
          productName: productNames[d.skuPartNumber] || d.skuPartNumber.replaceAll("_", " "),
          enabled: d.prepaidUnits?.enabled ?? 0,
          assigned: d.consumedUnits ?? 0,
          available: (d.prepaidUnits?.enabled ?? 0) - (d.consumedUnits ?? 0),
          warning: d.prepaidUnits?.warning ?? 0,
          type: d.appliesTo ?? "",
          status: d.capabilityStatus ?? "",
          skuPartNumber: d.skuPartNumber, // Tetap disimpan untuk internal use
        }));

      setLicenses(mapped);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      alert("Gagal mengambil data: " + err.message);
    }
    setLoading(false);
  }

  const filtered = licenses.filter((row) =>
    columns.some((col) =>
      String(row[col.key]).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalLicenses = licenses.reduce((sum, license) => sum + license.enabled, 0);
  const totalAssigned = licenses.reduce((sum, license) => sum + license.assigned, 0);
  const totalAvailable = licenses.reduce((sum, license) => sum + license.available, 0);

  return (
    <div className={`min-h-screen p-6 ${dark ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl p-6 mb-6 ${dark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#215ba6] dark:text-blue-400 mb-2">
                Microsoft 365 Licenses
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manajemen lisensi Microsoft 365 untuk organisasi
              </p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-4 mt-4 md:mt-0">
              <div className={`p-3 rounded-lg text-center ${dark ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalLicenses}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Lisensi</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${dark ? 'bg-green-900/20' : 'bg-green-100'}`}>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalAssigned}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Terpakai</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${dark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{totalAvailable}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Tersedia</div>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari lisensi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    dark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <span className="absolute right-3 top-3 text-gray-400">🔍</span>
              </div>
            </div>
            <button
              onClick={fetchLicenses}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Loading...
                </>
              ) : (
                <>
                  <span className="mr-2">🔄</span>
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl p-6 ${dark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`text-lg ${dark ? 'bg-gray-700 text-gray-100' : 'bg-blue-50 text-blue-900'}`}>
                  {columns.map((col) => (
                    <th className="px-4 py-3 text-left font-semibold" key={col.key}>
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        Memuat data lisensi...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                      {licenses.length === 0 ? "Belum ada data lisensi." : `Tidak ditemukan lisensi untuk "${search}"`}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr
                      key={i}
                      className={`${i % 2 === 0 ? (dark ? 'bg-gray-700/50' : 'bg-gray-50') : ''} hover:${
                        dark ? 'bg-gray-700' : 'bg-blue-50'
                      } transition-colors`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {row.productName}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {row.enabled.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {row.assigned.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.available > 0
                            ? dark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                            : dark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                        }`}>
                          {row.available.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.warning > 0 ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            dark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            ⚠️ {row.warning}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {row.type || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          row.status === "Enabled"
                            ? dark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                            : dark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                        }`}>
                          {row.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          {filtered.length > 0 && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              dark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              Menampilkan {filtered.length} dari {licenses.length} lisensi
              {search && ` untuk pencarian "${search}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}