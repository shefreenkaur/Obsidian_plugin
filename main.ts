import { 
    App, 
    MarkdownView, 
    Notice, 
    Plugin, 
    TFile,
    WorkspaceLeaf
} from 'obsidian';

// Import types
import { 
    KnowledgeSynthesisSettings, 
    ConceptExtractor, 
    ConceptGraph, 
    RelatedNote,
    PluginAPI
} from './src/utils/types';

// Import implementations
import { ConceptExtractorImpl } from './src/core/concept-extractor';
import { ConceptGraphImpl } from './src/core/concept-graph';
import { DataManagerImpl } from './src/core/data-manager';
import { NoteProcessor } from './src/services/note-processor';
import { SummaryGenerator } from './src/services/summary-generator';
import { RelatedNotesView, RELATED_NOTES_VIEW_TYPE } from './src/ui/related-notes-view';
import { KnowledgeSynthesisSettingTab } from './src/ui/settings-tab';

// Default settings
const DEFAULT_SETTINGS: KnowledgeSynthesisSettings = {
    extractionSensitivity: 5,
    maxRelatedNotes: 10,
    realTimeSuggestions: true,
    includeTags: true,
    includeLinks: true
}

/**
 * Main plugin class for Knowledge Synthesis
 * Coordinates all components and integrates with Obsidian
 */
export default class KnowledgeSynthesisPlugin extends Plugin implements PluginAPI  {
    // Plugin settings
    settings: KnowledgeSynthesisSettings;
    
    // Core components
    private conceptExtractor: ConceptExtractor;
    private conceptGraph: ConceptGraph;
    public dataManager: DataManagerImpl; // Public so it can be accessed by SettingsTab
    
    // Services
    private noteProcessor: NoteProcessor;
    private summaryGenerator: SummaryGenerator;
    
    /**
     * Plugin initialization
     */
    async onload() {
        console.log('Loading Knowledge Synthesis plugin');
        
        // Load settings
        await this.loadSettings();
        
        // Initialize core components
        this.conceptExtractor = new ConceptExtractorImpl();
        this.conceptExtractor.setSensitivity(this.settings.extractionSensitivity);
        
        this.conceptGraph = new ConceptGraphImpl(this.app.vault);
        this.dataManager = new DataManagerImpl(this);
        
        // Initialize services
        this.noteProcessor = new NoteProcessor(
            this.app.vault,
            this.conceptExtractor,
            this.conceptGraph,
            () => this.dataManager.saveConceptData()
        );
        
        this.summaryGenerator = new SummaryGenerator(
            this.app,
            this.conceptGraph,
            (file) => this.getRelatedNotes(file)
        );
        
        // Load saved data
        await this.dataManager.loadConceptData();
        
        // Register view for related notes
        this.registerView(
            RELATED_NOTES_VIEW_TYPE,
            (leaf) => new RelatedNotesView(leaf, this)
        );

        // Add ribbon icon for quick access
        this.addRibbonIcon('network', 'Knowledge Synthesis', () => {
            this.activateView();
        });

        // Register commands
        this.addCommands();
        
        // Register event handlers
        this.registerEvents();

        // Add settings tab
        this.addSettingTab(new KnowledgeSynthesisSettingTab(this.app, this));

        // Process existing notes in the vault
        this.processAllNotes();
        
        console.log('Knowledge Synthesis plugin loaded');
    }

    /**
     * Clean up when plugin is disabled
     */
    onunload() {
        console.log('Knowledge Synthesis plugin unloaded');
    }

    /**
     * Load plugin settings
     */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    /**
     * Save plugin settings
     */
    async saveSettings() {
        await this.saveData(this.settings);
        
        // Update extractor sensitivity when settings change
        this.conceptExtractor.setSensitivity(this.settings.extractionSensitivity);
    }
    
