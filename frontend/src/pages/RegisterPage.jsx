import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ScanFace, ArrowRight, Lock, Mail, User, School, BookOpen, Layers } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    collegeId: "",
    department: "",
    semester: "",
  });
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
      const payload = {
        ...form,
        semester: form.semester ? Number(form.semester) : undefined,
      };
      const { data } = await api.post("/auth/register", payload);
      login(data);
      if (data.user.role === "teacher") navigate("/teacher");
      else if (data.user.role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 py-12 px-6 selection:bg-brand-500 selection:text-white">
      {/* Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-[1/1] bg-gradient-to-tr from-brand-300/30 to-blue-300/30 blur-[120px] rounded-full pointer-events-none opacity-60"></div>
      
      <div className="w-full max-w-lg glass-card relative z-10 p-8 sm:p-10 rounded-[2.5rem] mt-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-600 to-brand-400 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30 mb-6 group transition-transform hover:scale-105">
            <ScanFace size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm font-medium">Join the intelligent attendance platform.</p>
        </div>

        {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <User size={16} />
                    </div>
                    <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Role</label>
                <select 
                    name="role" 
                    value={form.role} 
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all font-medium text-gray-700"
                >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email address</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                </div>
                <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@college.edu"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                </div>
                <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 mt-4">
              <p className="text-xs font-bold text-brand-600 bg-brand-50 inline-block px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Institution Details</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <School size={16} />
                        </div>
                        <input
                            type="text"
                            name="collegeId"
                            value={form.collegeId}
                            onChange={handleChange}
                            placeholder="College ID / USN"
                            disabled={isLoading}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <BookOpen size={16} />
                        </div>
                        <input
                            type="text"
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            placeholder="Department (e.g. CS)"
                            disabled={isLoading}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                        />
                    </div>
                </div>

                {form.role === "student" && (
                    <div className="space-y-1.5 sm:col-span-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <Layers size={16} />
                            </div>
                            <input
                                type="number"
                                name="semester"
                                min="1"
                                max="12"
                                value={form.semester}
                                onChange={handleChange}
                                placeholder="Semester Number (1-8)"
                                disabled={isLoading}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 shadow-sm transition-all"
                            />
                        </div>
                    </div>
                )}
              </div>
          </div>

          <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 py-4 bg-gray-900 flex justify-center items-center gap-2 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-xl shadow-gray-900/20 hover:shadow-gray-900/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 group"
          >
              {isLoading ? 'Creating Account...' : (
                  <>
                      Complete Registration <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
              )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 transition">Sign In Instead</Link>
        </p>
      </div>
    </div>
  );
}
