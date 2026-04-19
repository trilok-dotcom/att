import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ScanFace, ArrowRight, Lock, Mail, User } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setIsLoading(true);
      const { data } = await api.post("/auth/login", form);
      login(data);

      if (data.user.role === "teacher") navigate("/teacher");
      else if (data.user.role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 p-6 selection:bg-brand-500 selection:text-white">
      {/* Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-[1/1] bg-gradient-to-tr from-brand-300/30 to-blue-300/30 blur-[120px] rounded-full pointer-events-none opacity-60"></div>
      
      <div className="w-full max-w-md glass-card relative z-10 p-8 sm:p-10 rounded-[2.5rem]">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30 mb-6 group transition-transform hover:scale-105">
            <ScanFace size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">College Login</h1>
          <p className="text-gray-500 text-sm font-medium">Please sign in to continue</p>
        </div>

        {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name field removed as it's no longer required for login */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Email address</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@college.edu"
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                </div>
                <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                />
            </div>
          </div>

          <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 py-4 bg-gray-900 flex justify-center items-center gap-2 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 group"
          >
              {isLoading ? 'Signing in...' : (
                  <>
                      Sign In <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
              )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          New user? <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 transition">Register here</Link>
        </p>
      </div>
    </div>
  );
}
