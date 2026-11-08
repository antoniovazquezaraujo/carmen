import { Component, Input, Output, EventEmitter, forwardRef, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MelodyEditorService } from '../../services/melody-editor.service';
import { MelodyEditorComponent } from '../melody-editor/melody-editor.component';
import { NoteDuration } from '../../model/melody';

@Component({
    selector: 'app-melody-editor-wrapper',
    template: `
        <app-melody-editor 
            [notes]="notes" 
            (notesChange)="onNotesChange($event)"
            [showVariableIcon]="showVariableIcon"
            [playingBlockId]="blockId"
            [defaultDurationOverride]="defaultDurationOverride">
        </app-melody-editor>
    `,
    providers: [
        MelodyEditorService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MelodyEditorWrapperComponent),
            multi: true
        }
    ],
    imports: [MelodyEditorComponent]
})
export class MelodyEditorWrapperComponent implements ControlValueAccessor {
    @Input() notes: string = '';
    @Input() showVariableIcon: boolean = true;
    /** Bloque que edita el control; el editor lo usa para el resaltado `playing`. */
    @Input() blockId?: number;
    /** Duración propia de la melodía; si existe, prevalece sobre la global. */
    @Input() defaultDurationOverride?: NoteDuration;

    private onChange = (_: any) => {};
    private onTouched = () => {};

    constructor(private cdr: ChangeDetectorRef) {}

    writeValue(value: any): void {
        const newValue = value || '';
        if (newValue !== this.notes) {
            this.notes = newValue;
            this.cdr.detectChanges();
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    onNotesChange(newNotesValue: string): void {
        if (newNotesValue !== this.notes) {
            this.notes = newNotesValue;
            this.onChange(this.notes);
        }
        this.onTouched();
    }
} 