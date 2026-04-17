import { termsOfServiceContent } from "../content/legal";
import LegalPage from "./LegalPage";

export default function TermsOfService() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="The terms that govern access to Just Do Swift products, content, subscriptions, and related services."
      content={termsOfServiceContent}
    />
  );
}
