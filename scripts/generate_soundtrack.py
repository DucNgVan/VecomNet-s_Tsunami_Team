import math
import struct
import wave

SAMPLE_RATE = 44100
BPM = 118
BEAT_DUR = 60.0 / BPM
SIXTEENTH = BEAT_DUR / 4.0
TOTAL_DUR = 140.0  # 140 seconds
NUM_SAMPLES = int(SAMPLE_RATE * TOTAL_DUR)

left_channel = [0.0] * NUM_SAMPLES
right_channel = [0.0] * NUM_SAMPLES

def clamp(v):
    return max(-1.0, min(1.0, v))

def add_sample(idx, l, r):
    if 0 <= idx < NUM_SAMPLES:
        left_channel[idx] += l
        right_channel[idx] += r

# Chord progression in D minor: Dm9 -> Bbmaj7 -> Gm7 -> Asus4/A
CHORDS = [
    [146.83, 220.00, 261.63, 329.63, 392.00],  # D3, A3, C4, E4, G4 (Dm9)
    [116.54, 174.61, 233.08, 293.66, 349.23],  # Bb2, F3, Bb3, D4, F4 (Bbmaj7)
    [98.00, 146.83, 196.00, 233.08, 293.66],   # G2, D3, G3, Bb3, D4 (Gm7)
    [110.00, 164.81, 220.00, 293.66, 329.63],  # A2, E3, A3, D4, E4 (Asus4)
]

BAR_DUR = BEAT_DUR * 4.0

print("Generating musical elements...")

# 1. Atmospheric Chord Pads with slow chorus & stereo width
for bar in range(int(TOTAL_DUR / BAR_DUR) + 1):
    chord = CHORDS[bar % len(CHORDS)]
    start_t = bar * BAR_DUR
    dur = BAR_DUR * 1.05
    start_s = int(start_t * SAMPLE_RATE)
    len_s = int(dur * SAMPLE_RATE)
    
    for note_freq in chord:
        detune = 1.002
        for i in range(len_s):
            idx = start_s + i
            if idx >= NUM_SAMPLES:
                break
            t = i / SAMPLE_RATE
            # Soft attack and gentle release envelope
            env = math.sin(math.pi * min(1.0, t / dur)) ** 0.5
            
            # Left & Right slightly detuned for lush stereo sound
            s_l = math.sin(2.0 * math.pi * note_freq * t) * 0.04
            s_r = math.sin(2.0 * math.pi * (note_freq * detune) * t) * 0.04
            # Add subtle harmonic overtone
            s_l += math.sin(4.0 * math.pi * note_freq * t) * 0.015
            s_r += math.sin(4.0 * math.pi * (note_freq * detune) * t) * 0.015
            
            add_sample(idx, s_l * env, s_r * env)

# 2. Modern Drum Groove: Kick, Soft Snare, Hi-Hats, Sub-Bass
total_beats = int(TOTAL_DUR / BEAT_DUR)

