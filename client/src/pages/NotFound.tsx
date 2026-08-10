import { useEffect } from "react";
import { Link } from "wouter";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found | Lizaz";
  }, []);

  return (
    <main
      className="not-found"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background: "linear-gradient(160deg, #f7f8fb 0%, #eef1f7 100%)",
      }}
    >
      <div
        className="not-found__card"
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          padding: "2.5rem 2rem",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(28, 39, 79, 0.12)",
        }}
      >
        <p style={{ color: "#b8955a", fontWeight: 700, letterSpacing: "0.12em", margin: 0 }}>404</p>
        <h1 style={{ color: "#1c274f", margin: "0.75rem 0" }}>Page not found</h1>
        <p style={{ color: "#5b647a" }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn--primary">
            Back to home
          </Link>
          <Link href="/contact" className="btn btn--primary">
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
