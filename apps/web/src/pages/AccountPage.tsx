import { CreditCard, LogOut, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../lib/heroui";
import { getMessages } from "../lib/messages";
import { localizePublicPath, useAppLocale } from "../lib/locale";
import { createBillingPortalSession, createCheckoutSession } from "../services/member-auth";
import type { MemberSession } from "../types";

interface AccountPageProps {
  authSession: MemberSession | null;
  onSignOut: () => void | Promise<void>;
}

function formatDate(value: string | null, locale: "en" | "zh") {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AccountPage({ authSession, onSignOut }: AccountPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).account;
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function redirectTo(urlPromise: Promise<{ url: string }>) {
    setError("");
    setIsRedirecting(true);

    try {
      const { url } = await urlPromise;
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.billingError);
      setIsRedirecting(false);
    }
  }

  if (!authSession) {
    return (
      <section className="public-page mx-auto flex min-h-[calc(100vh-12rem)] max-w-[980px] items-center px-8 pb-24 pt-36 md:px-12 md:pt-40 lg:px-16 lg:pt-48">
        <Card className="public-surface w-full">
          <Card.Content className="flex flex-col gap-6 px-8 py-10 md:px-12 md:py-14">
            <span className="type-mono-label">{copy.memberCenter}</span>
            <h1 className="type-page-title max-w-[12ch]">{copy.noSessionTitle}</h1>
            <p className="type-body max-w-2xl">
              {copy.noSessionCopy}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={localizePublicPath("/login")} className="public-primary-button public-button-lg type-action inline-flex items-center justify-center">
                {copy.openLogin}
              </Link>
              <Link to={localizePublicPath("/")} className="public-secondary-button public-button-lg type-action inline-flex items-center justify-center">
                {copy.returnHome}
              </Link>
            </div>
          </Card.Content>
        </Card>
      </section>
    );
  }

  const renewalDate = formatDate(authSession.currentPeriodEnd, locale);
  const statusCopy = authSession.isEntitled ? copy.statusActive : copy.statusInactive;

  return (
    <section className="public-page mx-auto max-w-[980px] px-8 pb-24 pt-36 md:px-12 md:pt-40 lg:px-16 lg:pt-48">
      <Card className="public-surface">
        <Card.Content className="flex flex-col gap-8 px-8 py-10 md:px-12 md:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <span className="type-mono-label">{copy.memberCenter}</span>
              <h1 className="type-page-title">{copy.sessionTitle}</h1>
              <p className="type-body max-w-2xl">{copy.sessionCopy}</p>
            </div>
            <Button className="public-secondary-button public-button-md type-action" onPress={onSignOut}>
              <LogOut size={16} strokeWidth={2.2} />
              <span>{copy.signOut}</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="mb-3 flex items-center gap-2 text-[var(--public-micro)]">
                <Sparkles size={16} />
                <span className="type-mono-micro">{copy.emailLabel}</span>
              </div>
              <p className="type-body break-all">{authSession.email}</p>
            </div>
            <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="mb-3 flex items-center gap-2 text-[var(--public-micro)]">
                <LockKeyhole size={16} />
                <span className="type-mono-micro">{copy.subscriptionLabel}</span>
              </div>
              <p className="type-body">{statusCopy}</p>
            </div>
            <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5">
              <div className="mb-3 flex items-center gap-2 text-[var(--public-micro)]">
                <CreditCard size={16} />
                <span className="type-mono-micro">{copy.renewalLabel}</span>
              </div>
              <p className="type-body">{renewalDate ?? copy.renewalPending}</p>
            </div>
          </div>

          {error ? <p className="type-body-sm text-red-400">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            {authSession.hasBillingPortal ? (
              <Button
                className="public-primary-button public-button-lg type-action"
                isDisabled={isRedirecting}
                onPress={() => redirectTo(createBillingPortalSession())}
              >
                {isRedirecting ? copy.redirecting : copy.manageBilling}
              </Button>
            ) : (
              <Button
                className="public-primary-button public-button-lg type-action"
                isDisabled={isRedirecting}
                onPress={() => redirectTo(createCheckoutSession())}
              >
                {isRedirecting ? copy.redirecting : copy.subscribe}
              </Button>
            )}
            <Link to={localizePublicPath("/")} className="public-secondary-button public-button-lg type-action inline-flex items-center justify-center">
              {copy.returnHome}
            </Link>
          </div>
        </Card.Content>
      </Card>
    </section>
  );
}
