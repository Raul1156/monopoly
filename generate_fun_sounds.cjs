const fs = require('fs');
const path = require('path');

// Helper to write a WAV file
function writeWav(filePath, samples, sampleRate = 44100) {
    const buffer = Buffer.alloc(44 + samples.length * 2);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + samples.length * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(samples.length * 2, 40);

    for (let i = 0; i < samples.length; i++) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        s = s * 32767;
        buffer.writeInt16LE(s, 44 + i * 2);
    }

    fs.writeFileSync(filePath, buffer);
    console.log(`Generated: ${filePath}`);
}

const sampleRate = 44100;

function createEnvelope(samples, attackTime, releaseTime) {
    const attackSamples = Math.floor(attackTime * sampleRate);
    const releaseSamples = Math.floor(releaseTime * sampleRate);

    return samples.map((s, i) => {
        let env = 1;
        if (i < attackSamples) {
            env = i / attackSamples;
        } else if (i > samples.length - releaseSamples) {
            env = (samples.length - i) / releaseSamples;
        }
        return s * env;
    });
}

// 1. FUN BET: "Coin" / "Ka-ching"
// Two high frequencies fading out
function generateCoin() {
    const duration = 0.6;
    const samples = [];
    const totalSamples = sampleRate * duration;
    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        // Mix two high sines for metallic sound
        const val = (Math.sin(2 * Math.PI * 1200 * t) * 0.5) + (Math.sin(2 * Math.PI * 2400 * t) * 0.3);
        // Exponential decay
        samples.push(val * Math.exp(-4 * t));
    }
    return samples;
}

// 2. FUN SPIN: "Card Flapping"
// Sharp clicks
function generateClick() {
    const duration = 0.05; // Short blip
    const samples = [];
    const totalSamples = sampleRate * duration;

    // Frequency sweep parameters for a "tick" sound
    const startFreq = 800;
    const endFreq = 100;
    const k = (startFreq - endFreq) / duration;

    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;

        // Calculate phase for sweep: integral of (start - kt) is (start*t - 0.5*k*t^2)
        const phase = startFreq * t - 0.5 * k * t * t;

        // Square wave for 8-bit retro feel
        const val = Math.sign(Math.sin(2 * Math.PI * phase));

        // Linear decay envelope
        const env = 1 - (t / duration);

        samples.push(val * env * 0.3);
    }
    // Add silence for spacing between ticks in the loop
    const silence = new Array(Math.floor(sampleRate * 0.08)).fill(0);
    return [...samples, ...silence];
}
function generateSpinLoop() {
    const samples = [];
    // Create a loop of clicks
    for (let i = 0; i < 8; i++) {
        samples.push(...generateClick());
    }
    return samples;
}

// 3. FUN WIN: "8-bit Power Up"
// Rapid Arpeggio
function generateWin() {
    const notes = [
        523.25, // C5
        659.25, // E5
        783.99, // G5
        1046.50, // C6
        1318.51, // E6
        1567.98  // G6
    ];
    const samples = [];
    const noteDuration = 0.08;

    notes.forEach(freq => {
        const noteSamples = Math.floor(sampleRate * noteDuration);
        for (let i = 0; i < noteSamples; i++) {
            const t = i / sampleRate;
            // Square wave for 8-bit feel
            const val = Math.sign(Math.sin(2 * Math.PI * freq * t)) * 0.3;
            samples.push(val);
        }
    });
    // Final long note with vibrato
    const finalDuration = 0.4;
    const freq = 2093.00; // C7
    for (let i = 0; i < sampleRate * finalDuration; i++) {
        const t = i / sampleRate;
        const vibrato = 1 + 0.02 * Math.sin(2 * Math.PI * 10 * t);
        const val = Math.sign(Math.sin(2 * Math.PI * freq * vibrato * t)) * 0.3;
        samples.push(val);
    }

    return createEnvelope(samples, 0.01, 0.1);
}

// 4. FUN LOSE: "Sad Trombone / Wah Wah Wah"
function generateLose() {
    const samples = [];
    const wahDuration = 0.35;

    const notes = [
        { start: 392.00, end: 380.00 }, // G -> slight bend
        { start: 369.99, end: 360.00 }, // F#
        { start: 349.23, end: 340.00 }, // F
        { start: 329.63, end: 280.00 }  // E -> deep slide
    ];

    notes.forEach(note => {
        const noteSamples = Math.floor(sampleRate * wahDuration);
        for (let i = 0; i < noteSamples; i++) {
            const t = i / sampleRate;
            // Sawtooth-ish for brassy sound
            const freq = note.start + (note.end - note.start) * (i / noteSamples);
            const val = (2 * ((freq * t) % 1) - 1) * 0.4;
            // Lowpass filter effect approximation by envelope
            const env = Math.sin(Math.PI * (i / noteSamples));
            samples.push(val * env);
        }
        // Small silence between wahs
        samples.push(...new Array(2000).fill(0));
    });

    return samples;
}

const outputDir = path.join(__dirname, 'public', 'sounds');

writeWav(path.join(outputDir, 'bet.wav'), generateCoin());
writeWav(path.join(outputDir, 'spin.wav'), generateSpinLoop());
writeWav(path.join(outputDir, 'win.wav'), generateWin());
writeWav(path.join(outputDir, 'lose.wav'), generateLose());

console.log('Fun sounds generated!');
