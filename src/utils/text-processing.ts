import { TextProcessor } from './types';

//Implementation of text processing utilities for NLP

export class TextProcessingUtils implements TextProcessor {
    //Common English stop words to filter out
    private stopWords: Set<string> = new Set([
        'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
        'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'of', 'as', 'like', 'if', 'that', 'you', 'with', 'your', 'through',
        'to', 'from', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
        'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
        'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
        'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 
        'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
    ]);

    /**
     * Tokenize text into words
     * @param text Input text to tokenize
     * @returns Array of tokens
     */
    public tokenize(text: string): string[] {
        //Remove special characters and tokenize
        const normalized = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')  //Replace special chars with space
            .replace(/\s+/g, ' ')      //Replace multiple spaces with single space
            .trim();                   //Trim leading/trailing spaces
        
        return normalized.split(' ');
    }

    /**
     * Calculate term frequency for tokens
     * @param tokens Array of tokens
     * @returns Map of terms to their frequency
     */
    public calculateTermFrequency(tokens: string[]): Map<string, number> {
        const termFrequency = new Map<string, number>();
        
        for (const token of tokens) {
            const count = termFrequency.get(token) || 0;
            termFrequency.set(token, count + 1);
        }
        
        return termFrequency;
    }

    /**
     * Remove common stop words from tokens
     * @param tokens Array of tokens
     * @returns Filtered array with stop words removed
     */
    public removeStopWords(tokens: string[]): string[] {
        return tokens.filter(token => !this.stopWords.has(token) && token.length > 1);
    }

    /**
     * Basic stemming algorithm for English
     * Implements a simple version of Porter stemming
     * @param tokens Array of tokens
     * @returns Array of stemmed tokens
     */
    public stemWords(tokens: string[]): string[] {
        return tokens.map(token => {
            // Basic stemming rules (simplified)
            if (token.endsWith('ing')) {
                return token.slice(0, -3);
            } else if (token.endsWith('ly')) {
                return token.slice(0, -2);
            } else if (token.endsWith('s') && !token.endsWith('ss')) {
                return token.slice(0, -1);
            } else if (token.endsWith('ed') && token.length > 4) {
                return token.slice(0, -2);
            } else {
                return token;
            }
        });
    }

    /**
     * Extract potential named entities from text
     * Very simplified implementation for proof of concept
     * @param text Input text
     * @returns Array of potential named entities
     */
    public extractNamedEntities(text: string): string[] {
        const sentences = text.split(/[.!?]+/);
        const entities: string[] = [];
        
        //Simple named entity detection based on capitalization i.e. this checks for names
        for (const sentence of sentences) {
            const words = sentence.trim().split(' ');
            
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                
                //Skip first word of sentence and check for capitalization
                if (i > 0 && word.length > 1 && /^[A-Z][a-z]+$/.test(word)) {
                    entities.push(word);
                }
                
                //Check for consecutive capitalized words (compound entities)
                if (i < words.length - 1 && 
                    word.length > 1 && 
                    /^[A-Z][a-z]+$/.test(word) && 
                    /^[A-Z][a-z]+$/.test(words[i+1])) {
                    entities.push(`${word} ${words[i+1]}`);
                }
            }
        }
        
        return [...new Set(entities)];//Remove duplicates
    }
}