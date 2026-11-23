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
    try { await s.write(cmd); record(cmd.startsWith("wifi join ") ? "> wifi join" : "> " + cmd) } catch (err) { failed(err) }
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
  el("wifi-controls").hidden = s.kind !== "esp32-motherboard"
  el("wifi-join").onsubmit = event => {
    event.preventDefault()
    const ssid = el("wifi-ssid").value, pass = el("wifi-pass").value
    const bytes = new TextEncoder()
    if (/[\r\n\t]/.test(ssid + pass) || bytes.encode(ssid).length > 32 || bytes.encode(pass).length > 63) {
      record("Use a network name up to 32 bytes and a passphrase up to 63 bytes, without tabs or line breaks.")
      return
    }
    el("wifi-pass").value = ""
    void send("wifi join " + ssid + "\t" + pass)
  }
  el("serial").hidden = false
  el("encoder").hidden = s.kind !== "encoder"
  el("detents").textContent = "—"
  el("push").textContent = ""
  el("pot").hidden = s.kind !== "potentiometer"
  el("position").textContent = "—"
  el("raw").textContent = ""
  el("buzzer").hidden = s.kind !== "buzzer"
  const passiveBuzzer = Number(s.version.split(".")[0]) >= 2
  el("rate-field").hidden = !(passiveBuzzer || /^1\.([1-9]\d*)\./.test(s.version))
  el("rate-label").textContent = passiveBuzzer ? "Frequency (Hz)" : "Modulation (Hz)"
  el("rate").max = passiveBuzzer ? "4000" : "2000"
  el("rate").placeholder = passiveBuzzer ? "4000" : "Off"
  el("rate").value = ""
  log.textContent = ""
  record("DEVICE tscircuit " + s.kind + " " + s.version)
  s.onLine = line => {
    if ((s.kind === "encoder" || s.kind === "potentiometer") && line.startsWith("{")) {
      try {
        const v = JSON.parse(line)
        if (s.kind === "encoder" && v.module === "dial" && Number.isInteger(v.count) &&
            v.count >= 0 && v.count <= 0xffffffff && (v.pressed === 0 || v.pressed === 1)) {
          el("detents").textContent = v.count | 0 // Signed detents relative to power-up.
          el("push").textContent = v.pressed ? "Button pressed" : "Button released"
          return
        }
        if (s.kind === "potentiometer" && v.module === "position" && v.max === 255 && Number.isInteger(v.raw) && v.raw >= 0 && v.raw <= 255) {
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
    el("wifi-controls").hidden = true
    el("wifi-pass").value = ""
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
