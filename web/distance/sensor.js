// CH341T I²C stream commands. This board connects the VL53L0X at 7-bit address 0x29.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export class DistanceSensor {
  constructor(device) {
    this.device = device
  }

  async packet(bytes) {
    const result = await this.device.transferOut(2, Uint8Array.from(bytes))
    if (result.status !== "ok" || result.bytesWritten !== bytes.length)
      throw new Error("Incomplete CH341T USB write.")
  }

  async write(register, ...values) {
    await this.packet([0xaa, 0x74, 0x80 | (2 + values.length), 0x52, register, ...values, 0x75, 0])
  }

  async read(register, count = 1) {
    // Repeated START for the read address. ACK intermediate bytes, NACK the last.
    const ack = count > 1 ? [0xc0 | (count - 1)] : []
    await this.packet([0xaa, 0x74, 0x82, 0x52, register, 0x74, 0x81, 0x53, ...ack, 0xc0, 0x75, 0])
    const {status, data} = await this.device.transferIn(2, count)
    if (status !== "ok" || data?.byteLength !== count) throw new Error("Incomplete CH341T USB read.")
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  }

  async byte(register) { return (await this.read(register))[0] }

  async sequence(pairs) {
    for (const [register, value] of pairs) await this.write(register, value)
  }

  async wait(register, mask, wantSet = true) {
    const deadline = performance.now() + 1000
    do {
      if (Boolean((await this.byte(register)) & mask) === wantSet) return
      await delay(5)
    } while (performance.now() < deadline)
    throw new Error("VL53L0X timed out. Reconnect the board and try again.")
  }

  // Initialization and reference SPAD calibration adapted from Pololu's
  // VL53L0X driver (9f3773c). See LICENSE-vl53l0x.txt for Pololu and ST notices.
  async initialize() {
    await this.packet([0xaa, 0x61, 0]) // standard-mode I²C
    if (await this.byte(0xc0) !== 0xee) throw new Error("No VL53L0X identified on this adapter.")
    await this.write(0x89, (await this.byte(0x89)) | 1)
    await this.sequence([[0x88,0], [0x80,1], [0xff,1], [0,0]])
    this.stopVariable = await this.byte(0x91)
    await this.sequence([[0,1], [0xff,0], [0x80,0]])
    await this.write(0x60, (await this.byte(0x60)) | 0x12)
    await this.write(0x44, 0, 0x20)
    await this.write(1, 0xff)
    await this.configureSpads()
    await this.sequence(tuning)
    await this.write(0x0a, 4)
    await this.write(0x84, (await this.byte(0x84)) & ~0x10)
    await this.write(0x0b, 1)
    for (const [sequence, start] of [[1,0x41], [2,1]]) {
      await this.sequence([[1,sequence], [0,start]])
      await this.wait(0x13, 7)
      await this.sequence([[0x0b,1], [0,0]])
    }
    await this.write(1, 0xe8)
  }

  async configureSpads() {
    await this.sequence([[0x80,1], [0xff,1], [0,0], [0xff,6]])
    await this.write(0x83, (await this.byte(0x83)) | 4)
    await this.sequence([[0xff,7], [0x81,1], [0x80,1], [0x94,0x6b], [0x83,0]])
    await this.wait(0x83, 0xff)
    await this.write(0x83, 1)
    const info = await this.byte(0x92)
    await this.sequence([[0x81,0], [0xff,6]])
    await this.write(0x83, (await this.byte(0x83)) & ~4)
    await this.sequence([[0xff,1], [0,1], [0xff,0], [0x80,0]])
    const map = await this.read(0xb0, 6)
    const first = info & 0x80 ? 12 : 0
    let enabled = 0
    for (let i = 0; i < 48; i++) {
      const mask = 1 << (i % 8)
      if (i < first || enabled === (info & 0x7f)) map[i >> 3] &= ~mask
      else if (map[i >> 3] & mask) enabled++
    }
    await this.sequence([[0xff,1], [0x4f,0], [0x4e,0x2c], [0xff,0], [0xb6,0xb4]])
    await this.write(0xb0, ...map)
  }

  async sample() {
    await this.sequence([[0x80,1], [0xff,1], [0,0], [0x91,this.stopVariable], [0,1], [0xff,0], [0x80,0], [0,1]])
    await this.wait(0, 1, false)
    await this.wait(0x13, 7)
    const frame = await this.read(0x14, 12)
    await this.write(0x0b, 1)
    return {mm: (frame[10] << 8) | frame[11], status: (frame[0] >> 3) & 15}
  }
}

const tuning = [
  [0xff, 0x01], [0x00, 0x00], [0xff, 0x00], [0x09, 0x00], [0x10, 0x00],
  [0x11, 0x00], [0x24, 0x01], [0x25, 0xff], [0x75, 0x00], [0xff, 0x01],
  [0x4e, 0x2c], [0x48, 0x00], [0x30, 0x20], [0xff, 0x00], [0x30, 0x09],
  [0x54, 0x00], [0x31, 0x04], [0x32, 0x03], [0x40, 0x83], [0x46, 0x25],
  [0x60, 0x00], [0x27, 0x00], [0x50, 0x06], [0x51, 0x00], [0x52, 0x96],
  [0x56, 0x08], [0x57, 0x30], [0x61, 0x00], [0x62, 0x00], [0x64, 0x00],
  [0x65, 0x00], [0x66, 0xa0], [0xff, 0x01], [0x22, 0x32], [0x47, 0x14],
  [0x49, 0xff], [0x4a, 0x00], [0xff, 0x00], [0x7a, 0x0a], [0x7b, 0x00],
  [0x78, 0x21], [0xff, 0x01], [0x23, 0x34], [0x42, 0x00], [0x44, 0xff],
  [0x45, 0x26], [0x46, 0x05], [0x40, 0x40], [0x0e, 0x06], [0x20, 0x1a],
  [0x43, 0x40], [0xff, 0x00], [0x34, 0x03], [0x35, 0x44], [0xff, 0x01],
  [0x31, 0x04], [0x4b, 0x09], [0x4c, 0x05], [0x4d, 0x04], [0xff, 0x00],
  [0x44, 0x00], [0x45, 0x20], [0x47, 0x08], [0x48, 0x28], [0x67, 0x00],
  [0x70, 0x04], [0x71, 0x01], [0x72, 0xfe], [0x76, 0x00], [0x77, 0x00],
  [0xff, 0x01], [0x0d, 0x01], [0xff, 0x00], [0x80, 0x01], [0x01, 0xf8],
  [0xff, 0x01], [0x8e, 0x01], [0x00, 0x01], [0xff, 0x00], [0x80, 0x00],
]
