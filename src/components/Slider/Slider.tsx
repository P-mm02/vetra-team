'use client'

import styles from './Slider.module.css'
import SliderView from './SliderView'
import { useSlider } from './useSlider'
import type { Slide } from './function'
import type { Locale } from '@/lib/i18n'

type SliderProps = {
  slides: Slide[]
  ariaLabel?: string
  intervalMs?: number
  locale?: Locale
}

export default function Slider({ locale = 'en', ...props }: SliderProps) {
  const api = useSlider(props)
  if (!api) return null

  return <SliderView styles={styles} locale={locale} {...api} />
}
