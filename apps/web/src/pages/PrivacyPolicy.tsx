import { privacyPolicyContent } from "../content/legal";
import LegalPage from "./LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="How Just Do Swift collects, uses, and protects personal information across the site and related services."
      content={privacyPolicyContent}
    />
  );
}
