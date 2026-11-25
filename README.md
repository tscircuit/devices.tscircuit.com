# tscircuit USB devices

Open [devices.tscircuit.com](https://devices.tscircuit.com) in desktop Chrome or Edge. Choose **Add device**, pick the device type, then select the board in the browser picker. Each board has an independent card. Cards stay in this browser until removed, including when their boards are unplugged. Previously authorized, available devices reconnect on page load where the browser permits it. Use **Connect** on a saved card to choose its board again. Multiple saved boards of the same type may require manual selection after reload because the browser can omit unique serial numbers.

## Rotary encoder

Choose **Add device → Rotary encoder**. The EC11E dial reports signed detents relative to power-up and the debounced push-button state. Its CH552E samples quadrature A/B on P1.4/P1.6 and the button on P1.7 at 4 kHz. It supports `id`, `help`, `status`, and `led on|off`. The decoder and dial JSON report format are adapted from [basic-usbc-devices](https://github.com/tscircuit/basic-usbc-devices/tree/main/firmware/dial).

Build with the same CH552E settings as the potentiometer, using the `firmware/encoder` sketch. Flash `firmware/releases/encoder-1.0.0.hex` in WCH bootloader mode.

## Potentiometer

Choose **Add device → Potentiometer**. The CH552E measures the 10 kΩ linear pot on P1.4 and reports its eight-sample averaged 8-bit ADC value and normalized percentage. The serial protocol provides `id`, `help`, `status`, `led on` and `led off`. Readings are streamed as JSON compatible with the board's position reader.

Build with CH55xDuino 0.0.26 using `arduino-cli compile --fqbn CH55xDuino:mcs51:ch552:clock=24internal,usb_settings=user148,bootloader_pin=p36 --output-dir build/potentiometer firmware/potentiometer`. Flash `firmware/releases/potentiometer-1.0.0.hex` in WCH bootloader mode.

## Flex display

With power disconnected, seat the non-touch BuyDisplay ER-TFT035IPS-6 ribbon in the matching 50-pin connector. On the [device console](https://devices.tscircuit.com), select **Add device → Flex display**. Choose **Test pattern**, or select a local image or browser-supported video. Media is decoded in your browser and letterboxed on the panel. Still images use 480 × 320 RGB565. Video samples the current playback position after each acknowledged frame and expands 120 × 80 RGB565 to the full panel, without audio. Stop video leaves the last complete frame displayed. Firmware 1.1.0 supports a 0–100% hardware backlight slider, including during playback. The serial command `brightness` reads the setting and `brightness 50` sets 50%.

The CH552T adapter runs CH55xDuino 0.0.26 at 16 MHz. To rebuild with the same core as the buzzer, use `arduino-cli compile --fqbn CH55xDuino:mcs51:ch552:clock=16internal,usb_settings=user148,bootloader_pin=p36 --output-dir build/display firmware/display`. Flash `firmware/releases/display-1.1.0.hex` with wchisp in WCH bootloader mode. Panel wiring, LCD initialization and legacy framed CDC commands are based on [basic-usbc-devices](https://github.com/tscircuit/basic-usbc-devices/tree/main/firmware/display).

Serial commands include `id`, `help`, and `init`. After `OK init`, send `image` or `video` followed by LF. Wait for `READY`, send exactly 307200 or 19200 bytes respectively (big-endian RGB565 in row order), then wait for `OK frame` before the next command. The backlight turns on after the first complete frame.

## USB resetter

Connect the control port, choose **Add device → USB resetter**, and select the board. The serial console supports `id`, `help`, `status`, `off`, `on`, `cycle [seconds]` (alias `reset`), and `led on|off|auto`. A cycle defaults to one second and restores output on the board's timer. Explicit on/off commands cancel a pending cycle. Power passthrough starts enabled and the RGB indicator starts off. The separate passthrough input powers the downstream load. Status reports the switch command and both sensed voltages.

To reflash, hold BOOTSEL while connecting the control port. Copy `firmware/releases/compact-resetter-2.0.0.uf2` to RPI-RP2 for the 36 × 30 mm board with three adjacent LEDs. The original 42 × 42 mm board uses `firmware/releases/resetter-1.0.0.uf2`. To rebuild, set `PICO_SDK_PATH` to Raspberry Pi Pico SDK 2.3.1 (with submodules), then run `cmake -S firmware/resetter -B build/resetter -DPICO_BOARD=pico` and `cmake --build build/resetter`.

## Distance sensor

Choose **Add device → Distance sensor** and select the CH341 adapter. Its live reading and graph appear alongside the other devices. The board uses a fixed-function CH341T bridge (1a86:5512). Its WebUSB driver probes the VL53L0X model ID at I²C address 0x29, configures the reference SPADs, performs reference calibrations and requests individual measurements. Configuration is applied each connection. There is no flashable MCU on this board.

The page shows millimeters for completed measurements (device status 11) and flags results outside the board’s 30–300 mm working window. Invalid results clear the numeric display. See **Sensor help** on the page for usage. The driver and its third-party notices are in `web/distance/`.

## Buzzer serial commands

Open the USB CDC port at 115200 baud with DTR enabled. Send ASCII commands terminated by LF or CRLF. Responses end in CRLF.

| Command | Result |
| --- | --- |
| `id` | `DEVICE tscircuit buzzer 2.0.0` |
| `help` or `?` | Lists available commands |
| `beep` or `beep 250` | Sounds for 250 ms. Accepts 0–10000 ms |
| `tone 440 750` | Plays a 440 Hz tone for 750 ms. Range 20–4000 Hz and 1–10000 ms. |
| `stop` | Silences the buzzer immediately |
| `status` | Reports buzzing or idle |
| `led on` / `led off` | Sets the status LED |

On the original oscillator board running firmware 1.1.0, enter a frequency under **Modulation (Hz)** to gate the buzzer using Timer 2, or leave it blank for a steady beep. A microphone test at 220, 440, and 880 Hz showed a dominant acoustic peak near 3.01 kHz at all three settings, with sidebands spaced by the selected frequency.

The MCU times each beep. A new beep replaces the current timer. The original [binary buzzer and LED protocol](https://github.com/tscircuit/basic-usbc-devices/tree/main/firmware) is also supported.

## Firmware

The [board design](https://tscircuit.com/seveibar/basic-usbc-devices#files) uses a CH552E at 24 MHz. The AC-coupled piezo drive is on P1.4 and the active-low status LED is on P1.5. The USB CDC source and frame decoder come from [basic-usbc-devices](https://github.com/tscircuit/basic-usbc-devices/tree/main/firmware/buzzer).

Install Arduino CLI and CH55xDuino, then build from the repository root:

```sh
index=https://raw.githubusercontent.com/DeqingSun/ch55xduino/ch55xduino/package_ch55xduino_mcs51_index.json
arduino-cli core update-index --additional-urls "$index"
arduino-cli core install CH55xDuino:mcs51@0.0.26 --additional-urls "$index"
arduino-cli compile --fqbn CH55xDuino:mcs51:ch552:clock=24internal,usb_settings=user148,bootloader_pin=p36 --output-dir build firmware/buzzer
```

To flash the included image, bridge TP1 and TP2 while plugging the buzzer in, then release the bridge. Run `wchisp info` to check that the bootloader reports CH552, followed by `wchisp flash firmware/releases/buzzer-2.0.0.hex`. It restarts as a USB serial port.

## Website

The static Web Serial client lives in `web/`. Serve locally with `python3 -m http.server 8000 --directory web` and open http://localhost:8000. Vercel serves this directory over HTTPS. The linked GitHub repository deploys main to production and branches to previews.

For a button, toggle switch, or limit switch, choose its name under **Add device** and select the USB device. The button and limit switch show **Pressed** or **Released** and the toggle shows **On** or **Off**. All three use the same USB identifier. After refreshing the page, use **Connect** on the corresponding saved card.

## Device documentation

The Docusaurus site at [devices.tscircuit.com/docs](https://devices.tscircuit.com/docs/) is built into `web/docs/` alongside the device console. Run `npm ci` and `npm run docs:dev` for live editing, or `npm run build` for a production build. Edit a device page in `documentation/pages/` and its sidebar entry in `documentation/sections.json`.

Each file in `documentation/drawings/*.circuit.tsx` contains the board outline, thickness, USB-C receptacles and mounting-hole centres from the linked PCB revision. Coordinates in that source use the PCB centre as their origin. For each USB-C port, record its reference and the centre of the footprint’s front shield edge in millimetres. The edge sets the cable entry direction. On multiport boards, give each connector its electrical role. The published sheet also gives coordinates from its lower-left corner. The populated 3D views come from the board’s Circuit JSON and are stored beside the sheets in `documentation/static/img/devices/`.

Run the following in `documentation/drawings` to regenerate every sheet. Pass device names to export a subset, for example `bun export.tsx motherboard speaker`.

```sh
bun install --frozen-lockfile
bun export.tsx
```

The script compiles each TSX sheet with the version of tscircuit pinned in the drawings package. It loads the carrier and populated model, renders the Circuit JSON locally with `@tscircuit/circuit-json-to-drawing`, and saves the native SVG after checking the views, labels and dimensions. Each sheet uses native part views, dimensions, part labels and page notes. The connector and isometric views share the populated GLB. For new sheets, pass `releaseGlbUrl={getCadDownloadUrl(board, "glb")}` to render the same versioned assembly offered on the device page. This preserves thin and curved features such as the limit switch’s slotted lever and roller. The sheet converts the release model from meters and Y-up into the drawing frame. Older sheets that use `modelFile` expect a millimeter, Z-up mesh and can pin a specific commit with `modelRevision`.

The device pages link to the [versioned CAD downloads](https://github.com/tscircuit/devices.tscircuit.com/releases/tag/board-cad-2026-11-21). Downloadable GLBs use glTF’s meter units and include the populated board. STEP assemblies use millimeters with the PCB midplane at Z = 0. Actuator heights on the device pages and mounting sheets are measured from the component-side surface of the PCB.
