// Node.js script to generate simple WAV files for casino sounds
const fs = require('fs');
const path = require('path');

// Helper to write a WAV file
function writeWav(filePath, samples, sampleRate = 44100) {
    const buffer = Buffer.alloc(44 + samples.length * 2);

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + samples.length * 2, 4);
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (1 for Mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(samples.length * 2, 40);

    for (let i = 0; i < samples.length; i++) {
        // Clamp to 16-bit signed integer range
        let s = Math.max(-1, Math.min(1, samples[i]));
        s = s * 32767;
        buffer.writeInt16LE(s, 44 + i * 2);
    }

    fs.writeFileSync(filePath, buffer);
    console.log(`Generated: ${filePath}`);
}

// Generate Sine Wave
function generateSineWave(freq, duration, volume = 0.5, sampleRate = 44100) {
    const samples = [];
    const totalSamples = sampleRate * duration;
    for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const value = Math.sin(2 * Math.PI * freq * t) * volume;
        // Apply simple envelope (fade out)
        const envelope = 1 - (i / totalSamples); // Linear fade out
        samples.push(value * envelope);
    }
    return samples;
}

// Generate Noise (for click/spin)
function generateNoise(duration, volume = 0.5, sampleRate = 44100) {
    const samples = [];
    const totalSamples = sampleRate * duration;
    for (let i = 0; i < totalSamples; i++) {
        samples.push((Math.random() * 2 - 1) * volume);
    }
    return samples;
}

// Ensure output directory exists
const outputDir = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Bet Sound (Short high pitch beep)
const betSamples = generateSineWave(880, 0.1, 0.3); // A5 note, short
writeWav(path.join(outputDir, 'bet.wav'), betSamples);

// 2. Spin Sound (Rapid clicking sensation - using noise bursts)
const spinSamples = [];
const tickDuration = 0.05; // 50ms per tick
const ticks = 20; // 1 second loop
for (let i = 0; i < ticks; i++) {
    // Add a short burst of noise
    spinSamples.push(...generateNoise(0.01, 0.4));
    // Add silence
    spinSamples.push(...new Array(Math.floor(44100 * (tickDuration - 0.01))).fill(0));
}
writeWav(path.join(outputDir, 'spin.wav'), spinSamples); // This will be looped

// 3. Win Sound (Major Arpeggio: C4-E4-G4-C5)
const winSamples = [];
const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
notes.forEach(freq => {
    winSamples.push(...generateSineWave(freq, 0.15, 0.4));
});
// Add a final long C5
winSamples.push(...generateSineWave(523.25, 0.4, 0.4));
writeWav(path.join(outputDir, 'win.wav'), winSamples);

// 4. Lose Sound (Descending Tritone/sad: G4-E4-C#4-C4 or just sliding down)
const loseSamples = [];
const sadNotes = [392.00, 311.13, 277.18]; // G4, Eb4, Db4... something dissonant
sadNotes.forEach(freq => {
    loseSamples.push(...generateSineWave(freq, 0.3, 0.4));
});
// Sliding down effect
const slideSamples = [];
for (let i = 0; i < 44100 * 0.5; i++) {
    const t = i / 44100;
    const freq = 200 * (1 - t) + 100; // Slide from 200Hz to 100Hz
    slideSamples.push(Math.sin(2 * Math.PI * freq * t) * 0.4 * (1 - t));
}
loseSamples.push(...slideSamples);

writeWav(path.join(outputDir, 'lose.wav'), loseSamples);

console.log('All sounds generated successfully.');
