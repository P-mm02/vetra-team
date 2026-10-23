import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, Clock3, CreditCard, FolderKanban, Trash2, UsersRound } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import { getPortfolioRecords } from '@/lib/cms/projects'
import { canEditPortfolio, canManageUsers } from '@/lib/portfolio'
import { User } from '@/models/User/User'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

function formatDate(value: string | undefined) {
  if (!value) return 'No edits yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unavailable'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(date)
}

export default async function CmsHomePage() {
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
          <span className={styles.kicker}><span className={styles.kickerDot} /> YOUR WORKSPACE</span>
          <h1 id="dashboard-title">A clear view of your content.</h1>
          <p>Welcome back{user ? `, ${user.username}` : ''}. Manage the VETRA portfolio and keep published work up to date.</p>
          <div className={styles.heroActions}>
            <Link className={styles.heroPrimary} href="/admin/cms/projects">
              View portfolio <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a className={styles.heroSecondary} href="/" target="_blank" rel="noopener noreferrer">
              Open website <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className={styles.heroArtwork} aria-hidden="true">
          <span className={styles.orbitOne} /><span className={styles.orbitTwo} />
          <span className={styles.artMark}>V</span>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Workspace overview">
        <article className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.violet}`}><FolderKanban size={21} aria-hidden="true" /></span>
          <span className={styles.metricLabel}>Active portfolio entries</span>
          <strong className={styles.metricValue}>{projects ? projects.length : '—'}</strong>
          <span className={styles.metricHint}>{projects ? 'Visible to visitors' : 'Database temporarily unavailable'}</span>
        </article>
        {canManage ? (
          <article className={styles.metric}>
            <span className={`${styles.metricIcon} ${styles.cyan}`}><UsersRound size={21} aria-hidden="true" /></span>
            <span className={styles.metricLabel}>Active user accounts</span>
            <strong className={styles.metricValue}>{userCount ?? '—'}</strong>
            <span className={styles.metricHint}>{userCount === null ? 'Database temporarily unavailable' : 'Accounts outside Trash'}</span>
          </article>
        ) : (
          <article className={styles.metric}>
            <span className={`${styles.metricIcon} ${styles.cyan}`}><UsersRound size={21} aria-hidden="true" /></span>
            <span className={styles.metricLabel}>Your access</span>
            <strong className={styles.metricValueSmall}>{role}</strong>
            <span className={styles.metricHint}>{canEdit ? 'Portfolio editing available' : 'Read-only access'}</span>
          </article>
        )}
        <article className={styles.metric}>
          <span className={`${styles.metricIcon} ${styles.peach}`}><Clock3 size={21} aria-hidden="true" /></span>
          <span className={styles.metricLabel}>Latest portfolio edit</span>
          <strong className={styles.metricValueSmall}>{projects ? formatDate(latestEdit) : '—'}</strong>
          <span className={styles.metricHint}>{projects ? 'Bangkok time' : 'Database temporarily unavailable'}</span>
        </article>
      </section>

      <div className={styles.sectionHead}>
        <div><span className={styles.sectionKicker}>MANAGE</span><h2>Where would you like to go?</h2></div>
        <p>Tools for the work you have access to.</p>
      </div>
      <section className={styles.modules} aria-label="CMS sections">
        <Link href="/admin/cms/projects" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.violet}`}><FolderKanban size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>Portfolio</strong><span>{canEdit ? 'Add, update, and arrange project entries.' : 'Browse the published project entries.'}</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>
        {canManage && <Link href="/admin/cms/payments" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.blue}`}><CreditCard size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>Payments</strong><span>Create payment links and review their status.</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
        {canManage && <Link href="/admin/cms/users" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.cyan}`}><UsersRound size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>Users</strong><span>Manage accounts, roles, and access.</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
        {canEdit && <Link href="/admin/cms/trash" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.peach}`}><Trash2 size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>Trash</strong><span>Review items kept for 30 days after deletion.</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
        {canManage && <Link href="/admin/cms/analytics" className={styles.module}>
          <span className={`${styles.moduleIcon} ${styles.blue}`}><ChartNoAxesCombined size={23} aria-hidden="true" /></span>
          <span className={styles.moduleBody}><strong>Analytics</strong><span>Explore your website traffic.</span></span>
          <ArrowRight className={styles.moduleArrow} size={20} aria-hidden="true" />
        </Link>}
      </section>
    </main>
  )
}
