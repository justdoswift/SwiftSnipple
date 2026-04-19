import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../lib/heroui";
import { getMessages } from "../../lib/messages";
import { useAppLocale } from "../../lib/locale";
import type { AdminAuthSession } from "../../lib/admin-auth";
import { loginAdmin } from "../../services/admin-auth";

interface AdminLoginPageProps {
  authSession: AdminAuthSession | null;
  onAuthenticate: (session: AdminAuthSession) => void;
}

export default function AdminLoginPage({ authSession, onAuthenticate }: AdminLoginPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).adminAuth;
  const navigate = useNavigate();
  const [email, setEmail] = useState(authSession?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const session = await loginAdmin({
        email: email.trim().toLowerCase(),
        password,
      });
      onAuthenticate(session);
      navigate(`/${locale}/admin`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.invalidEmail);
    } finally {
      setIsSubmitting(false);
    }
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

            <Button className="auth-primary-button" type="submit" isDisabled={isSubmitting}>
              <Mail size={16} strokeWidth={2.1} />
              <span>{copy.enterWorkspace}</span>
            </Button>
          </form>

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
