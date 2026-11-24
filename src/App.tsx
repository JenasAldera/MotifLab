import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  AudioLines,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  Headphones,
  Minus,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Volume2,
  Waves,
} from 'lucide-react'
import type { PlaybackStyle, Voicing } from './audio/soundEngine'
import PianoKeyboard from './components/PianoKeyboard'
import {
  buildChord,
  getScaleChords,
  MODES,
  NOTE_NAMES,
  type ChordInfo,
  type ModeName,
} from './utils/musicTheory'
import './App.css'

async function loadSoundEngine() {
  const { soundEngine } = await import('./audio/soundEngine')
  return soundEngine
}

type SoundEngineInstance = Awaited<ReturnType<typeof loadSoundEngine>>

type Preset = {
  name: string
  description: string
  root: string
  mode: ModeName
  degrees: number[]
  icon: 'spark' | 'waves' | 'music' | 'headphones'
}

const PRESETS: Preset[] = [
  {
    name: 'Cinematic Heroic',
    description: 'Wide, uplifting momentum',
    root: 'D',
    mode: 'Dorian',
    degrees: [0, 6, 3, 4],
    icon: 'spark',
  },
  {
    name: 'Melancholic Waltz',
    description: 'A slow dance in the dark',
    root: 'C',
    mode: 'Natural Minor',
    degrees: [0, 5, 2, 6],
    icon: 'waves',
  },
  {
    name: 'Boss Fight Tension',
    description: 'Dark, restless, dramatic',
    root: 'E',
    mode: 'Phrygian',
    degrees: [0, 1, 6, 0],
    icon: 'music',
  },
  {
    name: 'Dream Sequence',
    description: 'Weightless and luminous',
    root: 'F',
    mode: 'Lydian',
    degrees: [0, 1, 4, 0],
    icon: 'headphones',
  },
]

const STYLE_OPTIONS: { label: string; value: PlaybackStyle; detail: string }[] = [
  { label: 'Pad', value: 'pad', detail: 'Block chords' },
  { label: 'Arpeggiator', value: 'arpeggiator', detail: 'Broken chord' },
  { label: 'Waltz', value: 'waltz', detail: 'Bass · chord · chord' },
]

const VOICING_OPTIONS: { label: string; value: Voicing; detail: string }[] = [
  { label: 'Triad', value: 'triad', detail: 'Root · 3rd · 5th' },
  { label: '7th / 9th', value: 'extended', detail: 'Color tones' },
  { label: 'Cinematic', value: 'open', detail: 'Open, low-root' },
]

const PRESET_ICONS = {
  spark: Sparkles,
  waves: Waves,
  music: Music2,
  headphones: Headphones,
}

