import { Chord, Note, Scale } from 'tonal'

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export const MODES = [
  { name: 'Natural Minor', tonalName: 'minor', mood: 'somber, reflective, cinematic' },
  { name: 'Dorian', tonalName: 'dorian', mood: 'bittersweet, heroic, nostalgic' },
  { name: 'Phrygian', tonalName: 'phrygian', mood: 'tense, dark, dramatic' },
  { name: 'Harmonic Minor', tonalName: 'harmonic minor', mood: 'mysterious, dramatic, old-world' },
  { name: 'Major', tonalName: 'major', mood: 'bright, confident, familiar' },
  { name: 'Lydian', tonalName: 'lydian', mood: 'dreamlike, weightless, luminous' },
] as const

export type ModeName = (typeof MODES)[number]['name']
export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented'

export type ChordInfo = {
  degree: number
  root: string
  name: string
  roman: string
  quality: ChordQuality
  notes: string[]
  seventh: string
  ninth: string
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

function getChordQuality(notes: string[]): ChordQuality {
  const detected = Chord.detect(notes)[0]
  const chord = detected ? Chord.get(detected) : null
  if (chord?.quality === 'Minor') return 'minor'
  if (chord?.quality === 'Diminished') return 'diminished'
  if (chord?.quality === 'Augmented') return 'augmented'
  return 'major'
}

function getChordName(notes: string[], root: string, quality: ChordQuality): string {
  const detected = Chord.detect(notes).find((name) => Note.pitchClass(name) === root)
  if (detected) return detected
  const suffix = quality === 'minor' ? 'm' : quality === 'diminished' ? 'dim' : quality === 'augmented' ? 'aug' : ''
  return `${root}${suffix}`
}

export function getScaleChords(root: string, mode: ModeName): ChordInfo[] {
  const tonalMode = MODES.find((item) => item.name === mode)?.tonalName
  if (!tonalMode) return []
  const scaleNotes = Scale.get(`${root} ${tonalMode}`).notes
  if (scaleNotes.length !== 7) return []

  return scaleNotes.map((chordRoot, degree) => {
    const notes = [0, 2, 4].map((offset) => scaleNotes[(degree + offset) % 7])
    const quality = getChordQuality(notes)
    const baseRoman = ROMAN_NUMERALS[degree]
    const roman = quality === 'minor' || quality === 'diminished'
      ? baseRoman.toLowerCase() + (quality === 'diminished' ? '°' : '')
      : baseRoman
    return {
      degree,
      root: chordRoot,
      name: getChordName(notes, chordRoot, quality),
      roman,
      quality,
      notes,
      seventh: scaleNotes[(degree + 6) % 7],
      ninth: scaleNotes[(degree + 1) % 7],
    }
  })
}

export type Voicing = 'triad' | 'extended' | 'open'

export function buildChord(chord: ChordInfo, voicing: Voicing): string[] {
  const baseNotes = chord.notes.map((note) => `${note}4`)
  if (voicing === 'triad') return baseNotes
  if (voicing === 'extended') return [...baseNotes, `${chord.seventh}5`, `${chord.ninth}5`]
  return [`${chord.root}3`, ...baseNotes.slice(1)]
}
