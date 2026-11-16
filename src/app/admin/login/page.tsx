
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError(`Supabase login error: ${loginError.message}`);
        return;
      }

      if (!data.user) {
        setError("Login failed: No user was returned.");
        return;
      }

      const { data: admin, error: adminError } =
        await supabase
          .from("admin_profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

      if (adminError) {
        await supabase.auth.signOut();
        setError(`Admin verification error: ${adminError.message}`);
        return;
      }

      if (!admin) {
        await supabase.auth.signOut();
        setError("Your account is not registered as an admin.");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();

    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";

      setError(`Unexpected error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-5 py-16 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl sm:p-10">

        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.3em] text-green-400">
            SAFA ARTS FEST 2K27
          </p>

          <h1 className="mt-6 text-3xl font-extrabold">
            Admin Login
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Sign in to manage the festival website.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-10 space-y-6">

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Admin Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
              autoComplete="username"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-green-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 pr-16 text-white outline-none transition focus:border-green-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-green-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="break-words rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "PLEASE WAIT..." : "LOGIN"}
          </button>

        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          SAFA ARTS FEST 2K27 · Admin Access Only
        </p>

      </div>
    </main>
  );
}
