import * as Tone from 'tone'
import { Note } from 'tonal'

export type PlaybackStyle = 'pad' | 'arpeggiator' | 'waltz'
export type Voicing = 'triad' | 'extended' | 'open'

export type PlaybackConfig = {
  progression: string[][]
  bpm: number
  beatsPerBar: 3 | 4
  style: PlaybackStyle
  voicing: Voicing
}

type PositionCallback = (slot: number, activeNotes: string[]) => void

class SoundEngine {
  private synth: Tone.PolySynth | null = null
  private filter: Tone.Filter | null = null
  private reverb: Tone.Reverb | null = null
  private repeatId: number | null = null
  private config: PlaybackConfig | null = null
  private onPosition: PositionCallback | null = null
  private step = 0

  async unlock(): Promise<void> {
    await Tone.start()
    if (!this.synth) {
      this.filter = new Tone.Filter({ frequency: 2400, type: 'lowpass', rolloff: -12 })
      this.reverb = new Tone.Reverb({ decay: 2.4, wet: 0.18 })
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.025, decay: 0.3, sustain: 0.62, release: 1.2 },
      })
      this.synth.volume.value = -9
      this.synth.chain(this.filter, this.reverb, Tone.getDestination())
    }
    await this.reverb?.ready
  }

  preview(notes: string[]): void {
    if (!this.synth) return
    this.synth.triggerAttackRelease(notes, 1.35)
  }

  start(config: PlaybackConfig, onPosition: PositionCallback): void {
    this.stop()
    if (!this.synth || config.progression.length === 0) return
    this.config = config
    this.onPosition = onPosition
    this.step = 0
    this.applyTransportSettings(config)
    this.repeatId = Tone.getTransport().scheduleRepeat((time) => this.tick(time), '8n')
    Tone.getTransport().start('+0.04')
  }

  updatePlayback(config: PlaybackConfig): void {
    if (!this.config) return
    this.config = config
    this.applyTransportSettings(config)
  }

  stop(): void {
    const transport = Tone.getTransport()
    if (this.repeatId !== null) {
      transport.clear(this.repeatId)
      this.repeatId = null
    }
    transport.stop()
    transport.cancel()
    this.synth?.releaseAll()
    this.config = null
    this.onPosition = null
    this.step = 0
  }

  private applyTransportSettings(config: PlaybackConfig): void {
    const transport = Tone.getTransport()
    transport.bpm.value = config.bpm
    transport.timeSignature = [config.beatsPerBar, 4]
  }

  private tick(time: number): void {
    const config = this.config
    if (!config || config.progression.length === 0) return
    const stepsPerBar = config.beatsPerBar * 2
    const withinBar = this.step % stepsPerBar
    const slot = Math.floor(this.step / stepsPerBar) % config.progression.length
    const chordNotes = config.progression[slot]
    if (!chordNotes?.length) return

    if (withinBar === 0) this.onPosition?.(slot, chordNotes)

    if (config.style === 'pad') {
      if (withinBar === 0) {
        const duration = (60 / config.bpm) * config.beatsPerBar * 0.94
        this.synth?.triggerAttackRelease(chordNotes, duration, time, 0.72)
      }
    } else if (config.style === 'arpeggiator') {
      const note = chordNotes[withinBar % chordNotes.length]
      this.onPosition?.(slot, [note])
      this.synth?.triggerAttackRelease(note, (60 / config.bpm) * 0.42, time, 0.78)
    } else {
      const beat = Math.floor(withinBar / 2)
      if (withinBar % 2 === 0) {
        const notes = beat === 0 ? [lowerOctave(chordNotes[0])] : chordNotes.slice(1)
        this.onPosition?.(slot, notes)
        this.synth?.triggerAttackRelease(notes, (60 / config.bpm) * 0.82, time, 0.76)
      }
    }
    this.step += 1
  }
}

function lowerOctave(note: string): string {
  const midi = Note.midi(note)
  return midi === null ? note : Note.fromMidi(midi - 12)
}

export const soundEngine = new SoundEngine()
