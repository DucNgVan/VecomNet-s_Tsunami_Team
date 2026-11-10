import math
import struct
import wave
import os

SAMPLE_RATE = 44100
BPM = 118
BEAT_DUR = 60.0 / BPM
SIXTEENTH = BEAT_DUR / 4.0
TOTAL_DUR = 252.0  # 252 seconds to cover full demo
NUM_SAMPLES = int(SAMPLE_RATE * TOTAL_DUR)

print(f"Allocating audio buffer for {TOTAL_DUR}s at {SAMPLE_RATE}Hz ({NUM_SAMPLES} samples)...")

# Use bytearray or array of floats for memory efficiency
import array
left_channel = array.array('f', [0.0] * NUM_SAMPLES)
right_channel = array.array('f', [0.0] * NUM_SAMPLES)

def clamp(v):
    return max(-1.0, min(1.0, v))

def add_sample(idx, l, r):
    if 0 <= idx < NUM_SAMPLES:
        left_channel[idx] += l
        right_channel[idx] += r

# Lush Chord progression in D minor: Dm9 -> Bbmaj7 -> Gm7 -> Asus4/A
CHORDS = [
    [146.83, 220.00, 261.63, 329.63, 392.00],  # D3, A3, C4, E4, G4 (Dm9)
    [116.54, 174.61, 233.08, 293.66, 349.23],  # Bb2, F3, Bb3, D4, F4 (Bbmaj7)
    [98.00, 146.83, 196.00, 233.08, 293.66],   # G2, D3, G3, Bb3, D4 (Gm7)
    [110.00, 164.81, 220.00, 293.66, 329.63],  # A2, E3, A3, D4, E4 (Asus4)
    [146.83, 220.00, 293.66, 349.23, 440.00],  # Dm (inversion)
    [130.81, 196.00, 261.63, 329.63, 392.00],  # Cmaj7
    [116.54, 174.61, 220.00, 293.66, 349.23],  # Bbmaj7
    [110.00, 164.81, 220.00, 277.18, 329.63],  # A7
]

BAR_DUR = BEAT_DUR * 4.0

print("1. Generating chord pads...")
num_bars = int(TOTAL_DUR / BAR_DUR) + 1
for bar in range(num_bars):
    chord = CHORDS[bar % len(CHORDS)]
    start_t = bar * BAR_DUR
    dur = BAR_DUR * 1.05
    start_s = int(start_t * SAMPLE_RATE)
    len_s = int(dur * SAMPLE_RATE)
    
    for note_freq in chord:
        detune = 1.0025
        for i in range(len_s):
            idx = start_s + i
            if idx >= NUM_SAMPLES:
                break
            t = i / SAMPLE_RATE
            env = math.sin(math.pi * min(1.0, t / dur)) ** 0.55
            
            s_l = math.sin(2.0 * math.pi * note_freq * t) * 0.038
            s_r = math.sin(2.0 * math.pi * (note_freq * detune) * t) * 0.038
            s_l += math.sin(4.0 * math.pi * note_freq * t) * 0.012
            s_r += math.sin(4.0 * math.pi * (note_freq * detune) * t) * 0.012
            
            left_channel[idx] += s_l * env
            right_channel[idx] += s_r * env

print("2. Generating drum groove & bassline...")
total_beats = int(TOTAL_DUR / BEAT_DUR)

