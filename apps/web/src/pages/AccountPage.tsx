import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "../lib/heroui";
import { getMessages } from "../lib/messages";
import { localizePublicPath, useAppLocale } from "../lib/locale";
import type { MockAuthSession } from "../lib/mock-auth";

interface AccountPageProps {
  authSession: MockAuthSession | null;
  onSignOut: () => void;
}

export default function AccountPage({ authSession, onSignOut }: AccountPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).account;
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

  return (
    <section className="public-page mx-auto flex min-h-[calc(100vh-12rem)] max-w-[980px] items-center justify-center px-8 pb-24 pt-36 md:px-12 md:pt-40 lg:px-16 lg:pt-48">
      <Button className="public-primary-button public-button-lg type-action" onPress={onSignOut}>
        <LogOut size={16} strokeWidth={2.2} />
        <span>{copy.signOut}</span>
      </Button>
    </section>
  );
}
