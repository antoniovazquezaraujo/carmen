import { NoteData } from "./note";
import { OctavedGrade } from "./octaved-grade";

export enum ScaleTypes {
    'WHITE', 'BLUE', 'RED', 'BLACK', 'PENTA', 'TONES', 'FULL'
}

export class Scale {
    static SCALES: Scale[] = [
        new Scale([0, 2, 3, 5, 7, 9, 10]),
        new Scale([0, 2, 4, 5, 7, 8, 10]),
        new Scale([0, 1, 4, 5, 7, 8, 11]),
        new Scale([1, 2, 4, 5, 7, 8, 10, 11]),
        new Scale([0, 2, 5, 7, 10]),
        new Scale([0, 2, 4, 6, 8, 10]),
        new Scale([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    ];

    static getScaleByName(name: string): Scale {
        console.log(`[Scale] getScaleByName called with name: '${name}'`);
        let selectedScale: Scale;
        switch (name) {
            case 'WHITE': selectedScale = Scale.SCALES[0]; break;
            case 'BLUE': selectedScale = Scale.SCALES[1]; break;
            case 'RED': selectedScale = Scale.SCALES[2]; break;
            case 'BLACK': selectedScale = Scale.SCALES[3]; break;
            case 'PENTA': selectedScale = Scale.SCALES[4]; break;
            case 'TONES': selectedScale = Scale.SCALES[5]; break;
            case 'FULL': selectedScale = Scale.SCALES[6]; break;
            default:
                console.warn(`[Scale] getScaleByName: Name '${name}' not found, returning default (WHITE).`);
                selectedScale = Scale.SCALES[0]; 
                break;
        }
        console.log(`[Scale] getScaleByName returning scale with notes:`, selectedScale.notes);
        return selectedScale;
    }

    static getScaleNames(): string[] {
        return ['WHITE', 'BLUE', 'RED', 'BLACK', 'PENTA', 'TONES', 'FULL'];
    }

    static getNoteName(noteOrder: number): string {
        return Tonality[noteOrder % 12];
    }

    notes: number[];

    constructor(notes: number[]) {
        this.notes = notes;
    }
    gradeToChord(
        grade: number,
        density: number,
        tonality: number, 
        gap: number,
        shiftStart: number,
        shiftSize: number,
        shiftValue: number
    ): NoteData[] {
        var selectedGrades:OctavedGrade[] = this.getSelectedGrades(grade, density, gap);
        var shiftedGrades:OctavedGrade[] = this.getShiftedGrades(selectedGrades, shiftStart, shiftSize, shiftValue)
        var notes:NoteData[] = this.octavedGradesToNotes(shiftedGrades);
        if(tonality === undefined || tonality === 0){
            return notes;
        }else{
            return this.getTunnednoteDatas(notes, tonality);
        }        
    }
    octavedGradesToNotes(grades: OctavedGrade[]): NoteData[] {
        var chordNotes: NoteData[] = [];
        for (var n = 0; n < grades.length; n++) {
            var grade = grades[n];
            chordNotes.push(grade.tonoteData());
        }
        return chordNotes;
    }
    /**
     * Desplaza en octavas la ventana `[shiftStart, shiftStart + shiftSize)` de
     * una lista de grados ya ordenada (el acorde final). La ventana se recorta
     * a los límites disponibles (`clamp`), `shiftSize <= 0` no hace nada y el
     * desplazamiento se aplica in-place, como esperan sus consumidores.
     */
    getShiftedGrades(octavedGrades: OctavedGrade[], shiftStart: number, shiftSize: number, shiftValue: number): OctavedGrade[] {
        if (shiftSize <= 0 || shiftValue === 0 || octavedGrades.length === 0) {
            return octavedGrades;
        }
        // Con valores no enteros, el primer/último índice entero de la ventana.
        const start = Math.max(0, Math.ceil(shiftStart));
        const end = Math.min(octavedGrades.length, Math.ceil(shiftStart + shiftSize));
        for (let n = start; n < end; n++) {
            octavedGrades[n].octave += shiftValue;
        }
        return octavedGrades;
    }
    getTunnednoteDatas(noteDatas: NoteData[], tonality: number): NoteData[] {
        for (const noteData of noteDatas) {
            noteData.note! += tonality;
        }
        return noteDatas;
    }
    getSelectedGrades(rootNoteOrder: number, density: number, gap: number): OctavedGrade[] {
        var chordOctavedGrades: OctavedGrade[] = [];
        var octave = 0;

        var index = rootNoteOrder;
        if (index >= this.getNumNotes()) {
            octave += (Math.floor(index / this.getNumNotes()));
            index = index % this.getNumNotes();
        }
        if (index < 0) {
            octave -=  (Math.ceil(Math.abs(index) / this.getNumNotes()));
            index = Math.abs((this.getNumNotes() )+ index)% this.getNumNotes();
        }
        chordOctavedGrades.push(new OctavedGrade(this,index, octave, ''));

        for (var n = 0; n < density; n++) {
            index += gap;
            if (index >= this.getNumNotes()) {
                octave +=  (Math.floor(Math.abs(index) / this.getNumNotes()));
                index = index % this.getNumNotes();
            }
            if (index < 0) { 
                octave -=  (Math.floor(Math.abs(index) / this.getNumNotes()));
                index = Math.abs((this.getNumNotes() )+ index)% this.getNumNotes();
            }
            chordOctavedGrades.push(new OctavedGrade(this,index, octave, ''));
        }
        return chordOctavedGrades;  
    }
        

    /**
     * Returns the number of notes in this scale
     */
    getNumNotes(): number {
        return this.notes.length
    }

}

export enum Tonality {
    D = 0,
    e = 1,
    E = 2,
    F = 3,
    g = 4,
    G = 5,
    a = 6,
    A = 7,
    b = 8,
    B = 9,
    C = 10,
    d = 11
}
