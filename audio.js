/**
 * AudioEngine class handling standard Web Audio API synthesis.
 * Built for zero-dependency, low-latency, polyphonic performance.
 */
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.activeNotes = new Map(); // midiNote -> { osc1, osc2, gainNode }
        
        // Defaults
        this.transpose = 0; // scale transpose offset in semitones (+/- half steps)
        this.sustain = true;
        this.volume = 0.8;
    }

    /**
     * Lazy initialization of AudioContext on first user interaction.
     */
    init() {
        if (this.ctx) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
    }

    /**
     * Start playing a note
     * @param {number} midiNote - The base midi note number
     */
    playNote(midiNote) {
        this.init();
        
        // Resume context if suspended (browser security restriction)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        // If note is already sounding, stop it immediately first to re-trigger clean attack
        if (this.activeNotes.has(midiNote)) {
            this.stopNoteImmediate(midiNote);
        }

        const transposedNote = midiNote + this.transpose;
        const freq = 440 * Math.pow(2, (transposedNote - 69) / 12);

        // Primary Oscillator (Triangle - warm, flute-like)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Secondary Harmonic (Sine - adds minor brightness/richness, 1 octave up)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);
        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.15, this.ctx.currentTime); // keep it subtle
        
        // Gain Node for Attack-Decay-Sustain-Release Envelope
        const gainNode = this.ctx.createGain();
        const gain = gainNode.gain;
        
        gain.setValueAtTime(0, this.ctx.currentTime);
        // Attack: rapid rise
        gain.linearRampToValueAtTime(1.0, this.ctx.currentTime + 0.015);
        // Decay to Sustain: smooth decay to sustain level
        gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.15);

        // Connect nodes
        osc1.connect(gainNode);
        
        osc2.connect(osc2Gain);
        osc2Gain.connect(gainNode);

        gainNode.connect(this.masterGain);

        // Start oscillators
        osc1.start(this.ctx.currentTime);
        osc2.start(this.ctx.currentTime);

        // Keep track of the active oscillators
        this.activeNotes.set(midiNote, { osc1, osc2, gainNode });
    }

    /**
     * Stop playing a note (initiate Release phase)
     * @param {number} midiNote 
     */
    stopNote(midiNote) {
        if (!this.ctx) return;
        const noteObj = this.activeNotes.get(midiNote);
        if (!noteObj) return;

        const now = this.ctx.currentTime;
        const { osc1, osc2, gainNode } = noteObj;
        const gain = gainNode.gain;

        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        
        const releaseTime = this.sustain ? 1.5 : 0.08;
        gain.linearRampToValueAtTime(0.0, now + releaseTime);

        osc1.stop(now + releaseTime);
        osc2.stop(now + releaseTime);

        // Clean up from map
        this.activeNotes.delete(midiNote);
    }

    /**
     * Immediately terminate a note without release tail
     */
    stopNoteImmediate(midiNote) {
        const noteObj = this.activeNotes.get(midiNote);
        if (!noteObj) return;

        const now = this.ctx.currentTime;
        const { osc1, osc2, gainNode } = noteObj;

        try {
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0.0, now + 0.02);
            osc1.stop(now + 0.02);
            osc2.stop(now + 0.02);
        } catch (e) {
            // handle cases where nodes were already stopped
        }

        this.activeNotes.delete(midiNote);
    }

    /**
     * Set Transpose Scale Offset
     * @param {number} offset - semitone count (+/-)
     */
    setTranspose(offset) {
        this.transpose = offset;
    }

    /**
     * Set Sustain Toggle
     * @param {boolean} value 
     */
    setSustain(value) {
        this.sustain = value;
    }

    /**
     * Update Global Volume
     * @param {number} value - 0 to 1
     */
    setVolume(value) {
        this.volume = value;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(value, this.ctx.currentTime);
        }
    }
}
