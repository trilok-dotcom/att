import { useEffect, useState } from "react";
import api from "../api/client";
import { Download, Search, Users, CheckCircle, XCircle, PieChart } from "lucide-react";

export default function SessionReportPage() {
  const [sessionId, setSessionId] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/reports/analytics")
      .then((res) => setAnalytics(res.data))
      .catch(() => {});
  }, []);

  const fetchReport = async () => {
    if (!sessionId.trim()) return;
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get(`/reports/session/${sessionId}`);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not fetch report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    try {
      const response = await api.get(`/reports/session/${sessionId}/csv`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `attendance-${sessionId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.message || "Could not export CSV");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <header className="glass-card p-6 sm:px-8 sm:py-6 rounded-3xl mb-8 flex justify-between items-center bg-white/70">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics & Reports</h1>
              <p className="text-gray-500 font-medium text-sm mt-1">Review session details and download offline attendance sheets.</p>
          </div>
      </header>

      {/* Control Panel */}
      <section className="glass-card rounded-[2rem] border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-bold tracking-tight flex items-center gap-2">
            <Search size={22} className="text-brand-500" /> Lookup Session
        </h2>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Search size={18} />
                </div>
                <input
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 transition-all shadow-sm font-mono text-sm"
                    placeholder="Enter unique Session ID..."
                />
            </div>
            
            <button type="button" onClick={fetchReport} disabled={loading} className="btn-primary sm:w-auto px-8 whitespace-nowrap">
                {loading ? "Fetching..." : "Fetch Report"}
            </button>
            <button type="button" onClick={downloadCsv} disabled={!report} className="rounded-2xl border-2 border-gray-200 bg-white px-6 py-3.5 font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 sm:w-auto">
                <Download size={18} /> Export CSV
            </button>
        </div>
        {error && <p className="mt-4 text-sm font-medium text-red-600 flex items-center gap-2"><XCircle size={16}/> {error}</p>}
      </section>

      {report && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Summary Stats */}
          <article className="lg:col-span-1 rounded-[2rem] bg-gray-950 p-8 shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-[-20%] right-[-20%] w-[200px] h-[200px] bg-brand-500/20 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10">
                <h3 className="mb-6 text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <PieChart size={20} className="text-brand-400"/> Summary
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <p className="text-gray-400 text-sm font-medium mb-1">Total Enrolled</p>
                        <p className="text-3xl font-bold">{report.summary.totalStudents}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-green-400 text-sm font-medium mb-1">Present</p>
                            <p className="text-2xl font-bold text-white">{report.summary.presentCount}</p>
                        </div>
                        <div>
                            <p className="text-red-400 text-sm font-medium mb-1">Absent</p>
                            <p className="text-2xl font-bold text-white">{report.summary.absentCount}</p>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-800">
                        <p className="text-gray-400 text-sm font-medium mb-1">Attendance Rate</p>
                        <div className="flex items-end gap-2">
                            <p className="text-4xl font-bold text-brand-400">{report.summary.attendancePercentage}</p>
                        </div>
                    </div>
                </div>
            </div>
          </article>
          
          {/* Present List */}
          <article className="lg:col-span-2 glass-card rounded-[2rem] border border-gray-200 bg-white/70 p-6 sm:p-8 shadow-sm flex flex-col h-[500px]">
            <h3 className="mb-6 text-xl font-bold tracking-tight text-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-2"><CheckCircle size={22} className="text-green-500"/> Present Students</div>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">{report.present?.length || 0}</span>
            </h3>
            
            <ul className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {report.present.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 font-medium">No students marked present.</div>
              ) : (
                  report.present.map((s) => (
                    <li key={s._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm transition hover:border-brand-200 group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center text-green-700 font-bold shrink-0">
                                {s.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 group-hover:text-gray-900 transition">{s.name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{s.collegeId || s.usn || "No ID"}</p>
                            </div>
                        </div>
                        <div className="bg-green-50 text-green-600 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Present</div>
                    </li>
                  ))
              )}
            </ul>
          </article>
        </div>
      )}

      {/* Global Analytics */}
      <section className="glass-card rounded-[2rem] border border-gray-200 bg-white/70 p-6 sm:p-8 shadow-sm">
        <h3 className="mb-6 text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-brand-500"/> Aggregate Subject Analytics
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analytics.length === 0 ? (
                <p className="text-gray-400 text-sm font-medium col-span-full">No aggregate analytics available.</p>
            ) : (
                analytics.map((item) => (
                    <article key={item._id} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                        <p className="font-bold text-gray-900 mb-2 truncate">{item._id}</p>
                        <p className="text-sm text-gray-500">
                            Total Records: <span className="font-bold text-brand-600">{item.count}</span>
                        </p>
                    </article>
                ))
            )}
        </div>
      </section>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}</style>
    </div>
  );
}
