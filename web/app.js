import {isContactSwitch, openSwitch, startSwitch} from "./contact-switch.js"
import {DistanceSensor} from "./distance/sensor.js"
import {identifySerial} from "./serial.js"
import {startRanging, startSerial} from "./device-controls.js"

const names = {
  encoder: "Rotary encoder", potentiometer: "Potentiometer", distance: "Distance sensor", display: "Flex display",
  button: "Button", toggle: "Toggle switch", limit: "Limit switch", buzzer: "Buzzer", resetter: "USB resetter"
}
const serialIds = {
  toggle: {usbVendorId: 0x1a86, usbProductId: 0x7523},
  ch552: {usbVendorId: 0x1209, usbProductId: 0xc550},
  resetter: {usbVendorId: 0x2e8a, usbProductId: 0x000a}
}
const usbIds = {
  distance: {vendorId: 0x1a86, productId: 0x5512},
  toggle: {vendorId: 0x1a86, productId: 0x7523}
}
function usesUsb(kind) {
  return kind === "distance" || (isContactSwitch(kind) && /Mac/i.test(navigator.platform))
}
const cards = new Map()
const claimed = new Set()
const remembered = new WeakMap()
const prefix = "tscircuit.device."
const el = id => document.getElementById(id)
const picker = el("picker")

function cardFor(saved) {
  const host = document.createElement("div")
  host.className = "device-card"
  const root = host.attachShadow({mode:"open"})
  root.append(el("card").content.cloneNode(true))
  const card = {saved, host, root}
  cards.set(saved.id, card)
  root.getElementById("name").textContent = saved.name
  root.getElementById("reconnect").onclick = () => card.session ? disconnect(card) : choose(saved.kind, card)
  root.getElementById("remove").onclick = async () => {
    cards.delete(saved.id)
    localStorage.removeItem(prefix + saved.id)
    host.remove()
    el("empty").hidden = cards.size > 0
    await disconnect(card)
  }
  el("devices").append(host)
  el("empty").hidden = true
  return card
}

async function disconnect(card, error) {
  const s = card.session
  if (!s) return
  card.session = null
  card.cleanup?.()
  card.cleanup = null
  card.root.getElementById("live").hidden = true
  const button = card.root.getElementById("reconnect")
  button.disabled = true
  try { await s.close() } finally {
    claimed.delete(s.handle)
    button.disabled = false
    button.textContent = "Connect"
    card.root.getElementById("state").textContent = error ? "Disconnected · " + error.message : "Disconnected"
  }
}

async function openDevice(handle, usb, requested) {
  if (!usb) {
    const info = handle.getInfo()
    if (info.usbVendorId === serialIds.toggle.usbVendorId && info.usbProductId === serialIds.toggle.usbProductId) return openSwitch(handle, requested, false)
    return Object.assign(await identifySerial(handle), {handle})
  }
  if (handle.vendorId === usbIds.toggle.vendorId && handle.productId === usbIds.toggle.productId) return openSwitch(handle, requested, true)
  await handle.open()
  try {
    await handle.selectConfiguration(1)
    await handle.claimInterface(0)
    const sensor = new DistanceSensor(handle)
    await sensor.initialize()
    const s = {handle, sensor, kind:"distance", async close() {
      s.stopped = true
      await s.loop
      await handle.close().catch(() => {})
    }}
    return s
  } catch (err) {
    await handle.close().catch(() => {})
    throw err
  }
}

