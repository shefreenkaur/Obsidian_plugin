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
        
        // Add original note summary
        const originalContent = await this.app.vault.read(file);
        summaryContent += `## Original Note: ${file.basename}\n\n`;
        
        // Extract the first few sentences as a summary (simplified)
        const firstParagraph = originalContent.split('\n\n')[0];
        summaryContent += `${firstParagraph}\n\n`;
        
        // Add key concepts section
        const concepts = this.conceptGraph.getNoteConcepts(file.path);
        if (concepts.length > 0) {
            summaryContent += `## Key Concepts\n\n`;
            summaryContent += concepts.map(c => `- ${c}`).join('\n');
            summaryContent += `\n\n`;
        }
        
        // Add related notes
        summaryContent += `## Related Notes\n\n`;
        
        for (const related of relatedNotes) {
            summaryContent += `### ${related.file.basename}\n\n`;
            
            // Add shared concepts
            if (related.sharedConcepts.length > 0) {
                summaryContent += `Shared concepts: ${related.sharedConcepts.join(', ')}\n\n`;
            }
            
            // Add snippet from related note
            try {
                const relatedContent = await this.app.vault.read(related.file);
                const firstParagraph = relatedContent.split('\n\n')[0];
                summaryContent += `${firstParagraph}\n\n`;
            } catch (error) {
                summaryContent += `Error reading note content.\n\n`;
            }
            
            // Add link to the note
            summaryContent += `[[${related.file.path}|View full note]]\n\n`;
        }
        
        // Create the new note
        try {
            // Try to find an existing summary note to update
            const summaryPath = `${file.parent?.path || ''}/${summaryTitle}.md`;
            let summaryFile: TFile | null = this.app.vault.getAbstractFileByPath(summaryPath) as TFile;
            
            if (summaryFile) {
                // Update existing file
                await this.app.vault.modify(summaryFile, summaryContent);
            } else {
                // Create new file
                summaryFile = await this.app.vault.create(summaryPath, summaryContent);
            }
            
            // Open the summary note
            this.app.workspace.getLeaf().openFile(summaryFile);
            
            return summaryContent;
        } catch (error) {
            console.error('Error creating summary:', error);
            new Notice('Error creating summary note');
            return '';
        }
    }
}