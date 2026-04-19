import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, Github, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../lib/heroui";
import { getMessages } from "../lib/messages";
import { localizePublicPath, useAppLocale } from "../lib/locale";
import type { MockAuthProvider, MockAuthSession } from "../lib/mock-auth";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  authSession: MockAuthSession | null;
  onAuthenticate: (session: MockAuthSession, remember: boolean) => void;
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

export default function LoginPage({ authSession, onAuthenticate }: LoginPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).publicAuth;
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState(authSession?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  const title = mode === "login" ? copy.titleLogin : copy.titleSignup;
  const ctaLabel = mode === "login" ? copy.logIn : copy.createAccount;

  const modePrompt = useMemo(
    () =>
      mode === "login"
        ? {
            label: copy.needAccount,
            action: copy.signUp,
            nextMode: "signup" as const,
          }
        : {
            label: copy.alreadyHaveAccount,
            action: copy.logIn,
            nextMode: "login" as const,
          },
    [copy.alreadyHaveAccount, copy.logIn, copy.needAccount, copy.signUp, mode],
  );

  function validateEmail(value: string) {
    return /\S+@\S+\.\S+/.test(value);
  }

  function completeAuth(provider: MockAuthProvider, nextEmail: string) {
    const session: MockAuthSession = {
      email: nextEmail,
      provider,
      createdAt: new Date().toISOString(),
    };

    onAuthenticate(session, provider === "email" ? rememberMe : true);
    navigate(localizePublicPath("/account"));
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

    if (mode === "signup" && password !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }

    setError("");
    completeAuth("email", email.trim().toLowerCase());
  }

  function handleProviderAuth(provider: Exclude<MockAuthProvider, "email">) {
    setError("");
    completeAuth(provider, provider === "google" ? "builder@google.mock" : "builder@github.mock");
  }

  return (
    <section className="auth-page-shell">
      <div className="auth-page-backdrop" aria-hidden="true" />
      <div className="auth-page-overlay" aria-hidden="true" />

      <header className="auth-page-brand-shell public-nav-shell flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        <Link to={localizePublicPath("/")} className="auth-page-brand public-nav-brand min-w-0" aria-label="Return to Just Do Swift home">
          <span className="public-nav-logo" aria-hidden="true">
            <span className="public-nav-logo-bar public-nav-logo-bar-primary" />
            <span className="public-nav-logo-bar public-nav-logo-bar-secondary" />
          </span>
          <span className="auth-brand-title truncate">
            Just Do Swift
          </span>
        </Link>
      </header>

      <div className="auth-page-content">
        <div className="auth-card">
          <div className="auth-card-copy">
            <h1 className="auth-card-title">{title}</h1>
          </div>

          {authSession ? (
            <div className="auth-session-banner">
              <p className="auth-body-copy">
                {copy.sessionBanner} <strong>{authSession.email}</strong>.
              </p>
              <Button className="auth-primary-button" onPress={() => navigate(localizePublicPath("/account"))}>
                {copy.openMemberCenter}
              </Button>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-micro-copy auth-field-label">{copy.emailAddress}</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.enterEmail}
                autoComplete="email"
              />
            </label>

            <label className="auth-field auth-field-password">
              <span className="auth-micro-copy auth-field-label">{copy.password}</span>
              <input
                type={isPasswordVisible ? "text" : "password"}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "login" ? copy.enterPassword : copy.createPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="auth-visibility-button"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                onClick={() => setIsPasswordVisible((currentState) => !currentState)}
              >
                {isPasswordVisible ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
            </label>

            {mode === "signup" ? (
              <label className="auth-field">
                <span className="auth-micro-copy auth-field-label">{copy.confirmPassword}</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={copy.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                />
              </label>
            ) : null}

            {mode === "login" ? (
              <div className="auth-row">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>{copy.rememberMe}</span>
                </label>
                <button type="button" className="auth-text-button">
                  {copy.forgotPassword}
                </button>
              </div>
            ) : null}

            {error ? <p className="auth-error">{error}</p> : null}

            <Button className="auth-primary-button" type="submit">
              <Mail size={16} strokeWidth={2.1} />
              <span>{ctaLabel}</span>
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

          <div className="auth-mode-toggle">
            <span className="auth-body-copy">{modePrompt.label}</span>
            <button
              type="button"
              className="auth-text-button"
              onClick={() => {
                setMode(modePrompt.nextMode);
                setError("");
              }}
            >
              {modePrompt.action}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
