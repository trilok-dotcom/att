import { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import QRScanner from "../components/QRScanner";

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
      setMessage(data.message || "Attendance marked");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Scan failed");
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!manualPayload.trim()) {
      setMessage("Paste encrypted payload first");
      return;
    }
    await handleScan(manualPayload.trim());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <QRScanner onScanSuccess={handleScan} />
        <form onSubmit={handleManualSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold text-slate-700">Manual Verify (No Camera)</h3>
          <p className="mb-2 text-xs text-slate-500">
            Paste encrypted payload from teacher dashboard to test locally without hosting.
          </p>
          <textarea
            value={manualPayload}
            onChange={(e) => setManualPayload(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-slate-300 p-2 text-xs"
            placeholder="Encrypted QR payload"
          />
          <button type="submit" className="btn-primary mt-2">
            Mark Attendance from Payload
          </button>
        </form>
        {message && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Enrolled Subjects</h2>
          <ul className="space-y-2">
            {subjects.map((subject) => (
              <li key={subject._id} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="font-medium">{subject.name}</p>
                <p className="text-sm text-slate-500">{subject.code}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Attendance History</h2>
        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No records yet.</p>
          ) : (
            history.map((item) => (
              <article key={item._id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="font-medium">{item.subject?.name} ({item.subject?.code})</p>
                <p className="text-sm text-slate-500">Class: {item.classSection?.name} - {item.classSection?.section}</p>
                <p className="text-xs text-slate-500">Marked: {new Date(item.markedAt).toLocaleString()}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
