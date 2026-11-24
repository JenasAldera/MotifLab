import { Note } from 'tonal'

type PianoKeyboardProps = {
  activeNotes: string[]
}

const WHITE_NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const BLACK_NOTE_NAMES = ['C#', 'D#', '', 'F#', 'G#', 'A#', '']
const VIEW_WIDTH = 700
const WHITE_KEY_WIDTH = VIEW_WIDTH / 14
const BLACK_KEY_WIDTH = 25
const BLACK_KEY_HEIGHT = 77

function isActive(note: string, activeNotes: string[]): boolean {
  const midi = Note.midi(note)
  if (midi === null) return false
  const activePitches = activeNotes.map((activeNote) => Note.midi(activeNote)).filter((value): value is number => value !== null)
  return activePitches.some((activePitch) => activePitch % 12 === midi % 12)
}

export default function PianoKeyboard({ activeNotes }: PianoKeyboardProps) {
  const whiteKeys = Array.from({ length: 14 }, (_, index) => {
    const octave = index < 7 ? 3 : 4
    const name = WHITE_NOTE_NAMES[index % 7]
    const note = `${name}${octave}`
    return { note, name, x: index * WHITE_KEY_WIDTH, index }
  })

  const blackKeys = Array.from({ length: 14 }, (_, index) => {
    const name = BLACK_NOTE_NAMES[index % 7]
    if (!name) return null
    const octave = index < 7 ? 3 : 4
    const x = (index + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
    return { note: `${name}${octave}`, x }
  }).filter((key): key is { note: string; x: number } => key !== null)

  return (
    <svg className="piano-svg" viewBox={`0 0 ${VIEW_WIDTH} 132`} role="img" aria-label="Two octave piano keyboard with active notes highlighted">
      {whiteKeys.map(({ note, name, x, index }) => {
        const active = isActive(note, activeNotes)
        return (
          <g key={note}>
            <rect x={x} y="0" width={WHITE_KEY_WIDTH} height="128" rx="3" className={`piano-white-key ${active ? 'piano-key-active' : ''}`} />
            {(name === 'C' || name === 'F') && <text x={x + 7} y="115" className="piano-key-label">{name}{index === 0 || index === 7 ? note.slice(-1) : ''}</text>}
          </g>
        )
      })}
      {blackKeys.map(({ note, x }) => (
        <rect key={note} x={x} y="0" width={BLACK_KEY_WIDTH} height={BLACK_KEY_HEIGHT} rx="3" className={`piano-black-key ${isActive(note, activeNotes) ? 'piano-black-active' : ''}`} />
      ))}
    </svg>
  )
}
