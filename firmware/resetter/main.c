#include "pico/stdlib.h"
#include "pico/status_led.h"
#include "hardware/adc.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define PWR_CUT 18
static uint64_t restore_us;
static enum { LED_OFF, LED_ON, LED_AUTO } led_mode;

static unsigned millivolts(unsigned channel) {
    adc_select_input(channel);
    adc_read();
    unsigned total = 0;
    for (int i = 0; i < 16; i++) total += adc_read();
    // 3.3 V reference and 100k/150k divider.
    return (total * 5500u + 32760u) / 65520u;
}

static void status(void) {
    unsigned in = millivolts(0), out = millivolts(1);
    printf("OK out=%s vin=%u.%03u vout=%u.%03u\n", gpio_get_out_level(PWR_CUT) ? "off" : "on",
           in / 1000, in % 1000, out / 1000, out % 1000);
}

static void update_led(void) {
    unsigned color = led_mode == LED_ON ? 0x001000 : 0;
    if (led_mode == LED_AUTO) {
        if (millivolts(0) < 4000) color = 0x000008;
        else if (gpio_get_out_level(PWR_CUT)) color = 0x100000;
        else color = millivolts(1) >= 4000 ? 0x001000 : 0x100800;
    }
    static unsigned previous = ~0u;
    if (color != previous) {
        colored_status_led_set_on_with_color(color);
        previous = color;
    }
}

static void execute(char *line) {
    char *cmd = strtok(line, " \t");
    char *arg = strtok(NULL, " \t");
    if (!cmd) return;
    if (strtok(NULL, " \t")) { puts("ERR too many arguments"); return; }
    if (!strcmp(cmd, "cycle") || !strcmp(cmd, "reset")) {
        char *end;
        double seconds = arg ? strtod(arg, &end) : 1.0;
        if ((arg && *end) || !isfinite(seconds) || seconds < 0.01 || seconds > 60) {
            puts("ERR cycle duration is 0.01-60 seconds"); return;
        }
        gpio_put(PWR_CUT, true);
        restore_us = time_us_64() + (uint64_t)(seconds * 1000000);
        puts("OK cycling");
    } else if (!strcmp(cmd, "led")) {
        if (arg && !strcmp(arg, "on")) led_mode = LED_ON;
        else if (arg && !strcmp(arg, "off")) led_mode = LED_OFF;
        else if (arg && !strcmp(arg, "auto")) led_mode = LED_AUTO;
        else { puts("ERR led on|off|auto"); return; }
        update_led();
        printf("OK led=%s\n", arg);
    } else if (arg) puts("ERR unexpected argument");
    else if (!strcmp(cmd, "id")) puts("DEVICE tscircuit resetter 1.0.0");
    else if (!strcmp(cmd, "help") || !strcmp(cmd, "?"))
        puts("id | help | status | on | off | cycle [seconds=1] | reset [seconds=1] | led on|off|auto");
    else if (!strcmp(cmd, "status")) status();
    else if (!strcmp(cmd, "on") || !strcmp(cmd, "off")) {
        restore_us = 0;
        gpio_put(PWR_CUT, !strcmp(cmd, "off"));
        status();
    } else puts("ERR unknown command; try help");
}

int main(void) {
    gpio_init(PWR_CUT);
    gpio_put(PWR_CUT, false);
    gpio_set_dir(PWR_CUT, GPIO_OUT);
    adc_init();
    adc_gpio_init(26);
    adc_gpio_init(27);
    status_led_init();
    stdio_init_all();
    char line[80];
    unsigned used = 0;
    bool discard = false;
    uint64_t next_led = 0;
    for (;;) {
        uint64_t now = time_us_64();
        if (restore_us && now >= restore_us) {
            gpio_put(PWR_CUT, false);
            restore_us = 0;
        }
        if (now >= next_led) { update_led(); next_led = now + 100000; }
        int c = getchar_timeout_us(1000);
        if (c < 0) continue;
        if (c == '\r' || c == '\n') {
            if (discard) puts("ERR invalid or long command");
            else { line[used] = 0; execute(line); }
            used = 0;
            discard = false;
        } else if (c < 32 || c > 126 || used >= sizeof(line) - 1) discard = true;
        else if (!discard) line[used++] = c;
    }
}
