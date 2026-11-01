import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { TreeDragDropService } from 'primeng/api';
import { SongPlayer } from './model/song.player';
import { NoteGenerationService } from './services/note-generation.service';
import { NoteGenerationUnifiedService } from './shared/services/note-generation-unified.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideAnimations(),
    providePrimeNG({ theme: { preset: Aura } }),
    TreeDragDropService,
    SongPlayer,
    // Servicios puros (sin @Injectable) instanciados por factory.
    { provide: NoteGenerationUnifiedService, useFactory: () => new NoteGenerationUnifiedService() },
    {
      provide: NoteGenerationService,
      useFactory: (unified: NoteGenerationUnifiedService) => new NoteGenerationService(unified),
      deps: [NoteGenerationUnifiedService]
    }
  ]
};