for b in range(total_beats):
    t_beat = b * BEAT_DUR
    s_beat = int(t_beat * SAMPLE_RATE)
    
    # Four-on-the-floor kick
    kick_len = int(0.24 * SAMPLE_RATE)
    for i in range(kick_len):
        idx = s_beat + i
        if idx >= NUM_SAMPLES:
            break
        t = i / SAMPLE_RATE
        freq = 48.0 + 90.0 * math.exp(-t * 30.0)
        env = math.exp(-t * 13.0)
        kick_val = math.sin(2.0 * math.pi * freq * t) * env * 0.26
        left_channel[idx] += kick_val
        right_channel[idx] += kick_val

    # Snare / Clap on beats 1 and 3
    if b % 2 == 1:
        snare_len = int(0.22 * SAMPLE_RATE)
        for i in range(snare_len):
            idx = s_beat + i
            if idx >= NUM_SAMPLES:
                break
            t = i / SAMPLE_RATE
            env = math.exp(-t * 15.0)
            noise = ((math.sin(i * 123.456) * 43758.5453) % 1.0 - 0.5) * 2.0
            tone = math.sin(2.0 * math.pi * 190.0 * t) * 0.35
            snare_val = (noise * 0.65 + tone) * env * 0.15
            left_channel[idx] += snare_val * 0.95
            right_channel[idx] += snare_val * 1.05

    # Hi-hats on 8th notes
    for sub in [0.5]:
        t_hat = t_beat + sub * BEAT_DUR
        s_hat = int(t_hat * SAMPLE_RATE)
        hat_len = int(0.08 * SAMPLE_RATE)
        for i in range(hat_len):
            idx = s_hat + i
            if idx >= NUM_SAMPLES:
                break
            t = i / SAMPLE_RATE
            env = math.exp(-t * 42.0)
            noise = ((math.sin((i + s_hat) * 314.159) * 43758.5453) % 1.0 - 0.5) * 2.0
            h_val = noise * env * 0.045
            left_channel[idx] += h_val
            right_channel[idx] += h_val

print("3. Generating sparkling arpeggio...")
scale_notes = [293.66, 329.63, 349.23, 392.00, 440.00, 523.25, 587.33, 659.25]
total_16ths = int(TOTAL_DUR / SIXTEENTH)

for step in range(total_16ths):
    t_step = step * SIXTEENTH
    s_step = int(t_step * SAMPLE_RATE)
    pat_idx = (step * 3) % len(scale_notes)
    freq = scale_notes[pat_idx]
    
    arp_len = int(0.12 * SAMPLE_RATE)
    pan = math.sin(step * 0.65) * 0.35
    for i in range(arp_len):
        idx = s_step + i
        if idx >= NUM_SAMPLES:
            break
        t = i / SAMPLE_RATE
        env = math.exp(-t * 24.0)
        val = math.sin(2.0 * math.pi * freq * t) * env * 0.045
        left_channel[idx] += val * (0.5 - pan)
        right_channel[idx] += val * (0.5 + pan)

print("4. Generating transition risers...")
# Key chapter boundaries in the 251-second demo
trans_times = [37.0, 61.0, 101.0, 118.0, 129.0, 141.0, 153.0, 165.0, 191.0, 203.0, 245.0]
for scene_sec in trans_times:
    if scene_sec >= TOTAL_DUR:
        continue
    s_trans = int(scene_sec * SAMPLE_RATE)
    riser_len = int(1.4 * SAMPLE_RATE)
    start_riser = max(0, s_trans - riser_len)
    
    for i in range(riser_len):
        idx = start_riser + i
        if idx >= NUM_SAMPLES:
            break
        t = i / riser_len
        freq = 140.0 + 850.0 * (t ** 2.2)
        env = (t ** 2) * 0.075
        noise = ((math.sin(i * 987.65) * 43758.5453) % 1.0 - 0.5) * 2.0
        val = (math.sin(2.0 * math.pi * freq * (i / SAMPLE_RATE)) * 0.45 + noise * 0.55) * env
        left_channel[idx] += val
        right_channel[idx] += val

print("5. Master fade out...")
fade_len = int(4.5 * SAMPLE_RATE)
fade_start = NUM_SAMPLES - fade_len
for i in range(fade_len):
    idx = fade_start + i
    factor = 1.0 - (i / fade_len)
    left_channel[idx] *= factor
    right_channel[idx] *= factor

out_dir = "demo_captures"
os.makedirs(out_dir, exist_ok=True)
out_wav = os.path.join(out_dir, "soundtrack_user_demo.wav")

print(f"Writing WAV file to {out_wav}...")
with wave.open(out_wav, "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SAMPLE_RATE)
    
    chunk_size = 100000
    for i in range(0, NUM_SAMPLES, chunk_size):
        end = min(NUM_SAMPLES, i + chunk_size)
        frames = bytearray()
        for j in range(i, end):
            l = int(clamp(left_channel[j]) * 32767)
            r = int(clamp(right_channel[j]) * 32767)
            frames.extend(struct.pack("<hh", l, r))
        wf.writeframes(frames)

print(f"✅ Extended soundtrack successfully generated: {out_wav} ({TOTAL_DUR}s)")
