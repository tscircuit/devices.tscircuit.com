// RK09K1130D62 wiper on P1.4; 8-bit ADC referenced to VCC.
#include "src/userUsbCdc/USBCDC.h"
#include <string.h>
extern __xdata volatile uint8_t UsbConfig;
static __xdata char line[24];
static uint8_t used, invalid, raw, count, last, reported;
static uint16_t total;
static uint32_t sampled, sent;

static void command(void) {
  line[used] = 0;
  if (invalid) { USBSerial_println("ERR invalid command"); }
  else if (!strcmp(line,"id")) { USBSerial_println("DEVICE tscircuit potentiometer 1.0.0"); }
  else if (!strcmp(line,"help")) { USBSerial_println("id | help | status | led on | led off; streams position 0-255"); }
  else if (!strcmp(line,"status")) reported = 0;
  else if (!strcmp(line,"led on")) { P1_5=0; USBSerial_println("OK led=on"); }
  else if (!strcmp(line,"led off")) { P1_5=1; USBSerial_println("OK led=off"); }
  else if (used) { USBSerial_println("ERR unknown command"); }
  used = invalid = 0;
}

void setup() {
  P1_5=1; pinMode(15,OUTPUT);
  pinMode(14,INPUT);
  USBInit();
}
void loop() {
  uint32_t now = millis();
  if (!UsbConfig || (USB_MIS_ST & bUMS_SUSPEND)) {
    P1_5=1; used=invalid=reported=count=0; total=0; return;
  }
  while (USBSerial_available()) {
    uint8_t b=USBSerial_read();
    if (b=='\n' || b=='\r') command();
    else if (b<32 || b>126 || used>=sizeof(line)-1) invalid=1;
    else line[used++]=b;
  }
  if (now-sampled < 2) return;
  sampled=now; total+=analogRead(14);
  if (++count < 8) return;
  raw=(total+4)/8; total=0; count=0;
  if (!USBSerial() || (reported && raw==last && now-sent<250)) return;
  USBSerial_print("{\"module\":\"position\",\"raw\":"); USBSerial_print(raw);
  USBSerial_print(",\"max\":255,\"uptime_ms\":"); USBSerial_print(now);
  USBSerial_print(",\"led\":"); USBSerial_print((uint8_t)!P1_5); USBSerial_println("}");
  last=raw; sent=now; reported=1;
}
