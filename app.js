// app.js - Controller logic connecting UI, Keyboard inputs, and Audio Engine

// Initialize synth engine
const audio = new AudioEngine();

// Scale definitions
const SCALE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 1-Octave Keyboard Note Configuration (MIDI 60 to 72)
const NOTES = [
    { midi: 60, type: 'white', name: 'C', swara: 'Sa', keyHint: 'A' },
    { midi: 61, type: 'black', name: 'C#', swara: 're', keyHint: 'W' },
    { midi: 62, type: 'white', name: 'D', swara: 'Re', keyHint: 'S' },
    { midi: 63, type: 'black', name: 'D#', swara: 'ga', keyHint: 'E' },
    { midi: 64, type: 'white', name: 'E', swara: 'Ga', keyHint: 'D' },
    { midi: 65, type: 'white', name: 'F', swara: 'ma', keyHint: 'F' },
    { midi: 66, type: 'black', name: 'F#', swara: 'Ma', keyHint: 'T' },
    { midi: 67, type: 'white', name: 'G', swara: 'Pa', keyHint: 'G' },
    { midi: 68, type: 'black', name: 'G#', swara: 'dha', keyHint: 'Y' },
    { midi: 69, type: 'white', name: 'A', swara: 'Dha', keyHint: 'H' },
    { midi: 70, type: 'black', name: 'A#', swara: 'ni', keyHint: 'U' },
    { midi: 71, type: 'white', name: 'B', swara: 'Ni', keyHint: 'J' },
    
    // High C ending
    { midi: 72, type: 'white', name: 'C', swara: 'Sa', keyHint: 'K' }
];

// QWERTY physical key mapping (relative offsets from base MIDI octave)
const KEY_MAP = {
    'KeyA': 0,   // Sa (C)
    'KeyW': 1,   // re (C#)
    'KeyS': 2,   // Re (D)
    'KeyE': 3,   // ga (D#)
    'KeyD': 4,   // Ga (E)
    'KeyF': 5,   // ma (F)
    'KeyT': 6,   // Ma (F#)
    'KeyG': 7,   // Pa (G)
    'KeyY': 8,   // dha (G#)
    'KeyH': 9,   // Dha (A)
    'KeyU': 10,  // ni (A#)
    'KeyJ': 11,  // Ni (B)
    'KeyK': 12   // Sa (C, Octave +1)
};

// Map display keys
const KEY_DISPLAY_NAMES = {
    'KeyA': 'A', 'KeyW': 'W', 'KeyS': 'S', 'KeyE': 'E', 'KeyD': 'D',
    'KeyF': 'F', 'KeyT': 'T', 'KeyG': 'G', 'KeyY': 'Y', 'KeyH': 'H',
    'KeyU': 'U', 'KeyJ': 'J', 'KeyK': 'K'
};

// Application state variables
let scaleOffset = 0;   // Semitones (+/- half steps)
let octaveOffset = 0;  // Offset in octaves (+/- 12 semitones)
const pressedKeyboardKeys = new Map(); // keyCode -> actual midi note played

// DOM Elements
const keyboardContainer = document.getElementById('keyboard');
const scaleValEl = document.getElementById('scale-val');
const octaveValEl = document.getElementById('octave-val');
const sustainCheckbox = document.getElementById('sustain-checkbox');
const sustainLabel = document.getElementById('sustain-label');
const volumeSlider = document.getElementById('volume-slider');

const btnDecScale = document.getElementById('btn-dec-scale');
const btnIncScale = document.getElementById('btn-inc-scale');
const btnDecOctave = document.getElementById('btn-dec-octave');
const btnIncOctave = document.getElementById('btn-inc-octave');

/**
 * Render Visual Keyboard
 */
function renderKeyboard() {
    keyboardContainer.innerHTML = '';
    let whiteKeysCount = 0;

    NOTES.forEach(note => {
        const keyEl = document.createElement('div');
        keyEl.className = `key ${note.type}`;
        keyEl.dataset.midi = note.midi;
        
        // Structure labels inside key
        keyEl.innerHTML = `
            <div class="swara-label">${note.swara}</div>
            <div class="pitch-label" id="pitch-${note.midi}">${note.name}</div>
            <div class="qwerty-hint" id="hint-${note.midi}">&nbsp;</div>
        `;

        if (note.type === 'white') {
            whiteKeysCount++;
        } else {
            // Absolute positioning math for overlapping black keys
            const whiteKeyWidth = 60; // must match style.css
            const blackKeyWidth = 36; // must match style.css
            const leftPosition = (whiteKeysCount * whiteKeyWidth) - (blackKeyWidth / 2);
            keyEl.style.left = `${leftPosition}px`;
        }

        // Mouse/Pointer Listeners for visual clicks
        keyEl.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            // Start audio on first interaction
            audio.init();
            
            const midi = parseInt(keyEl.dataset.midi, 10);
            const playedMidi = midi + octaveOffset * 12;
            triggerNoteStart(midi, playedMidi);
            
            // Handle release on global document to handle dragging off the key
            const releaseHandler = () => {
                triggerNoteStop(midi, playedMidi);
                document.removeEventListener('pointerup', releaseHandler);
            };
            document.addEventListener('pointerup', releaseHandler);
        });

        keyboardContainer.appendChild(keyEl);
    });

    updateKeyboardHints();
}

/**
 * Dynamically shift the QWERTY letter overlays based on the Octave Offset
 */
