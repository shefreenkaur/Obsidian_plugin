import { ConceptGraph, RelatedNote } from '../utils/types';
import { TFile, Vault } from 'obsidian';

/**
 * Structure to store note data in the graph
 */
interface NoteNode {
    path: string;
    concepts: string[];
    lastUpdated: number;
}

/**
 * Structure to store concept data in the graph
 */
interface ConceptNode {
    name: string;
    notePaths: string[];
    weight: number; // Concept importance
}

/**
 * Implementation of the Concept Graph that manages relationships between notes
 */
export class ConceptGraphImpl implements ConceptGraph {
    private notes: Map<string, NoteNode> = new Map();
    private concepts: Map<string, ConceptNode> = new Map();
    private vault: Vault;
    
    constructor(vault: Vault) {
        this.vault = vault;
    }

    /**
     * Add a note to the graph with its concepts
     * @param path Path to the note
     * @param concepts Array of concepts in the note
     */
    public addNote(path: string, concepts: string[]): void {
        // Create or update the note node
        this.notes.set(path, {
            path,
            concepts,
            lastUpdated: Date.now()
        });
        
        // Update concept nodes
        for (const concept of concepts) {
            const conceptNode = this.concepts.get(concept) || {
                name: concept,
                notePaths: [],
                weight: 1
            };
            
            // Add this note to the concept if not already present
            if (!conceptNode.notePaths.includes(path)) {
                conceptNode.notePaths.push(path);
            }
            
            // Update the concept's weight based on frequency
            conceptNode.weight = conceptNode.notePaths.length;
            
            // Save the updated concept
            this.concepts.set(concept, conceptNode);
        }
    }

    /**
     * Remove a note from the graph
     * @param path Path to the note to remove
     */
    public removeNote(path: string): void {
        // Get the note's concepts before removal
        const note = this.notes.get(path);
        if (!note) {
            return; // Note doesn't exist in the graph
        }
        
        // Remove note from all its concepts
        for (const concept of note.concepts) {
            const conceptNode = this.concepts.get(concept);
            if (conceptNode) {
                // Filter out this note path
                conceptNode.notePaths = conceptNode.notePaths.filter(p => p !== path);
                
                // Update weight
                conceptNode.weight = conceptNode.notePaths.length;
                
                // Remove concept if it no longer has any notes
                if (conceptNode.notePaths.length === 0) {
                    this.concepts.delete(concept);
                } else {
                    this.concepts.set(concept, conceptNode);
                }
            }
        }
        
        // Remove the note itself
        this.notes.delete(path);
    }

    /**
     * Find notes related to a given note
     * @param notePath Path to the note
     * @param maxResults Maximum number of results to return
     * @returns Array of related notes sorted by relevance
     */
    public findRelatedNotes(notePath: string, maxResults: number = 10): RelatedNote[] {
        const note = this.notes.get(notePath);
        if (!note) {
            return []; // Note doesn't exist in the graph
        }
        
        // Calculate relevance scores for all notes
        const scores: Map<string, { 
            relevance: number, 
            sharedConcepts: string[] 
        }> = new Map();
        
        // Iterate through concepts in the target note
        for (const concept of note.concepts) {
            const conceptNode = this.concepts.get(concept);
            if (!conceptNode) continue;
            
            // For each note that has this concept
            for (const relatedPath of conceptNode.notePaths) {
                // Skip the original note
                if (relatedPath === notePath) continue;
                
                // Get or initialize score data
                const scoreData = scores.get(relatedPath) || { 
                    relevance: 0, 
                    sharedConcepts: [] 
                };
                
                // Increment relevance score based on concept weight
                scoreData.relevance += conceptNode.weight;
                
                // Add to shared concepts if not already there
                if (!scoreData.sharedConcepts.includes(concept)) {
                    scoreData.sharedConcepts.push(concept);
                }
                
                scores.set(relatedPath, scoreData);
            }
        }
        
        // Convert to array and normalize scores
        const relatedNotes: RelatedNote[] = [];
        
        // Find maximum score for normalization
        const maxScore = Math.max(...Array.from(scores.values())
            .map(data => data.relevance), 1);
        
        // Convert scores to RelatedNote objects
        for (const [path, data] of scores.entries()) {
            // Get the file from vault
            const file = this.vault.getAbstractFileByPath(path);
            
            // Skip if file doesn't exist or isn't a TFile
            if (!file || !(file instanceof TFile)) continue;
            
            relatedNotes.push({
                file: file as TFile,
                relevance: data.relevance / maxScore, // Normalize to 0-1
                sharedConcepts: data.sharedConcepts
            });
        }
        
        // Sort by relevance (highest first) and limit results
        return relatedNotes
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, maxResults);
    }

    /**
     * Get all concepts for a note
     * @param notePath Path to the note
     * @returns Array of concepts
     */
    public getNoteConcepts(notePath: string): string[] {
        const note = this.notes.get(notePath);
        return note ? note.concepts : [];
    }

    /**
     * Get graph data for visualization
     * @returns Object with nodes and edges arrays for visualization
     */
    public getConceptNetwork(): { nodes: any[], edges: any[] } {
        const nodes: any[] = [];
        const edges: any[] = [];
        
        // Add note nodes
        for (const [path, note] of this.notes.entries()) {
            nodes.push({
                id: path,
                label: path.split('/').pop() || path, // Use filename as label
                type: 'note'
            });
        }
        
        // Add concept nodes (for concepts that appear in multiple notes)
        for (const [name, concept] of this.concepts.entries()) {
            if (concept.notePaths.length > 1) {
                nodes.push({
                    id: `concept-${name}`,
                    label: name,
                    type: 'concept',
                    weight: concept.weight
                });
                
                // Add edges from concept to notes
                for (const path of concept.notePaths) {
                    edges.push({
                        source: `concept-${name}`,
                        target: path,
                        value: 1
                    });
                }
            }
        }
        
        return { nodes, edges };
    }
    public updateNoteConcepts(path: string, newConcepts: string[]): void {
        this.notes.set(path, {
            path: path,
            concepts: newConcepts,
            lastUpdated: Date.now()
        });
    }
    
}