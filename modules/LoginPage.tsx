"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const METRICS = [
  { label: "Pipeline Value", value: "ETB 12.4M", change: "+18%", positive: true },
  { label: "Win Rate",        value: "68%",       change: "+4 pts", positive: true },
  { label: "Active Leads",   value: "247",        change: "+32",   positive: true },
  { label: "Avg Deal Cycle", value: "23 days",    change: "−3 d",  positive: true },
];

const FEATURES = [
  { icon: TrendingUp, text: "Pipeline & deal management" },
  { icon: Target,     text: "Lead scoring & qualification" },
  { icon: Zap,        text: "Service desk & SLA tracking" },
  { icon: Users,      text: "Sales targets & team reporting" },
];

export function LoginPage() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]     = useState(false);
  const [loading, setLoading]       = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">

      {/* ── LEFT BRAND PANEL ── */}
      <div
        className="relative hidden lg:flex lg:w-[58%] flex-col justify-between overflow-hidden p-10"
        style={{
          background: "linear-gradient(145deg, #0a1854 0%, #1a3a9f 45%, #4080f0 100%)",
        }}
      >
        {/* Dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1.2px, transparent 1.2px)",
            backgroundSize: "26px 26px",
          }}
        />
        {/* Glowing orbs */}
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(122,174,255,0.25) 0%, transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-56 -left-28 h-[480px] w-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(64,128,240,0.3) 0%, transparent 65%)" }}
        />

        {/* Wordmark */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-[20px] font-bold tracking-tight text-white">bettercrm</span>
        </div>

        {/* Hero copy + metrics */}
        <div className="relative z-10 space-y-9">
          <div>
            <h1 className="text-[38px] font-bold leading-[1.15] tracking-tight text-white">
              Your unified<br />
              revenue intelligence<br />
              platform.
            </h1>
            <p className="mt-3.5 max-w-[360px] text-[14px] leading-relaxed text-white/65">
              Close more deals, qualify leads faster, and keep your entire team aligned — all in one seamless workspace.
            </p>
          </div>

          {/* Live-metric cards */}
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                    {m.label}
                  </p>
                  <span className="shrink-0 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    {m.change}
                  </span>
                </div>
                <p className="mt-2 text-[22px] font-bold leading-none text-white">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[13px] text-white/70">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon className="h-3.5 w-3.5 text-[#7aaeff]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-[11px] text-white/35">
          © {new Date().getFullYear()} bettercrm · All rights reserved.
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12 sm:px-12">

        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4080f0]">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[18px] font-bold text-[#1c1e21]">bettercrm</span>
        </div>

        <div className="w-full max-w-[380px]">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[26px] font-bold text-[#1c1e21]">Welcome back</h2>
            <p className="mt-1.5 text-[13px] text-[#6b7280]">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#1c1e21]">
                Email address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="h-10 border-[#e5e7eb] bg-[#f9fafb] text-sm transition-colors focus:bg-white"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-[#1c1e21]">Password</label>
                <Link
                  href="#"
                  className="text-xs text-[#4080f0] hover:text-[#3070e0] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="h-10 border-[#e5e7eb] bg-[#f9fafb] pr-10 text-sm transition-colors focus:bg-white"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] transition hover:text-[#6b7280]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] accent-[#4080f0]"
              />
              <label
                htmlFor="remember"
                className="cursor-pointer select-none text-xs text-[#6b7280]"
              >
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 w-full bg-[#4080f0] text-sm font-semibold text-white hover:bg-[#3070e0] disabled:opacity-70"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#e5e7eb]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              or continue with
            </span>
            <div className="h-px flex-1 bg-[#e5e7eb]" />
          </div>

          {/* SSO buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] transition hover:bg-[#f9fafb] hover:border-[#d1d5db]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex h-10 items-center justify-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white text-xs font-medium text-[#374151] transition hover:bg-[#f9fafb] hover:border-[#d1d5db]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#f25022" d="M1 1h10v10H1z"/>
                <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                <path fill="#7fba00" d="M1 13h10v10H1z"/>
                <path fill="#ffb900" d="M13 13h10v10H13z"/>
              </svg>
              Microsoft
            </button>
          </div>

          {/* Legal */}
          <p className="mt-10 text-center text-[11px] text-[#9ca3af]">
            By signing in you agree to our{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-[#6b7280]">Terms of Service</Link>
            {" "}and{" "}
            <Link href="#" className="underline underline-offset-2 hover:text-[#6b7280]">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