function updateKeyboardHints() {
    // Clear current hints
    document.querySelectorAll('.qwerty-hint').forEach(el => el.innerHTML = '&nbsp;');

    const baseMidi = 60; // Always octave 4 visual keys!

    for (const [keyCode, relativeOffset] of Object.entries(KEY_MAP)) {
        const targetMidi = baseMidi + relativeOffset;
        const hintEl = document.getElementById(`hint-${targetMidi}`);
        if (hintEl) {
            hintEl.textContent = KEY_DISPLAY_NAMES[keyCode];
        }
    }
}

/**
 * Trigger sound and visual feedback
 */
function triggerNoteStart(visualMidi, playedMidi) {
    audio.playNote(playedMidi);
    const keyEl = document.querySelector(`.key[data-midi="${visualMidi}"]`);
    if (keyEl) {
        keyEl.classList.add('active');
    }
}

function triggerNoteStop(visualMidi, playedMidi) {
    audio.stopNote(playedMidi);
    const keyEl = document.querySelector(`.key[data-midi="${visualMidi}"]`);
    if (keyEl) {
        keyEl.classList.remove('active');
    }
}

/**
 * Scale Transposition Operations
 */
function updateScale(newOffset) {
    // Limit transpose offset safely between -12 and +12
    scaleOffset = Math.max(-12, Math.min(12, newOffset));
    audio.setTranspose(scaleOffset);

    // Get note name relative to C
    const index = ((scaleOffset % 12) + 12) % 12;
    const name = SCALE_NAMES[index];
    const sign = scaleOffset > 0 ? "+" : "";
    const displayVal = scaleOffset === 0 ? "C" : `${name} (${sign}${scaleOffset})`;
    
    scaleValEl.textContent = displayVal;
    
    // Update visual pitch labels on the keys
    updatePitchLabels();
}

/**
 * Update the visual pitch labels on the piano keys
 */
function updatePitchLabels() {
    NOTES.forEach(note => {
        const playedMidi = note.midi + scaleOffset;
        const noteName = SCALE_NAMES[playedMidi % 12];
        const pitchEl = document.getElementById(`pitch-${note.midi}`);
        if (pitchEl) {
            pitchEl.textContent = noteName;
        }
    });
}

function incrementScale() {
    updateScale(scaleOffset + 1);
}

function decrementScale() {
    updateScale(scaleOffset - 1);
}

/**
 * Octave Shift Operations
 */
function updateOctave(newOffset) {
    // Limit octave offsets safely between -2 (Octave 2) and +2 (Octave 6)
    octaveOffset = Math.max(-2, Math.min(2, newOffset));
    octaveValEl.textContent = `Octave ${4 + octaveOffset}`;
    updateKeyboardHints();
}

function incrementOctave() {
    updateOctave(octaveOffset + 1);
}

function decrementOctave() {
    updateOctave(octaveOffset - 1);
}

/**
 * Event Listeners for UI Controls
 */
btnDecScale.addEventListener('click', decrementScale);
btnIncScale.addEventListener('click', incrementScale);
btnDecOctave.addEventListener('click', decrementOctave);
btnIncOctave.addEventListener('click', incrementOctave);

sustainCheckbox.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    audio.setSustain(enabled);
    sustainLabel.textContent = enabled ? 'Enabled' : 'Disabled';
});

volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.setVolume(val);
});

/**
 * Physical QWERTY Keyboard Listeners
 */
window.addEventListener('keydown', (e) => {
    // Ignore native keyboard repeat triggers
    if (e.repeat) return;

    const code = e.code;

    // Handle transposition hotkeys (+ and -)
    if (code === 'Minus' || e.key === '-') {
        decrementScale();
        return;
    }
    if (code === 'Equal' || e.key === '+') {
        incrementScale();
        return;
    }

    // Handle octave shift hotkeys (Z and X)
    if (code === 'KeyZ') {
        decrementOctave();
        return;
    }
    if (code === 'KeyX') {
        incrementOctave();
        return;
    }

    // Handle musical note keypresses
    if (KEY_MAP.hasOwnProperty(code)) {
        // Prevent default scrolling for Space/keys if needed (keeps focus on piano)
        if (code === 'Semicolon' || code === 'Quote') {
            e.preventDefault();
        }

        const relativeOffset = KEY_MAP[code];
        const visualMidi = 60 + relativeOffset;
        const playedMidi = visualMidi + octaveOffset * 12;

        // Keep track of the active keyboard note so that if the user shifts the octave 
        // while holding a key, releasing it correctly stops the pitch they actually triggered.
        pressedKeyboardKeys.set(code, { visualMidi, playedMidi });
        triggerNoteStart(visualMidi, playedMidi);
    }
});

window.addEventListener('keyup', (e) => {
    const code = e.code;
    
    if (pressedKeyboardKeys.has(code)) {
        const { visualMidi, playedMidi } = pressedKeyboardKeys.get(code);
        triggerNoteStop(visualMidi, playedMidi);
        pressedKeyboardKeys.delete(code);
    }
});

// Start AudioContext on click/keydown/pointerdown inside document
const initAudioOnGesture = () => {
    audio.init();
    if (audio.ctx && audio.ctx.state === 'suspended') {
        audio.ctx.resume();
    }
    // Remove listeners once initialized
    window.removeEventListener('click', initAudioOnGesture);
    window.removeEventListener('keydown', initAudioOnGesture);
    window.removeEventListener('pointerdown', initAudioOnGesture);
};
window.addEventListener('click', initAudioOnGesture);
window.addEventListener('keydown', initAudioOnGesture);
window.addEventListener('pointerdown', initAudioOnGesture);

// Initial render
renderKeyboard();
updateScale(0);
updateOctave(0);
audio.setSustain(true);
audio.setVolume(0.8);
