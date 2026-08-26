"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Card, Field, inputClass } from "../../components/ui";

export default function Settings() {
  // Copy the shared profile into editable local form fields.
  const { profile, updateProfile, email } = useAuth();
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [profileEmail, setProfileEmail] = useState(
    profile.email || email || "",
  );
  const [address, setAddress] = useState(profile.address);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    // Save the form values via AuthContext, which writes to the profiles table.
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const { error } = await updateProfile({
      businessName,
      ownerName,
      email: profileEmail,
      address,
    });
    setSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">
        This is what shows up at the top of every invoice you send.
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Business or your name">
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Contact name"
            hint="Optional — shown under the business name."
          >
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Invoice email">
            <input
              type="email"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Business address"
            hint="Optional — appears on the invoice PDF."
          >
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          {saveError && <p className="text-sm text-rust">{saveError}</p>}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && <span className="text-sm text-stamp-dark">Saved.</span>}
          </div>
        </form>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg text-ink">Account</h2>
        <p className="mt-1 text-sm text-ink-500">Logged in as {email}</p>
        <p className="mt-3 text-xs text-ink-400">
          Password changes and account deletion aren't wired up in this demo
          build — see backend task 1 for real auth.
        </p>
      </Card>
    </div>
  );
}
