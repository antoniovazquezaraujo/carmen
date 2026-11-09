import { NoteData } from "./note";
import { PlayMode } from "./play.mode";
import { Scale, ScaleTypes, Tonality } from "./scale";
import { Block } from "./block";
import { Preset } from "./content";
import { InstrumentType } from "./instrument-type";
import { PlayState } from "./play.state";
import { BehaviorSubject, Subject } from "rxjs";
import { OctavedGrade } from "./octaved-grade";
import { NoteGenerationUnifiedService } from "./services/note-generation-unified.service";
import { DecorationItem } from "./mr/decoration.parser";
import { DEFAULT_VELOCITY, isVelocityProfileCommand, VelocityProfile, VelocityRamp } from "./velocity";

// Define missing constants (assuming default values, adjust if needed)
const DEFAULT_BPM = 120;
const MIN_BPM = 30;
const MAX_BPM = 240;

/** Instantánea de los ajustes que puede cambiar un preset/override. */
export interface PlayerPresetState {
    scale: ScaleTypes;
    tonality: number;
    timbre: number;
    density: number;
    inversion: number;
    octave: number;
    gap: number;
    shiftStart: number;
    shiftSize: number;
    shiftValue: number;
    velocity: number;
    velocityPattern: number[] | null;
    velocityRamp: VelocityRamp | null;
    playMode: PlayMode;
    currentPattern: NoteData[] | null;
    currentDecoration: DecorationItem[] | null;
    octavePattern: number[] | null;
}

type InstrumentId = string;

/** Superficie mínima del motor que usa el estado musical. */
interface PlayerAudioEngine {
    setTransportBpm(bpm: number): void;
}

export class Player {
    channel: number;
    scale: ScaleTypes = ScaleTypes.WHITE;
    tonality: number = Tonality.D;
    timbre: number = 0;
    noteDatas: NoteData[] = [];
    selectedNote: number = 0;
    density: number = 0;
    inversion: number = 0;
    octave: number = 2;
    gap: number = 2;
    shiftStart = 0;
    shiftSize = 0;
    shiftValue = 0;
    /** Intensidad base del preset (velocity MIDI 1–127). */
    velocity: number = DEFAULT_VELOCITY;
    /** Patrón cíclico de intensidades; `null` = sin patrón. */
    velocityPattern: number[] | null = null;
    /** Rampa de intensidad sobre notas generadas; `null` = sin rampa. */
    velocityRamp: VelocityRamp | null = null;
    /** Octavas de `OCTAVE_PATTERN`; `null` = sin expansión. */
    octavePattern: number[] | null = null;
    playMode: PlayMode = PlayMode.CHORD;

    /** Copia del perfil de intensidad (para ámbitos locales de bloque). */
    snapshotVelocityProfile(): VelocityProfile {
        return {
            velocity: this.velocity,
            velocityPattern: this.velocityPattern ? [...this.velocityPattern] : null,
            velocityRamp: this.velocityRamp ? { ...this.velocityRamp } : null
        };
    }

    restoreVelocityProfile(profile: VelocityProfile): void {
        this.velocity = profile.velocity;
        this.velocityPattern = profile.velocityPattern ? [...profile.velocityPattern] : null;
        this.velocityRamp = profile.velocityRamp ? { ...profile.velocityRamp } : null;
    }

    resetVelocityProfile(): void {
        this.velocity = DEFAULT_VELOCITY;
        this.velocityPattern = null;
        this.velocityRamp = null;
    }

    /**
     * Si el preset declara algún ajuste de intensidad, lo aplica como perfil
     * local del bloque: parte de defaults y devuelve el perfil anterior en
     * `endVelocityProfileScope`. Sin ajustes de intensidad no hay ámbito y se
     * conserva el perfil heredado.
     */
    beginVelocityProfileScope(commands: readonly { type: string }[]): VelocityProfile | null {
        if (!commands.some(command => isVelocityProfileCommand(command.type))) {
            return null;
        }
        const snapshot = this.snapshotVelocityProfile();
        this.resetVelocityProfile();
        return snapshot;
    }

    endVelocityProfileScope(snapshot: VelocityProfile | null): void {
        if (snapshot) {
            this.restoreVelocityProfile(snapshot);
        }
    }

    /**
     * `OCTAVE_PATTERN` es local al bloque: el comando lo fija durante la
     * pasada y se restaura antes de los hijos/hermanos.
     */
    beginOctavePatternScope(): number[] | null {
        const snapshot = this.octavePattern ? [...this.octavePattern] : null;
        this.octavePattern = null;
        return snapshot;
    }

    endOctavePatternScope(snapshot: number[] | null): void {
        this.octavePattern = snapshot ? [...snapshot] : null;
    }

