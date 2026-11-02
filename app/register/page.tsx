"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { School, User, Mail, Phone, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    schoolName: "",
    adminName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(field: string, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName,
          adminName: form.adminName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to send OTP.");
        return;
      }

      setOtpSent(true);
      setSuccess("OTP sent! Please check your email.");
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "OTP verification failed.");
        return;
      }

      setSuccess("Email verified! Your college account is ready. Redirecting...");
      setTimeout(() => router.push("/login/admin"), 1500);
    } catch {
      setError("Unable to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-indigo-700 p-12 text-white md:flex">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3"><School size={28} /></div>
              <span className="text-3xl font-bold">Presently</span>
            </div>
            <h1 className="mb-5 text-4xl font-bold">Manage your school smarter.</h1>
            <p className="text-indigo-100">
              One platform for school administration, teachers, students and attendance management.
            </p>
          </div>
          <div className="space-y-5">
            {["Easy school management", "Centralized attendance tracking", "Dedicated teacher and student access", "School-specific secure accounts"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 size={20} /><span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-indigo-200">Presently © {new Date().getFullYear()}</p>
        </section>

        <section className="p-7 sm:p-10">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600 md:hidden"><School size={28} /></div>
            <h2 className="text-3xl font-bold text-gray-900">
              {otpSent ? "Verify your email" : "Create Admin Account"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {otpSent ? `Enter the 6-digit code sent to ${form.email}` : "Register your college and create your Admin account."}
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {[
                { field: "schoolName", label: "College / School Name", placeholder: "Enter college name", icon: School },
                { field: "adminName", label: "Admin Full Name", placeholder: "Enter your name", icon: User },
                { field: "email", label: "Email Address", placeholder: "admin@example.com", icon: Mail, type: "email" },
                { field: "phone", label: "Phone Number", placeholder: "Enter phone number", icon: Phone },
                { field: "password", label: "Password", placeholder: "Minimum 8 characters", icon: Lock, type: "password" },
                { field: "confirmPassword", label: "Confirm Password", placeholder: "Confirm password", icon: Lock, type: "password" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.field}>
                    <label className="mb-2 block text-sm font-medium text-gray-700">{item.label} *</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-3.5 text-gray-400" size={18} />
                      <input
                        required
                        type={item.type || "text"}
                        maxLength={item.field === "schoolName" ? 120 : item.field === "adminName" ? 100 : undefined}
                        minLength={item.field === "password" ? 8 : undefined}
                        value={form[item.field as keyof typeof form]}
                        onChange={(e) => updateField(item.field, e.target.value)}
                        placeholder={item.placeholder}
                        className={inputClass}
                      />
                    </div>
                  </div>
                );
              })}

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {loading ? "Sending OTP..." : "Send Email OTP"} {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">6-Digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter OTP"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-indigo-500"
                />
              </div>
              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>
              <button onClick={() => { setOtpSent(false); setOtp(""); setError(""); setSuccess(""); }} className="w-full text-sm text-indigo-600 hover:underline">
                Back to registration
              </button>
            </div>
          )}

          {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{success}</div>}

          <p className="mt-7 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">Sign In</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
