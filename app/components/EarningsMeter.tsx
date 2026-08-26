// A landing-page-only visual demo of a timer earning money in real time.
import { useEffect, useRef, useState } from 'react'

export default function EarningsMeter() {
  const [rate, setRate] = useState(135)
  const [amount, setAmount] = useState(0)
  // A ref keeps the start timestamp without causing a render whenever it changes.
  const startRef = useRef(Date.now())

  // Changing the example rate starts a fresh earning demonstration.
  useEffect(() => {
    startRef.current = Date.now()
    setAmount(0)
  }, [rate])

  // requestAnimationFrame updates the displayed amount as smoothly as the browser can render.
  useEffect(() => {
    let raf: number
    const tick = () => {
      const elapsedHours = (Date.now() - startRef.current) / 1000 / 60 / 60
      setAmount(elapsedHours * rate)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rate])

  // Split the currency amount so dollars and cents can have different visual styles.
  const [dollars, cents] = amount.toFixed(2).split('.')

  return (
    <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Running · Website Redesign</p>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stamp opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-stamp" />
        </span>
      </div>

      <p className="mt-4 font-mono tabular text-4xl font-medium text-ink sm:text-5xl">
        ${Number(dollars).toLocaleString('en-US')}
        <span className="text-ink-300">.{cents}</span>
      </p>
      <p className="mt-1 text-sm text-ink-500">earned on this timer, right now</p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-ink-400">
          <span>Your rate</span>
          <span className="font-mono tabular text-ink-600">${rate}/hr</span>
        </div>
        <input
          type="range"
          min={40}
          max={300}
          step={5}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-100 accent-stamp"
          aria-label="Adjust hourly rate to see how earnings accumulate"
        />
      </div>
    </div>
  )
}
