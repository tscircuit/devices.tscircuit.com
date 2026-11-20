// CH552E, 24 MHz internal. P1.4 drives the buzzer MOSFET, P1.5 sinks the LED.
#include "src/userUsbCdc/USBCDC.h"
#include "frame.h"
#include <string.h>

extern __xdata volatile uint8_t UsbConfig;
static __xdata char line[40];
static uint8_t used;
static bool discard;
static uint32_t started, lastByte;
static uint16_t duration;

static void beep(uint16_t ms) {
  started = millis();
  duration = ms;
  P1_4 = ms != 0;
}

static void reply(const char *message) {
  while (*message) USBSerial_write(*message++);
  USBSerial_write('\r');
  USBSerial_write('\n');
  USBSerial_flush();
}

static void command(void) {
  uint16_t ms = 0;
  uint8_t i;
  if (!strcmp(line, "id")) reply("DEVICE tscircuit buzzer 1.0.0");
  else if (!strcmp(line, "help") || !strcmp(line, "?"))
    reply("id | help | beep [0-10000 ms, default 250] | stop | status | led on | led off");
  else if (!strcmp(line, "status")) reply(duration ? "STATUS buzzing" : "STATUS idle");
  else if (!strcmp(line, "led on") || !strcmp(line, "led off")) {
    P1_5 = !strcmp(line, "led off");
    reply("OK");
  } else if (!strcmp(line, "stop") || !strcmp(line, "beep")) {
    beep(line[0] == 's' ? 0 : 250);
    reply("OK");
  } else if (!strncmp(line, "beep ", 5) && line[5]) {
    for (i = 5; line[i]; i++) {
      if (line[i] < '0' || line[i] > '9' || ms > 1000) break;
      ms = ms * 10 + (line[i] - '0');
    }
    if (line[i] || ms > 10000) reply("ERR duration must be 0-10000 ms");
    else { beep(ms); reply("OK"); }
  } else reply("ERR unknown command; try help");
}

static void receive(uint8_t b) {
  if (state || b == 0xa5) {
    used = 0;
    discard = false;
    uint8_t result = frame_byte(b);
    if (!result) return;
    uint8_t status = result == 1 ? 4 : result;
    if (result == 1 && opcode == 0x10 && length == 2) {
      uint16_t ms = payload[0] | ((uint16_t)payload[1] << 8);
      if (ms <= 10000) { beep(ms); status = 0; }
    }
    if (result == 1 && opcode == 0x20 && length == 1 && payload[0] <= 1) {
      P1_5 = !payload[0];
      status = 0;
    }
    USBSerial_write(0xac);
    USBSerial_write(sequence);
    USBSerial_write(status);
    USBSerial_flush();
  } else if (b == '\n' || b == '\r') {
    if (discard) reply("ERR invalid or long line");
    else if (used) { line[used] = 0; command(); }
    used = 0;
    discard = false;
  } else if (b < 32 || b > 126 || used >= sizeof(line) - 1) discard = true;
  else if (!discard) line[used++] = b;
}

void setup() {
  P1_5 = 1;
  pinMode(15, OUTPUT);
  P1_4 = 0;
  pinMode(14, OUTPUT);
  USBInit();
}

void loop() {
  if (!UsbConfig || (USB_MIS_ST & bUMS_SUSPEND)) {
    P1_5 = 1;
    P1_4 = 0;
    duration = 0;
    used = 0;
    discard = false;
    frame_reset();
    if (USB_MIS_ST & bUMS_SUSPEND) {
      SAFE_MOD = 0x55; SAFE_MOD = 0xaa; WAKE_CTRL = bWAK_BY_USB; SAFE_MOD = 0;
      if (USB_MIS_ST & bUMS_SUSPEND) PCON |= PD;
      SAFE_MOD = 0x55; SAFE_MOD = 0xaa; WAKE_CTRL = 0; SAFE_MOD = 0;
    }
    return;
  }
  if (duration && (uint32_t)(millis() - started) >= duration) beep(0);
  if (state && (uint32_t)(millis() - lastByte) > 250) frame_reset();
  if (USBSerial_available()) {
    lastByte = millis();
    receive((uint8_t)USBSerial_read());
  }
}
