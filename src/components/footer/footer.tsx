// src/components/footer/footer.tsx
import Link from 'next/link'
import styles from './footer.module.css'

type FooterLink = { label: string; href: string }

const navLinks: FooterLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Work', href: '/work' },
  { label: 'Process', href: '/process' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

// TODO: change later
const contactEmail = 'hello@example.com'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer} aria-label="Footer">
      <div className={styles.container}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brandCol}>
            <div className={styles.brandRow}>
              <div className={styles.brandMark} aria-hidden="true" />
              <div>
                <div className={styles.brandName}>Wee | Freelance</div>
                <div className={styles.brandSub}>
                  Next.js • Web Apps • SEO • Dark Futuristic UI
                </div>
              </div>
            </div>

            <p className={styles.about}>
              รับทำเว็บไซต์และเว็บแอปด้วย Next.js เน้นความพรีเมียม ความเร็ว SEO
              และโค้ดที่ดูแลง่าย เหมาะกับทั้งเว็บบริษัท, landing สำหรับ
              QR/แคมเปญ และระบบหลังบ้าน
            </p>

            <div className={styles.ctaRow}>
              <Link className={styles.btnPrimary} href="/contact">
                เริ่มคุยโปรเจกต์
              </Link>
              <a className={styles.btnGhost} href={`mailto:${contactEmail}`}>
                ส่งอีเมล
              </a>
            </div>

            <div className={styles.mini}>
              QR Landing:{' '}
              <Link className={styles.inlineLink} href="/contact">
                /contact
              </Link>
            </div>
          </div>

          {/* Links */}
          <nav className={styles.navCol} aria-label="Footer navigation">
            <div className={styles.colTitle}>Menu</div>
            <ul className={styles.linkGrid}>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link className={styles.link} href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className={styles.contactCol}>
            <div className={styles.colTitle}>Contact</div>

            <div className={styles.contactCard}>
              <div className={styles.contactRow}>
                <div className={styles.k}>Email</div>
                <a className={styles.v} href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </div>

              <div className={styles.contactRow}>
                <div className={styles.k}>Location</div>
                <div className={styles.v}>Thailand</div>
              </div>

              <div className={styles.contactRow}>
                <div className={styles.k}>Work</div>
                <Link className={styles.vLink} href="/work">
                  ดูผลงาน
                </Link>
              </div>

              <div className={styles.note}>
                ถ้าต้องการประเมินงานเร็ว: ส่ง “เป้าหมาย + reference + deadline +
                งบคร่าว ๆ”
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.copy}>
            © {year} Wee | Freelance. All rights reserved.
          </div>

          <div className={styles.bottomLinks}>
            <Link className={styles.bottomLink} href="/privacy">
              Privacy
            </Link>
            <span className={styles.sep} aria-hidden="true">
              •
            </span>
            <Link className={styles.bottomLink} href="/terms">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
