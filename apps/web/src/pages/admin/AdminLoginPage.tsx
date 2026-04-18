import { useState, type FormEvent } from "react";
import { Github, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../lib/heroui";
import { getMessages } from "../../lib/messages";
import { useAppLocale } from "../../lib/locale";
import type { AdminAuthProvider, AdminAuthSession } from "../../lib/admin-auth";

interface AdminLoginPageProps {
  authSession: AdminAuthSession | null;
  onAuthenticate: (session: AdminAuthSession) => void;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.6 2.8-4 2.8-6.9 0-.7-.1-1.5-.2-2.2H12Z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.6 0 4.8-.9 6.4-2.4l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.3-4l-3.2 2.5C5 18.8 8.2 21 12 21Z"
      />
      <path
        fill="#4A90E2"
        d="M6.7 13.1c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.5 6.8C2.8 8.2 2.4 9.8 2.4 11.2s.4 3 1.1 4.4l3.2-2.5Z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.3c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.3 14.6 1.4 12 1.4c-3.8 0-7 2.2-8.5 5.4l3.2 2.5c.7-2.3 2.8-4 5.3-4Z"
      />
    </svg>
  );
}

export default function AdminLoginPage({ authSession, onAuthenticate }: AdminLoginPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).adminAuth;
  const navigate = useNavigate();
  const [email, setEmail] = useState(authSession?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function validateEmail(value: string) {
    return /\S+@\S+\.\S+/.test(value);
  }

  function completeAuth(provider: AdminAuthProvider, nextEmail: string) {
    const session: AdminAuthSession = {
      email: nextEmail,
      provider,
      createdAt: new Date().toISOString(),
    };

    onAuthenticate(session);
    navigate(`/${locale}/admin`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError(copy.invalidEmail);
      return;
    }

    if (password.trim().length < 6) {
      setError(copy.passwordShort);
      return;
    }

    setError("");
    completeAuth("email", email.trim().toLowerCase());
  }

  function handleProviderAuth(provider: Exclude<AdminAuthProvider, "email">) {
    setError("");
    completeAuth(provider, provider === "google" ? "creator@google.mock" : "creator@github.mock");
  }

  return (
    <section className="auth-page-shell auth-page-shell-admin">
      <div className="auth-page-backdrop" aria-hidden="true" />
      <div className="auth-page-overlay" aria-hidden="true" />

      <header className="auth-page-brand-shell public-nav-shell flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        <Link to={`/${locale}`} className="auth-page-brand public-nav-brand min-w-0" aria-label="Return to Just Do Swift home">
          <span className="public-nav-logo" aria-hidden="true">
            <span className="public-nav-logo-bar public-nav-logo-bar-primary" />
            <span className="public-nav-logo-bar public-nav-logo-bar-secondary" />
          </span>
          <span className="auth-brand-title truncate">
            Just Do Swift
          </span>
        </Link>
      </header>

      <div className="auth-page-content auth-page-content-admin">
        <div className="auth-card auth-card-admin">
          <div className="auth-card-copy">
            <p className="auth-micro-copy auth-admin-kicker">{copy.kicker}</p>
            <h1 className="auth-card-title">{copy.title}</h1>
            <p className="auth-body-copy auth-admin-copy">
              {copy.copy}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-micro-copy auth-field-label">{copy.emailAddress}</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.creatorEmailPlaceholder}
                autoComplete="email"
              />
            </label>

            <label className="auth-field">
              <span className="auth-micro-copy auth-field-label">{copy.password}</span>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                autoComplete="current-password"
              />
            </label>

            {error ? <p className="auth-error">{error}</p> : null}

            <Button className="auth-primary-button" type="submit">
              <Mail size={16} strokeWidth={2.1} />
              <span>{copy.enterWorkspace}</span>
            </Button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span />
            <span className="auth-micro-copy auth-divider-label">OR</span>
            <span />
          </div>

          <div className="auth-provider-stack">
            <button type="button" className="auth-provider-button" onClick={() => handleProviderAuth("google")}>
              <GoogleMark />
              <span>{copy.continueGoogle}</span>
            </button>
            <button type="button" className="auth-provider-button" onClick={() => handleProviderAuth("github")}>
              <Github size={16} strokeWidth={2} />
              <span>{copy.continueGithub}</span>
            </button>
          </div>

          <div className="auth-admin-footer">
            <Link to={`/${locale}`} className="auth-text-button">
              {copy.backToPublicCollection}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
