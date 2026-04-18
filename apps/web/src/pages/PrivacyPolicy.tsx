import { legalContent } from "../content/legal";
import { getMessages } from "../lib/messages";
import { useAppLocale } from "../lib/locale";
import LegalPage from "./LegalPage";

export default function PrivacyPolicy() {
  const { locale } = useAppLocale();
  const copy = getMessages(locale).legal;
  return (
    <LegalPage
      eyebrow={copy.privacyEyebrow}
      title={copy.privacyTitle}
      intro={copy.privacyIntro}
      content={legalContent.privacy[locale]}
    />
  );
}
