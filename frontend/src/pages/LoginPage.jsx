import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const { data } = await api.post("/auth/login", form);
      login(data);

      if (data.user.role === "teacher") navigate("/teacher");
      else if (data.user.role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <h1 className="mb-1 font-serif text-3xl text-amber-900">College Login</h1>
      <p className="mb-6 text-sm text-slate-600">Use your college email and password.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Student Name (required for student login)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-amber-300 focus:ring"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@college.edu"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-amber-300 focus:ring"
          required
        />
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-amber-300 focus:ring"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-amber-700 px-4 py-2 font-medium text-white transition hover:bg-amber-800"
        >
          Login
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New user? <Link to="/register" className="font-semibold text-amber-700">Register</Link>
      </p>
    </div>
  );
}
