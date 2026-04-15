import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/client";
import LiveAttendancePanel from "../components/LiveAttendancePanel";

const ACTIVE_SESSION_STORAGE_KEY = "teacherActiveSessionId";

export default function TeacherDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");

  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", students: [] });
  const [classForm, setClassForm] = useState({ name: "", section: "", subjectId: "", students: [] });

  const [activeSession, setActiveSession] = useState(null);
  const [liveRecords, setLiveRecords] = useState([]);
  const [usnQuery, setUsnQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const token = localStorage.getItem("token");
  const socket = useMemo(() => {
    if (!token) return null;
    return io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });
  }, [token]);

  const loadData = async () => {
    const [subjectRes, classRes, studentRes] = await Promise.all([
      api.get("/subjects/teacher"),
      api.get("/classes/teacher"),
      api.get("/auth/students"),
    ]);

    setSubjects(subjectRes.data);
    setClasses(classRes.data);
    setStudents(studentRes.data);
  };

  useEffect(() => {
    loadData().catch(() => setMessage("Failed to load teacher dashboard"));
  }, []);

  useEffect(() => {
    const restoreActiveSession = async () => {
      const savedSessionId = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (!savedSessionId) return;

      try {
        const { data } = await api.get(`/sessions/${savedSessionId}/live`);
        const isStillActive =
          data.session?.status === "active" &&
          new Date(data.session?.expiresAt).getTime() > Date.now();

        if (!isStillActive || !data.qrCodeDataUrl || !data.encryptedPayload) {
          localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          return;
        }

        setActiveSession({
          session: data.session,
          qrCodeDataUrl: data.qrCodeDataUrl,
          encryptedPayload: data.encryptedPayload,
        });

        setLiveRecords(
          (data.records || []).map((record) => ({
            student: record.student,
            markedAt: record.markedAt,
          }))
        );
      } catch (error) {
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      }
    };

    restoreActiveSession();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    socket.on("attendanceMarked", (event) => {
      setLiveRecords((prev) => [
        {
          student: event.student,
          markedAt: event.markedAt,
        },
        ...prev,
      ]);
    });

    socket.on("sessionEnded", () => {
      setActiveSession(null);
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !activeSession?.session?._id) return undefined;

    socket.emit("joinSession", activeSession.session._id);

    return () => {
      socket.emit("leaveSession", activeSession.session._id);
    };
  }, [socket, activeSession?.session?._id]);

  const handleCreateSubject = async (event) => {
    event.preventDefault();
    try {
      await api.post("/subjects", {
        ...subjectForm,
        students: subjectForm.students,
      });
      setSubjectForm({ name: "", code: "", students: [] });
      setMessage("Subject created");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create subject");
    }
  };

  const handleCreateClass = async (event) => {
    event.preventDefault();
    try {
      await api.post("/classes", {
        ...classForm,
        students: classForm.students,
      });
      setClassForm({ name: "", section: "", subjectId: "", students: [] });
      setMessage("Class created");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create class");
    }
  };

  const startSession = async (classId) => {
    try {
      const { data } = await api.post(`/sessions/start/${classId}`, { expiresInMinutes: 3 });
      setActiveSession(data);
      setLiveRecords([]);
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, data.session._id);
      setMessage("Session started. Show QR to students.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to start session");
    }
  };

  const endSession = async () => {
    if (!activeSession?.session?._id) return;
    try {
      await api.post(`/sessions/${activeSession.session._id}/end`);
      socket?.emit("leaveSession", activeSession.session._id);
      setMessage("Session ended. Download report from reports page.");
      setActiveSession(null);
      setLiveRecords([]);
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to end session");
    }
  };

  const copyPayload = async () => {
    if (!activeSession?.encryptedPayload) return;
    try {
      await navigator.clipboard.writeText(activeSession.encryptedPayload);
      setMessage("Encrypted payload copied");
    } catch (error) {
      setMessage("Could not copy payload. Copy manually.");
    }
  };

  const searchByUsn = async () => {
    if (!activeSession?.session?._id) return;
    try {
      setSearchLoading(true);
      const { data } = await api.get(
        `/attendance/session/${activeSession.session._id}/students/search`,
        { params: { q: usnQuery.trim() } }
      );
      setSearchResults(data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Student search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  const markManualAttendance = async (studentId) => {
    if (!activeSession?.session?._id) return;
    try {
      await api.post(`/attendance/session/${activeSession.session._id}/mark`, {
        studentId,
      });
      setMessage("Attendance marked manually");
      await searchByUsn();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not mark attendance");
    }
  };

  return (
    <div className="space-y-6">
      {message && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleCreateSubject} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Create Subject</h2>
          <div className="space-y-3">
            <input className="input" placeholder="Subject Name" value={subjectForm.name} onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input" placeholder="Subject Code" value={subjectForm.code} onChange={(e) => setSubjectForm((p) => ({ ...p, code: e.target.value }))} required />
            <select
              multiple
              className="input min-h-28"
              value={subjectForm.students}
              onChange={(event) => {
                const selected = [...event.target.selectedOptions].map((option) => option.value);
                setSubjectForm((p) => ({ ...p, students: selected }));
              }}
            >
              {students.map((student) => (
                <option key={student._id} value={student._id}>{student.name} ({student.collegeId || "No ID"})</option>
              ))}
            </select>
            <button type="submit" className="btn-primary">Create Subject</button>
          </div>
        </form>

        <form onSubmit={handleCreateClass} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Create Class/Section</h2>
          <div className="space-y-3">
            <input className="input" placeholder="Class Name" value={classForm.name} onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input" placeholder="Section (A/B/C)" value={classForm.section} onChange={(e) => setClassForm((p) => ({ ...p, section: e.target.value }))} required />
            <select className="input" value={classForm.subjectId} onChange={(e) => setClassForm((p) => ({ ...p, subjectId: e.target.value }))} required>
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>
              ))}
            </select>
            <select
              multiple
              className="input min-h-28"
              value={classForm.students}
              onChange={(event) => {
                const selected = [...event.target.selectedOptions].map((option) => option.value);
                setClassForm((p) => ({ ...p, students: selected }));
              }}
            >
              {students.map((student) => (
                <option key={student._id} value={student._id}>{student.name} ({student.collegeId || "No ID"})</option>
              ))}
            </select>
            <button type="submit" className="btn-primary">Create Class</button>
          </div>
        </form>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Classes</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {classes.map((classSection) => (
            <article key={classSection._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="font-semibold">{classSection.name} - {classSection.section}</p>
              <p className="text-sm text-slate-500">{classSection.subject?.name} ({classSection.subject?.code})</p>
              <p className="mt-1 text-xs text-slate-500">Students: {classSection.students?.length || 0}</p>
              <button
                type="button"
                className="mt-2 rounded-lg bg-teal-700 px-3 py-1.5 text-sm text-white hover:bg-teal-800"
                onClick={() => startSession(classSection._id)}
              >
                Start Session
              </button>
            </article>
          ))}
        </div>
      </section>

      {activeSession?.session && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Active QR Session</h2>
            <img src={activeSession.qrCodeDataUrl} alt="Attendance QR" className="mx-auto w-64 rounded-lg border border-slate-200 p-2" />
            <p className="mt-3 text-sm text-slate-600">
              Expires at: {new Date(activeSession.session.expiresAt).toLocaleTimeString()}
            </p>
            <p className="mt-2 text-xs text-slate-500">Fallback for localhost testing:</p>
            <textarea
              readOnly
              value={activeSession.encryptedPayload || ""}
              className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-[10px]"
            />
            <button
              type="button"
              onClick={copyPayload}
              className="mt-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Copy Encrypted Payload
            </button>
            <button type="button" onClick={endSession} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
              End Session
            </button>
          </div>
          <div className="space-y-4">
            <LiveAttendancePanel records={liveRecords} />
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-slate-800">Manual Attendance by USN</h3>
              <p className="mb-3 text-sm text-slate-500">
                Search by USN (text before @ in email), then mark attendance.
              </p>
              <div className="flex gap-2">
                <input
                  value={usnQuery}
                  onChange={(e) => setUsnQuery(e.target.value)}
                  placeholder="Example: 1ga23is171"
                  className="input"
                />
                <button
                  type="button"
                  onClick={searchByUsn}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
                >
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {searchResults.map((student) => (
                  <article
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-700">{student.name}</p>
                      <p className="text-xs text-slate-500">
                        USN: {student.usn} | Email: {student.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={student.alreadyMarked}
                      onClick={() => markManualAttendance(student.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm text-white ${
                        student.alreadyMarked
                          ? "cursor-not-allowed bg-slate-400"
                          : "bg-teal-700 hover:bg-teal-800"
                      }`}
                    >
                      {student.alreadyMarked ? "Marked" : "Mark Attendance"}
                    </button>
                  </article>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-sm text-slate-500">No students to display. Search by USN.</p>
                )}
              </div>
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
