import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { RelatedNote, RelatedNotesViewController, PluginAPI } from '../utils/types';

// View type for related notes
export const RELATED_NOTES_VIEW_TYPE = 'knowledge-synthesis-related-notes';

/**
 * Related Notes View implementation
 */
export class RelatedNotesView extends ItemView implements RelatedNotesViewController {
    private pluginApi: PluginAPI;
    private relatedContentEl: HTMLElement; // Changed from contentEl to avoid conflicts
    private currentFile: TFile | null = null;
    
    constructor(leaf: WorkspaceLeaf, pluginApi: PluginAPI) {
        super(leaf);
        this.pluginApi = pluginApi;
    }
    
    getViewType(): string {
        return RELATED_NOTES_VIEW_TYPE;
    }
    
    getDisplayText(): string {
        return "Related Notes";
    }
    
    async onOpen() {
        const { containerEl } = this;
        containerEl.empty();
        
        // Create content container
        this.relatedContentEl = containerEl.createDiv({ cls: 'knowledge-synthesis-related-notes' });
        
        // Create header
        this.relatedContentEl.createEl('h3', { text: 'Related Notes' });
        
        // Show placeholder text
        this.relatedContentEl.createEl('p', { 
            text: 'Open a note to see related content.',
            cls: 'knowledge-synthesis-placeholder'
        });
    }
    
    /**
     * Update the view with related notes for a file
     * @param file Current active file
     * @param relatedNotes Array of related notes
     */
    public updateRelatedNotes(file: TFile, relatedNotes: RelatedNote[]): void {
        this.currentFile = file;
        
        // Update header with filename
        this.relatedContentEl.empty();
        this.relatedContentEl.createEl('h3', { text: 'Related to: ' + file.basename });
        
        // Display concepts
        const concepts = this.pluginApi.extractConcepts(file.path);
        if (concepts.length > 0) {
            const conceptsEl = this.relatedContentEl.createDiv({ cls: 'knowledge-synthesis-concepts' });
            conceptsEl.createEl('h4', { text: 'Key Concepts' });
            
            const conceptsList = conceptsEl.createDiv({ cls: 'knowledge-synthesis-concepts-list' });
            for (const concept of concepts) {
                const tagEl = conceptsList.createSpan({ 
                    cls: 'knowledge-synthesis-concept-tag',
                    text: concept
                });
            }
        }
        
        // Display related notes
        if (relatedNotes.length > 0) {
            const relatedEl = this.relatedContentEl.createDiv({ cls: 'knowledge-synthesis-related' });
            relatedEl.createEl('h4', { text: 'Related Notes' });
            
            const relatedList = relatedEl.createDiv({ cls: 'knowledge-synthesis-related-list' });
            
            for (const related of relatedNotes) {
                const noteEl = relatedList.createDiv({ cls: 'knowledge-synthesis-related-note' });
                
                // Create link to the note
                const linkEl = noteEl.createEl('a', { 
                    cls: 'knowledge-synthesis-note-link',
                    text: related.file.basename
                });
                
                // Add click handler to open the note
                linkEl.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const leaf = this.app.workspace.getLeaf();
                    if (leaf) {
                        await leaf.openFile(related.file);
                    }
                });
                
                // Add relevance indicator
                const relevanceEl = noteEl.createDiv({ 
                    cls: 'knowledge-synthesis-relevance-bar' 
                });
                
                const indicatorEl = relevanceEl.createDiv({ 
                    cls: 'knowledge-synthesis-relevance-indicator' 
                });
                
                // Set width based on relevance score (0-100%)
                indicatorEl.style.width = `${Math.round(related.relevance * 100)}%`;
                
                // Add shared concepts
const sharedEl = noteEl.createDiv({
	cls: 'knowledge-synthesis-shared-concepts'
});

sharedEl.createSpan({
	cls: 'knowledge-synthesis-shared-label',
	text: 'Shared concepts: '
});

const sharedList = sharedEl.createDiv({ cls: 'knowledge-synthesis-shared-list' });

for (const concept of related.sharedConcepts) {
	const tag = sharedList.createSpan({
		cls: 'knowledge-synthesis-concept-tag knowledge-synthesis-shared',
		text: concept
	});

	// Add remove button
	const removeBtn = tag.createEl('button', { text: '×' });
	removeBtn.style.marginLeft = '6px';
	removeBtn.onclick = () => {
		related.sharedConcepts = related.sharedConcepts.filter(c => c !== concept);
		tag.remove();
		this.pluginApi.updateNoteConcepts(related.file.path, related.sharedConcepts);
	};
}

// Input to add new concept
const inputWrapper = sharedEl.createDiv({ cls: 'knowledge-synthesis-add-concept' });
const input = inputWrapper.createEl('input');
input.placeholder = 'Add new concept...';
input.style.marginRight = '6px';

const addBtn = inputWrapper.createEl('button', { text: 'Add' });
addBtn.onclick = () => {
	const newConcept = input.value.trim();
	if (newConcept && !related.sharedConcepts.includes(newConcept)) {
		related.sharedConcepts.push(newConcept);
		this.pluginApi.updateNoteConcepts(related.file.path, related.sharedConcepts);

		const newTag = sharedList.createSpan({
			cls: 'knowledge-synthesis-concept-tag knowledge-synthesis-shared',
			text: newConcept
		});

		const removeBtn = newTag.createEl('button', { text: '×' });
		removeBtn.style.marginLeft = '6px';
		removeBtn.onclick = () => {
			newTag.remove();
			related.sharedConcepts = related.sharedConcepts.filter(c => c !== newConcept);
			this.pluginApi.updateNoteConcepts(related.file.path, related.sharedConcepts);
		};

		input.value = '';
	}
};

            }
        } else {
            this.relatedContentEl.createEl('p', { 
                text: 'No related notes found. Try adding more content or concepts.',
                cls: 'knowledge-synthesis-no-results'
            });
        }
        
        // Add button to generate summary
        const actionsEl = this.relatedContentEl.createDiv({ cls: 'knowledge-synthesis-actions' });
        const summaryBtn = actionsEl.createEl('button', { 
            cls: 'knowledge-synthesis-summary-btn',
            text: 'Generate Summary'
        });
        
        summaryBtn.addEventListener('click', async () => {
            if (this.currentFile) {
                await this.pluginApi.generateSummary(this.currentFile);
            }
        });
    }
    
    /**
     * Clear the view
     */
    public clear(): void {
        this.relatedContentEl.empty();
        this.currentFile = null;
        
        this.relatedContentEl.createEl('h3', { text: 'Related Notes' });
        this.relatedContentEl.createEl('p', { 
            text: 'Open a note to see related content.',
            cls: 'knowledge-synthesis-placeholder'
        });
    }
}