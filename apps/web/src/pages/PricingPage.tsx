import { ArrowRight, Check, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { Button, Card, Chip } from "../lib/heroui";
import { getMessages } from "../lib/messages";
import { localizePublicPath, useAppLocale } from "../lib/locale";
import { createCheckoutSession } from "../services/member-auth";
import type { MemberSession } from "../types";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

interface PricingPageProps {
  authSession: MemberSession | null;
}

export default function PricingPage({ authSession }: PricingPageProps) {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).pricing;
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);

  async function handleCheckout(planId: string, priceId: string) {
    setError("");
    setIsRedirecting(planId);

    try {
      const { url } = await createCheckoutSession(priceId);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.billingError);
      setIsRedirecting(null);
    }
  }

  const isReturningMember = Boolean(authSession?.hasBillingPortal);

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="public-page relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-[1440px] flex-col justify-center px-8 pb-10 pt-24 md:px-12 md:pb-12 md:pt-28 lg:px-16 lg:pb-14 lg:pt-32"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-full -translate-x-1/2 overflow-hidden opacity-25">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.08),transparent_80%)]" />
      </div>

      <div className="flex flex-col items-center text-center">
        <motion.span variants={itemVariants} className="type-mono-label mb-4 block">
          {copy.kicker}
        </motion.span>
        <motion.h1 
          variants={itemVariants} 
          className="type-display mb-5 max-w-[26ch] text-balance"
        >
          {copy.title}
        </motion.h1>
        <motion.p 
          variants={itemVariants} 
          className="type-body-lg mb-10 max-w-[56ch] text-balance"
        >
          {copy.intro}
        </motion.p>
      </div>

      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
        {copy.plans.map((plan) => {
          const isYearly = plan.id === "yearly";
          const isFounding = plan.id === "founding";
          const isLoading = isRedirecting === plan.id;
          const badge = "badge" in plan ? plan.badge : undefined;
          const accentShellClass = isFounding
            ? "bg-gradient-to-b from-[rgba(214,204,184,0.45)] via-[rgba(214,204,184,0.16)] to-transparent opacity-95"
            : isYearly
              ? "bg-gradient-to-b from-white/30 via-white/10 to-transparent opacity-80"
              : "";
          const cardClass = isFounding
            ? "border-[rgba(214,204,184,0.32)] bg-[linear-gradient(180deg,rgba(214,204,184,0.12),rgba(255,255,255,0.04))]"
            : isYearly
              ? "border-white/20"
              : "";
          const iconClass = isFounding ? "text-[rgba(244,233,214,0.92)]" : isYearly ? "text-white" : "text-white/60";
          const badgeClass = isFounding
            ? "border border-[rgba(214,204,184,0.22)] bg-[rgba(214,204,184,0.12)] text-[rgba(244,233,214,0.92)]"
            : "bg-white/10 text-white";
          const priceWrapClass = isFounding
            ? "border-[rgba(214,204,184,0.2)] bg-[rgba(214,204,184,0.08)]"
            : "border-white/10 bg-white/[0.025]";
          const checkClass = isFounding ? "text-[rgba(244,233,214,0.92)]" : isYearly ? "text-white" : "text-white/40";
          const buttonClass = isFounding
            ? "border border-[rgba(214,204,184,0.22)] bg-[rgba(214,204,184,0.14)] text-[rgba(244,233,214,0.96)] hover:bg-[rgba(214,204,184,0.2)]"
            : isYearly
              ? "public-primary-button"
              : "public-secondary-button";

          const primaryLabel = !authSession
            ? copy.primaryCtaLoggedOut
            : isReturningMember
              ? copy.primaryCtaAccount
              : copy.primaryCtaCheckout;

          return (
            <motion.div key={plan.id} variants={itemVariants} className="relative flex flex-col">
              {(isYearly || isFounding) && (
                <div className={`absolute -inset-[1px] rounded-[var(--radius-panel-lg)] ${accentShellClass}`} />
              )}
              
              <Card className={`public-surface-strong relative flex flex-1 flex-col overflow-hidden transition-transform duration-500 hover:scale-[1.01] ${cardClass}`}>
                <Card.Content className="flex flex-1 flex-col gap-5 px-6 py-7 lg:px-7 lg:py-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner">
                        {isFounding ? <ShieldCheck size={20} className={iconClass} /> : <Zap size={20} className={iconClass} />}
                      </div>
                      {badge && (
                        <Chip variant="flat" size="sm" className={`${badgeClass} font-mono text-[10px] uppercase tracking-wider`}>
                          {badge}
                        </Chip>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="type-section-title text-[1.15rem] font-bold text-white/90">{plan.name}</h3>
                      <p className="type-body-sm mt-2 text-white/40 leading-relaxed min-h-[2.75rem]">{plan.description}</p>
                    </div>

                    <div className={`rounded-[24px] border px-4 py-4 ${priceWrapClass}`}>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-bold tracking-tighter leading-none text-white ${isFounding ? 'text-[3rem]' : 'text-[3.2rem]'}`}>
                        {plan.price}
                        </span>
                        <span className="type-body-sm text-white/30">{plan.interval}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 pt-1">
                    <p className="type-mono-micro mb-3 text-white/20 uppercase tracking-[0.2em]">
                      {copy.featuresTitle}
                    </p>
                    {copy.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check size={14} className={isYearly || isFounding ? "text-white" : "text-white/40"} />
                        <span className="type-body-xs text-white/60 leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 pt-3">
                    {!authSession ? (
                      <Link
                        to={localizePublicPath("/login")}
                        className={`public-button-lg type-action flex w-full items-center justify-center gap-2 py-3 ${buttonClass}`}
                      >
                        <CreditCard size={18} strokeWidth={2.5} />
                        <span>{primaryLabel}</span>
                      </Link>
                    ) : isReturningMember ? (
                      <Link
                        to={localizePublicPath("/account")}
                        className="public-secondary-button public-button-lg type-action flex w-full items-center justify-center gap-2 py-4"
                      >
                        <ShieldCheck size={18} strokeWidth={2.5} />
                        <span>{primaryLabel}</span>
                      </Link>
                    ) : (
                      <Button
                        className={`public-button-lg type-action w-full py-3 text-[0.9rem] ${buttonClass}`}
                        isDisabled={!!isRedirecting}
                        onPress={() => handleCheckout(plan.id, plan.priceId)}
                      >
                        <CreditCard size={18} strokeWidth={2.5} />
                        <span>{isLoading ? copy.redirecting : primaryLabel}</span>
                      </Button>
                    )}
                  </div>
                </Card.Content>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {error ? (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="mx-auto mt-5 max-w-[400px] text-center font-mono text-sm text-red-500"
        >
          {error}
        </motion.p>
      ) : null}

      <motion.p variants={itemVariants} className="type-mono-micro mt-6 text-balance text-center text-white/20">
        {copy.note}
      </motion.p>

      <div className="pointer-events-none absolute -bottom-44 left-1/2 h-[520px] w-full -translate-x-1/2 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.1),transparent_70%)]" />
      </div>
    </motion.section>
  );
}
