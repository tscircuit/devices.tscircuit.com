#include "tusb.h"
#include "pico/unique_id.h"
#include <string.h>

static const tusb_desc_device_t device = {
    .bLength = sizeof(device), .bDescriptorType = TUSB_DESC_DEVICE, .bcdUSB = 0x0200,
    .bDeviceClass = TUSB_CLASS_MISC, .bDeviceSubClass = MISC_SUBCLASS_COMMON,
    .bDeviceProtocol = MISC_PROTOCOL_IAD, .bMaxPacketSize0 = CFG_TUD_ENDPOINT0_SIZE,
    .idVendor = 0x2e8a, .idProduct = 0x000a, .bcdDevice = 0x0100,
    .iManufacturer = 1, .iProduct = 2, .iSerialNumber = 3, .bNumConfigurations = 1
};
static const uint8_t config[] = {
    TUD_CONFIG_DESCRIPTOR(1, 2, 0, TUD_CONFIG_DESC_LEN + TUD_CDC_DESC_LEN, 0, 100),
    TUD_CDC_DESCRIPTOR(0, 0, 0x81, 8, 0x02, 0x82, 64)
};
uint8_t const *tud_descriptor_device_cb(void) { return (const uint8_t *)&device; }
uint8_t const *tud_descriptor_configuration_cb(uint8_t index) { return index == 0 ? config : NULL; }
uint16_t const *tud_descriptor_string_cb(uint8_t index, uint16_t lang) {
    static uint16_t out[32];
    char serial[2 * PICO_UNIQUE_BOARD_ID_SIZE_BYTES + 1];
    if (index == 0) { out[0] = 0x0304; out[1] = 0x0409; return out; }
    pico_get_unique_board_id_string(serial, sizeof(serial));
    const char *names[] = {NULL, "tscircuit", "tscircuit USB Resetter", serial};
    if (index >= sizeof(names) / sizeof(names[0])) return NULL;
    size_t n = strlen(names[index]);
    out[0] = (TUSB_DESC_STRING << 8) | (2 + 2 * n);
    for (size_t i = 0; i < n; i++) out[i + 1] = names[index][i];
    return out;
}
