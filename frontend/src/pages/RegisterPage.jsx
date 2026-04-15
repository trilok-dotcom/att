import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

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

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
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
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
      <h1 className="mb-1 font-serif text-3xl text-amber-900">Create Account</h1>
      <p className="mb-6 text-sm text-slate-600">Register using your college details.</p>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="input" required />
        <input name="email" type="email" placeholder="College Email" value={form.email} onChange={handleChange} className="input" required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} className="input" required />
        <select name="role" value={form.role} onChange={handleChange} className="input">
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <input name="collegeId" placeholder="College ID" value={form.collegeId} onChange={handleChange} className="input" />
        <input name="department" placeholder="Department" value={form.department} onChange={handleChange} className="input" />
        {form.role === "student" && (
          <input name="semester" type="number" min="1" max="12" placeholder="Semester" value={form.semester} onChange={handleChange} className="input" />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="rounded-lg bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800">
          Register
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <Link to="/login" className="font-semibold text-amber-700">Login</Link>
      </p>
    </div>
  );
}
