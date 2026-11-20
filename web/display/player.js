const el = id => document.getElementById(id)
const canvas = el("screen")
const ctx = canvas.getContext("2d", {willReadFrequently: true})
let active

function draw(source, width, height) {
  canvas.width = width
  canvas.height = height
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, width, height)
  if (source) {
    const w = source.videoWidth || source.width
    const h = source.videoHeight || source.height
    const scale = Math.min(width / w, height / h)
    ctx.drawImage(source, (width - w * scale) / 2, (height - h * scale) / 2, w * scale, h * scale)
  } else {
    const colors = ["#fff", "#ff0", "#0ff", "#0f0", "#f0f", "#f00", "#00f", "#111"]
    colors.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.fillRect(i * width / 8, 0, width / 8, height)
    })
    ctx.fillStyle = "#18212e"
    ctx.fillRect(0, height * 0.67, width, height * 0.33)
    ctx.fillStyle = "#fff"
    ctx.font = "bold 28px system-ui"
    ctx.fillText("tscircuit", 22, height - 53)
    ctx.font = "16px system-ui"
    ctx.fillText("Flex display  /  480 × 320", 22, height - 23)
  }
  const rgba = ctx.getImageData(0, 0, width, height).data
  const bytes = new Uint8Array(width * height * 2)
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    bytes[j++] = (rgba[i] & 0xf8) | (rgba[i + 1] >> 5)
    bytes[j++] = ((rgba[i + 1] & 0x1c) << 3) | (rgba[i + 2] >> 3)
  }
  return bytes
}

export function enableDisplay(exchange, busy) {
  if (active) return
  const player = active = {stopped: false}
  el("display").hidden = false
  const file = el("media-file")
  const pattern = el("pattern")
  const stop = el("video-stop")
  file.value = ""
  file.disabled = pattern.disabled = false
  stop.disabled = true
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  el("media-state").textContent = "Choose an image or video, or send the test pattern."
  async function play(media) {
    if (active !== player || file.disabled) return
    busy(true)
    file.disabled = pattern.disabled = true
    player.stopped = false
    let video, bitmap, url
    try {
      el("media-state").textContent = "Preparing display…"
      if (media?.type.startsWith("video/")) {
        video = document.createElement("video")
        video.muted = true
        video.playsInline = true
        url = URL.createObjectURL(media)
        video.src = url
        await video.play()
        video.pause()
        video.currentTime = 0
      } else if (media) bitmap = await createImageBitmap(media)
      if (active !== player) return
      if (!player.initialized) {
        await exchange("init", "OK init")
        player.initialized = true
      }
      stop.disabled = !video
      let count = 0
      if (video) await video.play()
      do {
        if (active !== player || player.stopped) break
        const pixels = draw(video || bitmap, video ? 120 : 480, video ? 80 : 320)
        el("media-state").textContent = video ? "Playing · frame " + (count + 1) : "Sending image…"
        await exchange(video ? "video" : "image", "READY")
        await exchange(pixels, "OK frame")
        count++
      } while (video && !video.ended)
      if (active === player) el("media-state").textContent = video ? count + " video frames sent." : "Image sent to display."
    } catch (err) {
      if (active === player) el("media-state").textContent = err.message
    } finally {
      if (video) { video.pause(); video.removeAttribute("src"); video.load() }
      if (url) URL.revokeObjectURL(url)
      bitmap?.close()
      if (active === player) {
        file.disabled = pattern.disabled = false
        stop.disabled = true
        busy(false)
      }
    }
  }
  file.onchange = () => { const media = file.files[0]; file.value = ""; if (media) play(media) }
  pattern.onclick = () => play(null)
  stop.onclick = () => { player.stopped = true; stop.disabled = true }
}

export function hideDisplay() {
  active = undefined
  el("display").hidden = true
}
