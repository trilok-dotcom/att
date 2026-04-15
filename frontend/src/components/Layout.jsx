import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, QrCode } from "lucide-react";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-brand-500 selection:text-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/60 shadow-sm transition-all duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <QrCode size={18} className="text-white" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-gray-900 group-hover:text-brand-600 transition-colors">
              Attendance Pro
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200/80 cursor-default">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    <span className="text-xs font-bold text-gray-700 tracking-wide uppercase">{user.role}</span>
                </div>
            )}
            
            {user ? (
              <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
              </div>
            ) : (
              <Link to="/login" className="rounded-xl px-5 py-2.5 font-bold text-sm bg-gray-900 text-white hover:bg-black transition-all shadow-md">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="mx-auto w-full max-w-6xl px-6 py-10 flex-1 relative flex flex-col">
          {children}
      </main>
    </div>
  );
}
