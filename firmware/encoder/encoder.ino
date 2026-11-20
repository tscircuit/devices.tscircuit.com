#include "src/userUsbCdc/USBCDC.h"
#include <string.h>
extern __xdata volatile uint8_t UsbConfig;
static __xdata char line[24];
static uint8_t used, invalid, reported;
static void command(void) {
  line[used] = 0;
  if (invalid) { USBSerial_println("ERR invalid command"); }
  else if (!strcmp(line,"id")) { USBSerial_println("DEVICE tscircuit encoder 1.0.0"); }
  else if (!strcmp(line,"help")) { USBSerial_println("id | help | status | led on | led off; streams detent count and push state"); }
  else if (!strcmp(line,"status")) reported = 0;
  else if (!strcmp(line,"led on")) { P1_5=0; USBSerial_println("OK led=on"); }
  else if (!strcmp(line,"led off")) { P1_5=1; USBSerial_println("OK led=off"); }
  else if (used) { USBSerial_println("ERR unknown command"); }
  used = invalid = 0;
}

// CH552E: A=P1.4, B=P1.6, encoder push=P1.7. 30 detents / 15 pulses.
volatile uint32_t position = 0;
volatile uint16_t invalidTransitions = 0;
volatile uint8_t pressed = 0;
uint8_t previousAB, candidatePush, pushTicks;
int8_t partial = 0;
const int8_t transitions[16] = {0,-1,1,0, 1,0,0,-1, -1,0,0,1, 0,1,-1,0};
uint8_t readAB(void) { uint8_t p=P1; return ((p>>4)&1)|((p>>5)&2); }
void Timer2Interrupt(void) __interrupt(INT_NO_TMR2) {
  uint8_t ab, push;
  TF2=0;
  ab=readAB();
  if ((ab^previousAB)==3) { partial=0; invalidTransitions++; }
  else {
    partial+=transitions[(previousAB<<2)|ab];
    if(partial>=2) { position++; partial=0; }
    if(partial<=-2) { position--; partial=0; }
  }
  previousAB=ab;
  push=(P1&0x80)?0:1;
  if(push!=candidatePush) {candidatePush=push;pushTicks=0;}
  else if(pushTicks<80) {pushTicks++;if(pushTicks==80)pressed=push;}
}
void setup() { P1_5=1;pinMode(15,OUTPUT);
  pinMode(14, INPUT_PULLUP); pinMode(16, INPUT_PULLUP); pinMode(17, INPUT_PULLUP);
  previousAB=readAB(); candidatePush=(P1&0x80)?0:1; pushTicks=0;
  // 24 MHz / 12 / 500 = 4 kHz. Timer0 remains available to millis().
  T2CON=0; T2MOD &= ~bT2_CLK;
  RCAP2L=(65536UL-500)&255; RCAP2H=(65536UL-500)>>8;
  TL2=RCAP2L; TH2=RCAP2H; ET2=1; TR2=1;
  USBInit();
}
void loop() {
  if (!UsbConfig || (USB_MIS_ST & bUMS_SUSPEND)) {
    P1_5=1; used=invalid=reported=0; return;
  }
  while (USBSerial_available()) {
    uint8_t b=USBSerial_read();
    if (b=='\n' || b=='\r') command();
    else if (b<32 || b>126 || used>=sizeof(line)-1) invalid=1;
    else line[used++]=b;
  }
  static uint32_t lastTime=0, lastPosition=0;
  static uint16_t lastInvalid=0;
  static uint8_t lastPressed=255;
  uint32_t now=millis(), count;
  uint16_t errors;
  uint8_t push, savedEA;
  if(now-lastTime<20) return;
  savedEA=EA; EA=0; count=position;errors=invalidTransitions;push=pressed;EA=savedEA;
  if(!USBSerial()) return;
  if(reported && count==lastPosition && push==lastPressed && errors==lastInvalid && now-lastTime<250)return;
  USBSerial_print("{\"module\":\"dial\",\"count\":");USBSerial_print(count);
  USBSerial_print(",\"pressed\":");USBSerial_print(push);
  USBSerial_print(",\"invalid\":");USBSerial_print(errors);
  USBSerial_print(",\"uptime_ms\":");USBSerial_print(now);USBSerial_print(",\"led\":");USBSerial_print((uint8_t)!P1_5);USBSerial_println("}");
  lastTime=now;lastPosition=count;lastPressed=push;lastInvalid=errors;reported=1;
}
