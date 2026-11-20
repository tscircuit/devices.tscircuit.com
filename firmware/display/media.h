// 120 x 80 video frames expand fourfold into the LCD's 480 x 320 GRAM.
// Full-resolution images stream directly; the MCU stores only one video row.
#include <string.h>
static __xdata uint8_t videoRow[240];
static __xdata char line[24];
static uint8_t used, overflow, videoMode, rowBytes;
static uint32_t remaining;
static void say(const char *s) {
  while (*s) USBSerial_write(*s++);
  USBSerial_write('\n');
  USBSerial_flush();
}
static void window(void) {
  lcd_command(0x2a); lcd_write(0); lcd_write(0); lcd_write(1); lcd_write(0xdf);
  lcd_command(0x2b); lcd_write(0); lcd_write(0); lcd_write(1); lcd_write(0x3f);
  lcd_command(0x2c);
}
static void initPanel(void) {
  uint8_t i = 0, count;
  lcd_reset();
  while (i < sizeof(panelSettings)) {
    lcd_command(panelSettings[i++]);
    count = panelSettings[i++];
    while (count--) lcd_write(panelSettings[i++]);
  }
  lcd_command(0x11); delay(150);
  lcd_command(0x21); lcd_command(0x29); delay(50);
}
static void pixels(uint8_t b) {
  uint8_t x, y, k, hi, lo;
  if (!videoMode) lcd_write(b);
  else {
    videoRow[rowBytes++] = b;
    if (rowBytes == sizeof(videoRow)) {
      rowBytes = 0;
      for (y = 0; y < 4; y++) {
        for (x = 0; x < sizeof(videoRow); x += 2) {
          hi = videoRow[x]; lo = videoRow[x + 1];
          for (k = 0; k < 4; k++) { lcd_write(hi); lcd_write(lo); }
        }
      }
    }
  }
  if (--remaining == 0) { P3_4 = 1; say("OK frame"); }
}
static void textByte(uint8_t b) {
  if (b != '\r' && b != '\n') {
    if (b < 32 || b > 126 || used >= sizeof(line)-1) overflow = 1;
    else line[used++] = b;
    return;
  }
  if (!used && !overflow) return;
  line[used] = 0;
  if (overflow) say("ERR invalid command");
  else if (!strcmp(line, "id")) say("DEVICE tscircuit display 1.0.0");
  else if (!strcmp(line, "help")) say("id | init | image (480x320 RGB565 BE) | video (120x80 RGB565 BE); wait READY then send pixels");
  else if (!strcmp(line, "init")) { initPanel(); say("OK init"); }
  else if (!strcmp(line, "image") || !strcmp(line, "video")) {
    if (sleeping) say("ERR init required");
    else {
      videoMode = line[0] == 'v'; rowBytes = 0;
      remaining = videoMode ? 19200UL : 307200UL;
      window(); say("READY");
    }
  } else say("ERR unknown command");
  used = overflow = 0;
}
