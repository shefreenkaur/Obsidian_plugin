// src/services/summary-generator.ts
import { App, TFile, Notice } from 'obsidian';
import { SummaryGeneratorService, RelatedNote, ConceptGraph } from '../utils/types';

/**
 * Service to generate summaries from related notes
 */
export class SummaryGenerator implements SummaryGeneratorService {
    constructor(
        private app: App,
        private conceptGraph: ConceptGraph,
        private getRelatedNotes: (file: TFile) => Promise<RelatedNote[]>
    ) {}
    
    /**
     * Generate a summary from related notes
     * @param file File to generate summary for
     * @returns The content of the generated summary
     */
    public async generateSummary(file: TFile): Promise<string> {
        // Get related notes
        const relatedNotes = await this.getRelatedNotes(file);
        
        if (relatedNotes.length === 0) {
            new Notice('No related notes found to generate summary');
            return '';
        }
        
        // Create a new note with summary
        const summaryTitle = `Summary of ${file.basename}`;
        let summaryContent = `# ${summaryTitle}\n\n`;
        
        // Add metadata
        summaryContent += `> [!info] Summary generated from ${file.basename} and ${relatedNotes.length} related notes\n`;
        summaryContent += `> Generated on ${new Date().toLocaleString()}\n\n`;
        
        // Get original note content
        const originalContent = await this.app.vault.read(file);
        
        // Extract key concepts
        const concepts = this.conceptGraph.getNoteConcepts(file.path);
        
        // Organize information by concept
        const conceptInfo: Record<string, {
            originalSentences: string[];
            relatedSentences: Record<string, string[]>;
        }> = {};
        
        // For each concept, collect related information
        for (const concept of concepts) {
            conceptInfo[concept] = {
                originalSentences: this.extractSentencesWithConcept(originalContent, concept),
                relatedSentences: {}
            };
            
            // Get sentences from related notes
            for (const related of relatedNotes) {
                if (related.sharedConcepts.includes(concept)) {
                    const relatedContent = await this.app.vault.read(related.file);
                    conceptInfo[concept].relatedSentences[related.file.basename] = 
                        this.extractSentencesWithConcept(relatedContent, concept);
                }
            }
        }
        
        // First add brief overview of original note
        summaryContent += `## Original Note: ${file.basename}\n\n`;
        const firstParagraph = originalContent.split('\n\n')[0];
        summaryContent += `${firstParagraph}\n\n`;
        
        // Add section for each significant concept
        summaryContent += `## Key Concepts and Relationships\n\n`;
        
        for (const concept of concepts) {
            // Skip concepts with no related information
            if (Object.keys(conceptInfo[concept].relatedSentences).length === 0) continue;
            
            summaryContent += `### Concept: ${concept}\n\n`;
            
            // Add original note's usage
            if (conceptInfo[concept].originalSentences.length > 0) {
                summaryContent += `In ${file.basename}:\n`;
                for (const sentence of conceptInfo[concept].originalSentences.slice(0, 3)) {
                    summaryContent += `- ${this.highlightConcept(sentence.trim(), concept)}\n`;
                }
                summaryContent += `\n`;
            }
            
            // Add related notes' usage
            for (const [noteName, sentences] of Object.entries(conceptInfo[concept].relatedSentences)) {
                if (sentences.length > 0) {
                    summaryContent += `In ${noteName}:\n`;
                    for (const sentence of sentences.slice(0, 3)) {
                        summaryContent += `- ${this.highlightConcept(sentence.trim(), concept)}\n`;
                    }
                    summaryContent += `\n`;
                }
            }
        }
        
        // Add section with links to related notes
        summaryContent += `## Related Notes\n\n`;
        for (const related of relatedNotes) {
            summaryContent += `- [[${related.file.path}|${related.file.basename}]] (Relevance: ${Math.round(related.relevance * 100)}%)\n`;
        }
        
        // Create the summary file and return the content
        try {
            const summaryPath = `${file.parent?.path || ''}/${summaryTitle}.md`;
            let summaryFile = this.app.vault.getAbstractFileByPath(summaryPath) as TFile;
            
            if (summaryFile) {
                await this.app.vault.modify(summaryFile, summaryContent);
            } else {
                summaryFile = await this.app.vault.create(summaryPath, summaryContent);
            }
            
            this.app.workspace.getLeaf().openFile(summaryFile);
            return summaryContent;
        } catch (error) {
            console.error('Error creating summary:', error);
            new Notice('Error creating summary note');
            return '';
        }
    }
    
    /**
     * Extract sentences containing a concept
     * @param content Text content to search
     * @param concept Concept to find in sentences
     * @returns Array of sentences containing the concept
     */
    private extractSentencesWithConcept(content: string, concept: string): string[] {
        // Split content into sentences (simplified approach)
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Find sentences containing the concept (case insensitive)
        const regex = new RegExp(`\\b${concept}\\b`, 'i');
        return sentences.filter(sentence => regex.test(sentence));
    }
    
    /**
     * Highlight concept in text using markdown formatting
     * @param text Text containing the concept
     * @param concept Concept to highlight
     * @returns Text with highlighted concept
     */
    private highlightConcept(text: string, concept: string): string {
        const regex = new RegExp(`\\b(${concept})\\b`, 'gi');
        return text.replace(regex, '**$1**'); // Bold in markdown
    }
}