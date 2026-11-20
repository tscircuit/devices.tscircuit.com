import {displayControls} from "./display/player.js"
import {distanceHistory} from "./distance/history.js"

export function startSerial(root, s, failed) {
  const el = id => root.getElementById(id)
  const display = displayControls(root)
  const log = el("log")
  let ack
  function record(line) {
    log.textContent = (log.textContent + line + "\n").slice(-12000)
    log.scrollTop = log.scrollHeight
  }
  async function send(cmd) {
    try { await s.write(cmd); record("> " + cmd) } catch (err) { failed(err) }
  }
  async function exchange(data, expected) {
    let timer
    try {
      const reply = new Promise((resolve,reject) => {
        ack = {expected, resolve, reject}
        timer = setTimeout(() => reject(Error("Display timed out.")),15000)
      })
      await Promise.all([s.write(data), reply])
    } catch (err) { failed(err); throw err }
    finally { clearTimeout(timer); ack = undefined }
  }
  function lock(locked) {
    el("command").disabled = el("send").disabled = locked
    root.querySelector("[data-command=help]").disabled = locked
  }
  lock(false)
  el("serial").hidden = false
  el("pot").hidden = s.kind !== "potentiometer"
  el("position").textContent = "—"
  el("raw").textContent = ""
  el("buzzer").hidden = s.kind !== "buzzer"
  el("rate-field").hidden = !/^1\.([1-9]\d*)\./.test(s.version)
  log.textContent = ""
  record("DEVICE tscircuit " + s.kind + " " + s.version)
  s.onLine = line => {
    if (s.kind === "potentiometer" && line.startsWith("{")) {
      try {
        const v = JSON.parse(line)
        if (v.module === "position" && v.max === 255 && Number.isInteger(v.raw) && v.raw >= 0 && v.raw <= 255) {
          el("position").textContent = Math.round(v.raw * 100 / 255)
          el("meter").value = v.raw
          el("raw").textContent = "ADC " + v.raw + " / 255"
          return
        }
      } catch {}
    }
    const level = /^BRIGHTNESS (\d{1,3})$/.exec(line)
    if (level) { display.reportBrightness(level[1]); return }
    if (ack) {
      if (line === ack.expected) ack.resolve()
      else ack.reject(Error("Unexpected display reply: " + line))
      return
    }
    record(line)
  }
  if (s.kind === "display") display.enableDisplay(exchange, lock, send, s.version)
  el("terminal").onsubmit = event => {
    event.preventDefault()
    const cmd = el("command").value.trim()
    if (cmd) send(cmd)
    el("command").value = ""
  }
  el("play").onsubmit = event => {
    event.preventDefault()
    const hz = el("rate").valueAsNumber, ms = el("duration").valueAsNumber
    send(!el("rate-field").hidden && hz && ms ? `tone ${hz} ${ms}` : `beep ${ms}`)
  }
  for (const b of root.querySelectorAll("[data-command]")) b.onclick = () => send(b.dataset.command)
  return () => {
    ack?.reject(Error("Disconnected."))
    display.hideDisplay()
  }
}

export function startRanging(root, session, failed) {
  const el = id => root.getElementById(id)
  el("ranging").hidden = false
  el("serial").hidden = true
  el("distance").textContent = "—"
  el("quality").textContent = "Awaiting measurement"
  const history = distanceHistory(el("history"))
  session.loop = (async () => {
    while (!session.stopped) {
      const {mm,status} = await session.sensor.sample()
      if (session.stopped) break
      const valid = status === 11
      history.add(valid ? mm : null)
      el("distance").textContent = valid ? mm : "—"
      el("quality").textContent = !valid ? "No valid return · sensor status " + status :
        mm < 30 ? "Below working range" : mm > 300 ? "Above working range" : "Within working range"
      await new Promise(resolve => setTimeout(resolve,75))
    }
  })().catch(err => { if (!session.stopped) queueMicrotask(() => failed(err)) })
  return () => { session.stopped = true; history.dispose() }
}
