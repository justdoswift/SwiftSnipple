import { ArrowUpRight, CheckCircle2, Crown, LayoutGrid, LogOut, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "../lib/heroui";
import { getMessages } from "../lib/messages";
import { useAppLocale } from "../lib/locale";
import type { MockAuthSession } from "../lib/mock-auth";

interface AccountPageProps {
  authSession: MockAuthSession | null;
  onSignOut: () => void;
}

export default function AccountPage({ authSession, onSignOut }: AccountPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).account;
  const memberPanels = [
    {
      eyebrow: copy.panels.libraryEyebrow,
      title: copy.panels.libraryTitle,
      copy: copy.panels.libraryCopy,
      icon: LayoutGrid,
    },
    {
      eyebrow: copy.panels.membershipEyebrow,
      title: copy.panels.membershipTitle,
      copy: copy.panels.membershipCopy,
      icon: Crown,
    },
    {
      eyebrow: copy.panels.signalsEyebrow,
      title: copy.panels.signalsTitle,
      copy: copy.panels.signalsCopy,
      icon: Sparkles,
    },
  ];
  if (!authSession) {
    return (
      <section className="public-page mx-auto flex min-h-[calc(100vh-12rem)] max-w-[980px] items-center px-6 pb-24 pt-44 md:px-10 md:pt-52">
        <Card className="public-surface w-full rounded-[34px]">
          <Card.Content className="flex flex-col gap-6 px-8 py-10 md:px-12 md:py-14">
            <span className="type-mono-label">{copy.memberCenter}</span>
            <h1 className="type-page-title max-w-[12ch]">{copy.noSessionTitle}</h1>
            <p className="type-body max-w-2xl">
              {copy.noSessionCopy}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={`/${locale}/login`} className="public-primary-button type-action inline-flex h-12 items-center justify-center rounded-full px-6">
                {copy.openLogin}
              </Link>
              <Link to={`/${locale}`} className="public-secondary-button type-action inline-flex h-12 items-center justify-center rounded-full px-6">
                {copy.returnHome}
              </Link>
            </div>
          </Card.Content>
        </Card>
      </section>
    );
  }

  return (
    <section className="public-page account-page mx-auto max-w-[1180px] px-6 pb-24 pt-44 md:px-10 md:pt-52">
      <div className="account-hero">
        <div className="account-identity-card">
          <div className="account-identity-copy">
            <span className="type-mono-label">{copy.memberCenter}</span>
            <h1 className="type-page-title max-w-[11ch]">{copy.heroTitle}</h1>
            <p className="type-body max-w-2xl">
              {copy.heroCopy}
            </p>
          </div>
          <div className="account-identity-meta">
            <div className="account-badge">
              <CheckCircle2 size={18} strokeWidth={2.2} />
              <span>{authSession.provider === "email" ? copy.emailAccess : `${authSession.provider} ${copy.accessSuffix}`}</span>
            </div>
            <p className="type-card-title">{authSession.email}</p>
            <p className="type-body-sm">{copy.stagedOn} {new Date(authSession.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="account-actions">
          <Link to={`/${locale}/admin`} className="public-secondary-button type-action inline-flex h-12 items-center justify-center rounded-full px-6">
            {copy.publishingWorkspace}
            <ArrowUpRight size={15} strokeWidth={2.2} />
          </Link>
          <Button className="public-primary-button type-action h-12 px-6" radius="full" onPress={onSignOut}>
            <LogOut size={16} strokeWidth={2.2} />
            <span>{copy.signOut}</span>
          </Button>
        </div>
      </div>

      <div className="account-grid">
        {memberPanels.map(({ eyebrow, title, copy, icon: Icon }) => (
          <Card key={`${eyebrow}-${title}`} className="public-surface account-panel rounded-[30px]">
            <Card.Content className="flex h-full flex-col gap-6 px-7 py-8 md:px-8 md:py-9">
              <div className="account-panel-icon">
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <div className="space-y-3">
                <span className="type-mono-label">{eyebrow}</span>
                <h2 className="type-section-title text-[1.55rem] md:text-[1.8rem]">{title}</h2>
                <p className="type-body">{copy}</p>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>
    </section>
  );
}
