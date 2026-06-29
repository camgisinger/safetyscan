import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPageHeader from '../../components/LegalPageHeader'

export const metadata: Metadata = {
  title: 'Terms and Conditions | SafetyScan',
  description: 'SafetyScan terms and conditions of use — your agreement with Cameron Jesse Gisinger (ABN 78 350 866 147) governing use of the SafetyScan compliance assistance service.',
}

const toc = [
  { id: 's1',  label: '1. Agreement to Terms' },
  { id: 's2',  label: '2. Description of Service' },
  { id: 's3',  label: '3. Important Disclaimer — Nature of the Service' },
  { id: 's4',  label: '4. Eligibility' },
  { id: 's5',  label: '5. Account Registration' },
  { id: 's6',  label: '6. Acceptable Use' },
  { id: 's7',  label: '7. Intellectual Property' },
  { id: 's8',  label: '8. Pricing and Payment' },
  { id: 's9',  label: '9. Limitation of Liability' },
  { id: 's10', label: '10. Australian Consumer Law' },
  { id: 's11', label: '11. Indemnification' },
  { id: 's12', label: '12. Privacy' },
  { id: 's13', label: '13. Modifications to the Service' },
  { id: 's14', label: '14. Termination' },
  { id: 's15', label: '15. Governing Law' },
  { id: 's16', label: '16. Contact' },
  { id: 's17', label: '17. Changes to These Terms' },
]

