"""Render the web app's gentle practice cues as native WAV assets."""

import math
import struct
import wave
from pathlib import Path

RATE = 22050
NOTES = {
    "correct": [(523.25, 0, .13, .026), (659.25, .085, .19, .031)],
    "retry": [(392, 0, .12, .018), (349.23, .075, .17, .016)],
    "complete": [(392, 0, .12, .024), (523.25, .09, .14, .027), (659.25, .19, .25, .032)],
}

output = Path(__file__).resolve().parents[1] / "assets" / "feedback"
output.mkdir(parents=True, exist_ok=True)
for name, notes in NOTES.items():
    length = max(delay + duration for _, delay, duration, _ in notes) + .03
    samples = []
    for frame in range(int(length * RATE)):
        time = frame / RATE
        value = 0.0
        for frequency, delay, duration, volume in notes:
            age = time - delay
            if 0 <= age < duration:
                attack = min(1.0, age / .015)
                release = min(1.0, (duration - age) / .055)
                value += math.sin(2 * math.pi * frequency * age) * volume * attack * release
        samples.append(struct.pack("<h", round(max(-1, min(1, value)) * 32767)))
    with wave.open(str(output / f"{name}.wav"), "wb") as sound:
        sound.setnchannels(1)
        sound.setsampwidth(2)
        sound.setframerate(RATE)
        sound.writeframes(b"".join(samples))
