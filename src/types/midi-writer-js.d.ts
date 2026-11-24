declare module 'midi-writer-js' {
  class Track {
    addTrackName(name: string): this
    setTempo(bpm: number): this
    setTimeSignature(numerator: number, denominator: number): this
    addEvent(event: NoteEvent): this
  }

  class NoteEvent {
    constructor(options: {
      pitch: string[]
      duration: string
      velocity?: number
    })
  }

  class Writer {
    constructor(track: Track | Track[])
    buildFile(): Uint8Array
    dataUri(): string
  }

  const MidiWriter: {
    Track: typeof Track
    NoteEvent: typeof NoteEvent
    Writer: typeof Writer
  }

  export default MidiWriter
}
