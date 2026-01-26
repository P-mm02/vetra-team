'use client'

import styles from './DotsLoader.module.css'

export default function DotsLoader() {
  return (
    <div className={styles.con} aria-label="Loading">
      {/* <h1>Loading</h1> */}

      <div className={styles.text} aria-hidden="true">
        <span>L</span>
        <span>o</span>
        <span>a</span>
        <span>d</span>
        <span>i</span>
        <span>n</span>
        <span>g</span>
      </div>

      <div className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
