// USB-C ILI9488 8080 adapter. CH552T, 3.3 V, 16 MHz internal clock.
// P1[7:0]=D[7:0], P3.2=WR, P3.3=DC, P3.1=RESET, P3.4=backlight.
#include "src/userUsbCdc/USBCDC.h"
#include "frame.h"
extern __xdata volatile uint8_t UsbConfig;
static uint32_t lastByte;
static uint8_t sleeping=1;
static uint8_t brightness = 100;
static uint8_t frameVisible;

static void driveBacklight(uint8_t level) {
  if (level == 0 || level == 100) {
    P3_4 = level == 100;
    PWM_CTRL &= ~bPWM2_OUT_EN;
  } else {
    PWM_DATA2 = ((uint16_t)level * 256 + 50) / 100;
    PWM_CTRL |= bPWM2_OUT_EN;
  }
}
static void blankBacklight(void) {
  frameVisible = 0;
  driveBacklight(0);
}
static void lcd_write(uint8_t b){P1=b;P3_2=0;__asm__("nop\n nop\n");P3_2=1;}
static void lcd_command(uint8_t b){P3_3=0;lcd_write(b);P3_3=1;}
static void lcd_reset(void){blankBacklight();P3_1=0;delay(20);P3_1=1;delay(150);sleeping=0;}
static const __code uint8_t panelSettings[] = {
  0xe0, 0xf, 0x0, 0x3, 0x9, 0x8, 0x16, 0xa, 0x3f, 0x78, 0x4c, 0x9, 0xa, 0x8, 0x16, 0x1a, 0xf,
  0xe1, 0xf, 0x0, 0x16, 0x19, 0x3, 0xf, 0x5, 0x32, 0x45, 0x46, 0x4, 0xe, 0xd, 0x35, 0x37, 0xf,
  0xc0, 0x2, 0x17, 0x15,
  0xc1, 0x1, 0x41,
  0xc5, 0x3, 0x0, 0x12, 0x80,
  0x36, 0x1, 0x28,
  0x3a, 0x1, 0x55,
  0xb0, 0x1, 0x0,
  0xb1, 0x1, 0xa0,
  0xb4, 0x1, 0x2,
  0xb6, 0x2, 0x2, 0x2,
  0xe9, 0x1, 0x0,
  0xf7, 0x4, 0xa9, 0x51, 0x2c, 0x82,
};
#include "media.h"
static void reply(uint8_t status){USBSerial_write(0xac);USBSerial_write(sequence);USBSerial_write(status);USBSerial_flush();}
static uint8_t execute(void){
 uint8_t i;
 if(opcode==0x20 && length==1 && payload[0]<=1){P3_5=!payload[0];return 0;}
 if(opcode==1 && length==0){lcd_reset();return 0;}
 if(sleeping)return 5;
 if(opcode==2 && length>=1){lcd_command(payload[0]);for(i=1;i<length;i++)lcd_write(payload[i]);return 0;}
 if(opcode==3 && length>=1){for(i=0;i<length;i++)lcd_write(payload[i]);return 0;}
 if(opcode==4 && length==1 && payload[0]<=1){frameVisible=payload[0];driveBacklight(frameVisible ? brightness : 0);return 0;}
 return 4;
}
void setup(){
 P3_5=1;P3_4=0;P3_2=1;P3_3=1;P3_1=0;P1=0;
 P1_MOD_OC=0;P1_DIR_PU=0xff;
 P3_MOD_OC&=~0x3e;P3_DIR_PU|=0x3e;
 PIN_FUNC &= ~bPWM2_PIN_X; // PWM2 uses P3.4
 PWM_CK_SE = 16;
 USBInit();
}
void loop(){
 uint8_t result;
 if(USB_MIS_ST & bUMS_SUSPEND){
  remaining=0;used=overflow=0;P3_5=1;blankBacklight();if(!sleeping){lcd_command(0x28);lcd_command(0x10);sleeping=1;}frame_reset();
  SAFE_MOD=0x55;SAFE_MOD=0xaa;WAKE_CTRL=bWAK_BY_USB;SAFE_MOD=0;
  if(USB_MIS_ST & bUMS_SUSPEND)PCON|=PD;
  SAFE_MOD=0x55;SAFE_MOD=0xaa;WAKE_CTRL=0;SAFE_MOD=0;
  return;
 }
 if(!UsbConfig){remaining=0;used=overflow=0;P3_5=1;blankBacklight();P3_1=0;sleeping=1;frame_reset();return;}
 if(state && (uint32_t)(millis()-lastByte)>250)frame_reset();
 if(remaining && (uint32_t)(millis()-lastByte)>3000){remaining=0;say("ERR frame timeout");}
 if(USBSerial_available()) lastByte=millis();
 while(USBSerial_available()){
  uint8_t b=(uint8_t)USBSerial_read();
  if(remaining){pixels(b);continue;}
  if(!state && b!=0xa5){textByte(b);continue;}
  result=frame_byte(b);
  if(result==1)reply(execute());else if(result)reply(result);
 }
}