async function attach(handle, usb, {requested, target, restoring = false} = {}) {
  if (claimed.has(handle)) {
    if (!restoring) el("notice").textContent = "That device is already connected or connecting."
    return
  }
  claimed.add(handle)
  let session, attached = false
  try {
    session = await openDevice(handle, usb, requested)
    const kind = session.kind
    if (!Object.hasOwn(names, kind)) throw Error("Unrecognized device identity.")
    if (requested && requested !== kind) throw Error("Selected " + names[kind] + ". Choose " + names[requested] + " instead.")
    if (target && !cards.has(target.saved.id)) return
    const previous = cards.get(remembered.get(handle))
    let card = target || (previous?.saved.kind === kind ? previous : null)
    if (restoring && !card) {
      const matches = [...cards.values()].filter(c => c.saved.kind === kind)
      // Identical USB bridges can lack a unique serial number. Never guess between cards.
      if (matches.length !== 1) return
      card = matches[0]
    }
    if (card?.session || session.ended) return
    if (!card) {
      const taken = new Set([...cards.values()].map(c => c.saved.name))
      let name = names[kind]
      for (let i = 2; taken.has(name); i++) name = names[kind] + " " + i
      const saved = {id:crypto.randomUUID(), kind, name}
      localStorage.setItem(prefix + saved.id, JSON.stringify(saved))
      card = cardFor(saved)
    }
    remembered.set(handle, card.saved.id)
    card.session = session
    const failed = err => { if (card.session === session) void disconnect(card, err) }
    session.onEnd = failed
    const r = card.root
    r.getElementById("state").textContent = session.version ? "Connected · Firmware " + session.version : "Connected"
    r.getElementById("reconnect").textContent = "Disconnect"
    r.getElementById("live").hidden = false
    card.cleanup = kind === "distance" ? startRanging(r,session,failed) : isContactSwitch(kind) ? startSwitch(r,session,failed) : startSerial(r,session,failed)
    attached = true
  } finally {
    if (!attached) {
      if (session) await session.close()
      claimed.delete(handle)
    }
  }
}

async function choose(kind, target) {
  picker.close()
  el("notice").textContent = ""
  const usb = usesUsb(kind)
  try {
    if (!(usb ? navigator.usb : navigator.serial)) throw Error("Open this page in desktop Chrome or Edge to connect this device.")
    const filterKind = isContactSwitch(kind) ? "toggle" : kind
    const handle = usb ? await navigator.usb.requestDevice({filters:[usbIds[filterKind]]}) :
      await navigator.serial.requestPort({filters:[serialIds[filterKind] ?? serialIds.ch552]})
    await attach(handle, usb, {requested:kind, target})
  } catch (err) { if (err.name !== "NotFoundError") el("notice").textContent = err.message }
}

for (const [kind, name] of Object.entries(names)) {
  const choice = document.createElement("button")
  choice.textContent = name
  choice.onclick = () => choose(kind)
  el("choices").append(choice)
}
el("add").onclick = () => picker.showModal()
for (const key of Object.keys(localStorage).filter(k => k.startsWith(prefix))) {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (key === prefix + saved.id && Object.hasOwn(names,saved.kind) && typeof saved.name === "string") cardFor(saved)
  } catch {}
}

async function restore(handle, usb) {
  const info = usb ? handle : handle.getInfo()
  // These switches share an identifier. Only restore a handle paired in this page.
  const switchHandle = usb
    ? info.vendorId === usbIds.toggle.vendorId && info.productId === usbIds.toggle.productId
    : info.usbVendorId === serialIds.toggle.usbVendorId && info.usbProductId === serialIds.toggle.usbProductId
  if (switchHandle) {
    const target = cards.get(remembered.get(handle))
    if (target && isContactSwitch(target.saved.kind) && !target.session && usesUsb(target.saved.kind) === usb)
      await attach(handle, usb, {requested:target.saved.kind, target, restoring:true}).catch(() => {})
    return
  }
  const possible = [...cards.values()].some(c => {
    if (c.session || isContactSwitch(c.saved.kind)) return false
    if (usesUsb(c.saved.kind) !== usb) return false
    if (usb) return info.vendorId === usbIds[c.saved.kind].vendorId && info.productId === usbIds[c.saved.kind].productId
    const id = serialIds[c.saved.kind] ?? serialIds.ch552
    return c.saved.kind !== "distance" && info.usbVendorId === id.usbVendorId && info.usbProductId === id.usbProductId
  })
  if (possible) await attach(handle, usb, {restoring:true}).catch(() => {})
}
for (const [api, usb] of [[navigator.serial,false],[navigator.usb,true]]) {
  if (!api) continue
  api.addEventListener("connect", e => restore(usb ? e.device : e.target, usb))
  api.addEventListener("disconnect", e => {
    const handle = usb ? e.device : e.target
    const card = cards.get(remembered.get(handle))
    if (card?.session?.handle === handle) void disconnect(card)
  })
  const authorized = usb ? api.getDevices() : api.getPorts()
  authorized.then(handles => Promise.all(handles.map(h => restore(h,usb)))).catch(() => {})
}
if (new URLSearchParams(location.search).get("add") === "distance") picker.showModal()
