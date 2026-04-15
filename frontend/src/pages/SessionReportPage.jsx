import { useEffect, useState } from "react";
import api from "../api/client";

export default function SessionReportPage() {
  const [sessionId, setSessionId] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    api
      .get("/reports/analytics")
      .then((res) => setAnalytics(res.data))
      .catch(() => {});
  }, []);

  const fetchReport = async () => {
    try {
      setError("");
      const { data } = await api.get(`/reports/session/${sessionId}`);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not fetch report");
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Session Report</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="input"
            placeholder="Enter Session ID"
          />
          <button type="button" onClick={fetchReport} className="btn-primary">
            Fetch Report
          </button>
          <button type="button" onClick={downloadCsv} className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800">
            Export CSV
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      {report && (
        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">Summary</h3>
            <p>Total: {report.summary.totalStudents}</p>
            <p>Present: {report.summary.presentCount}</p>
            <p>Absent: {report.summary.absentCount}</p>
            <p>Attendance %: {report.summary.attendancePercentage}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">Present Students</h3>
            <ul className="space-y-1 text-sm">
              {report.present.map((s) => (
                <li key={s._id}>{s.name} ({s.collegeId || "No ID"})</li>
              ))}
            </ul>
          </article>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Attendance Analytics (by Subject)</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {analytics.map((item) => (
            <li key={item._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              {item._id}: {item.count} total marks
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
