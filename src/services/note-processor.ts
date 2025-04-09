import { TFile, Vault, Notice } from 'obsidian';
import { ConceptExtractor, ConceptGraph, NoteProcessorService } from '../utils/types';

/**
 * Service to handle note processing for concept extraction and relationship tracking
 */
export class NoteProcessor implements NoteProcessorService {
    // Keep track of processed files to avoid redundant processing
    private processedFiles: Map<string, number> = new Map(); // path -> lastModified
    
    constructor(
        private vault: Vault,
        private conceptExtractor: ConceptExtractor,
        private conceptGraph: ConceptGraph,
        private saveCallback: () => Promise<void>
    ) {}
    
    /**
     * Process a single note file
     * @param file Note file to process
     */
    public async processNote(file: TFile): Promise<void> {
        // Skip if file was recently processed (optimization)
        if (!this.shouldProcessNote(file)) {
            return;
        }
        
        try {
            // Read the file content
            const content = await this.vault.read(file);
            
            // Extract concepts
            const concepts = this.conceptExtractor.extractConcepts(content);
            
            // Add to concept graph
            this.conceptGraph.addNote(file.path, concepts);
            
            // Mark as processed
            this.processedFiles.set(file.path, file.stat.mtime);
            
            // Save changes
            await this.saveCallback();
        } catch (error) {
            console.error(`Error processing file ${file.path}:`, error);
        }
    }
    
    /**
     * Check if a file needs processing
     * @param file File to check
     * @returns true if file needs processing, false otherwise
     */
    public shouldProcessNote(file: TFile): boolean {
        // Skip non-markdown files
        if (file.extension !== 'md') {
            return false;
        }
        
        const lastModified = file.stat.mtime;
        const lastProcessed = this.processedFiles.get(file.path);
        
        // Process if never processed or modified since last processing
        return !lastProcessed || lastProcessed < lastModified;
    }
    
    /**
     * Process all notes in the vault
     */
    public async processAllNotes(): Promise<void> {
        const files = this.vault.getMarkdownFiles();
        let processedCount = 0;
        
        // Show notice
        const notice = new Notice(`Processing ${files.length} notes...`, 0);
        
        for (const file of files) {
            await this.processNote(file);
            processedCount++;
            
            // Update notice periodically
            if (processedCount % 10 === 0) {
                notice.setMessage(`Processed ${processedCount}/${files.length} notes...`);
            }
        }
        
        // Save data when complete
        await this.saveCallback();
        
        // Close notice
        notice.hide();
        
        // Show completion notice
        new Notice(`Completed processing ${processedCount} notes.`);
    }
}