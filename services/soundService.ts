

import type { SoundEffectName } from '../types';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            return null;
        }
    }
    return audioContext;
};

/**
 * Creates and/or resumes the shared AudioContext. 
 * This must be called from within a user gesture handler (e.g., a click event) 
 * to comply with browser autoplay policies.
 */
export const initAudioContext = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("AudioContext resume failed", e));
    }
};


const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
};

const playNoise = (duration: number) => {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * 0.5);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);


    noiseSource.connect(gainNode);
    gainNode.connect(ctx.destination);
    noiseSource.start();
};


export const playSound = (effectName: SoundEffectName) => {
    const ctx = getAudioContext();
    // This is a crucial first step. If the context hasn't been created and started
    // by a user gesture via initAudioContext, sounds won't play for viewers.
    // For the host clicking the button, this will be the gesture that starts it.
    if (!ctx) {
      initAudioContext();
    } else if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Now check again, if it's still not running, we can't play sound.
    if (!audioContext || audioContext.state !== 'running') {
        console.warn("AudioContext is not running. Sound was blocked.");
        return;
    }
    
    switch (effectName) {
        case 'riso': // Laughter
            playTone(880, 0.1);
            setTimeout(() => playTone(987, 0.1), 100);
            setTimeout(() => playTone(1108, 0.1), 200);
            break;
        case 'aplausos': // Applause
            playNoise(1.5);
            break;
        case 'animar': // Cheer
             const cheerOsc = audioContext?.createOscillator();
             if (cheerOsc && audioContext) {
                const gainNode = audioContext.createGain();
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);

                cheerOsc.type = 'sawtooth';
                cheerOsc.frequency.setValueAtTime(440, audioContext.currentTime);
                cheerOsc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);
                
                cheerOsc.connect(gainNode);
                gainNode.connect(audioContext.destination);
                cheerOsc.start();
                cheerOsc.stop(audioContext.currentTime + 0.5);
             }
            break;
        case 'beijar': // Kiss
            playTone(1500, 0.1);
            break;
        case 'estranho': // Weird
            const weirdOsc = audioContext?.createOscillator();
            if(weirdOsc && audioContext) {
                const gainNode = audioContext.createGain();
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);

                weirdOsc.type = 'sawtooth';
                weirdOsc.frequency.setValueAtTime(400, audioContext.currentTime);
                weirdOsc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.5);
                
                const lfo = audioContext.createOscillator();
                lfo.frequency.setValueAtTime(10, audioContext.currentTime);
                const lfoGain = audioContext.createGain();
                lfoGain.gain.setValueAtTime(20, audioContext.currentTime);

                lfo.connect(lfoGain);
                lfoGain.connect(weirdOsc.frequency);

                weirdOsc.connect(gainNode);
                gainNode.connect(audioContext.destination);
                lfo.start();
                weirdOsc.start();
                lfo.stop(audioContext.currentTime + 0.5);
                weirdOsc.stop(audioContext.currentTime + 0.5);
            }
            break;
        case 'resposta_errada': // Wrong Answer
            playTone(150, 0.3, 'square');
            break;
        case 'sorriso': // Smile
            playTone(1046, 0.3); // C6
            break;
        case 'gift': // Gift sound
            playTone(1046.50, 0.1, 'triangle'); // C6
            setTimeout(() => playTone(1318.51, 0.1, 'triangle'), 100); // E6
            setTimeout(() => playTone(1567.98, 0.2, 'triangle'), 200); // G6
            break;
    }
};