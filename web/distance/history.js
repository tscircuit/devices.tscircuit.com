// Keep a rolling window in acquisition time, including gaps for invalid samples.
export function distanceHistory(canvas) {
  const ctx = canvas.getContext("2d")
  const windowMs = 30000
  let samples = []

  function draw() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    const scale = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const left = 48, right = width - 10, top = 16, bottom = height - 28
    const values = samples.flatMap(s => s.mm === null ? [] : [s.mm])
    const max = values.length ? Math.max(...values) : 300
    const min = values.length ? Math.min(...values) : 0
    const roughStep = Math.max(20, max - min) / 4
    const magnitude = 10 ** Math.floor(Math.log10(roughStep))
    const step = [1, 2, 5, 10].find(n => n * magnitude >= roughStep) * magnitude
    const low = Math.max(0, Math.floor((min - step / 2) / step) * step)
    const high = Math.max(low + step * 2, Math.ceil((max + step / 2) / step) * step)
    const y = mm => bottom - (mm - low) / (high - low) * (bottom - top)
    ctx.font = "12px system-ui"
    ctx.fillStyle = "#465b73"
    ctx.textAlign = "right"
    ctx.lineWidth = 1
    for (let mm = low; mm <= high; mm += step) {
      ctx.fillText(String(mm), left - 8, y(mm) + 4)
      ctx.strokeStyle = "#dbe1e8"
      ctx.beginPath()
      ctx.moveTo(left, y(mm))
      ctx.lineTo(right, y(mm))
      ctx.stroke()
    }
    for (const seconds of [30, 20, 10, 0]) {
      const x = right - seconds / 30 * (right - left)
      ctx.textAlign = seconds === 30 ? "left" : seconds === 0 ? "right" : "center"
      ctx.fillText(seconds ? "−" + seconds + " s" : "0 s", x, height - 5)
    }
    if (!samples.length) return
    const end = samples.at(-1).time
    let previous
    ctx.strokeStyle = ctx.fillStyle = "#235cc0"
    ctx.lineWidth = 2
    ctx.beginPath()
    for (const sample of samples) {
      if (sample.mm !== null) {
        const x = right - (end - sample.time) / windowMs * (right - left)
        if (previous && previous.mm !== null && sample.time - previous.time < 1000) ctx.lineTo(x, y(sample.mm))
        else ctx.moveTo(x, y(sample.mm))
        ctx.fillRect(x - 1, y(sample.mm) - 1, 2, 2)
      }
      previous = sample
    }
    ctx.stroke()
  }

  const observer = new ResizeObserver(draw)
  observer.observe(canvas)
  return {
    dispose() { observer.disconnect() },
    reset() { samples = []; draw() },
    add(mm) {
      const time = performance.now()
      samples = samples.filter(sample => sample.time >= time - windowMs)
      samples.push({time, mm})
      draw()
    }
  }
}
