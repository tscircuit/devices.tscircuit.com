# tscircuit USB devices

Open [devices.tscircuit.com](https://devices.tscircuit.com) in desktop Chrome or Edge. Plug in a board, click **Connect device**, and select **tscircuit Buzzer**. The page queries its identity and shows the matching controls. The buzzer has a fixed pitch of approximately 2.8 kHz.

## Serial commands

Open the USB CDC port at 115200 baud with DTR enabled. Send ASCII commands terminated by LF or CRLF. Responses end in CRLF.

| Command | Result |
| --- | --- |
| `id` | `DEVICE tscircuit buzzer 1.0.0` |
| `help` or `?` | Lists available commands |
| `beep` or `beep 250` | Sounds for 250 ms. Accepts 0–10000 ms |
| `stop` | Silences the buzzer immediately |
| `status` | Reports buzzing or idle |
| `led on` / `led off` | Sets the status LED |

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

To flash the included image, bridge TP1 and TP2 while plugging the buzzer in, then release the bridge. Run `wchisp info` to check that the bootloader reports CH552, followed by `wchisp flash firmware/releases/buzzer-1.0.0.hex`. It restarts as a USB serial port.

## Website

The static Web Serial client lives in `web/`. Serve locally with `python3 -m http.server 8000 --directory web` and open http://localhost:8000. Vercel serves this directory over HTTPS. The linked GitHub repository deploys main to production and branches to previews.
