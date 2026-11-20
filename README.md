# tscircuit USB devices

Open [devices.tscircuit.com](https://devices.tscircuit.com) in desktop Chrome or Edge. Plug in a board, click **Connect device**, and select **tscircuit Buzzer**. The page queries its identity and shows the matching controls. The buzzer has a fixed pitch of approximately 2.8 kHz.

## Flex display

With power disconnected, seat the non-touch BuyDisplay ER-TFT035IPS-6 ribbon in the matching 50-pin connector. On the [device console](https://devices.tscircuit.com), select **Connect device → tscircuit Flex Display**. Choose **Test pattern**, or select a local image or browser-supported video. Media is decoded in your browser and letterboxed on the panel. Still images use 480 × 320 RGB565. Video samples the current playback position after each acknowledged frame and expands 120 × 80 RGB565 to the full panel, without audio. Stop video leaves the last complete frame displayed.

The CH552T adapter runs CH55xDuino 0.0.26 at 16 MHz. To rebuild with the same core as the buzzer, use `arduino-cli compile --fqbn CH55xDuino:mcs51:ch552:clock=16internal,usb_settings=user148,bootloader_pin=p36 --output-dir build/display firmware/display`. Flash `firmware/releases/display-1.0.0.hex` with wchisp in WCH bootloader mode. Panel wiring, LCD initialization and legacy framed CDC commands are based on [basic-usbc-devices](https://github.com/tscircuit/basic-usbc-devices/tree/main/firmware/display).

Serial commands include `id`, `help`, and `init`. After `OK init`, send `image` or `video` followed by LF. Wait for `READY`, send exactly 307200 or 19200 bytes respectively (big-endian RGB565 in row order), then wait for `OK frame` before the next command. The backlight turns on after the first complete frame.

## USB resetter

Connect the control port, click **Connect device**, and choose **tscircuit USB Resetter**. The serial console supports `id`, `help`, `status`, `off`, `on`, `cycle [seconds]` (alias `reset`), and `led on|off|auto`. A cycle defaults to one second and restores output on the board's timer. Explicit on/off commands cancel a pending cycle. Power passthrough starts enabled and the RGB indicator starts off. The separate passthrough input powers the downstream load. Status reports the switch command and both sensed voltages.

To reflash, connect the control port in BOOTSEL mode and copy `firmware/releases/resetter-1.0.0.uf2` to RPI-RP2. To rebuild, set `PICO_SDK_PATH` to Raspberry Pi Pico SDK 2.3.1 (with submodules), then run `cmake -S firmware/resetter -B build/resetter -DPICO_BOARD=pico` and `cmake --build build/resetter`.

## Distance sensor

Open the [distance sensor page](https://devices.tscircuit.com/distance/) in desktop Chrome or Edge, choose **Connect sensor**, then select the CH341 adapter. The board uses a fixed-function CH341T bridge (1a86:5512). Its WebUSB driver probes the VL53L0X model ID at I²C address 0x29, configures the reference SPADs, performs reference calibrations and requests individual measurements. Configuration is applied each connection. There is no flashable MCU on this board.

The page shows millimeters for completed measurements (device status 11) and flags results outside the board’s 30–300 mm working window. Invalid results clear the numeric display. See **Sensor help** on the page for usage. The driver and its third-party notices are in `web/distance/`.

## Buzzer serial commands

Open the USB CDC port at 115200 baud with DTR enabled. Send ASCII commands terminated by LF or CRLF. Responses end in CRLF.

| Command | Result |
| --- | --- |
| `id` | `DEVICE tscircuit buzzer 1.1.0` |
| `help` or `?` | Lists available commands |
| `beep` or `beep 250` | Sounds for 250 ms. Accepts 0–10000 ms |
| `tone 440 750` | Switches buzzer power at 440 Hz for 750 ms, with 50% duty cycle. Range 20–2000 Hz and 1–10000 ms. |
| `stop` | Silences the buzzer immediately |
| `status` | Reports buzzing or idle |
| `led on` / `led off` | Sets the status LED |

On firmware 1.1.0, enter a frequency under **Modulation (Hz)** to gate the buzzer using Timer 2, or leave it blank for a steady beep. A microphone test at 220, 440, and 880 Hz showed a dominant acoustic peak near 3.01 kHz at all three settings, with sidebands spaced by the selected frequency.

The MCU times each beep. A new beep replaces the current timer. The original [binary buzzer and LED protocol](https://github.com/tscircuit/basic-usbc-devices/tree/main/firmware) is also supported.

## Firmware

The [board design](https://tscircuit.com/seveibar/basic-usbc-devices#files) uses a CH552E at 24 MHz. The buzzer MOSFET is on P1.4 and the active-low status LED is on P1.5. The USB CDC source and frame decoder come from [basic-usbc-devices](https://github.com/tscircuit/basic-usbc-devices/tree/main/firmware/buzzer).

Install Arduino CLI and CH55xDuino, then build from the repository root:

```sh
index=https://raw.githubusercontent.com/DeqingSun/ch55xduino/ch55xduino/package_ch55xduino_mcs51_index.json
arduino-cli core update-index --additional-urls "$index"
arduino-cli core install CH55xDuino:mcs51@0.0.26 --additional-urls "$index"
arduino-cli compile --fqbn CH55xDuino:mcs51:ch552:clock=24internal,usb_settings=user148,bootloader_pin=p36 --output-dir build firmware/buzzer
```

To flash the included image, bridge TP1 and TP2 while plugging the buzzer in, then release the bridge. Run `wchisp info` to check that the bootloader reports CH552, followed by `wchisp flash firmware/releases/buzzer-1.1.0.hex`. It restarts as a USB serial port.

## Website

The static Web Serial client lives in `web/`. Serve locally with `python3 -m http.server 8000 --directory web` and open http://localhost:8000. Vercel serves this directory over HTTPS. The linked GitHub repository deploys main to production and branches to previews.
