
export interface Coords {
    top: number;
    left: number;
    bottom: number;
}
export interface Synonym {
    word: string;
    partsOfSpeech?: string[];
    description?: string;
}
export class SynonymPopoverComponent {
    private container: HTMLElement;
    private onClickOutside: () => void;
    private onSelect: (selection: string) => void;
    private coords: Coords;
    private synonyms: Synonym[];

    constructor(options: {
        coords: Coords;
        synonyms: Synonym[];
        onSelect: (selection: string) => void;
        onClickOutside: () => void;
    }) {
        this.coords = options.coords;
        this.synonyms = options.synonyms;
        this.onSelect = options.onSelect;
        this.onClickOutside = options.onClickOutside;

        this.container = document.createElement('div');
        this.container.classList.add('dict-s-popover');
        this.container.style.position = 'absolute';
        this.container.style.left = `${this.coords.left}px`;
        this.container.style.top = `${this.coords.bottom}px`;

        this.init();
        this.render();
        document.body.appendChild(this.container);
    }

    private init() {
        // Handle positioning
        const height = this.container.clientHeight;
        const width = this.container.clientWidth;

        if (this.coords.bottom + height > window.innerHeight) {
            this.container.style.top = `${this.coords.top - height}px`;
        }

        if (this.coords.left + width > window.innerWidth) {
            this.container.style.left = `${window.innerWidth - width - 15}px`;
        }

        // Handle click outside
        const onBodyPointerUp = (e: MouseEvent) => {
            if (!this.container.contains(e.target as Node)) {
                document.body.removeEventListener('pointerup', onBodyPointerUp);
                this.onClickOutside();
            }
        };

        document.body.addEventListener('pointerup', onBodyPointerUp);
    }

    private render() {
        this.container.innerHTML = '';
        
        this.synonyms.forEach(synonym => {
            const option = document.createElement('div');
            option.classList.add('dict-s-popover__select-option');
            option.addEventListener('click', () => {
                this.onSelect(synonym.word);
                this.destroy();
            });

            const label = document.createElement('div');
            label.classList.add('dict-s-popover__select-label');

            const term = document.createElement('div');
            term.classList.add('dict-s-popover__term');
            term.textContent = synonym.word;
            label.appendChild(term);

            if (synonym.partsOfSpeech?.length) {
                const pos = document.createElement('div');
                pos.classList.add('dict-s-popover__meta-pos');
                pos.textContent = synonym.partsOfSpeech.join(', ');
                label.appendChild(pos);
            }

            option.appendChild(label);

            if (synonym.description) {
                const description = document.createElement('div');
                description.classList.add('dict-s-popover__meta-description');
                description.textContent = synonym.description;
                option.appendChild(description);
            }

            this.container.appendChild(option);
        });
    }

    public destroy() {
        this.container.remove();
    }
}


export class SynonymPopover {
    private _view: SynonymPopoverComponent;
    private isDestroyed = false;

    constructor() {
        this.openSynonymPopover();
    }

    destroy(): void {
        this._view?.destroy();
        this.isDestroyed = true;
    }

    async openSynonymPopover(): Promise<void> {
        // const {
        //     cursor,
        //     coords,
        //     line,
        //     selection,
        //     apiManager,
        //     onSelect
        // } = this.settings

        // const sentences = line.split(/[.!?]/g);
        // let seen = 0;

        // // Loop through each sentence until we find our target word
        // for (const sentence of sentences) {
        //     if (seen <= cursor.ch && cursor.ch <= seen + sentence.length) {
        //     //     // Split the sentence to get the left and right contexts
        //     //     const before = sentence.substring(0, cursor.ch - seen)
        //     //     const after = sentence.substring(cursor.ch - seen + selection.length)

        //     //     let pos: PartOfSpeech;

        //     //     if(this.settings.advancedPoS){
        //     //         try {
        //     //             pos = await apiManager.requestPartOfSpeech(selection, before, after);
        //     //         } catch (e) {
        //     //             console.error(`Error determining part of speech for word ${selection}`, e);
        //     //         }
        //     //     }

        //     //     let synonyms: Synonym[];

        //     //     // Return early if we've been destroyed
        //     //     if (this.isDestroyed) return;

        //     //     try {
        //     //         synonyms = await apiManager.requestSynonyms(selection, pos);
        //     //     } catch (e) {
        //     //         console.error(`Error requesting synonyms for word ${selection}`, e);
        //     //     }

        //     //     // Return early if we've been destroyed
        //     //     if (this.isDestroyed) return;
        //     //     if (!synonyms?.length) return;

        //         // Open the synonym popover
        //         this._view = new SynonymPopoverComponent({
        //             coords,
        //             synonyms,
        //             onSelect: (selection) => {
        //                 onSelect(selection);
        //                 this.destroy();
        //             },
        //             onClickOutside: () => {
        //                 this.destroy();
        //             }
        //         });

        //         break;
        //     }

        //     seen += sentence.length + 1;
        // }
    }
}