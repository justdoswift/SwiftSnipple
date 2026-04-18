import { legalContent } from "../content/legal";
import { getMessages } from "../lib/messages";
import { useAppLocale } from "../lib/locale";
import LegalPage from "./LegalPage";

export default function TermsOfService() {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).legal;
  return (
    <LegalPage
      eyebrow={copy.termsEyebrow}
      title={copy.termsTitle}
      intro={copy.termsIntro}
      content={legalContent.terms[locale]}
    />
  );
}
