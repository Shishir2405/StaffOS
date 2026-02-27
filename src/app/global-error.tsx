"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif"
        }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Something went wrong!
          </h1>
          <p style={{ color: "#666", marginBottom: "2rem", textAlign: "center" }}>
            A critical error occurred. Please refresh the page or contact support.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.875rem", color: "#999", marginBottom: "2rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