    /**
     * Add plugin commands to Obsidian command palette
     */
    private addCommands() {
        // Command to extract concepts from current note
        this.addCommand({
            id: 'extract-concepts',
            name: 'Extract Concepts from Current Note',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    if (!checking) {
                        this.processCurrentNote();
                    }
                    return true;
                }
                return false;
            }
        });
        
        // Command to show related notes
        this.addCommand({
            id: 'show-related-notes',
            name: 'Show Related Notes',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    if (!checking) {
                        this.activateView();
                    }
                    return true;
                }
                return false;
            }
        });
        
        // Command to generate summary from related notes
        this.addCommand({
            id: 'generate-summary',
            name: 'Generate Summary from Related Notes',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView && activeView.file) {
                    if (!checking) {
                        this.generateSummary(activeView.file);
                    }
                    return true;
                }
                return false;
            }
        });
    }
    
    /**
     * Register event handlers
     */
    private registerEvents() {
        // Process note when it's saved
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    // Only process if realTimeSuggestions is enabled
                    if (this.settings.realTimeSuggestions) {
                        this.noteProcessor.processNote(file);
                    }
                }
            })
        );
        
        // Remove note from graph when deleted
        this.registerEvent(
            this.app.vault.on('delete', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.conceptGraph.removeNote(file.path);
                    // Save changes
                    this.dataManager.saveConceptData();
                }
            })
        );
        
        // Update when a file is renamed
        this.registerEvent(
            this.app.vault.on('rename', (file, oldPath) => {
                if (file instanceof TFile && file.extension === 'md') {
                    // Remove old path and add with new path
                    this.conceptGraph.removeNote(oldPath);
                    this.noteProcessor.processNote(file);
                }
            })
        );
        
        // Process current note when active leaf changes
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', (leaf) => {
                if (leaf?.view instanceof MarkdownView && this.settings.realTimeSuggestions) {
                    this.processCurrentNote();
                }
            })
        );
    }
    
    /**
     * Process the current active note
     */
    private async processCurrentNote() {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && activeView.file) {
            await this.noteProcessor.processNote(activeView.file);
            
            // Update related notes view if it's open
            this.updateRelatedNotesView(activeView.file);
        }
    }
    
    /**
     * Activate the related notes view
     */
    private async activateView() {
        // Check if view is already open
        const leaves = this.app.workspace.getLeavesOfType(RELATED_NOTES_VIEW_TYPE);
        
        if (leaves.length === 0) {
            // Create the view if it doesn't exist
            const leaf = this.app.workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({
                    type: RELATED_NOTES_VIEW_TYPE,
                    active: true,
                });
            }
        }
        
        // Focus the view
        const existingLeaves = this.app.workspace.getLeavesOfType(RELATED_NOTES_VIEW_TYPE);
        if (existingLeaves.length > 0) {
            this.app.workspace.revealLeaf(existingLeaves[0]);
        
            // Update with current file
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView && activeView.file) {
                this.updateRelatedNotesView(activeView.file);
            }
        }
    }
    
    /**
     * Update the related notes view with data for a file
     * @param file File to show related notes for
     */
    private updateRelatedNotesView(file: TFile) {
        const leaves = this.app.workspace.getLeavesOfType(RELATED_NOTES_VIEW_TYPE);
        
        if (leaves.length > 0) {
            const view = leaves[0].view as RelatedNotesView;
            const relatedNotes = this.conceptGraph.findRelatedNotes(
                file.path, 
                this.settings.maxRelatedNotes
            );
            
            view.updateRelatedNotes(file, relatedNotes);
        }
    }
    
    /**
     * Process all existing notes in the vault
     * Public for settings tab access
     */
    public async processAllNotes(): Promise<void> {
        await this.noteProcessor.processAllNotes();
    }
    
    /**
     * Clear all stored data
     * Public for settings tab access
     */
    public async clearData(): Promise<void> {
        await this.dataManager.clearData();
    }
    
    /**
     * API method: Get related notes for a file
     * @param file File to find related notes for
     * @returns Array of related notes
     */
    public async getRelatedNotes(file: TFile): Promise<RelatedNote[]> {
        return this.conceptGraph.findRelatedNotes(
            file.path, 
            this.settings.maxRelatedNotes
        );
    }
    
    /**
     * API method: Extract concepts from content
     * @param content Text content to analyze
     * @returns Array of extracted concepts
     */
    public extractConcepts(content: string): string[] {
        return this.conceptExtractor.extractConcepts(content);
    }
    
    /**
     * API method: Add a concept to a note (used by UI when user adds a concept)
     * @param filePath Path to the file
     * @param concept Concept to add
     */
    public async addConceptToNote(filePath: string, concept: string): Promise<void> {
        // Get current concepts
        const concepts = this.conceptGraph.getNoteConcepts(filePath);
        
        // Add new concept if not already present
        if (!concepts.includes(concept)) {
            concepts.push(concept);
            
            // Update the graph
            this.conceptGraph.addNote(filePath, concepts);
            
            // Save changes
            await this.dataManager.saveConceptData();
            
            // Notify success
            new Notice(`Added concept "${concept}" to note`);
        }
    }
    
    /**
     * API method: Generate a summary from related notes
     * @param file File to generate summary for
     */
    public generateSummary(file: TFile): Promise<string> {
        return this.summaryGenerator.generateSummary(file);
    }
    
    /**
     * API method: Get plugin settings
     * @returns Current plugin settings
     */
    public getSettings(): KnowledgeSynthesisSettings {
        return this.settings;
    }
}