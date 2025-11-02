"use client";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <header style={{
            background: "#333",
            color: "white",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <nav style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/app" style={{ color: "white" }}>ダッシュボード</Link>
              <Link href="/app/tweet" style={{ color: "white" }}>Tweet</Link>
              <Link href="/app/board" style={{ color: "white" }}>掲示板</Link>
              <Link href="/app/history" style={{ color: "white" }}>歴史</Link>
            </nav>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span>{user?.signInDetails?.loginId}</span>
              <button
                onClick={signOut}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#555",
                  border: "none",
                  color: "white",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Sign out
              </button>
            </div>
          </header>
          <main style={{ flex: 1, padding: "2rem" }}>{children}</main>
        </div>
      )}
    </Authenticator>
  );
}
