# Knowledge Synthesis Plugin for Obsidian

A plugin that automatically analyzes note content to discover hidden connections between ideas using natural language processing. Enhance your knowledge management by finding conceptual relationships across your notes without manual linking.

## Features

- **Automatic Concept Extraction**: Identifies important topics and themes in your notes
- **Related Notes Panel**: Shows notes with similar concepts even without manual links
- **Concept Tagging**: Add or remove concept tags with one click
- **Knowledge Graph**: Visualize semantic relationships between notes
- **Summary Generation**: Create summary notes that combine information from related sources

## Installation

### For Testing and Review

1.  Download the project files from the repository
2.  Ensure you have Obsidian installed (v0.15.0 or newer)
3.  Create a test vault or use an existing one
4.  Enable Community Plugins and turn on Developer Mode in Obsidian settings
5.  Create a folder at this location: `[Your Vault]/.obsidian/plugins/knowledge-synthesis/`
6.  Copy the following files into that folder:
    - `main.js`
    - `manifest.json`
    - `styles.css`
7.  Restart Obsidian and enable the "Knowledge Synthesis" plugin in Settings → Community plugins

### For Development

1.  Clone the repository
2.  Run `npm install` to install dependencies
3.  Run `npm run dev` for development with hot-reload
4.  Run `npm run build` to create a production build

## Usage Guide

### Getting Started

1.  Open any note in your vault
2.  Click the "Network" icon in the ribbon to open the Related Notes panel
3.  The plugin will automatically extract concepts from your current note and show related notes

### Interacting with Concepts

- **View Concepts**: Open any note to see its key concepts in the Related Notes panel
- **Add/Remove Concepts**: Click on a concept to remove it or use the "+" button to add new ones
- **Find Related Notes**: The plugin automatically shows notes that share concepts with your current note
- **Generate Summaries**: Click the "Generate Summary" button to create a new note that combines information from related sources

### Configuration

In the plugin settings, you can adjust:

- **Extraction Sensitivity**: Control how aggressively concepts are extracted (1-10)
- **Maximum Related Notes**: Set how many related notes are displayed
- **Real-Time Suggestions**: Enable/disable automatic updates while editing
- **Include Tags/Links**: Choose whether to consider #tags and \[\[links\]\] as concepts

## Project Structure

- `main.ts`: Entry point for the plugin
- `src/core/`: Core functionality (concept extraction, relationship graph)
- `src/ui/`: User interface components
- `src/services/`: Service layer connecting UI and core
- `src/utils/`: Utility functions and type definitions

## Contributors

- **Shefreen**: Core backend implementation, plugin architecture, data structures
- **Gurman**: UI components, graph visualization, frontend functionality
- **Fuzail**: Documentation, user guide, project report

## Building from Source

bash

```
# Install dependencies

npm install


# Run development build with hot-reload

npm run dev

# Create production build

npm run build
```

## Testing

For the best testing experience:

1.  Create several notes with related content
2.  Open one of the notes to see related notes in the panel
3.  Try adding and removing concepts to adjust the relationships
4.  Generate a summary from related notes

## Notes for Evaluation

- The plugin uses simple NLP techniques for concept extraction
- The concept graph visualization supports zooming and panning
- Summary generation includes highlighting of shared concepts
- Settings allow customization of extraction sensitivity and behavior

We welcome any feedback on the functionality, user experience, or code structure. 

&nbsp;

&nbsp;