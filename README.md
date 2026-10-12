# YC Deadline Countdown

A Chrome new-tab extension that counts down to the **YC Winter 2027 application
deadline: Mon, Nov 2 2026, 8:00 PM PT**. It has an animated 8-bit city in the
background and an optional lofi beat that's generated live in the browser.

- Big fractional-days counter (e.g. `21.8209744 days`) plus a `d h m s` readout
- The toolbar badge shows the days left, and clicking the icon opens the countdown
- The **LOFI** button (bottom right) toggles the music. The setting is remembered,
  and only the tab you're looking at plays.

## Install (for whoever you send it to)

1. Unzip `yc-deadline-countdown.zip`.
2. Open `chrome://extensions` and switch on **Developer mode** (top right).
3. Click **Load unpacked** and pick the unzipped `yc-deadline-countdown` folder.
4. Open a new tab. If Chrome asks whether to keep the new-tab change, choose **Keep it**.

## Changing the deadline

Edit `extension/config.js`. The new tab page and the badge both read from it.

## Building the zip

```sh
./build.sh   # -> dist/yc-deadline-countdown.zip
```
