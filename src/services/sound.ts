
class SoundManager {
    private sounds: { [key: string]: HTMLAudioElement } = {};
    private initialized = false;
    private context: AudioContext | null = null;

    // Track active oscillators/nodes for stopping loops
    private activeNodes: {
        spin?: { osc: OscillatorNode; gain: GainNode; interval?: number };
        ambience?: {
            crowd: { source: AudioBufferSourceNode; gain: GainNode } | null;
            interval?: number
        };
    } = {};

    // Preload sounds
    init() {
        if (this.initialized) return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.context = new AudioContextClass();
        } catch (e) {
            console.warn("Web Audio API not supported");
        }

        const soundFiles = {
            spin: "/sounds/spin.mp3",
            win: "/sounds/win.mp3",
            lose: "/sounds/lose.mp3",
            chip: "/sounds/chip.mp3",
        };

        Object.entries(soundFiles).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = "auto";
            audio.volume = 0.5;
            this.sounds[key] = audio;

            audio.onerror = () => {
                // harmful to log on every missing file in dev, but okay here.
            };
        });

        this.initialized = true;
    }

    // --- PUBLIC API ---

    playAmbience() {
        if (!this.context) return;
        this.resumeContext();
        this.stopAmbience(); // Ensure no duplicates

        // 1. Crowd/Room Tone (Pink Noise lowpassed)
        const ctx = this.context;
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;
        noiseSrc.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "lowpass";
        noiseFilter.frequency.value = 400;

        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.03; // Very subtle

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSrc.start();

        // 2. Random Casino Beeps (Slot machines)
        const interval = window.setInterval(() => {
            if (Math.random() > 0.7) this.playSlotMachineBeep();
        }, 2000);

        this.activeNodes.ambience = {
            crowd: { source: noiseSrc, gain: noiseGain },
            interval: interval
        };
    }

    stopAmbience() {
        if (this.activeNodes.ambience) {
            if (this.activeNodes.ambience.crowd) {
                try {
                    this.activeNodes.ambience.crowd.source.stop();
                    this.activeNodes.ambience.crowd.source.disconnect();
                } catch (e) { }
            }
            clearInterval(this.activeNodes.ambience.interval);
            this.activeNodes.ambience = undefined;
        }
    }

    startSpinSound() {
        if (!this.context) return;
        this.resumeContext();
        this.stopSpinSound();

        const ctx = this.context;

        // Spinning ticks - mimicking the ball hitting frets rapidly
        // We'll use a rapid sequence of clicks
        // Actually, a low frequency square wave with a filter sweep sounds like a mechanical hum + clicks

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(20, ctx.currentTime); // flapper freq

        // Envelope for the "tick"
        // We want it to sound like "tick-tick-tick-tick"
        // Just playing a raw low freq sawtooth sounds like a buzz.
        // Let's try a filtered noise pulse loop or just the synth tick from before but looped rapidly.

        // Better approach: Schedule playing 'tick' sounds rapidly.
        // Let's use setInterval for simplicity of implementation, though strict timing isn't guaranteed.

        let speed = 50; // ms
        const tickInterval = window.setInterval(() => {
            this.playTick(1200 + Math.random() * 200, 0.05);
        }, speed);

        this.activeNodes.spin = { osc: osc as any, gain: gain, interval: tickInterval };
    }

    stopSpinSound() {
        if (this.activeNodes.spin) {
            clearInterval(this.activeNodes.spin.interval);
            // Play one last "clack" for the ball settling
            this.playTick(800, 0.2);
            this.activeNodes.spin = undefined;
        }
    }

    playSound(name: "spin" | "win" | "lose" | "chip", volume = 0.5) {
        if (!this.initialized) this.init();

        if (name === "spin") {
            // For single-shot spin current usage (compatibility), just trigger start?
            // The modal handles start/stop now. If old code calls this, ignore or map to short effect.
            return;
        }

        // Try playing the file first
        const audio = this.sounds[name];
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volume;

            // If the file loads and plays successfully, great.
            // If it fails (e.g. 404), we should fallback to synth.
            // Since play() is async, we can catch errors.
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Fallback to synth if file fails
                    this.playSynth(name);
                });
            }
        } else {
            this.playSynth(name);
        }
    }

    // --- PRIVATE SYNTH HELPERS ---

    private resumeContext() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    private playSlotMachineBeep() {
        if (!this.context) return;
        const ctx = this.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        // Pentatonic C majorish: C, D, E, G, A
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        const freq = notes[Math.floor(Math.random() * notes.length)];

        osc.type = Math.random() > 0.5 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.02, now); // Quiet
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    private playTick(freq: number, duration: number) {
        if (!this.context) return;
        const ctx = this.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, now);
        // Quick decay
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    private playSynth(type: "spin" | "win" | "lose" | "chip") {
        if (!this.context) return;
        this.resumeContext();

        const ctx = this.context;
        const now = ctx.currentTime;

        switch (type) {
            case "chip":
                // Short high tick
                const oscC = ctx.createOscillator();
                const gainC = ctx.createGain();
                oscC.connect(gainC);
                gainC.connect(ctx.destination);

                oscC.type = "sine";
                oscC.frequency.setValueAtTime(2000, now);
                oscC.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
                gainC.gain.setValueAtTime(0.1, now);
                gainC.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscC.start(now);
                oscC.stop(now + 0.05);
                break;

            case "win":
                // "Locochon" Win Sound: Fast, energetic, major scale run with vibrato
                // Play a fast upward arpeggio
                const winNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C Major arpeggio
                const winSpeed = 0.06;

                winNotes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    const startTime = now + i * winSpeed;

                    osc.type = "square"; // "8-bit" ish energetic sound
                    osc.frequency.setValueAtTime(freq, startTime);
                    // Add a little vibrato sliding up
                    osc.frequency.linearRampToValueAtTime(freq * 1.02, startTime + winSpeed);

                    gain.gain.setValueAtTime(0.15, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + winSpeed * 1.5);

                    osc.start(startTime);
                    osc.stop(startTime + winSpeed * 2);
                });

                // Final chord hit
                setTimeout(() => {
                    [523.25, 659.25, 783.99, 1046.50].forEach(freq => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);

                        const hitTime = now + winNotes.length * winSpeed;
                        osc.type = "triangle";
                        osc.frequency.setValueAtTime(freq * 2, hitTime); // Higher octave
                        gain.gain.setValueAtTime(0.1, hitTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.5);

                        osc.start(hitTime);
                        osc.stop(hitTime + 0.5);
                    });
                }, (winNotes.length * winSpeed * 1000));

                break;

            case "lose":
                // "Locochon" Lose Sound: Sad, descending, discordant
                const loseNotes = [440, 415.30, 392.00, 349.23]; // A, G#, G, F (descending chromatic-ish)
                const loseSpeed = 0.3;

                loseNotes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    const startTime = now + i * loseSpeed;
                    osc.type = "sawtooth"; // Harsh buzzer sound
                    osc.frequency.setValueAtTime(freq, startTime);
                    // Pitch bend down
                    osc.frequency.linearRampToValueAtTime(freq * 0.9, startTime + loseSpeed);

                    gain.gain.setValueAtTime(0.15, startTime);
                    gain.gain.linearRampToValueAtTime(0, startTime + loseSpeed);

                    osc.start(startTime);
                    osc.stop(startTime + loseSpeed);
                });

                // Final "thud"
                const thudOsc = ctx.createOscillator();
                const thudGain = ctx.createGain();
                thudOsc.connect(thudGain);
                thudGain.connect(ctx.destination);

                const thudTime = now + loseNotes.length * loseSpeed;
                thudOsc.type = "sine";
                thudOsc.frequency.setValueAtTime(100, thudTime);
                thudOsc.frequency.exponentialRampToValueAtTime(10, thudTime + 0.3);
                thudGain.gain.setValueAtTime(0.3, thudTime);
                thudGain.gain.exponentialRampToValueAtTime(0.001, thudTime + 0.3);

                thudOsc.start(thudTime);
                thudOsc.stop(thudTime + 0.3);
                break;
        }
    }


}

export const soundManager = new SoundManager();

