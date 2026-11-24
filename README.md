# MotifLab

MotifLab is a browser-based music exploration and composition tool for building
harmonic ideas quickly. It helps users explore scales and modes, hear diatonic
chords, arrange chord progressions, audition different playback styles, and
export the result as a standard MIDI file.

The app is designed as a lightweight sketchpad rather than a full digital audio
workstation. It is especially useful for songwriters, composers, producers,
musicians, game developers, and students who want to try a musical atmosphere
before continuing the idea in a DAW.

## What can you do with MotifLab?

- Choose from 12 root notes, from C through B.
- Explore six tonal modes:
  - Natural Minor
  - Dorian
  - Phrygian
  - Harmonic Minor
  - Major
  - Lydian
- Read a short mood description for the selected mode.
- Generate all seven diatonic chords in the selected key and mode.
- View both Roman numeral notation and chord names for every scale degree.
- Preview individual chords with warm, synthesized audio.
- Build or edit a progression with up to eight slots.
- Start with a ready-made preset or create a custom sequence.
- Play the progression with a pad, arpeggiator, or waltz-style rhythm.
- Adjust tempo from 60 to 180 BPM.
- Switch between 4/4 and 3/4 time signatures.
- Choose triad, 7th/9th extension, or open/cinematic voicing.
- Follow the active chords and individual notes on a live two-octave keyboard.
- Export the current progression as a `.mid` file for use in a DAW.

## Why MotifLab?

Writing a progression often starts with an emotional target: cinematic, tense,
nostalgic, dreamy, or heroic. MotifLab connects that feeling to a key and mode,
while still keeping the note and chord choices mathematically related to a
selected scale.

For example, a Dorian progression can provide a bittersweet and heroic character,
while Phrygian makes an immediate starting point for dark or dramatic material.
The generated palette removes guesswork and helps users discover new combinations
without requiring advanced music theory knowledge.

## Included presets

MotifLab includes four one-click preset progressions:

| Preset | Starting scale | Musical use |
| --- | --- | --- |
| Cinematic Heroic | D Dorian | Wide, uplifting momentum |
| Melancholic Waltz | C Natural Minor | Reflective, dark 3/4 motion |
| Boss Fight Tension | E Phrygian | Restless and dramatic tension |
| Dream Sequence | F Lydian | Weightless, luminous harmony |

Preset progressions can be used immediately or modified by removing slots,
adding other diatonic chords, and changing playback settings.

## How to use it

1. Select a root note and scale or mode.
2. Review the generated chord palette.
3. Click a chord to preview it.
4. Use the add button beside a chord to place it into the progression timeline.
5. Remove a timeline chord with the minus button when editing the sequence.
6. Choose Pad, Arpeggiator, or Waltz playback.
7. Choose a voicing and set the BPM and time signature.
8. Click **Play progression** to hear the result.
9. Click **Export .MID** to download the progression for use in your DAW.

MIDI export uses the selected root, scale-based progression, voicing, tempo,
time signature, and the current progression slots. Browser audio begins only
after a user interaction, such as clicking a chord or pressing Play, in order
to follow browser autoplay policies.

## Playback modes

### Pad / Block Chords

Plays the selected chord notes together as sustained block chords. This mode is
well suited to atmospheric textures and broad musical sketches.

### Arpeggiator

Cycles through the notes of each chord individually. It creates a rhythmic,
broken-chord movement without requiring a separate pattern editor.

### Waltz Bass-Chord

Uses a root-note bass position on the first beat and upper chord notes on beats
two and three. This mode is intended for 3/4 waltz patterns.

## Voicing options

### Standard Triad

Uses the root, third, and fifth of each diatonic chord.

### 7th / 9th Extensions

Adds scale-related seventh and ninth color tones to the standard chord notes.

### Open / Cinematic

Uses a lower root position and a more open arrangement for wider, cinematic
sounding voicings.

## Visual feedback

The app includes a real-time, non-interactive two-octave piano keyboard. White
and black piano keys highlight according to the currently active chord or
arpeggiator note. The progression timeline also highlights the current slot
during playback.

## Technology

- **React** - component-based user interface
- **Vite** - development server and production build tooling
- **TypeScript** - application and module type safety
- **Tailwind CSS** - utility styles, with custom DAW-style visual design
- **Tone.js** - browser synthesis, transport scheduling, filtering, and reverb
- **Tonal** - scale, chord, note, and music-theory calculations
- **Lucide React** - interface icons
- **midi-writer-js** - browser-generated standard MIDI files

All audio synthesis and composition happens in the browser. MotifLab does not
require a server, account, API key, or database.

## Project structure

```text
src/
├── App.tsx                  # Main application UI and state
├── App.css                  # Studio-style visual design
├── index.css                # Global styles and Tailwind setup
├── audio/
│   └── soundEngine.ts       # Tone.js synth, transport, and scheduling
├── components/
│   └── PianoKeyboard.tsx    # Two-octave SVG piano visualization
└── utils/
    └── musicTheory.ts        # Scale, chord, Roman numeral, and voicing logic
```

The music-theory logic and audio/scheduling logic are kept separate from the
React interface so that chord generation and playback behavior can be maintained
independently.

## Getting started

### Prerequisites

- Node.js
- npm

### Install dependencies

```sh
npm install
```

### Start the development server

```sh
npm run dev
```

Vite will print the local URL in the terminal, usually
`http://localhost:5173`.

### Create a production build

```sh
npm run build
```

The generated static files are placed in `dist/`.

### Preview the production build

```sh
npm run preview
```

### Run lint checks

```sh
npm run lint
```

## Deployment

Because MotifLab is a client-side Vite application, `dist/` can be deployed to
any static website host. No backend process or environment variables are required.

## Browser audio

Web browsers restrict audio until the page receives a user action. MotifLab
unlocks the audio context through `Tone.start()` when a chord is previewed or
playback is started.

Headphones or speakers are recommended for the strongest listening experience.
The Tone.js synth is routed through a low-pass filter and subtle reverb to produce
a warmer sound than a raw oscillator.
