import { ConceptExtractor } from 'src/utils/types';
import { TextProcessingUtils } from 'src/utils/text-processing';

/**
 * Implementation of Concept Extraction using NLP techniques
 */
export class ConceptExtractorImpl implements ConceptExtractor {
    private sensitivity: number = 5; //Default sensitivity (1-10)
    private textProcessor: TextProcessingUtils;
    private userFeedback: Map<string, boolean> = new Map(); //Store user feedback on concepts
    
    constructor() {
        this.textProcessor = new TextProcessingUtils();
    }

    /**
     * Extract concepts from text content
     * @param content Text content to analyze
     * @returns Array of extracted concepts
     */
    public extractConcepts(content: string): string[] {
        //Skip empty content
        if (!content || content.trim() === '') {
            return [];
        }

        // Extract concepts using multiple techniques
        const concepts: string[] = [
            ...this.extractFromTfIdf(content),
            ...this.extractFromHeadings(content),
            ...this.extractFromEmphasis(content),
            ...this.extractFromNamedEntities(content)
        ];
        
        //Apply user feedback
        const filteredConcepts = concepts.filter(concept => {
            const feedback = this.userFeedback.get(concept);
            //If we have explicit negative feedback, filter it out
            if (feedback === false) {
                return false;
            }
            return true;
        });
        
        //Remove duplicates and return sorted by importance
        return [...new Set(filteredConcepts)];
    }

    /**
     * Set sensitivity for extraction (1-10)
     * @param sensitivity Sensitivity level (1-10)
     */
    public setSensitivity(sensitivity: number): void {
        // Ensure sensitivity is within valid range
        this.sensitivity = Math.max(1, Math.min(10, sensitivity));
    }

    /**
     * Learn from user feedback on concept relevance
     * @param concept The concept receiving feedback
     * @param isRelevant Whether the user marked it as relevant
     */
    public learnFromUserFeedback(concept: string, isRelevant: boolean): void {
        this.userFeedback.set(concept, isRelevant);
    }

    /**
     * Extract concepts using TF-IDF like approach
     * @param content Text content to analyze
     * @returns Array of concepts
     */
    private extractFromTfIdf(content: string): string[] {
        //Tokenize the content
        const tokens = this.textProcessor.tokenize(content);
        
        //remove stop words
        const filteredTokens = this.textProcessor.removeStopWords(tokens);
        
        //calculate term frequency
        const termFrequency = this.textProcessor.calculateTermFrequency(filteredTokens);
        
        //sort by frequency and take top N based on sensitivity
        const threshold = Math.max(2, Math.floor(20 / (11 - this.sensitivity)));
        
        //convert to array and sort by frequency
        const sortedTerms = Array.from(termFrequency.entries())
            .filter(([_, freq]) => freq >= threshold)
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.sensitivity * 3) //take more terms with higher sensitivity
            .map(([term, _]) => term);
            
        return sortedTerms;
    }

    /**
     * Extract concepts from markdown headings
     * @param content Markdown content
     * @returns Array of concepts from headings
     */
    private extractFromHeadings(content: string): string[] {
        const headingRegex = /^#+\s+(.+)$/gm;
        const headings: string[] = [];
        let match;
        
        while ((match = headingRegex.exec(content)) !== null) {
            headings.push(match[1].trim());
        }
        
        return headings;
    }

    /**
     * Extract concepts from emphasized text (bold/italic)
     * @param content Markdown content
     * @returns Array of concepts from emphasized text
     */
    private extractFromEmphasis(content: string): string[] {
        const emphasisRegex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
        const emphasized: string[] = [];
        let match;
        
        while ((match = emphasisRegex.exec(content)) !== null) {
            const text = match[2] || match[4];
            if (text && text.trim().length > 0) {
                emphasized.push(text.trim());
            }
        }
        
        return emphasized;
    }

    /**
     * Extract named entities as concepts
     * @param content Text content
     * @returns Array of named entities
     */
    private extractFromNamedEntities(content: string): string[] {
        return this.textProcessor.extractNamedEntities(content);
    }
}