'use client'

import styles from './Slider.module.css'
import SliderView from './SliderView'
import { useSlider } from './useSlider'
import type { Slide } from './function'

type SliderProps = {
  slides: Slide[]
  ariaLabel?: string
  intervalMs?: number
}

export default function Slider(props: SliderProps) {
  const api = useSlider(props)
  if (!api) return null

  return <SliderView styles={styles} {...api} />
}
