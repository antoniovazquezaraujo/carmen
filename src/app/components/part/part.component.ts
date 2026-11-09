import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { CdkDrag, type CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Button, ButtonDirective } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'primeng/tooltip';
import { Bind } from 'primeng/bind';
import { TreeDragDropService } from 'primeng/api';
import type { TreeNodeDragEvent } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Block } from 'src/app/model/block';
import { Part } from 'src/app/model/part';
import { Song } from 'src/app/model/song';
import { SongPlayer } from 'src/app/model/song.player';
import type { ContentEditRequest } from '../block-content-links/block-content-links.component';
import { BlockComponent } from '../block/block.component';
import {
    containsBlock,
    findBlockById,
    moveBlockBetween,
    moveBlockWithin
} from '../parts/parts-layout';

/**
 * Parte de la canción: nombre, instrumento y una secuencia de bloques
 * estructurales (`Part.items: Block[]`, ADR-004). Sin referencias `use`.
 */
@Component({
    selector: 'app-part',
    templateUrl: './part.component.html',
    styleUrls: ['./part.component.scss'],
    imports: [Bind, Button, CdkDrag, CdkDropList, FormsModule, Tooltip, ButtonDirective, BlockComponent]
})
export class PartComponent implements OnInit, OnDestroy {
    @Input() part!: Part;
    @Input() song!: Song;
    @Output() onDuplicatePart: EventEmitter<Part>;
    @Output() onRemovePart: EventEmitter<Part>;
    @Output() duplicateBlockEvent = new EventEmitter<{ block: Block; partId: number }>();
    @Output() removeBlockEvent = new EventEmitter<{ blockId: number; partId: number }>();
    @Output() addChildEvent = new EventEmitter<{ parentBlock: Block | null; partId: number }>();
    @Output() playPartEvent = new EventEmitter<number>();
    @Output() stopPartEvent = new EventEmitter<number>();
    /** Navegación desde un chip de contenido hasta la biblioteca. */
    @Output() contentEditEvent = new EventEmitter<ContentEditRequest>();

    currentBlock: Block = new Block();
    isExpanded = true;
    /** Bloque raíz que se está arrastrando, para apagar su tooltip. */
    draggedRootBlockId: number | null = null;

    /** `true` mientras un bloque hijo se arrastra con PrimeNG. */
    primeDragActive = false;
    /** Zona inferior resaltada mientras el bloque hijo está encima. */
    rootDropActive = false;

    private primeDrag: TreeNodeDragEvent | null = null;
    private readonly subscriptions = new Subscription();

    constructor(
        private readonly songPlayer: SongPlayer,
        private readonly cdr: ChangeDetectorRef,
        private readonly dragDropService: TreeDragDropService
    ) {
        this.onDuplicatePart = new EventEmitter<Part>();
        this.onRemovePart = new EventEmitter<Part>();
    }

    /** Bloques de la parte (ya no hay `BlockReference` ni `PartItem`). */
    get blocks(): Block[] {
        return this.part.items;
    }

    trackByBlock(_index: number, block: Block): number {
        return block.id;
    }

    hasChildren(_index: number, block: Block): boolean {
        return !!block.children && block.children.length > 0;
    }

    /** Añade un bloque raíz a la parte. */
    addRootBlock(): void {
        const block = new Block();
        this.part.items.push(block);
        this.currentBlock = block;
        this.addChildEvent.emit({ parentBlock: null, partId: this.part.id });
    }

    onRootDragStarted(block: Block): void {
        this.draggedRootBlockId = block.id;
    }

    onRootDragEnded(): void {
        this.draggedRootBlockId = null;
    }

