# Hindustani Virtual Piano

A web-based virtual piano application optimized for Hindustani Classical Music practitioners. It features a fixed-root layout where the C key is always anchored to "Sa", but provides scale-shifting (transposition) capabilities to play in any key while maintaining the familiar relative mapping.

## Key Features

1. **Scale Shifting (Pitch Transpose)**: Shift the base pitch/scale of the piano by +/- half steps using physical keyboard keys `+`/`=` and `-`/`_`, or on-screen buttons.
2. **Fixed Hindustani Swara Labels**: The keys on the UI are permanently labeled with Hindustani Swaras relative to C. C is always "Sa".
3. **Polyphonic QWERTY keyboard mapping**: Play notes using your keyboard (QWERTY layout).
4. **Sustain Enabled by Default**: Realistic, ringing key releases (can be toggled).
5. **Octave Shifting**: Shift octaves of the physical keyboard mapping using `Z` (down) and `X` (up).
6. **Material Design Aesthetics**: Styled following Google's modern, clean Material Design 3 guidelines.

## Keyboard Controls Reference

### Musical Keys (1 Octave from C to C)
* **A** -> Sa (C)
* **W** -> Komal Re (C#)
* **S** -> Shuddha Re (D)
* **E** -> Komal Ga (D#)
* **D** -> Shuddha Ga (E)
* **F** -> Shuddha Ma (F)
* **T** -> Tivra Ma (F#)
* **G** -> Pa (G)
* **Y** -> Komal Dha (G#)
* **H** -> Shuddha Dha (A)
* **U** -> Komal Ni (A#)
* **J** -> Shuddha Ni (B)
* **K** -> Sa (Next Octave C)

### Function Keys
* **`+` / `=`**: Transpose scale Up by a half-step.
* **`-` / `_`**: Transpose scale Down by a half-step.
* **`Z`**: Shift base Octave Down.
* **`X`**: Shift base Octave Up.

## Local Hosting
Since this is built with clean Vanilla HTML, CSS, and Javascript, it does not require any compile/build steps.

You can manage the local server using the `./run.sh` script:

* **Start the server** (default port 8080):
  ```bash
  bash run.sh start
  # or simply:
  bash run.sh
  ```
* **Start on a custom port** (e.g., 9000):
  ```bash
  bash run.sh start 9000
  # or simply:
  bash run.sh 9000
  ```
* **Stop the server**:
  ```bash
  bash run.sh stop
  ```
* **Restart the server**:
  ```bash
  bash run.sh restart
  ```
* **Check status**:
  ```bash
  bash run.sh status
  ```
