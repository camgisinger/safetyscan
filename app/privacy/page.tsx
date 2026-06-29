import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPageHeader from '../../components/LegalPageHeader'

export const metadata: Metadata = {
  title: 'Privacy Policy | SafetyScan',
  description: 'SafetyScan privacy policy — how we collect, store, and use your personal information in accordance with the Australian Privacy Act 1988.',
}

const toc = [
  { id: 's1',  label: '1. Introduction' },
  { id: 's2',  label: '2. Who We Are' },
  { id: 's3',  label: '3. Information We Collect' },
  { id: 's4',  label: '4. How We Use Your Information' },
  { id: 's5',  label: '5. How We Store Your Information' },
  { id: 's6',  label: '6. Sharing Your Information' },
  { id: 's7',  label: '7. Data Retention' },
  { id: 's8',  label: '8. Security' },
  { id: 's9',  label: '9. Your Rights' },
  { id: 's10', label: '10. Cookies and Tracking' },
  { id: 's11', label: '11. Children\'s Privacy' },
  { id: 's12', label: '12. Changes to This Policy' },
  { id: 's13', label: '13. Complaints' },
]

export default function PrivacyPage() {
  return (
    <>
      <LegalPageHeader title="Privacy Policy" />
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <article style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '36px 20px 96px',
          fontFamily: 'var(--ff)',
          color: 'var(--text)',
        }}>

          {/* ── Document header ── */}
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text)' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 4px', lineHeight: 1.6 }}>
            SafetyScan · Operated by Cameron Jesse Gisinger (ABN 78 350 866 147)
          </p>
          <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 4px', lineHeight: 1.6 }}>
            Effective date: 1 July 2026
          </p>
          <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 32px', lineHeight: 1.6 }}>
            Contact:{' '}
            <a href="mailto:privacy@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
              privacy@safetyscan.com.au
            </a>
          </p>

          {/* ── Table of contents ── */}
          <nav aria-label="Table of contents" style={{
            background: 'var(--surf)',
            border: '1.5px solid var(--line)',
            borderRadius: 8,
            padding: '18px 20px',
            marginBottom: 40,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mut)', margin: '0 0 12px' }}>
              Contents
            </p>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {toc.map(item => (
                <li key={item.id}>
                  <a href={`#${item.id}`} style={{ fontSize: 14, color: 'var(--amber)', textDecoration: 'none', lineHeight: 1.5 }}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* ── Section 1 ── */}
          <section>
            <h2 id="s1" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              1. Introduction
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              SafetyScan ("we", "us", "our") is committed to protecting your personal information in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              This Privacy Policy explains how we collect, use, store, and disclose your personal information when you use SafetyScan ("the Service") at safetyscan.com.au.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              By using the Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <Divider />

          {/* ── Section 2 ── */}
          <section>
            <h2 id="s2" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              2. Who We Are
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              SafetyScan is operated by Cameron Jesse Gisinger, an individual/sole trader registered in Queensland, Australia.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 4px', color: 'var(--text)' }}>ABN: 78 350 866 147</p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 4px', color: 'var(--text)' }}>
              Contact:{' '}
              <a href="mailto:support@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>support@safetyscan.com.au</a>
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>Website: safetyscan.com.au</p>
          </section>

          <Divider />

          {/* ── Section 3 ── */}
          <section>
            <h2 id="s3" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              3. Information We Collect
            </h2>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.1 Account Information</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              When you create an account, we collect your email address and a password (stored in encrypted form). We do not collect your name, phone number, or physical address unless you provide it voluntarily.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.2 Site Photos</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              When you perform a scan, you upload photos of construction sites. These photos are stored securely in our database. Photos may contain images of workers, equipment, signage, and site locations.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.3 Scan Data</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              We store the results of each scan including work type classifications, compliance findings, legislation references, summaries, and any notes you add.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.4 Usage Data</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              We collect information about how you use the Service including scan counts, site names you create, and activity timestamps. This data is used to improve the Service and for internal reporting.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.5 Technical Data</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We may collect standard technical information including your IP address, browser type, device type, and pages visited. This is collected automatically by our hosting infrastructure.
            </p>
          </section>

          <Divider />

          {/* ── Section 4 ── */}
          <section>
            <h2 id="s4" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              4. How We Use Your Information
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We use your information to:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 12px' }}>
              {[
                'Provide, operate, and maintain the Service',
                'Process and store your scan photos and results',
                'Perform AI-powered compliance analysis on your uploaded photos',
                'Improve the accuracy and performance of the Service',
                'Communicate with you about your account, updates, and support',
                'Monitor usage patterns to improve the Service',
                'Comply with legal obligations',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>
          </section>

          <Divider />

          {/* ── Section 5 ── */}
          <section>
            <h2 id="s5" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              5. How We Store Your Information
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 6px', fontWeight: 600, color: 'var(--text)' }}>
              Primary storage — Australia:
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              Your account data, scan results, and site photos are stored in Supabase, hosted in the ap-southeast-2 (Sydney, Australia) region. This is our primary data store.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 14px', fontWeight: 600, color: 'var(--text)' }}>
              Data processed overseas:
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 16px', color: 'var(--text)' }}>
              To deliver the Service, your data is also processed by third-party services located outside Australia:
            </p>

            {/* Services table */}
            <div style={{ overflowX: 'auto', marginBottom: 18 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--surf)' }}>
                    {['Service', 'What is shared', 'Location', 'Purpose'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                        fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--mut)', border: '1.5px solid var(--line)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Anthropic', 'Site photos (resized) and any typed context', 'United States', 'AI compliance analysis'],
                    ['OpenAI', 'Short text search queries only (no photos or personal data)', 'United States', 'Generating search embeddings for legislation retrieval'],
                    ['Vercel', 'Web traffic and photos in transit during analysis', 'United States', 'Hosting and serving the application'],
                  ].map(([service, what, location, purpose]) => (
                    <tr key={service}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, border: '1px solid var(--div)', color: 'var(--text)', verticalAlign: 'top' }}>{service}</td>
                      <td style={{ padding: '10px 14px', border: '1px solid var(--div)', color: 'var(--text)', verticalAlign: 'top', lineHeight: 1.5 }}>{what}</td>
                      <td style={{ padding: '10px 14px', border: '1px solid var(--div)', color: 'var(--text)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{location}</td>
                      <td style={{ padding: '10px 14px', border: '1px solid var(--div)', color: 'var(--text)', verticalAlign: 'top', lineHeight: 1.5 }}>{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              By using the Service, you consent to your site photos being transmitted to and processed by Anthropic in the United States for the purpose of AI analysis. Anthropic's privacy policy is available at anthropic.com/privacy.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              Short text search queries (not photos or personal data) are transmitted to OpenAI in the United States for the purpose of generating vector embeddings. OpenAI's privacy policy is available at openai.com/privacy.
            </p>
          </section>

          <Divider />

          {/* ── Section 6 ── */}
          <section>
            <h2 id="s6" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              6. Sharing Your Information
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 16px', color: 'var(--text)' }}>
              We do not sell, trade, or rent your personal information to third parties.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We may share your information in the following circumstances:
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>6.1 Third-party service providers</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              As described in Section 5, your data is processed by Anthropic, OpenAI, Vercel, and Supabase solely for the purpose of delivering the Service.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>6.2 Shared scans</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              If you choose to share a scan using the share link feature, the scan result (including photos) will be accessible to anyone with the link. You control whether sharing is enabled.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>6.3 Legal requirements</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              We may disclose your information if required to do so by law, court order, or government authority.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>6.4 Business transfers</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. You will be notified of any such change.
            </p>
          </section>

          <Divider />

          {/* ── Section 7 ── */}
          <section>
            <h2 id="s7" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              7. Data Retention
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We retain your personal information for as long as your account is active. If you delete your account, your personal data and scan photos will be deleted within 30 days, except where we are required by law to retain it.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              Scan results and photos associated with your account can be deleted by you at any time through the application.
            </p>
          </section>

          <Divider />

          {/* ── Section 8 ── */}
          <section>
            <h2 id="s8" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              8. Security
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We implement reasonable security measures to protect your information including:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 16px' }}>
              {[
                'Encrypted storage of passwords',
                'Row-level security on all database tables (you can only access your own data)',
                'HTTPS encryption for all data in transit',
                'Access controls limiting who can access production systems',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <Divider />

          {/* ── Section 9 ── */}
          <section>
            <h2 id="s9" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              9. Your Rights
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              Under the Australian Privacy Principles, you have the right to:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 16px' }}>
              {[
                'Access the personal information we hold about you',
                'Request correction of inaccurate or incomplete information',
                'Make a complaint about how we handle your personal information',
                'Request deletion of your personal information (subject to legal retention requirements)',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>privacy@safetyscan.com.au</a>.
              {' '}We will respond within 30 days.
            </p>
          </section>

          <Divider />

          {/* ── Section 10 ── */}
          <section>
            <h2 id="s10" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              10. Cookies and Tracking
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              SafetyScan uses session cookies to maintain your login state. We do not use third-party advertising cookies or tracking pixels.
            </p>
          </section>

          <Divider />

          {/* ── Section 11 ── */}
          <section>
            <h2 id="s11" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              11. Children's Privacy
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              The Service is not intended for use by persons under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us at{' '}
              <a href="mailto:privacy@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>privacy@safetyscan.com.au</a>.
            </p>
          </section>

          <Divider />

          {/* ── Section 12 ── */}
          <section>
            <h2 id="s12" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              12. Changes to This Policy
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by a prominent notice on the Service. The effective date at the top of this policy indicates when it was last updated.
            </p>
          </section>

          <Divider />

          {/* ── Section 13 ── */}
          <section>
            <h2 id="s13" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              13. Complaints
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              If you believe we have breached the Australian Privacy Principles, you may lodge a complaint with us at{' '}
              <a href="mailto:privacy@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>privacy@safetyscan.com.au</a>.
              {' '}We will respond within 30 days.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au.
            </p>
          </section>

          {/* ── Footer ── */}
          <footer style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: '1.5px solid var(--div)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: 0 }}>
              SafetyScan · Cameron Jesse Gisinger (ABN 78 350 866 147) · Queensland, Australia
            </p>
            <p style={{ fontSize: 13, color: 'var(--mut)', margin: 0 }}>
              Also see our{' '}
              <Link href="/terms" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
                Terms and Conditions
              </Link>
            </p>
          </footer>

        </article>
      </div>
    </>
  )
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--div)', margin: '32px 0' }} />
}