    /** Instantánea para aplicar overrides locales y restaurarlos después. */
    snapshotPresetState(): PlayerPresetState {
        return {
            scale: this.scale,
            tonality: this.tonality,
            timbre: this.timbre,
            density: this.density,
            inversion: this.inversion,
            octave: this.octave,
            gap: this.gap,
            shiftStart: this.shiftStart,
            shiftSize: this.shiftSize,
            shiftValue: this.shiftValue,
            velocity: this.velocity,
            velocityPattern: this.velocityPattern ? [...this.velocityPattern] : null,
            velocityRamp: this.velocityRamp ? { ...this.velocityRamp } : null,
            playMode: this.playMode,
            currentPattern: this.currentPattern ? [...this.currentPattern] : null,
            currentDecoration: this.currentDecoration ? [...this.currentDecoration] : null,
            octavePattern: this.octavePattern ? [...this.octavePattern] : null
        };
    }

    restorePresetState(state: PlayerPresetState): void {
        this.scale = state.scale;
        this.tonality = state.tonality;
        this.timbre = state.timbre;
        this.density = state.density;
        this.inversion = state.inversion;
        this.octave = state.octave;
        this.gap = state.gap;
        this.shiftStart = state.shiftStart;
        this.shiftSize = state.shiftSize;
        this.shiftValue = state.shiftValue;
        this.velocity = state.velocity;
        this.velocityPattern = state.velocityPattern ? [...state.velocityPattern] : null;
        this.velocityRamp = state.velocityRamp ? { ...state.velocityRamp } : null;
        this.playMode = state.playMode;
        this.currentPattern = state.currentPattern ? [...state.currentPattern] : null;
        this.currentDecoration = state.currentDecoration ? [...state.currentDecoration] : null;
        this.octavePattern = state.octavePattern ? [...state.octavePattern] : null;
    }
    instrumentType: InstrumentType;
    instrumentId: InstrumentId;
    currentPattern: NoteData[] | null = null;
    /** Items de `DECORATION` activos; `null` = sin adorno. */
    currentDecoration: DecorationItem[] | null = null;

    // Unified note generation service for consistent note creation
    private noteGenUnified = new NoteGenerationUnifiedService();

    private _playState = PlayState.STOPPED;
    private _playProgress = 0;
    private _bpm = DEFAULT_BPM;
    private _isMuted = false;

    private playStateSubject = new BehaviorSubject<PlayState>(this._playState);
    private playProgressSubject = new BehaviorSubject<number>(this._playProgress);
    private bpmSubject = new BehaviorSubject<number>(this._bpm);
    private isMutedSubject = new BehaviorSubject<boolean>(this._isMuted);
    private stopEventSubject = new Subject<void>();
    private errorSubject = new Subject<Error>();

    playState$ = this.playStateSubject.asObservable();
    playProgress$ = this.playProgressSubject.asObservable();
    bpm$ = this.bpmSubject.asObservable();
    isMuted$ = this.isMutedSubject.asObservable();
    stopEvent$ = this.stopEventSubject.asObservable();
    error$ = this.errorSubject.asObservable();

    constructor(
        channel: number,
        instrumentType: InstrumentType,
        instrumentId: InstrumentId,
        private audioEngine: PlayerAudioEngine
    ) {
        this.channel = channel;
        this.instrumentType = instrumentType;
        this.instrumentId = instrumentId;
    }

    get playState(): PlayState { return this._playState; }
    get playProgress(): number { return this._playProgress; }
    get bpm(): number { return this._bpm; }
    get isMuted(): boolean { return this._isMuted; }

    setPlayState(newState: PlayState): void {
        if (this._playState !== newState) {
            this._playState = newState;
            this.playStateSubject.next(this._playState);
        }
    }

    setPlayProgress(newProgress: number): void {
        const clampedProgress = Math.max(0, Math.min(1, newProgress));
        if (this._playProgress !== clampedProgress) {
            this._playProgress = clampedProgress;
            this.playProgressSubject.next(this._playProgress);
        }
    }

    setBpm(newBpm: number): void {
        const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
        if (this._bpm !== clampedBpm) {
            this._bpm = clampedBpm;
            this.audioEngine.setTransportBpm(this._bpm);
            this.bpmSubject.next(this._bpm);
        }
    }

    toggleMute(): void {
        this._isMuted = !this._isMuted;
        this.isMutedSubject.next(this._isMuted);
    }

    reportError(error: Error): void {
        console.error("[Player] Reporting error:", error);
        this.errorSubject.next(error);
    }

