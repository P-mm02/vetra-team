'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import styles from './VetraSelect.module.css'

export type SelectOption<T extends string> = {
  value: T
  label: string
  disabled?: boolean
}

type Props<T extends string> = {
  name?: string // for <form> submit (hidden input)
  value: T | '' // controlled
  onChange: (v: T) => void
  options: SelectOption<T>[]
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function VetraSelect<T extends string>({
  name,
  value,
  onChange,
  options,
  label,
  placeholder = 'Select…',
  disabled = false,
  className = '',
}: Props<T>) {
  const uid = useId()
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const enabledOptions = useMemo(
    () => options.filter((o) => !o.disabled),
    [options],
  )

  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value],
  )

  // set active index to selected (or first enabled) when opening
  useEffect(() => {
    if (!open) return
    const selIndex = options.findIndex((o) => o.value === value && !o.disabled)
    const next =
      selIndex >= 0
        ? selIndex
        : options.findIndex((o) => !o.disabled) >= 0
          ? options.findIndex((o) => !o.disabled)
          : 0
    setActiveIndex(next)
    // scroll into view after open
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>(
        `[data-opt-index="${next}"]`,
      )
      el?.scrollIntoView({ block: 'nearest' })
    })
  }, [open, options, value])

  // close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (listRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open])

  // close on escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function move(delta: number) {
    if (!options.length) return
    let i = activeIndex
    for (let step = 0; step < options.length; step++) {
      i = clamp(i + delta, 0, options.length - 1)
      if (!options[i]?.disabled) {
        setActiveIndex(i)
        const el = listRef.current?.querySelector<HTMLElement>(
          `[data-opt-index="${i}"]`,
        )
        el?.scrollIntoView({ block: 'nearest' })
        return
      }
    }
  }

  function choose(i: number) {
    const opt = options[i]
    if (!opt || opt.disabled) return
    onChange(opt.value)
    setOpen(false)
    btnRef.current?.focus()
  }

  function onButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((p) => !p)
      return
    }
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(+1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      const first = options.findIndex((o) => !o.disabled)
      if (first >= 0) setActiveIndex(first)
    } else if (e.key === 'End') {
      e.preventDefault()
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          setActiveIndex(i)
          break
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(activeIndex)
    }
  }

  return (
    <div className={`${styles.wrap} ${className}`} data-disabled={disabled}>
      {label ? (
        <label className={styles.label} htmlFor={`${uid}-btn`}>
          {label}
        </label>
      ) : null}

      {/* hidden input for form submit */}
      {name ? <input type="hidden" name={name} value={value || ''} /> : null}

      <button
        id={`${uid}-btn`}
        ref={btnRef}
        className={styles.button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        onKeyDown={onButtonKeyDown}
      >
        <span className={styles.value}>
          {selected ? (
            selected.label
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
      </button>

      {open ? (
        <div
          id={`${uid}-list`}
          ref={listRef}
          className={styles.pop}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${uid}-opt-${activeIndex}`}
          onKeyDown={onListKeyDown}
        >
          <div className={styles.list}>
            {options.map((o, i) => {
              const isSel = o.value === value
              const isActive = i === activeIndex
              return (
                <button
                  key={o.value}
                  id={`${uid}-opt-${i}`}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  data-opt-index={i}
                  className={`${styles.option} ${
                    isSel ? styles.optionSelected : ''
                  } ${isActive ? styles.optionActive : ''}`}
                  disabled={o.disabled}
                  onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                  onClick={() => choose(i)}
                >
                  <span className={styles.optionText}>{o.label}</span>
                  {isSel ? <span className={styles.check} /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
