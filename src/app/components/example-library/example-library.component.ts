import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { EXAMPLE_SONGS, ExampleSong } from 'src/app/model/examples';

/**
 * Compact side panel with the example library. A title is enough: clicking it
 * loads the song and starts playback immediately.
 */
@Component({
    selector: 'app-example-library',
    templateUrl: './example-library.component.html',
    styleUrls: ['./example-library.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExampleLibraryComponent {
    @Output() close = new EventEmitter<void>();
    @Output() loadExample = new EventEmitter<ExampleSong>();

    readonly examples = EXAMPLE_SONGS;

    trackByExample(_index: number, example: ExampleSong): string {
        return example.id;
    }

    select(example: ExampleSong): void {
        this.loadExample.emit(example);
    }
}
