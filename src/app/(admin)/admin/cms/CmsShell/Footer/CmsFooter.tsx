import { ArrowUpRight } from 'lucide-react'
import styles from './CmsFooter.module.css'

export default function CmsFooter() {
  return (
    <div className={styles.sideFoot}>
      <a className={styles.siteLink} href="/" target="_blank" rel="noopener noreferrer">
        <span>View website</span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </a>
    </div>
  )
}
