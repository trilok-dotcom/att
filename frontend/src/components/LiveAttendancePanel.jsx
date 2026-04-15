export default function LiveAttendancePanel({ records = [] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-slate-800">Live Attendance</h3>
      <div className="max-h-72 overflow-y-auto">
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">No attendance marked yet.</p>
        ) : (
          <ul className="space-y-2">
            {records.map((record, index) => (
              <li
                key={`${record.student?.id || record.student?._id || index}-${record.markedAt}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-slate-700">{record.student?.name}</p>
                  <p className="text-xs text-slate-500">{record.student?.email}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(record.markedAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
