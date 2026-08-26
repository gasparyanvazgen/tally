"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputClass } from "../components/ui";
import AuthLayout from "../components/AuthLayout";

export default function Login() {
  // Read the shared sign-in action and create local state for every form field.
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    // Keep the form on this page instead of letting the browser refresh it.
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setError("");
    setLoading(true);
    // Update the shared auth state, then navigate to the private dashboard.
    await signIn(email, password);
    router.push("/app");
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to Tally"
      footer={
        <>
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-ink hover:text-stamp"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@studio.com"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>
        {error && <p className="text-sm text-rust">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>
        <p className="text-center text-xs text-ink-400">
          Demo build \u2014 any email and password will do.
        </p>
      </form>
    </AuthLayout>
  );
}
