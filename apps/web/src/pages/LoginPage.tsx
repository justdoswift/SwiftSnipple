import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, Github, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../lib/heroui";
import type { MockAuthProvider, MockAuthSession } from "../lib/mock-auth";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  authSession: MockAuthSession | null;
  onAuthenticate: (session: MockAuthSession, remember: boolean) => void;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
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
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState(authSession?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  const title = mode === "login" ? "Log In" : "Sign Up";
  const ctaLabel = mode === "login" ? "Log In" : "Create Account";

  const modePrompt = useMemo(
    () =>
      mode === "login"
        ? {
            label: "Need to create an account?",
            action: "Sign Up",
            nextMode: "signup" as const,
          }
        : {
            label: "Already have an account?",
            action: "Log In",
            nextMode: "login" as const,
          },
    [mode],
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
    navigate("/account");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError("Use a valid email address to enter the member shell.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Passwords need at least six characters in this UI preview.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Password confirmation needs to match before we can stage the account.");
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

      <header className="auth-page-brand-shell public-nav-shell mx-auto flex max-w-[1380px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="auth-page-brand public-nav-brand min-w-0" aria-label="Return to Just Do Swift home">
          <span className="public-nav-logo" aria-hidden="true">
            <span className="public-nav-logo-bar public-nav-logo-bar-primary" />
            <span className="public-nav-logo-bar public-nav-logo-bar-secondary" />
          </span>
          <span className="truncate text-[1.05rem] font-semibold tracking-[-0.03em] md:text-[1.2rem]">
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
              <p className="type-body-sm">
                You already have a staged member session for <strong>{authSession.email}</strong>.
              </p>
              <Button className="public-primary-button type-action h-12 w-full" radius="full" onPress={() => navigate("/account")}>
                Open Member Center
              </Button>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="type-mono-micro auth-field-label">Email Address</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </label>

            <label className="auth-field auth-field-password">
              <span className="type-mono-micro auth-field-label">Password</span>
              <input
                type={isPasswordVisible ? "text" : "password"}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="auth-visibility-button"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                onClick={() => setIsPasswordVisible((currentState) => !currentState)}
              >
                {isPasswordVisible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
              </button>
            </label>

            {mode === "signup" ? (
              <label className="auth-field">
                <span className="type-mono-micro auth-field-label">Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
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
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-text-button">
                  Forgot password?
                </button>
              </div>
            ) : null}

            {error ? <p className="auth-error">{error}</p> : null}

            <Button className="auth-primary-button" radius="full" type="submit">
              <Mail size={18} strokeWidth={2.2} />
              <span>{ctaLabel}</span>
            </Button>
          </form>

          <div className="auth-divider" aria-hidden="true">
            <span />
            <span className="type-mono-micro">OR</span>
            <span />
          </div>

          <div className="auth-provider-stack">
            <button type="button" className="auth-provider-button" onClick={() => handleProviderAuth("google")}>
              <GoogleMark />
              <span>Continue with Google</span>
            </button>
            <button type="button" className="auth-provider-button" onClick={() => handleProviderAuth("github")}>
              <Github size={18} strokeWidth={2} />
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="auth-mode-toggle">
            <span>{modePrompt.label}</span>
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
