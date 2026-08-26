"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputClass } from "../components/ui";
import AuthLayout from "../components/AuthLayout";

export default function Signup() {
  // These values are controlled inputs: React stores their current value while the user types.
  const { signUp } = useAuth();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    // Prevent normal HTML form navigation so we can validate first.
    e.preventDefault();
    if (!email || !password) {
      setError("Enter an email and password to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: signUpError, needsEmailConfirmation } = await signUp(
      email,
      password,
      businessName,
    );
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
      return;
    }
    if (needsEmailConfirmation) {
      setError("Check your email to confirm your account, then log in.");
      return;
    }
    router.push("/app");
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Set up your account"
      footer={
        <>
          Already have one?{" "}
          <Link href="/login" className="font-medium text-ink hover:text-stamp">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Business or your name"
          hint="Shown on your invoices \u2014 you can change this later."
        >
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Ada Ruiz Consulting"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
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
            placeholder="At least 6 characters"
          />
        </Field>
        {error && <p className="text-sm text-rust">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
