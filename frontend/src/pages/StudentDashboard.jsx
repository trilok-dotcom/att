import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import QRScanner from "../components/QRScanner";
import { BookOpen, CheckCircle2, QrCode, TerminalSquare, FileDigit } from "lucide-react";

export default function StudentDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [manualPayload, setManualPayload] = useState("");

  const loadData = useCallback(async () => {
    const [subjectRes, historyRes] = await Promise.all([
      api.get("/subjects/student"),
      api.get("/attendance/history/student"),
    ]);
    setSubjects(subjectRes.data);
    setHistory(historyRes.data);
  }, []);

  useEffect(() => {
    loadData().catch(() => setMessage("Failed to load student dashboard"));
  }, [loadData]);

  const handleScan = async (encryptedPayload) => {
    try {
      const { data } = await api.post("/attendance/scan", { encryptedPayload });
      setMessage(data.message || "Attendance marked successfully");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Scan failed");
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!manualPayload.trim()) {
      setMessage("Please paste the encrypted payload first.");
      return;
    }
    await handleScan(manualPayload.trim());
    setManualPayload("");
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Toast Notification */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce p-4 bg-gray-900 border border-gray-800 text-white rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 size={20} className="text-brand-400" />
          <p className="text-sm font-medium pr-2 w-max max-w-sm truncate">{message}</p>
        </div>
      )}

      {/* Header Banner */}
      <header className="glass-card p-6 sm:px-8 sm:py-6 rounded-3xl mb-8 flex justify-between items-center bg-white/70">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Portal</h1>
              <p className="text-gray-500 font-medium text-sm mt-1">Scan live QR codes or view your active enrollments.</p>
          </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Actions Column */}
        <section className="space-y-8 flex flex-col">
            
          {/* Scanner Container */}
          <div className="glass-card rounded-[2rem] bg-gray-950 p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden relative group">
              <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-brand-500/10 rounded-full blur-[80px]"></div>
              <div className="relative z-10 text-center flex-1">
                  <h2 className="mb-2 text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                      <QrCode size={24} className="text-brand-400" /> Fast Scanner
                  </h2>
                  <p className="text-gray-400 text-sm mb-6">Point your camera at the teacher's screen.</p>
                  
                  <div className="rounded-2xl overflow-hidden border border-gray-800 shadow-xl bg-black relative aspect-[4/3] flex items-center justify-center">
                    <QRScanner onScanSuccess={handleScan} />
                  </div>
              </div>
          </div>

          {/* Fallback Form */}
          <form onSubmit={handleManualSubmit} className="glass-card rounded-[2rem] border border-gray-200 bg-white/70 p-6 sm:p-8 shadow-sm">
            <h3 className="mb-2 text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <TerminalSquare size={22} className="text-brand-500" /> Manual Verify
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Paste the encrypted payload string if the camera is unavailable.
            </p>
            <textarea
              value={manualPayload}
              onChange={(e) => setManualPayload(e.target.value)}
              className="min-h-28 w-full rounded-2xl border border-gray-200 bg-white p-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all resize-none font-mono text-gray-700"
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
            />
            <button type="submit" className="btn-primary mt-4">
              Mark Attendance from Payload
            </button>
          </form>

        </section>

        {/* Info Column */}
        <section className="space-y-8 flex flex-col h-full">
            
            {/* Active Subscriptions */}
            <div className="glass-card rounded-[2rem] border border-gray-200 bg-white/70 p-6 sm:p-8 shadow-sm">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <BookOpen size={22} className="text-brand-500" /> Enrolled Subjects
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                {subjects.length === 0 ? (
                    <li className="text-sm font-medium text-gray-400 col-span-full">Not enrolled in any subjects.</li>
                ) : (
                    subjects.map((subject) => (
                    <li key={subject._id} className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm transition hover:border-brand-200 hover:-translate-y-0.5">
                        <p className="font-bold text-gray-900 truncate">{subject.name}</p>
                        <p className="text-xs text-brand-600 font-bold mt-1 bg-brand-50 inline-block px-2 py-0.5 rounded-full">{subject.code}</p>
                    </li>
                    ))
                )}
                </ul>
            </div>

            {/* History Ledger */}
            <div className="glass-card rounded-[2rem] border border-gray-200 bg-white/70 p-6 sm:p-8 shadow-sm flex-1 flex flex-col">
                <h2 className="mb-6 text-xl font-bold tracking-tight text-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-2"><FileDigit size={22} className="text-brand-500" /> Attendance Ledger</div>
                    <span className="text-xs font-bold bg-brand-100 text-brand-700 px-3 py-1 rounded-full">{history.length} Logs</span>
                </h2>
                
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[360px]">
                {history.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium py-10">No records completely yet.</div>
                ) : (
                    history.map((item) => (
                    <article key={item._id} className="flex items-start justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:shadow-sm">
                        <div>
                            <p className="font-bold text-gray-800">{item.subject?.name}</p>
                            <p className="text-sm text-gray-500 mt-0.5">Class: <span className="font-medium text-gray-700">{item.classSection?.name} - {item.classSection?.section}</span></p>
                            <p className="text-xs text-gray-400 mt-2 font-mono flex items-center gap-1">
                                {new Date(item.markedAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="shrink-0 bg-green-50 text-green-600 p-2 rounded-xl">
                            <CheckCircle2 size={18} />
                        </div>
                    </article>
                    ))
                )}
                </div>
            </div>

        </section>
      </div>
      
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}</style>
    </div>
  );
}
