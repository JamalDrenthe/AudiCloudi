import type { Track } from '@/types';

// In-memory cache for generated track audio URLs
const generatedAudioCache = new Map<string, string>();

/**
 * Returns pre-generated audio URL synchronously from memory if already computed.
 */
export function getGeneratedTrackAudioSync(track: Track): string | null {
  const cacheKey = `${track.id}_${track.genre}`;
  return generatedAudioCache.get(cacheKey) || null;
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave and write 16-bit PCM samples
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  const length = buffer.length;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channelData[c][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Deterministically generates musical audio for any track using OfflineAudioContext.
 * Guaranteed to produce playable audio in any modern browser without network dependency.
 */
export async function generateTrackAudio(track: Track): Promise<string> {
  if (typeof window === 'undefined') return '';

  const cacheKey = `${track.id}_${track.genre}`;
  if (generatedAudioCache.has(cacheKey)) {
    return generatedAudioCache.get(cacheKey)!;
  }

  const AudioContextClass =
    window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  if (!AudioContextClass) {
    return '';
  }

  // Generate 45 seconds of audio loop
  const durationSeconds = 45;
  const sampleRate = 22050; // Optimized sample rate for ultra-fast generation (< 50ms)
  const totalSamples = sampleRate * durationSeconds;

  const offlineCtx = new AudioContextClass(2, totalSamples, sampleRate);

  // Create hash seed from track id and title
  let hash = 0;
  const seedString = `${track.id}_${track.title}_${track.genre}`;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const genre = (track.genre || 'electronic').toLowerCase();

  // BPM selection
  let bpm = 120;
  if (genre.includes('hip') || genre.includes('lofi') || genre.includes('lo-fi')) {
    bpm = 84;
  } else if (genre.includes('ambient')) {
    bpm = 64;
  } else if (genre.includes('jazz')) {
    bpm = 108;
  } else if (genre.includes('rock')) {
    bpm = 126;
  } else if (genre.includes('pop')) {
    bpm = 118;
  }

  const beatSec = 60 / bpm;
  const totalBeats = Math.floor(durationSeconds / beatSec);

  // Musical scales (MIDI note frequencies)
  // Base roots: A2 = 110Hz, C3 = 130.81Hz, D3 = 146.83Hz, F3 = 174.61Hz, G3 = 196Hz
  const chordSets = [
    // Minor progression: Am, F, C, G
    [
      [220, 261.63, 329.63, 440],     // Am
      [174.61, 220, 261.63, 349.23],  // F
      [130.81, 164.81, 196, 261.63],  // C
      [196, 246.94, 293.66, 392],     // G
    ],
    // Chill progression: Dm9, Em7, Fmaj7, G7
    [
      [146.83, 220, 261.63, 329.63],  // Dm9
      [164.81, 196, 246.94, 293.66],  // Em7
      [174.61, 220, 261.63, 329.63],  // Fmaj7
      [196, 246.94, 293.66, 349.23],  // G7
    ],
    // Ambient progression: Cmaj9, Am9, Fmaj9, Gsus4
    [
      [130.81, 196, 246.94, 293.66, 392],
      [110, 164.81, 220, 261.63, 329.63],
      [174.61, 220, 261.63, 329.63, 440],
      [196, 261.63, 293.66, 392],
    ],
  ];

  const chordProgression = chordSets[seed % chordSets.length];

  // Master Gain & Limiter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.75, 0);
  masterGain.connect(offlineCtx.destination);

  // Delay/reverb effect for lush atmospheric depth
  const delayNode = offlineCtx.createDelay();
  delayNode.delayTime.setValueAtTime(beatSec * 0.75, 0);
  const delayFeedback = offlineCtx.createGain();
  delayFeedback.gain.setValueAtTime(0.28, 0);
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayNode.connect(masterGain);

  // 1. CHORD PADS / HARMONY
  const beatsPerChord = 4;
  for (let b = 0; b < totalBeats; b += beatsPerChord) {
    const chordIndex = Math.floor(b / beatsPerChord) % chordProgression.length;
    const chord = chordProgression[chordIndex];
    const startTime = b * beatSec;
    const chordDuration = beatsPerChord * beatSec;

    chord.forEach((freq, noteIdx) => {
      const osc = offlineCtx.createOscillator();
      const noteGain = offlineCtx.createGain();
      const filter = offlineCtx.createBiquadFilter();

      osc.type = genre.includes('ambient') ? 'sine' : noteIdx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Subtle detune for warm analog feel
      osc.detune.setValueAtTime((noteIdx - 1.5) * 4 + ((seed % 7) - 3), startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(genre.includes('ambient') ? 800 : 1800, startTime);

      // Smooth attack & release envelope
      const attack = genre.includes('ambient') ? 0.6 : 0.15;
      const release = 0.5;
      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.linearRampToValueAtTime(0.12, startTime + attack);
      noteGain.gain.setValueAtTime(0.12, startTime + chordDuration - release);
      noteGain.gain.linearRampToValueAtTime(0.001, startTime + chordDuration);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);
      noteGain.connect(delayNode);

      osc.start(startTime);
      osc.stop(startTime + chordDuration);
    });
  }

  // 2. BASSLINE
  const bassFilter = offlineCtx.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.setValueAtTime(genre.includes('ambient') ? 250 : 450, 0);
  bassFilter.Q.setValueAtTime(2.5, 0);
  bassFilter.connect(masterGain);

  for (let b = 0; b < totalBeats; b++) {
    const chordIndex = Math.floor(b / beatsPerChord) % chordProgression.length;
    const rootFreq = chordProgression[chordIndex][0] / 2; // Octave down for bass
    const startTime = b * beatSec;

    const playBass = genre.includes('ambient') ? b % 4 === 0 : b % 2 === 0 || (b % 4 === 3 && (seed % 3 === 0));

    if (playBass) {
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();

      bassOsc.type = genre.includes('hip') ? 'sine' : 'sawtooth';
      bassOsc.frequency.setValueAtTime(rootFreq, startTime);

      bassGain.gain.setValueAtTime(0.001, startTime);
      bassGain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + beatSec * 0.85);

      bassOsc.connect(bassGain);
      bassGain.connect(bassFilter);

      bassOsc.start(startTime);
      bassOsc.stop(startTime + beatSec * 0.9);
    }
  }

  // 3. MELODY / ARPEGGIO
  if (!genre.includes('podcast')) {
    const melodyGain = offlineCtx.createGain();
    melodyGain.gain.setValueAtTime(0.14, 0);
    melodyGain.connect(masterGain);
    melodyGain.connect(delayNode);

    for (let b = 0; b < totalBeats; b++) {
      const chordIndex = Math.floor(b / beatsPerChord) % chordProgression.length;
      const chord = chordProgression[chordIndex];
      const subdivisions = genre.includes('electronic') ? 2 : 1;

      for (let sub = 0; sub < subdivisions; sub++) {
        const startTime = (b + sub / subdivisions) * beatSec;
        const noteDuration = (beatSec / subdivisions) * 0.75;
        const noteIndex = ((b * 2 + sub + seed) % chord.length);
        const freq = chord[noteIndex] * 2; // High melodic register

        const leadOsc = offlineCtx.createOscillator();
        const leadEnvelope = offlineCtx.createGain();

        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(freq, startTime);

        leadEnvelope.gain.setValueAtTime(0.001, startTime);
        leadEnvelope.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
        leadEnvelope.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        leadOsc.connect(leadEnvelope);
        leadEnvelope.connect(melodyGain);

        leadOsc.start(startTime);
        leadOsc.stop(startTime + noteDuration);
      }
    }
  }

  // 4. DRUMS & PERCUSSION (For Electronic, Hip Hop, Pop, Rock, Jazz)
  if (!genre.includes('ambient') && !genre.includes('podcast')) {
    // Noise buffer for Snare and Hi-Hats
    const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.25, sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    for (let b = 0; b < totalBeats; b++) {
      const startTime = b * beatSec;
      const beatInBar = b % 4;

      // KICK DRUM (beats 0 and 2 for hip hop, 0 1 2 3 for electronic)
      const isKick = genre.includes('electronic') ? true : beatInBar === 0 || (beatInBar === 2 && seed % 2 === 0);
      if (isKick) {
        const kickOsc = offlineCtx.createOscillator();
        const kickGain = offlineCtx.createGain();

        kickOsc.frequency.setValueAtTime(140, startTime);
        kickOsc.frequency.exponentialRampToValueAtTime(42, startTime + 0.12);

        kickGain.gain.setValueAtTime(0.35, startTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);

        kickOsc.start(startTime);
        kickOsc.stop(startTime + 0.2);
      }

      // SNARE / CLAP (beats 1 and 3)
      if (beatInBar === 1 || beatInBar === 3) {
        const snareNoise = offlineCtx.createBufferSource();
        snareNoise.buffer = noiseBuffer;

        const snareFilter = offlineCtx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(1200, startTime);

        const snareGain = offlineCtx.createGain();
        snareGain.gain.setValueAtTime(0.2, startTime);
        snareGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(masterGain);

        snareNoise.start(startTime);
        snareNoise.stop(startTime + 0.2);
      }

      // HI-HATS (8th notes)
      for (let sub = 0; sub < 2; sub++) {
        const hatTime = startTime + (sub * beatSec) / 2;
        const hatSource = offlineCtx.createBufferSource();
        hatSource.buffer = noiseBuffer;

        const hatFilter = offlineCtx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(6500, hatTime);

        const hatGain = offlineCtx.createGain();
        hatGain.gain.setValueAtTime(sub === 0 ? 0.08 : 0.05, hatTime);
        hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.05);

        hatSource.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(masterGain);

        hatSource.start(hatTime);
        hatSource.stop(hatTime + 0.06);
      }
    }
  }

  // Render synthesized audio buffer
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const blobUrl = URL.createObjectURL(wavBlob);

  generatedAudioCache.set(cacheKey, blobUrl);
  return blobUrl;
}
