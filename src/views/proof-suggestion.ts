import { Modal, Editor } from 'obsidian';

interface ProofItem {
    type: string;
    start: number;
    end: number;
    description: string;
    suggestion: string;
}

export class ProofSuggestionModal extends Modal {
    private currentIndex: number = 0;
    private proofItems: ProofItem[];
    private editor: Editor;
    private selectionOffset: number;

    constructor(app: any, proofItems: ProofItem[], editor: Editor) {
        super(app);
        this.proofItems = proofItems;
        this.editor = editor;
        this.selectionOffset = this.getSelectionOffset();
    }
    private getSelectionOffset(): number {
        const selection = this.editor.getSelection();
        if (selection) {
            const cursor = this.editor.getCursor('from');
            return this.editor.posToOffset(cursor);
        }
        return 0;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('proof-suggestion-modal');

        const currentItem = this.proofItems[this.currentIndex];
        if (!currentItem) return;

        // Adjust start and end positions based on selection offset
        const adjustedStart = currentItem.start + this.selectionOffset;
        const adjustedEnd = currentItem.end + this.selectionOffset;
        
        // Select the text to be replaced
        const startPos = this.editor.offsetToPos(adjustedStart);
        const endPos = this.editor.offsetToPos(adjustedEnd);
        this.editor.setSelection(startPos, endPos);

        // Position modal near the text
        const coords = (this.editor as any).cm.coordsAtPos?.(startPos);
        if (coords) {
            this.modalEl.style.position = 'absolute';
            this.modalEl.style.top = `${coords.top + 20}px`;
            this.modalEl.style.left = `${coords.left}px`;
        }

        // Modal content
        const container = contentEl.createDiv('proof-suggestion-container');
        
        // Type
        const typeEl = container.createDiv('proof-type');
        typeEl.setText(currentItem.type);

        // Description
        const descEl = container.createDiv('proof-description');
        descEl.setText(currentItem.description);

        // Suggestion
        const suggestionEl = container.createDiv('proof-suggestion');
        suggestionEl.setText(`建议: ${currentItem.suggestion}`);

        // Buttons
        const buttonContainer = container.createDiv('proof-buttons');
        
        const acceptButton = buttonContainer.createEl('button', { text: '接受' });
        acceptButton.onclick = () => {
            this.handleAccept(currentItem);
            this.showNext();
        };

        const rejectButton = buttonContainer.createEl('button', { text: '拒绝' });
        rejectButton.onclick = () => {
            this.showNext();
        };
        
        const selectBtn = buttonContainer.createEl('button', { text: `select :(${adjustedStart}-${adjustedEnd}),(${startPos}, ${endPos}) ` });
        selectBtn.onclick = () => {
            this.editor.setSelection(startPos, endPos);
        };

    }

    private handleAccept(item: ProofItem) {
        this.editor.replaceRange(
            item.suggestion,
            this.editor.offsetToPos(item.start),
            this.editor.offsetToPos(item.end)
        );
    }

    private showNext() {
        this.currentIndex++;
        if (this.currentIndex < this.proofItems.length) {
            this.onOpen();
        } else {
            this.close();
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export function showProofSuggestions(app: any, proofItems: ProofItem[], editor: Editor) {
    console.log(`showProofSuggestions:`, proofItems);
    
    const modal = new ProofSuggestionModal(app, proofItems, editor);
    modal.open();
}