for b in range(total_beats):
    t_beat = b * BEAT_DUR
    s_beat = int(t_beat * SAMPLE_RATE)
    
    # Kick drum on beats 0, 1, 2, 3 (Four-on-the-floor tech pulse)
    kick_len = int(0.25 * SAMPLE_RATE)
    for i in range(kick_len):
        idx = s_beat + i
        if idx >= NUM_SAMPLES:
            break
        t = i / SAMPLE_RATE
        # Pitch envelope 140Hz -> 45Hz
        freq = 45.0 + 95.0 * math.exp(-t * 28.0)
        env = math.exp(-t * 12.0)
        kick_val = math.sin(2.0 * math.pi * freq * t) * env * 0.28
        add_sample(idx, kick_val, kick_val)

    # Snare / Clap on beats 1 and 3 (2nd and 4th beat of each 4-beat bar)
    if b % 2 == 1:
        snare_len = int(0.2 * SAMPLE_RATE)
        for i in range(snare_len):
            idx = s_beat + i
            if idx >= NUM_SAMPLES:
                break
            t = i / SAMPLE_RATE
            env = math.exp(-t * 16.0)
            # Filtered noise + tone
            noise = ((math.sin(i * 123.456) * 43758.5453) % 1.0 - 0.5) * 2.0
            tone = math.sin(2.0 * math.pi * 185.0 * t) * 0.3
            snare_val = (noise * 0.7 + tone) * env * 0.16
            add_sample(idx, snare_val * 0.9, snare_val * 1.1)

    # Hi-hats on every 8th note (off-beat syncopation)
    for sub in [0.5]:
        t_hat = t_beat + sub * BEAT_DUR
        s_hat = int(t_hat * SAMPLE_RATE)
        hat_len = int(0.08 * SAMPLE_RATE)
        for i in range(hat_len):
            idx = s_hat + i
            if idx >= NUM_SAMPLES:
                break
            t = i / SAMPLE_RATE
            env = math.exp(-t * 40.0)
            noise = ((math.sin((i + s_hat) * 314.159) * 43758.5453) % 1.0 - 0.5) * 2.0
            add_sample(idx, noise * env * 0.05, noise * env * 0.05)

# 3. Arpeggiator (16th-note sparkling tech plucks)
scale_notes = [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25]
total_16ths = int(TOTAL_DUR / SIXTEENTH)

for step in range(total_16ths):
    t_step = step * SIXTEENTH
    s_step = int(t_step * SAMPLE_RATE)
    # Pattern
    pat_idx = (step * 3) % len(scale_notes)
    freq = scale_notes[pat_idx]
    
    arp_len = int(0.12 * SAMPLE_RATE)
    pan = math.sin(step * 0.7) * 0.35  # Subtle panning
    for i in range(arp_len):
        idx = s_step + i
        if idx >= NUM_SAMPLES:
            break
        t = i / SAMPLE_RATE
        env = math.exp(-t * 22.0)
        val = math.sin(2.0 * math.pi * freq * t) * env * 0.05
        add_sample(idx, val * (0.5 - pan), val * (0.5 + pan))

# 4. Cinematic Risers / Transition Swooshes at Scene boundaries (~every 10s)
for scene_sec in [7.0, 17.0, 28.0, 39.0, 50.0, 61.0, 72.0, 83.0, 94.0, 105.0, 116.0, 127.0]:
    if scene_sec >= TOTAL_DUR:
        break
    s_trans = int(scene_sec * SAMPLE_RATE)
    riser_len = int(1.2 * SAMPLE_RATE)
    start_riser = max(0, s_trans - riser_len)
    
    for i in range(riser_len):
        idx = start_riser + i
        if idx >= NUM_SAMPLES:
            break
        t = i / riser_len  # 0 to 1
        freq = 150.0 + 800.0 * (t ** 2)
        env = (t ** 2) * 0.08
        noise = ((math.sin(i * 987.65) * 43758.5453) % 1.0 - 0.5) * 2.0
        val = (math.sin(2.0 * math.pi * freq * (i / SAMPLE_RATE)) * 0.4 + noise * 0.6) * env
        add_sample(idx, val, val)

# 5. Master fade out at the end (last 4 seconds)
fade_len = int(4.0 * SAMPLE_RATE)
fade_start = NUM_SAMPLES - fade_len
for i in range(fade_len):
    idx = fade_start + i
    factor = (1.0 - (i / fade_len))
    left_channel[idx] *= factor
    right_channel[idx] *= factor

print("Writing WAV file...")
out_wav = "demo_captures/soundtrack.wav"
with wave.open(out_wav, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    
    # Interleave and convert to 16-bit PCM
    frames = bytearray()
    for i in range(NUM_SAMPLES):
        l = int(clamp(left_channel[i]) * 32767)
        r = int(clamp(right_channel[i]) * 32767)
        frames.extend(struct.pack("<hh", l, r))
    wf.writeframes(frames)

print(f"Soundtrack generated: {out_wav} ({TOTAL_DUR}s)")
