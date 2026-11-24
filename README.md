# MotifLab

MotifLab is a client-side musical sketchpad for exploring chord progressions and
leitmotifs. Choose a root and mode, preview diatonic chords, arrange a progression,
then play it with Tone.js or export it as a MIDI file.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Included

- Six selectable scales and modes, with diatonic chord names and Roman numerals
- Four ready-to-play progression presets and an editable eight-slot timeline
- Pad, arpeggiator, and waltz playback; three voicings; tempo and meter controls
- Two-octave active-note keyboard visualization and MIDI export

All synthesis and composition run in the browser; no backend is required. Start
audio using a user gesture such as Preview or Play to satisfy browser audio policies.