    /**
     * Grados finales del acorde (density/gap → INV → SHIFT) en la escala y
     * octava del player, sin convertir todavía a MIDI. `DECORATION` los usa
     * para sumar sus offsets en grados de escala.
     */
    getSelectedOctavedGrades(): OctavedGrade[] {
        const scaleName = ScaleTypes[this.scale];
        const scale = Scale.getScaleByName(scaleName);
        if (!scale) {
            console.error(`[Player] Invalid scale type. Enum value: ${this.scale}, Derived name: '${scaleName}'`);
            return [];
        }

        const notesToGenerate = this.density + 1;
        let grades: number[] = [];

        for (let i = 0; i < notesToGenerate; i++) {
            grades.push(this.selectedNote + i * this.gap);
        }

        if (this.inversion > 0 && grades.length > 1) {
            const inversionCount = this.inversion % grades.length;
            const notesToInvert = grades.slice(0, inversionCount);
            const remainingNotes = grades.slice(inversionCount);
            const scaleSize = scale.getNumNotes();
            const invertedNotes = notesToInvert.map(g => g + scaleSize);
            grades = [...remainingNotes, ...invertedNotes];
        }

        // SHIFTSTART/SHIFTSIZE/SHIFTVALUE: la ventana [shiftStart, shiftStart+shiftSize)
        // se aplica sobre el acorde final (después de la inversión) y suma
        // shiftValue octavas a las notas afectadas. Sin comandos (0/0/0) el
        // resultado es idéntico al de siempre.
        const octavedGrades = grades.map(grade => new OctavedGrade(scale, grade, this.octave));
        scale.getShiftedGrades(octavedGrades, this.shiftStart, this.shiftSize, this.shiftValue);
        return octavedGrades;
    }

    getSelectedNotes(): NoteData[] {
        const octavedGrades = this.getSelectedOctavedGrades();

        let midiNotes: NoteData[] = octavedGrades.map(octavedGrade => {
            const midiNote = octavedGrade.toNote() + this.tonality;
            
            // Use unified service for consistent note creation
            const noteResult = this.noteGenUnified.createNoteNoteData(midiNote);
            return noteResult.success && noteResult.data ? noteResult.data : new NoteData({ type: 'note', note: midiNote });
        });
        
        console.log(`[Player] getSelectedNotes for grade ${this.selectedNote}: Density=${this.density}, Gap=${this.gap}, Inversion=${this.inversion}, Octave=${this.octave}, Tonality=${this.tonality} -> MIDI Notes:`, midiNotes.map(n=>n.note));
        return midiNotes; 
    }

    /**
     * MIDI de un grado final del acorde desplazado `offset` **grados de escala**
     * (DECORATION). Re-normaliza el grado con `OctavedGrade` (misma escala,
     * octava y tonalidad), así el adorno se mantiene dentro de la escala.
     */
    decoratedMidiNote(octavedGrade: OctavedGrade, offset: number): number {
        const shiftedGrade = new OctavedGrade(octavedGrade.scale, octavedGrade.grade + offset, octavedGrade.octave);
        return shiftedGrade.toNote() + this.tonality;
    }

    generateNoteDataFromScale(scale: any, tunnedNote: number, tonality: number): NoteData[] {
        console.warn("[Player] generateNoteDataFromScale called, potentially redundant?");
        return [];
    }

    selectNotes(): void {
        console.warn("[Player] selectNotes called, purpose unclear?");
        this.noteDatas = [];
    }

    setInversion(noteDatas: NoteData[]): NoteData[] {
        console.warn("[Player] setInversion called, logic moved to getSelectedNotes.");
        var invertednoteDatas: NoteData[] = [];
        for (var n = 0; n < noteDatas.length; n++) {
            var noteData = noteDatas[n];
            if (n < this.inversion && noteData.note !== undefined) {
                noteData.note += 12;
            }
            invertednoteDatas.push(noteData);
        }
        return invertednoteDatas;
    }

    setOctave(chordNotes: NoteData[]): NoteData[] {
        console.warn("[Player] setOctave called, logic moved to getSelectedNotes.");
        var octavednoteDatas: NoteData[] = [];
        for (var noteData of chordNotes) {
            if (noteData.note !== undefined) {
                noteData.note += (this.octave * 12);
            }
            octavednoteDatas.push(noteData);
        }
        return octavednoteDatas;
    }

    selectScale(scale: ScaleTypes) {
        this.scale = scale;
    }

    getScale(): ScaleTypes {
        return this.scale;
    }

    executePreset(preset: Preset): void {
        console.log(`[Player] Executing preset '${preset.label}' on player for instrument ${this.instrumentId}`);
        preset.settings.forEach(setting => {
            setting.execute(this);
        });
    }

    /** Ejecuta el preset del bloque, si lo tiene. */
    executeBlockPreset(block: Block): void {
        if (block.preset) {
            this.executePreset(block.preset);
        }
    }
}