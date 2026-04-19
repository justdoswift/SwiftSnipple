import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../lib/heroui";
import { getMessages } from "../lib/messages";
import { localizePublicPath, useAppLocale } from "../lib/locale";
import { loginMember, signupMember } from "../services/member-auth";
import type { MemberSession } from "../types";

type AuthMode = "login" | "signup";

interface LoginPageProps {
  authSession: MemberSession | null;
  onAuthenticate: (session: MemberSession) => void;
}

export default function LoginPage({ authSession, onAuthenticate }: LoginPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).publicAuth;
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState(authSession?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === "login" ? copy.titleLogin : copy.titleSignup;
  const ctaLabel =
    isSubmitting
      ? mode === "login"
        ? copy.loggingIn
        : copy.creatingAccount
      : mode === "login"
        ? copy.logIn
        : copy.createAccount;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    setIsSubmitting(true);

    try {
      const nextSession =
        mode === "login"
          ? await loginMember({ email: email.trim().toLowerCase(), password })
          : await signupMember({ email: email.trim().toLowerCase(), password });

      onAuthenticate(nextSession);
      navigate(localizePublicPath("/account"));
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page-shell">
      <div className="auth-page-backdrop" aria-hidden="true" />
      <div className="auth-page-overlay" aria-hidden="true" />

      <header className="auth-page-brand-shell public-nav-shell flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
        <Link to={localizePublicPath("/")} className="auth-page-brand public-nav-brand min-w-0" aria-label="Return to Just Do Swift home">
          <span className="public-nav-logo" aria-hidden="true">
            <img src="/favicon.svg" alt="" className="public-nav-logo-image" />
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
            <p className="auth-body-copy">{copy.subtitle}</p>
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </label>
            ) : null}

            {error ? <p className="auth-error">{error}</p> : null}

            <Button className="auth-primary-button" type="submit" isDisabled={isSubmitting}>
              <Mail size={16} strokeWidth={2.1} />
              <span>{ctaLabel}</span>
            </Button>
          </form>

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