export default function TermsPage() {
  return (
    <>
      <LegalPageHeader title="Terms and Conditions" />
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
            Terms and Conditions
          </h1>
          <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 4px', lineHeight: 1.6 }}>
            SafetyScan · Operated by Cameron Jesse Gisinger (ABN 78 350 866 147)
          </p>
          <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 4px', lineHeight: 1.6 }}>
            Effective date: 1 July 2026
          </p>
          <p style={{ fontSize: 14, color: 'var(--mut)', margin: '0 0 32px', lineHeight: 1.6 }}>
            Contact:{' '}
            <a href="mailto:support@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
              support@safetyscan.com.au
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
              1. Agreement to Terms
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              By accessing or using SafetyScan ("the Service") at safetyscan.com.au, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              These Terms constitute a legally binding agreement between you and Cameron Jesse Gisinger (ABN 78 350 866 147), operating as SafetyScan.
            </p>
          </section>

          <Divider />

          {/* ── Section 2 ── */}
          <section>
            <h2 id="s2" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              2. Description of Service
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              SafetyScan is an AI-powered construction site compliance assistance tool that analyses site photographs and provides guidance against Queensland work health and safety legislation and codes of practice.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              The Service is designed to assist site supervisors, foremen, safety officers, and principal contractors in identifying potential compliance matters. It is not a substitute for professional WHS advice.
            </p>
          </section>

          <Divider />

          {/* ── Section 3 ── */}
          <section>
            <h2 id="s3" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              3. Important Disclaimer — Nature of the Service
            </h2>

            {/* Callout */}
            <div style={{
              background: 'rgba(245, 138, 34, 0.08)',
              border: '1.5px solid rgba(245, 138, 34, 0.35)',
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)', margin: '0 0 2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Read this section carefully.
              </p>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.1 Compliance guidance only</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 10px', color: 'var(--text)' }}>
              SafetyScan is a compliance assistance and guidance tool. It is NOT:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 18px' }}>
              {[
                'A definitive compliance assessment',
                'Legal advice',
                'A substitute for a qualified Work Health and Safety (WHS) professional',
                'A guarantee of compliance with any legislation, standard, or code of practice',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.2 Limitations of AI analysis</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 10px', color: 'var(--text)' }}>
              The Service uses artificial intelligence to analyse photographs. AI analysis has inherent limitations including but not limited to:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 18px' }}>
              {[
                'Inability to assess what is not visible in a photograph',
                'Potential for missed hazards, incorrect identifications, or inaccurate clause references',
                'Dependence on photograph quality, angle, and lighting',
                'Inability to assess site conditions not captured in the photograph',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.3 Not a substitute for site inspection</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              No AI-powered photograph analysis can replace a physical site inspection conducted by a qualified WHS professional. The Service should be used as a guide to prompt further investigation, not as a definitive compliance determination.
            </p>

            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>3.4 User responsibility</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 10px', color: 'var(--text)' }}>
              You are solely responsible for:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 12px' }}>
              {[
                'Verifying all findings and recommendations produced by the Service',
                'Ensuring your workplace complies with all applicable legislation',
                'Engaging qualified WHS professionals for definitive compliance advice',
                'Any decisions made based on output from the Service',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>
          </section>

          <Divider />

          {/* ── Section 4 ── */}
          <section>
            <h2 id="s4" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              4. Eligibility
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              You must be at least 18 years of age to use the Service. By using the Service, you represent and warrant that you are at least 18 years old.
            </p>
          </section>

          <Divider />

          {/* ── Section 5 ── */}
          <section>
            <h2 id="s5" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              5. Account Registration
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              5.1 You must create an account to use the Service. You agree to provide accurate and complete information when creating your account.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              5.2 You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              5.3 You must notify us immediately at{' '}
              <a href="mailto:support@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>support@safetyscan.com.au</a>
              {' '}if you become aware of any unauthorised use of your account.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              5.4 We reserve the right to suspend or terminate your account if you breach these Terms.
            </p>
          </section>

          <Divider />

          {/* ── Section 6 ── */}
          <section>
            <h2 id="s6" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              6. Acceptable Use
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              You agree not to:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 12px' }}>
              {[
                'Use the Service for any unlawful purpose',
                'Upload photographs containing content that is illegal, offensive, or violates the privacy of individuals without their consent',
                'Attempt to circumvent, disable, or interfere with security features of the Service',
                'Use the Service to generate or distribute misleading compliance reports',
                'Reproduce, redistribute, or resell the Service or its outputs without our express written permission',
                'Use automated tools to scrape, crawl, or extract data from the Service',
                'Upload photographs that you do not have the right to share',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>
          </section>

          <Divider />

          {/* ── Section 7 ── */}
          <section>
            <h2 id="s7" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              7. Intellectual Property
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              7.1 The Service, including its software, design, content, and AI models, is the intellectual property of Cameron Jesse Gisinger and is protected by Australian and international intellectual property laws.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              7.2 You retain ownership of photographs you upload to the Service. By uploading photographs, you grant us a limited licence to process and store those photographs for the purpose of delivering the Service.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              7.3 Scan results generated by the Service are provided for your personal and business use. You may not resell or commercially distribute scan results without our prior written consent.
            </p>
          </section>

          <Divider />

          {/* ── Section 8 ── */}
          <section>
            <h2 id="s8" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              8. Pricing and Payment
            </h2>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>8.1 Current pricing</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              The Service is currently available on a subscription basis. Pricing details are displayed at safetyscan.com.au/pricing.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>8.2 Subscription billing</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              Subscription fees are billed monthly or annually in advance. All prices are in Australian dollars (AUD) and inclusive of GST where applicable.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>8.3 Cancellation</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not provide refunds for partial billing periods except where required by the Australian Consumer Law.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>8.4 Changes to pricing</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 18px', color: 'var(--text)' }}>
              We may change our pricing with 30 days notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.
            </p>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>8.5 Free trials and demos</h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              Where we offer a free trial or demo access, the terms of that trial will be communicated to you separately. At the end of a free trial, the Service may require a paid subscription to continue.
            </p>
          </section>

          <Divider />

          {/* ── Section 9 ── */}
          <section>
            <h2 id="s9" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              9. Limitation of Liability
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              9.1 To the maximum extent permitted by Australian law, Cameron Jesse Gisinger, operating as SafetyScan, shall not be liable for any:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 12px' }}>
              {[
                'Direct, indirect, incidental, or consequential loss or damage',
                'Loss of profits, revenue, data, or business opportunity',
                'Personal injury, death, or property damage',
                'WHS penalties, fines, or enforcement action',
                'Costs arising from reliance on AI-generated compliance analysis',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              arising from your use of or inability to use the Service, even if we have been advised of the possibility of such damages.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              9.2 Our total liability to you for any claim arising from your use of the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              9.3 Nothing in these Terms excludes, restricts, or modifies any right or remedy, or any guarantee, warranty, or other term or condition implied or imposed by the Australian Consumer Law that cannot be excluded or limited by agreement.
            </p>
          </section>

          <Divider />

          {/* ── Section 10 ── */}
          <section>
            <h2 id="s10" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              10. Australian Consumer Law
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              Our goods and services come with guarantees that cannot be excluded under the Australian Consumer Law. For major failures with the Service, you are entitled to a remedy under the Australian Consumer Law.
            </p>
          </section>

          <Divider />

          {/* ── Section 11 ── */}
          <section>
            <h2 id="s11" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              11. Indemnification
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              You agree to indemnify and hold harmless Cameron Jesse Gisinger, operating as SafetyScan, from and against any claims, damages, losses, and expenses (including legal fees) arising from:
            </p>
            <ul style={{ paddingLeft: 22, margin: '0 0 12px' }}>
              {[
                'Your use of the Service',
                'Your breach of these Terms',
                'Your violation of any law or third-party rights',
                'Any content you upload to the Service',
              ].map(item => (
                <li key={item} style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 6, color: 'var(--text)' }}>{item}</li>
              ))}
            </ul>
          </section>

          <Divider />

          {/* ── Section 12 ── */}
          <section>
            <h2 id="s12" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              12. Privacy
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              Your use of the Service is also governed by our Privacy Policy, available at safetyscan.com.au/privacy. By using the Service, you agree to the collection and use of your information as described in the Privacy Policy.
            </p>
          </section>

          <Divider />

          {/* ── Section 13 ── */}
          <section>
            <h2 id="s13" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              13. Modifications to the Service
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We reserve the right to modify, suspend, or discontinue the Service (or any part of it) at any time with reasonable notice where practicable. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <Divider />

          {/* ── Section 14 ── */}
          <section>
            <h2 id="s14" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              14. Termination
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              14.1 We may suspend or terminate your access to the Service immediately if you breach these Terms, engage in conduct that is harmful to other users or to us, or for any other reason at our discretion with reasonable notice.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              14.2 On termination, your right to use the Service ceases immediately. Your data will be handled in accordance with our Privacy Policy.
            </p>
          </section>

          <Divider />

          {/* ── Section 15 ── */}
          <section>
            <h2 id="s15" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              15. Governing Law
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              These Terms are governed by the laws of Queensland, Australia. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts of Queensland, Australia.
            </p>
          </section>

          <Divider />

          {/* ── Section 16 ── */}
          <section>
            <h2 id="s16" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              16. Contact
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 4px', color: 'var(--text)' }}>
              For questions about these Terms, contact us at:
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 4px', color: 'var(--text)' }}>
              Email:{' '}
              <a href="mailto:support@safetyscan.com.au" style={{ color: 'var(--amber)', textDecoration: 'none' }}>support@safetyscan.com.au</a>
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 16px', color: 'var(--text)' }}>
              Website: safetyscan.com.au
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 4px', color: 'var(--text)' }}>Cameron Jesse Gisinger</p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 4px', color: 'var(--text)' }}>ABN 78 350 866 147</p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>Queensland, Australia</p>
          </section>

          <Divider />

          {/* ── Section 17 ── */}
          <section>
            <h2 id="s17" style={{ fontSize: 19, fontWeight: 700, margin: '0 0 14px', scrollMarginTop: 80, color: 'var(--text)' }}>
              17. Changes to These Terms
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: '0 0 12px', color: 'var(--text)' }}>
              We may update these Terms from time to time. We will notify you of material changes by email or prominent notice on the Service at least 14 days before the changes take effect. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.
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
              <Link href="/privacy" style={{ color: 'var(--amber)', textDecoration: 'none' }}>
                Privacy Policy
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
