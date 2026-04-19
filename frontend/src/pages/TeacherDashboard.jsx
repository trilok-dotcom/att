import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/client";
import LiveAttendancePanel from "../components/LiveAttendancePanel";
import { BookOpen, Users, Play, StopCircle, ClipboardCheck, QrCode, Search, FileSignature } from "lucide-react";

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
    setMessage("");
    try {
      await api.post("/subjects", {
        ...subjectForm,
        students: subjectForm.students,
      });
      setSubjectForm({ name: "", code: "", students: [] });
      setMessage("Subject created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create subject.");
    }
  };

  const handleCreateClass = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.post("/classes", {
        ...classForm,
        students: classForm.students,
      });
      setClassForm({ name: "", section: "", subjectId: "", students: [] });
      setMessage("Class created successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not create class.");
    }
  };

  const startSession = async (classId) => {
    try {
      const { data } = await api.post(`/sessions/start/${classId}`, { expiresInMinutes: 5 });
      setActiveSession(data);
      setLiveRecords([]);
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, data.session._id);
      setMessage("Session started. Displaying QR code.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to start session");
    }
  };

  const endSession = async () => {
    if (!activeSession?.session?._id) return;
    try {
      await api.post(`/sessions/${activeSession.session._id}/end`);
      socket?.emit("leaveSession", activeSession.session._id);
      setMessage("Session ended. Check the Reports page.");
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
      setMessage("Encrypted payload copied to clipboard.");
    } catch (error) {
      setMessage("Clipboard copy failed.");
    }
  };

  const searchByUsn = async () => {
    if (!activeSession?.session?._id) return;
    try {
      setMessage("");
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
      setMessage("Attendance marked successfully.");
      await searchByUsn(); // Refresh search view
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not mark attendance");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce p-4 bg-gray-900 border border-gray-800 text-white rounded-2xl shadow-2xl flex items-center gap-3">
          <ClipboardCheck size={20} className="text-brand-400" />
          <p className="text-sm font-medium pr-2">{message}</p>
        </div>
      )}

      {/* Header Banner */}
      <header className="glass-card p-6 sm:px-8 sm:py-6 rounded-3xl mb-8 flex justify-between items-center bg-white/70">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Teacher Workspace</h1>
              <p className="text-gray-500 font-medium text-sm mt-1">Manage subjects, classes, and live attendance forms.</p>
          </div>
      </header>

      {/* Active Session Zone */}
      {activeSession?.session ? (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Live QR Feed */}
            <section className="glass-card rounded-[2rem] bg-gray-950 p-8 flex flex-col justify-between shadow-2xl overflow-hidden relative">
                <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-brand-500/10 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10 text-center flex-1 flex flex-col">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs font-bold ring-1 ring-green-500/30 mx-auto mb-6">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Broadcasting Session
                    </div>
                    
                    <h2 className="mb-8 text-3xl font-bold text-white tracking-tight">Scan to Log Attendance</h2>
                    
                    <div className="mx-auto w-72 h-72 bg-white rounded-3xl p-4 shadow-xl border-4 border-gray-800 flex items-center justify-center relative group overflow-hidden">
                        {/* Scanner animation line */}
                        <div className="absolute left-0 right-0 h-1 bg-brand-400/50 shadow-[0_0_15px_rgba(99,102,241,1)] animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
                        <img src={activeSession.qrCodeDataUrl} alt="Attendance QR Code" className="w-full h-full object-contain" />
                    </div>
                    
                    <p className="mt-8 text-sm font-medium text-gray-400">
                        Session strictly expires at: <span className="text-white font-bold">{new Date(activeSession.session.expiresAt).toLocaleTimeString()}</span>
                    </p>

                    <div className="mt-auto space-y-4 pt-10">
                        <button
                            type="button"
                            onClick={copyPayload}
                            className="w-full rounded-2xl bg-gray-800 px-4 py-3.5 text-sm font-bold text-white hover:bg-gray-700 transition flex justify-center items-center gap-2"
                        >
                            <QrCode size={18} /> Copy QR Payload (Local Test)
                        </button>
                        <button 
                            type="button" 
                            onClick={endSession} 
                            className="w-full rounded-2xl border-2 border-red-500/20 bg-red-500/10 px-4 py-3.5 text-red-500 font-bold hover:bg-red-500 hover:text-white transition flex justify-center items-center gap-2"
                        >
                            <StopCircle size={18} /> End Session Now
                        </button>
                    </div>
                </div>
                <style jsx="true">{`
                    @keyframes scan {
                        0% { top: 10%; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 90%; opacity: 0; }
                    }
                `}</style>
            </section>

            {/* Side Logic (Manual & Live Feed) */}
            <div className="space-y-6 flex flex-col">
                <div className="flex-1 glass-card p-6 rounded-3xl shadow-sm">
                    <LiveAttendancePanel records={liveRecords} />
                </div>
                
                <section className="glass-card p-8 rounded-3xl shadow-sm border border-brand-100">
                    <h3 className="mb-2 text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <FileSignature size={22} className="text-brand-500"/> Manual Entry Fallback
                    </h3>
                    <p className="mb-6 text-sm text-gray-500">
                        Manually search USN and bypass QR scan.
                    </p>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>
                            <input
                                value={usnQuery}
                                onChange={(e) => setUsnQuery(e.target.value)}
                                placeholder="E.g: iga20is001"
                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 shadow-sm transition-all"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={searchByUsn}
                            className="rounded-2xl bg-gray-900 px-6 py-3.5 text-white hover:bg-black font-bold transition shadow-md whitespace-nowrap"
                        >
                            {searchLoading ? "..." : "Search"}
                        </button>
                    </div>

                    {/* Results */}
                    <div className="mt-6 space-y-3">
                        {searchResults.map((student) => (
                            <article
                                key={student.id}
                                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:shadow-sm"
                            >
                                <div>
                                    <p className="font-bold text-gray-800">{student.name}</p>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                                        USN: {student.usn}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={student.alreadyMarked}
                                    onClick={() => markManualAttendance(student.id)}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                                        student.alreadyMarked
                                        ? "cursor-not-allowed bg-green-50 text-green-600 ring-1 ring-green-200"
                                        : "bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-500/20 hover:-translate-y-0.5"
                                    }`}
                                >
                                    {student.alreadyMarked ? "Marked" : "Mark"}
                                </button>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
      ) : (
        <>
            {/* Setup Forms */}
            <div className="grid gap-8 lg:grid-cols-2">
                <form onSubmit={handleCreateSubject} className="glass-card p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 text-brand-100 opacity-20 pointer-events-none group-hover:scale-110 transition duration-500">
                        <BookOpen size={200} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">Create Subject <BookOpen size={20} className="text-gray-400"/></h2>
                        <div className="space-y-4">
                            <input className="input" placeholder="Subject Name (e.g. Data Structures)" value={subjectForm.name} onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))} required />
                            <input className="input uppercase" placeholder="Subject Code (CS201)" value={subjectForm.code} onChange={(e) => setSubjectForm((p) => ({ ...p, code: e.target.value }))} required />
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Enroll Students</label>
                                <select
                                    multiple
                                    className="input min-h-32 custom-scrollbar text-sm"
                                    value={subjectForm.students}
                                    onChange={(event) => {
                                        const selected = [...event.target.selectedOptions].map((option) => option.value);
                                        setSubjectForm((p) => ({ ...p, students: selected }));
                                    }}
                                >
                                    {students.map((student) => (
                                        <option key={student._id} value={student._id} className="py-1">{student.name} ({student.collegeId || "No ID"})</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn-primary mt-2">Initialize Subject</button>
                        </div>
                    </div>
                </form>

                <form onSubmit={handleCreateClass} className="glass-card p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute -bottom-10 -right-10 text-blue-100 opacity-20 pointer-events-none group-hover:-translate-x-2 transition duration-500">
                        <Users size={200} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="mb-6 text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">Create Section <Users size={20} className="text-gray-400"/></h2>
                        <div className="space-y-4">
                            <input className="input" placeholder="Class Name (e.g. BTech 2024)" value={classForm.name} onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))} required />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input className="input uppercase" placeholder="Section (A/B)" value={classForm.section} onChange={(e) => setClassForm((p) => ({ ...p, section: e.target.value }))} required />
                                <select className="input text-sm" value={classForm.subjectId} onChange={(e) => setClassForm((p) => ({ ...p, subjectId: e.target.value }))} required>
                                    <option value="" disabled>Select Subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject._id} value={subject._id}>{subject.code}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Bind Students</label>
                                <select
                                    multiple
                                    className="input min-h-32 custom-scrollbar text-sm"
                                    value={classForm.students}
                                    onChange={(event) => {
                                        const selected = [...event.target.selectedOptions].map((option) => option.value);
                                        setClassForm((p) => ({ ...p, students: selected }));
                                    }}
                                >
                                    {students.map((student) => (
                                        <option key={student._id} value={student._id} className="py-1">{student.name} ({student.collegeId || "No ID"})</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn-primary mt-2">Initialize Section</button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Launchpad */}
            <section className="glass-card p-8 rounded-3xl mt-8">
                <h2 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
                    Active Classrooms
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {classes.length === 0 ? (
                    <p className="text-gray-400 col-span-full py-4 font-medium">No sections available to start.</p>
                ) : (
                    classes.map((classSection) => (
                        <article key={classSection._id} className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col transition hover:shadow-lg hover:border-gray-300 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{classSection.name}</p>
                                    <p className="text-brand-600 font-bold text-sm bg-brand-50 inline-block px-2 py-0.5 rounded-full mt-1">Section {classSection.section}</p>
                                </div>
                            </div>
                            
                            <p className="text-sm font-medium text-gray-500 mb-1">{classSection.subject?.name}</p>
                            <p className="text-xs text-gray-400 mb-6 flex items-center gap-1.5"><Users size={12}/> {classSection.students?.length || 0} Enrolled</p>
                            
                            <button
                                type="button"
                                className="mt-auto flex items-center justify-center gap-2 w-full rounded-xl bg-gray-900 px-4 py-3 font-bold text-white transition shadow-md hover:bg-black hover:shadow-lg"
                                onClick={() => startSession(classSection._id)}
                            >
                                <Play size={16} className="fill-current" /> Initialize Session
                            </button>
                        </article>
                    ))
                )}
                </div>
            </section>
        </>
      )}

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}</style>
    </div>
  );
}
