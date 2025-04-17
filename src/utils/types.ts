import { App, TFile, WorkspaceLeaf } from 'obsidian';

/**
 * Settings interface for Knowledge Synthesis plugin
 */
export interface KnowledgeSynthesisSettings {
    extractionSensitivity: number;
    maxRelatedNotes: number;
    realTimeSuggestions: boolean;
    includeTags: boolean;
    includeLinks: boolean;
}

/**
 * Interface for concept extraction
 */
export interface ConceptExtractor {
    // Extract concepts from text content
    extractConcepts(content: string): string[];
    
    // Set sensitivity for extraction (1-10)
    setSensitivity(sensitivity: number): void;
    
    // Learn from user feedback
    learnFromUserFeedback(concept: string, isRelevant: boolean): void;
}

/**
 * Related note type returned by findRelatedNotes
 */
export interface RelatedNote {
    file: TFile;            // The Obsidian file object
    relevance: number;      // Relevance score (0-1)
    sharedConcepts: string[]; // Concepts that appear in both notes
}

/**
 * Interface for managing relationships between notes
 */
export interface ConceptGraph {
    // Add a note to the graph with its concepts
    addNote(path: string, concepts: string[]): void;
    
    // Remove a note from the graph
    removeNote(path: string): void;
    
    // Find notes related to a given note
    findRelatedNotes(notePath: string, maxResults?: number): RelatedNote[];
    
    // Get all concepts for a note
    getNoteConcepts(notePath: string): string[];
    
    // Get graph data for visualization
    getConceptNetwork(): { nodes: any[], edges: any[] };
}

/**
 * Interface for data persistence
 */
export interface DataManager {
    // Save concept data to disk
    saveConceptData(): Promise<void>;
    
    // Load concept data from disk
    loadConceptData(): Promise<void>;
    
    // Clear all stored data
    clearData(): Promise<void>;
}

/**
 * Interface for NLP text processing utilities
 */
export interface TextProcessor {
    // Tokenize text into words
    tokenize(text: string): string[];
    
    // Calculate term frequency
    calculateTermFrequency(tokens: string[]): Map<string, number>;
    
    // Remove common stop words
    removeStopWords(tokens: string[]): string[];
    
    // Stem words to their root form
    stemWords(tokens: string[]): string[];
}

/**
 * Interface for the Note Processor service
 */
export interface NoteProcessorService {
    // Process a single note file
    processNote(file: TFile): Promise<void>;
    
    // Process all notes in the vault
    processAllNotes(): Promise<void>;
    
    // Check if a note needs processing
    shouldProcessNote(file: TFile): boolean;
}

/**
 * Interface for the Summary Generator service
 */
export interface SummaryGeneratorService {
    // Generate a summary from related notes
    generateSummary(file: TFile): Promise<string>;
}

/**
 * Interface for the Related Notes View
 */
export interface RelatedNotesViewController {
    // Update the view with related notes for a file
    updateRelatedNotes(file: TFile, relatedNotes: RelatedNote[]): void;
    
    // Clear the view
    clear(): void;
}

/**
 * Plugin API that other components can access
 */
export interface PluginAPI {
    // Get related notes for a file
    getRelatedNotes(file: TFile): Promise<RelatedNote[]>;
    
    // Extract concepts from content
    extractConcepts(content: string): string[];
    
    // Add a concept to a note
    addConceptToNote(filePath: string, concept: string): Promise<void>;

    updateNoteConcepts(path: string, concepts: string[]): void;

    
    // Generate a summary from related notes
    generateSummary(file: TFile): Promise<string>;
    
    // Access to settings
    getSettings(): KnowledgeSynthesisSettings;
}