import {DistanceSensor} from "./sensor.js"

import {distanceHistory} from "./history.js"

const el = id => document.getElementById(id)
const connect = el("connect")
const history = distanceHistory(el("history"))
let session

function resetReading() {
  el("distance").textContent = "—"
  el("quality").textContent = "Awaiting measurement"
}

function show({mm, status}) {
  const valid = status === 11
  history.add(valid ? mm : null)
  el("distance").textContent = valid ? mm : "—"
  let quality = "Within working range"
  if (!valid) quality = "No valid return · sensor status " + status
  else if (mm < 30) quality = "Below working range"
  else if (mm > 300) quality = "Above working range"
  el("quality").textContent = quality
}

async function run(current) {
  const {device} = current
  try {
    await device.open()
    await device.selectConfiguration(1)
    await device.claimInterface(0)
    const sensor = new DistanceSensor(device)
    await sensor.initialize()
    el("identity").textContent = "VL53L0X distance sensor"
    el("state").textContent = "Connected · CH341T USB-to-I²C"
    connect.textContent = "Disconnect"
    connect.disabled = false
    while (!current.stopped) {
      const reading = await sensor.sample()
      if (current.stopped) break
      show(reading)
      await new Promise(resolve => setTimeout(resolve, 75))
    }
  } catch (error) {
    if (!current.stopped) current.message = error.message
  } finally {
    try { if (device.opened) await device.close() }
    catch (error) { current.message ??= error.message }
    resetReading()
    el("identity").textContent = "USB distance sensor"
    el("state").textContent = current.message || "Disconnected."
    connect.textContent = "Connect sensor"
    connect.disabled = false
    session = undefined
  }
}

connect.onclick = async () => {
  connect.disabled = true
  if (session) {
    session.stopped = true
    return
  }
  try {
    const device = await navigator.usb.requestDevice({filters: [{vendorId: 0x1a86, productId: 0x5512}]})
    history.reset()
    session = {device}
    el("state").textContent = "Identifying and initializing the sensor…"
    await run(session)
  } catch (error) {
    el("state").textContent = error.name === "NotFoundError" ? "No sensor selected." : error.message
    connect.disabled = false
  }
}

if (!navigator.usb) {
  connect.disabled = true
  el("state").textContent = "Open this page in desktop Chrome or Edge to use WebUSB."
} else {
  navigator.usb.addEventListener("disconnect", event => {
    if (session?.device === event.device) {
      session.stopped = true
      session.message = "Sensor unplugged."
    }
  })
}
