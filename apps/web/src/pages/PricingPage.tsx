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

      <div className="mx-auto grid w-full max-w-[860px] grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
        {copy.plans.map((plan) => {
          const isYearly = plan.id === "yearly";
          const isLoading = isRedirecting === plan.id;
          const badge = "badge" in plan ? plan.badge : undefined;
          const accentShellClass = isYearly
            ? "bg-gradient-to-b from-white/30 via-white/10 to-transparent opacity-80"
            : "";
          const cardClass = isYearly ? "border-white/20" : "";
          const iconClass = isYearly ? "text-white" : "text-white/60";
          const badgeClass = "bg-white/10 text-white";
          const priceWrapClass = "border-white/10 bg-white/[0.025]";
          const checkClass = isYearly ? "text-white" : "text-white/40";
          const buttonClass = isYearly ? "public-primary-button" : "public-secondary-button";

          const primaryLabel = !authSession
            ? copy.primaryCtaLoggedOut
            : isReturningMember
              ? copy.primaryCtaAccount
              : copy.primaryCtaCheckout;

          return (
            <motion.div key={plan.id} variants={itemVariants} className="relative flex flex-col">
              {isYearly && (
                <div className={`absolute -inset-[1px] rounded-[var(--radius-panel-lg)] ${accentShellClass}`} />
              )}
              
              <Card className={`public-surface-strong relative flex min-h-[620px] flex-1 flex-col overflow-hidden transition-transform duration-500 hover:scale-[1.01] ${cardClass}`}>
                <Card.Content className="flex flex-1 flex-col gap-6 px-7 py-8 lg:px-8 lg:py-9">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner">
                        <Zap size={20} className={iconClass} />
                      </div>
                      {badge && (
                        <Chip variant="flat" size="sm" className={`${badgeClass} font-mono text-[10px] uppercase tracking-wider`}>
                          {badge}
                        </Chip>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="type-section-title text-[1.15rem] font-bold text-white/90">{plan.name}</h3>
                      <p className="type-body-sm mt-3 min-h-[3.25rem] text-white/40 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className={`rounded-[24px] border px-5 py-5 ${priceWrapClass}`}>
                      <div className="flex items-baseline gap-3">
                        <span className="text-[3.2rem] font-bold tracking-tighter leading-none text-white">
                        {plan.price}
                        </span>
                        <span className="type-body-sm text-white/30">{plan.interval}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 pt-3">
                    <p className="type-mono-micro mb-4 text-white/20 uppercase tracking-[0.2em]">
                      {copy.featuresTitle}
                    </p>
                    {copy.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="flex items-start gap-3.5">
                        <Check size={14} className={checkClass} />
                        <span className="type-body-xs leading-snug text-white/60">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 pt-5">
                    {!authSession ? (
                      <Link
                        to={localizePublicPath("/login")}
                        className={`public-button-lg type-action flex w-full items-center justify-center gap-2 py-3.5 ${buttonClass}`}
                      >
                        <CreditCard size={18} strokeWidth={2.5} />
                        <span>{primaryLabel}</span>
                      </Link>
                    ) : isReturningMember ? (
                      <Link
                        to={localizePublicPath("/account")}
                        className="public-secondary-button public-button-lg type-action flex w-full items-center justify-center gap-2 py-3.5"
                      >
                        <ShieldCheck size={18} strokeWidth={2.5} />
                        <span>{primaryLabel}</span>
                      </Link>
                    ) : (
                      <Button
                        className={`public-button-lg type-action w-full py-3.5 text-[0.9rem] ${buttonClass}`}
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
