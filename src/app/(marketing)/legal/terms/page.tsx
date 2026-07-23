import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import {
  LegalCallout,
  LegalDoc,
  LegalSection,
} from "@/components/marketing/legal-doc";

export const metadata = buildMetadata({
  title: "Terms and Conditions",
  description: `The terms governing your use of ${siteConfig.name}.`,
  path: "/legal/terms",
});

export default function TermsPage() {
  return (
    <LegalDoc title="Terms and Conditions" updated="22 July 2026">
      <LegalSection heading="1. Introduction">
        <p>
          Welcome to {siteConfig.name}. These Terms and Conditions govern your
          use of our website, services and any transactions you make through our
          platform. By creating an account or using {siteConfig.name}, you agree
          to be bound by these terms.
        </p>
        <p>
          {siteConfig.name} provides software that helps South African homeowners
          comply with labour legislation when employing a domestic worker,
          gardener, nanny, caregiver or driver — including employment contracts,
          payslips, UIF and leave records.
        </p>
      </LegalSection>

      <LegalSection heading="2. Not legal advice">
        <LegalCallout tone="warning">
          <strong>Important.</strong> {siteConfig.name} is a software provider,
          not a law firm, and nothing on the platform constitutes legal advice.
          Our contracts, payslips and guidance are generated from the information
          you provide, based on prevailing legislation (including the BCEA, the
          UIF Act and related regulations). You remain responsible for reviewing
          all documents and for meeting your legal obligations as an employer.
          For complex or disputed matters, consult a qualified labour law
          professional.
        </LegalCallout>
      </LegalSection>

      <LegalSection heading="3. Your account">
        <p>
          You must provide accurate, current and complete information and keep it
          up to date. You are responsible for safeguarding your login
          credentials and for all activity that occurs under your account. You
          confirm that you have the authority and lawful basis to process the
          personal information of any employee you add to the platform.
        </p>
      </LegalSection>

      <LegalSection heading="4. Subscriptions and billing">
        <h3>4.1 Plans</h3>
        <p>
          The free trial includes limited usage (one employee and one payslip).
          Premium is billed monthly (R49 / month) or annually (R490 / year) and
          unlocks unlimited employees, payslips and contracts. All prices are in
          South African Rand (ZAR) and include VAT where applicable.
        </p>
        <h3>4.2 Payment processing</h3>
        <p>
          Payments are processed securely through <strong>Netcash</strong>, a
          PCI DSS Level 1 compliant South African payment service provider. We
          accept card and Instant EFT among other methods offered by Netcash.
        </p>
        <h3>4.3 Payment security</h3>
        <p>
          Your payment information is encrypted and processed by Netcash.{" "}
          {siteConfig.name} does not store your card details on our servers.
        </p>
        <h3>4.4 Renewal and cancellation</h3>
        <p>
          You may cancel at any time from your billing settings and will retain
          access until the end of your paid period. We do not automatically
          charge a payment method you have not added.
        </p>
        <h3>4.5 Failed payments</h3>
        <p>
          If a payment fails, no funds are deducted. Common causes include
          insufficient funds, incorrect card details or a 3-D Secure failure. You
          may try again or contact your bank.
        </p>
      </LegalSection>

      <LegalSection heading="5. Refund policy">
        <p>
          Subscriptions are billed in advance for the chosen period. As you can
          cancel at any time and retain access until the end of the paid period,
          we do not generally provide partial refunds for unused time, except
          where required by law. If you believe you were charged in error,
          contact <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{" "}
          with your invoice reference and we will resolve it promptly.
        </p>
      </LegalSection>

      <LegalSection heading="6. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Use the platform for any unlawful purpose.</li>
          <li>Upload personal information you have no lawful basis to process.</li>
          <li>Attempt to disrupt, reverse-engineer or gain unauthorised access to the platform or its data.</li>
          <li>Resell or misrepresent the service.</li>
        </ul>
        <p>We may suspend or terminate accounts that violate these terms.</p>
      </LegalSection>

      <LegalSection heading="7. Documents you generate">
        <p>
          Contracts, payslips and other documents are generated from the
          information you supply. You are responsible for verifying their
          accuracy and for signing, issuing and retaining them as the law
          requires. {siteConfig.name} is not responsible for outcomes arising
          from inaccurate information you provide.
        </p>
      </LegalSection>

      <LegalSection heading="8. Limitation of liability and indemnity">
        <p>
          The platform is provided “as is” and “as available”. To the fullest
          extent permitted by South African law, {siteConfig.name} is not liable
          for any indirect, incidental, special or consequential loss arising
          from your use of the service, and our total liability for any claim is
          limited to the fees you paid to us in the 12 months preceding the
          claim.
        </p>
        <p>
          You agree to indemnify and hold {siteConfig.name} harmless against
          claims, losses or damages arising from your breach of these terms, your
          violation of any law, or inaccurate information you provide.
        </p>
      </LegalSection>

      <LegalSection heading="9. Intellectual property">
        <p>
          The platform, its software, templates and branding are owned by{" "}
          {siteConfig.name} and protected by law. Documents you generate for your
          own employment records remain yours to use for that purpose.
        </p>
      </LegalSection>

      <LegalSection heading="10. Privacy and data protection">
        <p>
          We process personal information in accordance with the Protection of
          Personal Information Act (POPIA). Please see our{" "}
          <a href="/legal/privacy">Privacy Policy</a> for full details of how we
          collect, use and protect data.
        </p>
      </LegalSection>

      <LegalSection heading="11. Dispute resolution and governing law">
        <p>
          If you have a dispute, please contact us first so we can resolve it
          amicably. These terms are governed by the laws of the Republic of South
          Africa, and you submit to the jurisdiction of the South African courts.
        </p>
      </LegalSection>

      <LegalSection heading="12. Contact">
        <p>
          Questions about these terms? Email us at{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
        </p>
      </LegalSection>

      <LegalCallout tone="info">
        <span className="inline-flex flex-wrap items-center gap-1">
          Secure payments powered by{" "}
          <a href="https://netcash.co.za" target="_blank" rel="noopener noreferrer">
            Netcash
          </a>{" "}
          · PCI DSS Level 1 Compliant
        </span>
      </LegalCallout>
    </LegalDoc>
  );
}
