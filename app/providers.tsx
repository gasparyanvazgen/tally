"use client";

// Context providers use React state and browser storage, so this file must run in the browser.
import type { ReactNode } from "react";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";

export default function Providers({ children }: { children: ReactNode }) {
  // Nest the data store inside authentication so every page can use both stores.
  return (
    <AuthProvider>
      <DataProvider>{children}</DataProvider>
    </AuthProvider>
  );
}
