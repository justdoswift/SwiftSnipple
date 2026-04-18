import { ArrowUpRight, CheckCircle2, Crown, LayoutGrid, LogOut, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "../lib/heroui";
import type { MockAuthSession } from "../lib/mock-auth";

interface AccountPageProps {
  authSession: MockAuthSession | null;
  onSignOut: () => void;
}

const memberPanels = [
  {
    eyebrow: "Library Access",
    title: "Saved browsing shell",
    copy: "This member area can later hold saved snippets, follow lists, and release alerts without pretending those systems already ship.",
    icon: LayoutGrid,
  },
  {
    eyebrow: "Membership",
    title: "Stripe-ready roadmap",
    copy: "Membership and gated access stay future-facing here. The UI makes room for them without claiming billing or entitlements exist today.",
    icon: Crown,
  },
  {
    eyebrow: "Signals",
    title: "Launch notes and remixes",
    copy: "A future home for snippet bookmarks, personal prompts, and adaptation notes once real account persistence lands.",
    icon: Sparkles,
  },
];

export default function AccountPage({ authSession, onSignOut }: AccountPageProps) {
  if (!authSession) {
    return (
      <section className="public-page mx-auto flex min-h-[calc(100vh-12rem)] max-w-[980px] items-center px-6 pb-24 pt-44 md:px-10 md:pt-52">
        <Card className="public-surface w-full rounded-[34px]">
          <Card.Content className="flex flex-col gap-6 px-8 py-10 md:px-12 md:py-14">
            <span className="type-mono-label">Member Center</span>
            <h1 className="type-page-title max-w-[12ch]">No staged member session yet.</h1>
            <p className="type-body max-w-2xl">
              The account shell is UI-only for now. Use the login surface to stage a mock session and preview the member center flow.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="public-primary-button type-action inline-flex h-12 items-center justify-center rounded-full px-6">
                Open Login
              </Link>
              <Link to="/" className="public-secondary-button type-action inline-flex h-12 items-center justify-center rounded-full px-6">
                Return Home
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
            <span className="type-mono-label">Member Center</span>
            <h1 className="type-page-title max-w-[11ch]">Your snippet library staging area.</h1>
            <p className="type-body max-w-2xl">
              This member surface is intentionally lightweight for now: a place to land after sign-in, track future access surfaces, and keep account UI connected to the core snippet library.
            </p>
          </div>
          <div className="account-identity-meta">
            <div className="account-badge">
              <CheckCircle2 size={18} strokeWidth={2.2} />
              <span>{authSession.provider === "email" ? "Email access" : `${authSession.provider} access`}</span>
            </div>
            <p className="type-card-title">{authSession.email}</p>
            <p className="type-body-sm">Mock session staged on {new Date(authSession.createdAt).toLocaleDateString("en-US")}</p>
          </div>
        </div>

        <div className="account-actions">
          <Link to="/admin" className="public-secondary-button type-action inline-flex h-12 items-center justify-center rounded-full px-6">
            Publishing Workspace
            <ArrowUpRight size={15} strokeWidth={2.2} />
          </Link>
          <Button className="public-primary-button type-action h-12 px-6" radius="full" onPress={onSignOut}>
            <LogOut size={16} strokeWidth={2.2} />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      <div className="account-grid">
        {memberPanels.map(({ eyebrow, title, copy, icon: Icon }) => (
          <Card key={title} className="public-surface account-panel rounded-[30px]">
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
