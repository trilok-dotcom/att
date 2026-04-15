import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#f7efd4_0%,#f2f5ff_35%,#fbf7ef_70%)] text-slate-800">
      <header className="border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-2xl font-semibold tracking-wide text-amber-900">
            Smart Attendance
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {user && (
              <span className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 font-medium text-amber-800">
                {user.name} ({user.role})
              </span>
            )}
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="rounded-lg bg-slate-900 px-3 py-1.5 text-white">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
