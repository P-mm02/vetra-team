import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, Clock3, CreditCard, FolderKanban, Trash2, UsersRound } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import { getPortfolioRecords } from '@/lib/cms/projects'
import { canEditPortfolio, canManageUsers } from '@/lib/portfolio'
import { User } from '@/models/User/User'
import styles from './page.module.css'
import { getCmsI18n } from '@/lib/cms/i18n-server'
import { cmsRoleLabel } from '@/lib/cms/i18n'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { t } = await getCmsI18n()
  return { title: t('Dashboard', 'ภาพรวม') }
}

export default async function CmsHomePage() {
  const { t, locale, formatDate, formatNumber } = await getCmsI18n()
  const user = await getCurrentUser()
  const role = user?.role || 'viewer'
  const canManage = canManageUsers(role)
  const canEdit = canEditPortfolio(role)

  const [projectsResult, usersResult] = await Promise.allSettled([
    getPortfolioRecords(),
    canManage ? User.countDocuments({ deletedAt: null }) : Promise.resolve(null),
  ])

  const projects = projectsResult.status === 'fulfilled' ? projectsResult.value : null
  const userCount = usersResult.status === 'fulfilled' ? usersResult.value : null
  const latestEdit = projects?.reduce<string | undefined>((latest, item) =>
    !latest || item.updatedAt > latest ? item.updatedAt : latest, undefined)

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="dashboard-title">
        <div className={styles.heroContent}>
          <span className={styles.kicker}><span className={styles.kickerDot} /> {t('YOUR WORKSPACE', 'พื้นที่ทำงานของคุณ')}</span>
          <h1 id="dashboard-title">{t('A clear view of your content.', 'ดูแลเว็บไซต์ของคุณได้ในที่เดียว')}</h1>
          <p>{t(`Welcome back${user ? `, ${user.username}` : ''}. Manage the VETRA portfolio and keep your work up to date.`, `ยินดีต้อนรับ${user ? ` ${user.username}` : ''} จัดการผลงาน VETRA และอัปเดตข้อมูลให้เป็นปัจจุบัน`)}</p>
          <div className={styles.heroActions}>
            <Link className={styles.heroPrimary} href="/admin/cms/projects">
              {t('View portfolio', 'จัดการผลงาน')} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a className={styles.heroSecondary} href={locale === 'en' ? '/en' : '/'} target="_blank" rel="noopener noreferrer">
              {t('Open website', 'เปิดเว็บไซต์')} <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className={styles.heroArtwork} aria-hidden="true">
          <span className={styles.orbitOne} /><span className={styles.orbitTwo} />
          <svg className={styles.artMark} viewBox="0 0 200 200" focusable="false"><path d="M40 45 100 162 160 45M65 45 104 122 143 45" fill="none" stroke="currentColor" strokeWidth="8" /></svg>
        </div>
      </section>

      <section className={styles.metrics} aria-label={t('Workspace overview', 'ภาพรวมเว็บไซต์')}>
        <article className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.violet}`}><FolderKanban size={21} aria-hidden="true" /></span>
          <span className={styles.metricLabel}>{t('Active portfolio entries', 'ผลงานบนเว็บไซต์')}</span>
          <strong className={styles.metricValue}>{projects ? formatNumber(projects.length) : '—'}</strong>
          <span className={styles.metricHint}>{projects ? t('Visible to visitors', 'แสดงให้ผู้เข้าชมเห็น') : t('Database temporarily unavailable', 'ฐานข้อมูลไม่พร้อมใช้งานชั่วคราว')}</span>
        </article>
        {canManage ? (
          <article className={styles.metric}>
            <span className={`${styles.metricIcon} ${styles.cyan}`}><UsersRound size={21} aria-hidden="true" /></span>
            <span className={styles.metricLabel}>{t('User accounts', 'บัญชีผู้ใช้งาน')}</span>
            <strong className={styles.metricValue}>{userCount === null ? '—' : formatNumber(userCount)}</strong>
            <span className={styles.metricHint}>{userCount === null ? t('Database temporarily unavailable', 'ฐานข้อมูลไม่พร้อมใช้งานชั่วคราว') : t('Accounts outside Trash', 'บัญชีที่ไม่ได้อยู่ในถังขยะ')}</span>
          </article>
        ) : (
          <article className={styles.metric}>
            <span className={`${styles.metricIcon} ${styles.cyan}`}><UsersRound size={21} aria-hidden="true" /></span>
            <span className={styles.metricLabel}>{t('Your access', 'สิทธิ์ของคุณ')}</span>
            <strong className={styles.metricValueSmall}>{cmsRoleLabel(role, locale)}</strong>
            <span className={styles.metricHint}>{canEdit ? t('Portfolio editing available', 'สามารถแก้ไขผลงานได้') : t('Read-only access', 'ดูข้อมูลได้เท่านั้น')}</span>
          </article>
        )}
        <article className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.peach}`}><Clock3 size={21} aria-hidden="true" /></span>
          <span className={styles.metricLabel}>{t('Latest portfolio edit', 'อัปเดตผลงานล่าสุด')}</span>
          <strong className={styles.metricValueSmall}>{projects ? latestEdit ? formatDate(latestEdit) : t('No edits yet', 'ยังไม่มีการแก้ไข') : '—'}</strong>
          <span className={styles.metricHint}>{projects ? t('Bangkok time', 'เวลาไทย') : t('Database temporarily unavailable', 'ฐานข้อมูลไม่พร้อมใช้งานชั่วคราว')}</span>
        </article>
      </section>

      <div className={styles.sectionHead}>
        <div><span className={styles.sectionKicker}>{t('MANAGE', 'จัดการ')}</span><h2>{t('Where would you like to go?', 'เริ่มจัดการส่วนไหนดี?')}</h2></div>
        <p>{t('Tools for the work you have access to.', 'เครื่องมือสำหรับงานที่คุณมีสิทธิ์เข้าถึง')}</p>
      </div>
      <section className={styles.modules} aria-label={t('CMS sections', 'ส่วนต่าง ๆ ของระบบจัดการ')}>
        <Link href="/admin/cms/projects" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.violet}`}><FolderKanban size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>{t('Portfolio', 'ผลงาน')}</strong><span>{canEdit ? t('Add, update, and arrange project entries.', 'เพิ่ม แก้ไข และจัดเรียงผลงาน') : t('Browse the project entries.', 'ดูรายการผลงานบนเว็บไซต์')}</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>
        {canManage && <Link href="/admin/cms/payments" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.blue}`}><CreditCard size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>{t('Payments', 'การชำระเงิน')}</strong><span>{t('Create payment links and review their status.', 'สร้างลิงก์ชำระเงินและตรวจสอบสถานะ')}</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
        {canManage && <Link href="/admin/cms/users" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.cyan}`}><UsersRound size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>{t('Users', 'ผู้ใช้งาน')}</strong><span>{t('Manage accounts, roles, and access.', 'จัดการบัญชี บทบาท และสิทธิ์การเข้าถึง')}</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
        {canEdit && <Link href="/admin/cms/trash" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.peach}`}><Trash2 size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>{t('Trash', 'ถังขยะ')}</strong><span>{t('Review items kept for 30 days after deletion.', 'กู้คืนรายการภายใน 30 วันหลังลบ')}</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
        {canManage && <Link href="/admin/cms/analytics" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.blue}`}><ChartNoAxesCombined size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>{t('Analytics', 'สถิติการเข้าชม')}</strong><span>{t('Explore your website traffic.', 'ดูสถิติผู้เข้าชมเว็บไซต์ของคุณ')}</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
      </section>
    </main>
  )
}