    /** Reordena/mueve bloques raíz o los anida si se sueltan en una cabecera. */
    onBlockDrop(event: CdkDragDrop<Block[]>): void {
        this.draggedRootBlockId = null;
        const moved = event.previousContainer.data[event.previousIndex];
        const nestTarget = this.blockHeaderAt(event.event);

        if (nestTarget) {
            if (!moved || containsBlock(moved, nestTarget)) {
                return;
            }
            event.previousContainer.data.splice(event.previousIndex, 1);
            nestTarget.children.push(moved);
            (nestTarget as Block & { expanded?: boolean }).expanded = true;
            this.currentBlock = nestTarget;
            this.cdr.detectChanges();
            return;
        }

        if (event.previousContainer === event.container) {
            moveBlockWithin(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            moveBlockBetween(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex
            );
        }
        this.currentBlock = event.container.data[event.currentIndex] ?? this.part.items[0] ?? new Block();
    }

    /** Bloque cuya cabecera está bajo el puntero en el momento del drop. */
    private blockHeaderAt(event: Event): Block | null {
        if (typeof document === 'undefined') {
            return null;
        }
        const pointer = event as MouseEvent;
        if (typeof pointer.clientX !== 'number' || typeof pointer.clientY !== 'number') {
            return null;
        }
        const element = document.elementFromPoint(pointer.clientX, pointer.clientY);
        const header = element?.closest('.block-header') as HTMLElement | null;
        const id = Number(header?.dataset['blockId']);
        if (!header || !Number.isInteger(id)) {
            return null;
        }
        return findBlockById(this.song?.parts ?? [this.part], id);
    }

    onDuplicateBlock(block: Block): void {
        const copy = block.clone();
        const rootIndex = this.part.items.findIndex(item => item.id === block.id);
        if (rootIndex !== -1) {
            this.part.items.splice(rootIndex + 1, 0, copy);
            this.duplicateBlockEvent.emit({ block: copy, partId: this.part.id });
            return;
        }

        const parent = this.findParentBlock(this.part.items, block);
        if (parent) {
            const childIndex = parent.children.findIndex(child => child.id === block.id);
            parent.children.splice(childIndex + 1, 0, copy);
            this.duplicateBlockEvent.emit({ block: copy, partId: this.part.id });
            return;
        }

        this.part.items.push(copy);
        this.duplicateBlockEvent.emit({ block: copy, partId: this.part.id });
    }

    onRemoveBlock(block: Block): void {
        const blockId = block.id;
        this.part.removeBlock(block);
        this.removeBlockEvent.emit({ blockId, partId: this.part.id });
    }

    onAddChild(parentBlock: Block | null): void {
        const newBlock = new Block();
        if (parentBlock) {
            parentBlock.children.push(newBlock);
        } else {
            this.part.items.push(newBlock);
        }
        this.currentBlock = newBlock;
        this.addChildEvent.emit({ parentBlock, partId: this.part.id });
    }

    ngOnInit(): void {
        if (this.part.items.length > 0) {
            this.currentBlock = this.part.items[0];
        }
        this.subscriptions.add(this.dragDropService.dragStart$.subscribe(event => {
            this.primeDrag = event;
            this.primeDragActive = !!event.node && !!event.subNodes;
        }));
        this.subscriptions.add(this.dragDropService.dragStop$.subscribe(() => {
            this.primeDrag = null;
            this.primeDragActive = false;
            this.rootDropActive = false;
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    /**
     * Zona inferior de la part para devolver un bloque hijo al primer nivel.
     * PrimeNG no ofrece un destino fuera de sus árboles; este drop nativo
     * saca el nodo de `subNodes` y lo añade a `part.items`.
     */
    onRootDragOver(event: DragEvent): void {
        if (!this.primeDrag?.node || !this.primeDrag.subNodes) {
            return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        this.rootDropActive = true;
    }

    onRootDragLeave(event: DragEvent): void {
        const current = event.currentTarget as HTMLElement | null;
        const related = event.relatedTarget as Node | null;
        if (!current || !related || !current.contains(related)) {
            this.rootDropActive = false;
        }
    }

    onRootDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.rootDropActive = false;
        const drag = this.primeDrag;
        this.primeDrag = null;
        this.primeDragActive = false;
        if (!drag?.node || !drag.subNodes) {
            return;
        }
        const index = drag.subNodes.indexOf(drag.node);
        if (index < 0) {
            return;
        }
        drag.subNodes.splice(index, 1);
        this.part.items.push(drag.node as Block);
        this.currentBlock = drag.node as Block;
        this.cdr.detectChanges();
    }

    duplicatePart(): void {
        this.onDuplicatePart.emit(this.part);
    }

    removePart(): void {
        this.onRemovePart.emit(this.part);
    }

    playPart(): void {
        if (this.part && this.song) {
            void this.songPlayer.playPart(this.part, this.song);
            this.playPartEvent.emit(this.part.id);
        }
    }

    stopPart(): void {
        this.songPlayer.stop();
        this.stopPartEvent.emit(this.part.id);
    }

    setCurrentBlock(block: Block): void {
        this.currentBlock = block;
    }

    toggleExpansion(): void {
        this.isExpanded = !this.isExpanded;
    }

    private findParentBlock(blocks: readonly Block[], target: Block): Block | null {
        for (const block of blocks) {
            if (block.children.some(child => child.id === target.id)) {
                return block;
            }
            const nested = this.findParentBlock(block.children, target);
            if (nested) {
                return nested;
            }
        }
        return null;
    }
}
