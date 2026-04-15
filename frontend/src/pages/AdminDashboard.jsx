import { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/summary")
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to fetch admin summary"));
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold">Admin Dashboard</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <article className="stats-card"><p>Students</p><h2>{summary.students}</h2></article>
          <article className="stats-card"><p>Teachers</p><h2>{summary.teachers}</h2></article>
          <article className="stats-card"><p>Subjects</p><h2>{summary.subjects}</h2></article>
          <article className="stats-card"><p>Classes</p><h2>{summary.classes}</h2></article>
          <article className="stats-card"><p>Sessions</p><h2>{summary.sessions}</h2></article>
        </div>
      )}
    </section>
  );
}
