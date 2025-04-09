import { DataManager } from '../utils/types';
import { Plugin } from 'obsidian';

/**
 * Interface for persistent data storage
 */
interface ConceptData {
    version: number;
    notes: Record<string, {
        concepts: string[];
        lastUpdated: number;
    }>;
    concepts: Record<string, {
        notePaths: string[];
        weight: number;
    }>;
    userFeedback: Record<string, boolean>;
}

/**
 * Implementation of data persistence for concepts and relationships
 */
export class DataManagerImpl implements DataManager {
    private plugin: Plugin;
    private data: ConceptData;
    
    // Current data version for migration support
    private readonly CURRENT_VERSION = 1;
    
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        
        // Initialize with empty data
        this.data = {
            version: this.CURRENT_VERSION,
            notes: {},
            concepts: {},
            userFeedback: {}
        };
    }

    /**
     * Save concept data to disk
     */
    public async saveConceptData(): Promise<void> {
        // In Obsidian Plugin API, saveData takes only one argument: the data to save
        await this.plugin.saveData(this.data);
    }

    /**
     * Load concept data from disk
     */
    public async loadConceptData(): Promise<void> {
        try {
            // loadData doesn't take arguments in the Obsidian Plugin API
            const savedData = await this.plugin.loadData();
            
            // If no data exists yet, keep the default empty data
            if (!savedData) {
                return;
            }
            
            // Check if data migration is needed
            if (savedData.version !== this.CURRENT_VERSION) {
                this.data = this.migrateData(savedData);
            } else {
                this.data = savedData;
            }
        } catch (error) {
            console.error('Failed to load concept data:', error);
            // Keep using the default empty data
        }
    }

    /**
     * Clear all stored data
     */
    public async clearData(): Promise<void> {
        this.data = {
            version: this.CURRENT_VERSION,
            notes: {},
            concepts: {},
            userFeedback: {}
        };
        
        await this.saveConceptData();
    }

    /**
     * Get the loaded data
     */
    public getData(): ConceptData {
        return this.data;
    }

    /**
     * Set the data (used when updating from the concept graph)
     */
    public setData(
        notes: Record<string, { concepts: string[], lastUpdated: number }>,
        concepts: Record<string, { notePaths: string[], weight: number }>,
        userFeedback: Record<string, boolean>
    ): void {
        this.data = {
            version: this.CURRENT_VERSION,
            notes,
            concepts,
            userFeedback
        };
    }

    /**
     * Migrate data from an older version to the current version
     */
    private migrateData(oldData: any): ConceptData {
        // This is a placeholder for future migrations
        return {
            version: this.CURRENT_VERSION,
            notes: oldData.notes || {},
            concepts: oldData.concepts || {},
            userFeedback: oldData.userFeedback || {}
        };
    }
}