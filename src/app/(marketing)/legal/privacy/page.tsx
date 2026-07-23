import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import {
  LegalCallout,
  LegalDoc,
  LegalPanel,
  LegalSection,
} from "@/components/marketing/legal-doc";

export const metadata = buildMetadata({
  title: "Privacy Policy (POPIA)",
  description: `How ${siteConfig.name} collects, uses and protects your personal information under the Protection of Personal Information Act (POPIA).`,
  path: "/legal/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" updated="22 July 2026" effective="22 July 2026">
      <LegalCallout tone="info">
        <strong>POPIA compliance statement.</strong> {siteConfig.name} is
        committed to protecting your personal information and your right to
        privacy in accordance with the{" "}
        <strong>Protection of Personal Information Act (POPIA)</strong> of South
        Africa. This policy explains how we collect, use, store and protect
        personal information — both yours and that of the domestic workers you
        employ.
      </LegalCallout>

      <LegalSection heading="1. Information Officer">
        <p>
          In terms of POPIA, {siteConfig.name} has appointed an Information
          Officer responsible for ensuring compliance with data protection law:
        </p>
        <LegalPanel>
          <p className="font-semibold">K Steffens</p>
          <p className="text-muted-foreground">Information Officer — {siteConfig.name}</p>
          <p className="mt-2">
            <a href={`mailto:privacy@labourmate.co.za`}>privacy@labourmate.co.za</a>
            <br />
            <a href="tel:+27844078482">+27 84 407 8482</a>
          </p>
        </LegalPanel>
      </LegalSection>

      <LegalSection heading="2. Responsible party and operator">
        <p>
          Under POPIA, <strong>you (the employer)</strong> are the “responsible
          party” for the personal information of the domestic worker, gardener,
          nanny, caregiver or driver you employ. {siteConfig.name} acts as an{" "}
          <strong>“operator”</strong>, processing that information on your behalf
          and under your instruction, solely to provide the service.
        </p>
        <p>
          For your own account information (your name, email and billing
          details), {siteConfig.name} is the responsible party.
        </p>
      </LegalSection>

      <LegalSection heading="3. Personal information we collect">
        <h3>3.1 Information you provide about yourself</h3>
        <ul>
          <li>
            <strong>Identity &amp; contact:</strong> name, email address, phone
            number, physical address and (optionally) your SA ID number for
            contracts.
          </li>
          <li>
            <strong>Account:</strong> password (stored only as a secure hash) and
            your preferences.
          </li>
          <li>
            <strong>Billing:</strong> subscription and payment history (your card
            details are handled by Netcash and are never stored by us).
          </li>
        </ul>
        <h3>3.2 Information you provide about your employees</h3>
        <ul>
          <li>
            <strong>Identity:</strong> names, SA ID or passport number.
          </li>
          <li>
            <strong>Contact &amp; address:</strong> phone, WhatsApp, email and
            residential address.
          </li>
          <li>
            <strong>Employment &amp; pay:</strong> occupation, start date, salary,
            working hours, leave records and payslip data.
          </li>
          <li>
            <strong>Banking:</strong> bank account details used on payslips.
          </li>
        </ul>
        <h3>3.3 Information collected automatically</h3>
        <ul>
          <li>Device and browser information, and general location from your IP address.</li>
          <li>Usage information such as pages visited and actions taken.</li>
          <li>Cookies — see section 8.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. How we use personal information">
        <p>
          We process personal information only for specific, explicitly defined
          and legitimate purposes:
        </p>
        <ul>
          <li>To create and manage your account (contract / consent).</li>
          <li>
            To generate employment contracts and payslips, and to calculate UIF,
            PAYE and leave balances (contract).
          </li>
          <li>To deliver documents by email or WhatsApp when you choose to send them (contract).</li>
          <li>To process subscription payments (contract).</li>
          <li>To send reminders and important service notices (legitimate interest).</li>
          <li>To send marketing communications, only with your consent (consent).</li>
          <li>To comply with legal and regulatory obligations (legal obligation).</li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Who we share information with">
        <p>We share personal information only with trusted operators that help us run the service:</p>
        <ul>
          <li><strong>Netcash</strong> — payment processing (PCI DSS Level 1 compliant).</li>
          <li><strong>Supabase</strong> — database, storage and authentication hosting.</li>
          <li><strong>Resend</strong> — delivery of transactional email.</li>
          <li>
            <strong>Meta (WhatsApp Cloud API)</strong> — delivery of payslips and
            messages that you initiate.
          </li>
        </ul>
        <p>
          We may disclose information if required by law or valid request from a
          public authority.
        </p>
        <LegalCallout tone="success">
          ✓ We do <strong>not</strong> sell your personal information — or your
          employees’ personal information — to third parties.
        </LegalCallout>
      </LegalSection>

      <LegalSection heading="6. How we protect information">
        <ul>
          <li>
            <strong>Field-level encryption:</strong> sensitive identifiers such as
            ID, passport and bank account numbers are encrypted at rest using
            AES-256-GCM.
          </li>
          <li><strong>Encryption in transit:</strong> all connections use TLS/SSL.</li>
          <li><strong>Secure authentication:</strong> passwords are hashed with a strong, salted algorithm.</li>
          <li><strong>Access controls &amp; audit logs:</strong> sensitive actions are logged with actor and change history.</li>
          <li>
            <strong>Payment security:</strong> card payments are handled by
            PCI DSS Level 1 compliant Netcash — we never see or store your card
            details.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. Data retention">
        <p>
          We keep personal information only as long as necessary. Because
          employment records carry legal obligations, some data is retained even
          after account closure:
        </p>
        <ul>
          <li><strong>Account information:</strong> until deletion is requested, plus 30 days.</li>
          <li>
            <strong>Employment, payslip and leave records:</strong> at least{" "}
            <strong>3 years</strong> as required by the BCEA and related
            legislation.
          </li>
          <li><strong>Transaction &amp; tax records:</strong> up to 5 years for tax compliance.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="8. Cookies">
        <p>We use a small number of cookies:</p>
        <ul>
          <li><strong>Essential</strong> — authentication and security (session).</li>
          <li><strong>Functional</strong> — remembering preferences such as dark mode.</li>
        </ul>
        <p>
          You can control cookies through your browser settings; disabling
          essential cookies may break sign-in and other core functionality.
        </p>
      </LegalSection>

      <LegalSection heading="9. Your rights under POPIA">
        <p>As a data subject you have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Request correction of inaccurate or incomplete information.</li>
          <li>Request deletion, subject to legal retention requirements.</li>
          <li>Object to processing for direct marketing.</li>
          <li>Lodge a complaint with the Information Regulator.</li>
        </ul>
        <p>
          To exercise any of these rights, contact our Information Officer at{" "}
          <a href="mailto:privacy@labourmate.co.za">privacy@labourmate.co.za</a>.
          We will respond within 30 days.
        </p>
        <LegalPanel>
          <p className="font-semibold">Information Regulator (South Africa)</p>
          <p className="mt-1">
            Email: <a href="mailto:inforeg@justice.gov.za">inforeg@justice.gov.za</a>
            <br />
            Website: justice.gov.za/inforeg
          </p>
        </LegalPanel>
      </LegalSection>

      <LegalSection heading="10. Changes and contact">
        <p>
          We may update this policy from time to time and will revise the “Last
          updated” date above. For any privacy question, contact us at{" "}
          <a href="mailto:privacy@labourmate.co.za">privacy@labourmate.co.za</a>{" "}
          or <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