function App() {
  const [root, setRoot] = useState('C')
  const [mode, setMode] = useState<ModeName>('Natural Minor')
  const [progression, setProgression] = useState([0, 5, 2, 6])
  const [bpm, setBpm] = useState(92)
  const [meter, setMeter] = useState<3 | 4>(3)
  const [style, setStyle] = useState<PlaybackStyle>('waltz')
  const [voicing, setVoicing] = useState<Voicing>('triad')
  const [playing, setPlaying] = useState(false)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [activeNotes, setActiveNotes] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState('Melancholic Waltz')
  const [previewDegree, setPreviewDegree] = useState<number | null>(null)
  const [audioError, setAudioError] = useState('')
  const soundEngineRef = useRef<SoundEngineInstance | null>(null)

  const chords = useMemo(() => getScaleChords(root, mode), [root, mode])
  const progressionChords = useMemo(
    () => progression.map((degree) => chords[degree]).filter((chord): chord is ChordInfo => Boolean(chord)),
    [chords, progression],
  )

  useEffect(() => {
    if (!playing) return
    let cancelled = false
    void loadSoundEngine().then((engine) => {
      if (cancelled) return
      soundEngineRef.current = engine
      engine.updatePlayback({
        progression: progressionChords.map((chord) => buildChord(chord, voicing)),
        bpm,
        beatsPerBar: meter,
        style,
        voicing,
      })
    }).catch((error: unknown) => {
      setAudioError(error instanceof Error ? error.message : 'Audio engine could not be loaded.')
    })
    return () => { cancelled = true }
  }, [bpm, meter, playing, progressionChords, style, voicing])

  useEffect(
    () => () => {
      soundEngineRef.current?.stop()
    },
    [],
  )

  const runAudioAction = async (action: (engine: SoundEngineInstance) => void) => {
    setAudioError('')
    try {
      const engine = await loadSoundEngine()
      soundEngineRef.current = engine
      await engine.unlock()
      action(engine)
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : 'Audio could not be started.')
    }
  }

  const previewChord = (chord: ChordInfo) => {
    setPreviewDegree(chord.degree)
    void runAudioAction((engine) => {
      const notes = buildChord(chord, voicing)
      setActiveNotes(notes)
      engine.preview(notes)
    })
  }

  const togglePlayback = () => {
    if (playing) {
      soundEngineRef.current?.stop()
      setPlaying(false)
      setActiveSlot(null)
      setActiveNotes([])
      return
    }
    if (progression.length < 1) return
    void runAudioAction((engine) => {
      engine.start(
        {
          progression: progressionChords.map((chord) => buildChord(chord, voicing)),
          bpm,
          beatsPerBar: meter,
          style,
          voicing,
        },
        (slot, notes) => {
          setActiveSlot(slot)
          setActiveNotes(notes)
        },
      )
      setPlaying(true)
    })
  }

  const addChord = (degree: number) => {
    setSelectedPreset('')
    setProgression((current) => (current.length < 8 ? [...current, degree] : current))
  }

  const removeChord = (slot: number) => {
    setSelectedPreset('')
    if (playing && progression.length === 1) {
      soundEngineRef.current?.stop()
      setPlaying(false)
      setActiveSlot(null)
      setActiveNotes([])
    }
    setProgression((current) => current.filter((_, index) => index !== slot))
  }

  const loadPreset = (preset: Preset) => {
    soundEngineRef.current?.stop()
    setPlaying(false)
    setActiveSlot(null)
    setActiveNotes([])
    setRoot(preset.root)
    setMode(preset.mode)
    setProgression(preset.degrees)
    setSelectedPreset(preset.name)
    if (preset.name === 'Melancholic Waltz') {
      setMeter(3)
      setStyle('waltz')
    } else {
      setMeter(4)
      setStyle('pad')
    }
  }

  const exportMidi = async () => {
    if (progressionChords.length === 0) return
    setAudioError('')
    try {
      const { default: MidiWriter } = await import('midi-writer-js')
      const track = new MidiWriter.Track()
      track.addTrackName('MotifLab progression')
      track.setTempo(bpm)
      track.setTimeSignature(meter, 4)
      const duration = meter === 3 ? '2.' : '1'
      progressionChords.forEach((chord) => {
        track.addEvent(
          new MidiWriter.NoteEvent({
            pitch: buildChord(chord, voicing),
            duration,
            velocity: 82,
          }),
        )
      })
      const fileBytes = new MidiWriter.Writer(track).buildFile()
      const midiBuffer = new ArrayBuffer(fileBytes.byteLength)
      new Uint8Array(midiBuffer).set(fileBytes)
      const url = URL.createObjectURL(new Blob([midiBuffer], { type: 'audio/midi' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'motiflab-progression.mid'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : 'MIDI export could not be created.')
    }
  }

  const clearProgression = () => {
    soundEngineRef.current?.stop()
    setPlaying(false)
    setProgression([])
    setSelectedPreset('')
    setActiveSlot(null)
    setActiveNotes([])
  }

  return (
    <main className="studio min-h-screen">
      <header className="topbar">
        <a className="brand" href="#" aria-label="MotifLab home">
          <span className="brand-mark"><AudioLines size={21} strokeWidth={2.2} /></span>
          <span>motif<span className="brand-light">lab</span></span>
        </a>
        <div className="topbar-center"><span className="live-dot" /> SOUND DESIGN WORKSPACE</div>
        <div className="topbar-right">
          <span className="autosave"><Check size={13} /> Ready to create</span>
          <button className="help-button" title="Compose, arrange, and export a musical idea"><CircleHelp size={17} /></button>
        </div>
      </header>

      <section className="hero-row">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> COMPOSITION SUITE <span className="eyebrow-version">01 / 04</span></p>
          <h1>Find your next <span>motif.</span></h1>
          <p className="hero-subtitle">Shape a feeling into a progression. Hear it, refine it, make it yours.</p>
        </div>
        <div className="hero-tag"><span className="tag-icon"><Sparkles size={15} /></span> A LITTLE THEORY. A LOT OF FEELING.</div>
      </section>

      <section className="control-panel panel">
        <div className="panel-heading">
          <div className="section-title"><span className="section-number">01</span><div><h2>Set the scene</h2><p>Choose a tonal center and a feeling</p></div></div>
          <div className="key-signature"><span className="signature-dot" /> KEY SIGNATURE <strong>{root} {mode.toLowerCase()}</strong></div>
        </div>
        <div className="scene-controls">
          <div className="root-control">
            <label className="field-label" htmlFor="root-note">ROOT NOTE</label>
            <div className="select-wrap">
              <select id="root-note" value={root} onChange={(event) => { setRoot(event.target.value); setSelectedPreset('') }}>
                {NOTE_NAMES.map((note) => <option key={note} value={note}>{note}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="mode-control">
            <label className="field-label" htmlFor="scale-mode">SCALE / MODE</label>
            <div className="select-wrap">
              <select id="scale-mode" value={mode} onChange={(event) => { setMode(event.target.value as ModeName); setSelectedPreset('') }}>
                {MODES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="mood-card">
            <span className="mood-spark"><Sparkles size={15} /></span>
            <div><span className="mood-label">THE MOOD</span><p>{MODES.find((item) => item.name === mode)?.mood}</p></div>
            <span className="mood-accent" />
          </div>
          <div className="scene-note"><span className="note-wave"><Waves size={16} /></span><span>Built for <strong>stories</strong><br />that stay with you.</span></div>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="panel palette-panel">
          <div className="panel-heading compact-heading">
            <div className="section-title"><span className="section-number">02</span><div><h2>Chord palette</h2><p>Seven colors in your scale</p></div></div>
            <span className="micro-badge">{root} {mode.toUpperCase()}</span>
          </div>
          <div className="chord-list">
            {chords.map((chord) => (
              <article className={`chord-card ${previewDegree === chord.degree ? 'chord-previewed' : ''}`} key={chord.degree}>
                <button className="chord-preview" onClick={() => previewChord(chord)} aria-label={`Preview ${chord.name}`}>
                  <span className="chord-index">{String(chord.degree + 1).padStart(2, '0')}</span>
                  <span className="chord-core"><strong>{chord.roman}</strong><span>{chord.name}</span></span>
                  <span className="chord-quality">{chord.quality}</span>
                  <Volume2 className="preview-icon" size={15} />
                </button>
                <button className="add-chord" onClick={() => addChord(chord.degree)} disabled={progression.length >= 8} aria-label={`Add ${chord.name} to progression`}><Plus size={16} /></button>
              </article>
            ))}
          </div>
          <p className="palette-hint"><Volume2 size={13} /> Click to preview <span>·</span> <Plus size={13} /> to add to your progression</p>
        </div>

        <div className="panel timeline-panel">
          <div className="panel-heading compact-heading timeline-heading">
            <div className="section-title"><span className="section-number">03</span><div><h2>Progression timeline</h2><p>Your idea, measure by measure</p></div></div>
            <button className="clear-button" onClick={clearProgression} disabled={progression.length === 0}><RotateCcw size={13} /> CLEAR</button>
          </div>
          <div className="timeline-meta"><span><span className="tiny-indicator" /> PATTERN SEQUENCE</span><span>{progression.length} / 8 SLOTS <span className="meta-divider">·</span> {meter}/4</span></div>
          <div className="timeline-slots">
            {Array.from({ length: 8 }, (_, slot) => {
              const chord = progression[slot] === undefined ? undefined : chords[progression[slot]]
              return (
                <div className={`timeline-slot ${chord ? 'slot-filled' : 'slot-empty'} ${activeSlot === slot ? 'slot-active' : ''}`} key={slot}>
                  <span className="slot-number">{String(slot + 1).padStart(2, '0')}</span>
                  {chord ? (
                    <>
                      <span className="slot-roman">{chord.roman}</span>
                      <span className="slot-name">{chord.name}</span>
                      <button className="remove-slot" onClick={() => removeChord(slot)} title={`Remove ${chord.name}`} aria-label={`Remove chord from slot ${slot + 1}`}><Minus size={13} /></button>
                    </>
                  ) : <span className="empty-mark">+</span>}
                  {activeSlot === slot && <span className="playing-bars"><i /><i /><i /><i /></span>}
                </div>
              )
            })}
          </div>
          <div className="transport">
            <button className={`play-button ${playing ? 'is-playing' : ''}`} onClick={togglePlayback} disabled={progression.length === 0}>
              {playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
              <span>{playing ? 'Stop playback' : 'Play progression'}</span>
            </button>
            <div className="tempo-control">
              <div className="tempo-label"><span>BPM</span><strong>{bpm}</strong></div>
              <input aria-label="Tempo in beats per minute" type="range" min="60" max="180" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} style={{ '--range-progress': `${((bpm - 60) / 120) * 100}%` } as CSSProperties} />
              <div className="tempo-extremes"><span>60</span><span>180</span></div>
            </div>
            <div className="meter-control"><span className="control-caption">METER</span><div className="segmented-control meter-switch">
              <button onClick={() => setMeter(4)} className={meter === 4 ? 'selected' : ''}>4/4</button>
              <button onClick={() => { setMeter(3); setStyle('waltz') }} className={meter === 3 ? 'selected' : ''}>3/4</button>
            </div></div>
          </div>
          {audioError && <p className="audio-error" role="alert">{audioError}</p>}
        </div>
      </section>

      <section className="panel presets-panel">
        <div className="panel-heading compact-heading preset-heading">
          <div className="section-title"><span className="section-number">04</span><div><h2>Start somewhere</h2><p>Good things begin with a feeling</p></div></div>
          <span className="preset-aside"><Sparkles size={13} /> MADE TO BE PLAYED WITH</span>
        </div>
        <div className="preset-grid">
          {PRESETS.map((preset, index) => {
            const Icon = PRESET_ICONS[preset.icon]
            return (
              <button key={preset.name} onClick={() => loadPreset(preset)} className={`preset-card ${selectedPreset === preset.name ? 'preset-selected' : ''}`}>
                <span className={`preset-icon preset-icon-${index}`}><Icon size={16} /></span>
                <span className="preset-copy"><strong>{preset.name}</strong><small>{preset.description}</small></span>
                <span className="preset-arrow">↗</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel performance-panel">
          <div className="panel-heading compact-heading">
            <div className="section-title"><span className="section-number">05</span><div><h2>Performance</h2><p>Choose how it moves</p></div></div>
            <span className="subtle-status"><span className="status-dot" /> {playing ? 'PLAYING LIVE' : 'READY'}</span>
          </div>
          <div className="performance-groups">
            <div className="option-group">
              <span className="field-label">PLAYBACK STYLE</span>
              <div className="option-row">
                {STYLE_OPTIONS.map((option) => (
                  <button className={`option-button ${style === option.value ? 'option-active' : ''}`} key={option.value} onClick={() => setStyle(option.value)}>
                    <span>{option.label}</span><small>{option.detail}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="option-group">
              <span className="field-label">VOICING</span>
              <div className="option-row">
                {VOICING_OPTIONS.map((option) => (
                  <button className={`option-button ${voicing === option.value ? 'option-active' : ''}`} key={option.value} onClick={() => setVoicing(option.value)}>
                    <span>{option.label}</span><small>{option.detail}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel piano-panel">
          <div className="panel-heading compact-heading">
            <div className="section-title"><span className="section-number">06</span><div><h2>Note activity</h2><p>Live pitch visualization</p></div></div>
            <span className="octave-label">C3 — B4 <span>· 2 OCTAVES</span></span>
          </div>
          <PianoKeyboard activeNotes={activeNotes} />
          <div className="keyboard-footer"><span><i className="key-legend-dot" /> ACTIVE NOTES</span><span>{activeNotes.length ? activeNotes.join('  ·  ') : 'Waiting for playback'}</span></div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-left"><span className="footer-logo"><AudioLines size={14} /></span> MOTIFLAB <span className="footer-divider">/</span> YOUR NEXT IDEA STARTS HERE</div>
        <button className="export-button" onClick={exportMidi} disabled={!progression.length}><Download size={15} /> Export .MID</button>
      </footer>
    </main>
  )
}

export default App
