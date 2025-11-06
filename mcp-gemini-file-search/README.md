# MCP Gemini File Search Server

A Model Context Protocol (MCP) server that integrates Google's Gemini API File Search functionality, enabling Claude to search and analyze documents using Gemini's powerful RAG (Retrieval Augmented Generation) capabilities.

## Features

- **Upload Files**: Upload documents to Gemini's File API (PDF, DOCX, TXT, JSON, and code files)
- **File Management**: List, get details, and delete uploaded files
- **Intelligent Search**: Search through documents using Gemini's vector search with built-in citations
- **Wide Format Support**: Support for PDF, DOCX, TXT, JSON, and common programming languages
- **Automatic Citations**: Responses include citations showing which documents were used

## What is Gemini File Search?

Gemini File Search is a fully managed RAG system built into the Gemini API that:
- Uses vector search powered by Gemini's embedding model
- Automatically chunks and indexes your documents
- Provides citations in responses
- Costs only $0.15 per 1 million tokens for indexing (storage is free)

Learn more: [Gemini File Search Documentation](https://ai.google.dev/gemini-api/docs/file-search)

## Installation

1. **Prerequisites**
   - Node.js 18 or higher
   - A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

2. **Install Dependencies**
   ```bash
   cd mcp-gemini-file-search
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your Gemini API key
   ```

## Configuration for Claude Desktop

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gemini-file-search": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-gemini-file-search/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/mcp-gemini-file-search` with the actual absolute path to this directory.

## Configuration for Claude Code (CLI)

If using Claude Code CLI, you can configure the MCP server in your MCP settings file.

## Available Tools

### 1. `upload_file`
Upload a file to Gemini File API for searching.

**Parameters:**
- `file_path` (required): Path to the file to upload
- `display_name` (optional): Display name for the file

**Example:**
```json
{
  "file_path": "/path/to/document.pdf",
  "display_name": "Important Document"
}
```

### 2. `list_files`
List all uploaded files with their metadata.

**Parameters:** None

### 3. `search_files`
Search through uploaded files using natural language queries.

**Parameters:**
- `query` (required): The search query or question
- `file_uris` (optional): Array of specific file URIs to search
- `model` (optional): Gemini model to use (default: "gemini-2.0-flash-exp")

**Example:**
```json
{
  "query": "What are the key findings about climate change?",
  "file_uris": ["files/abc123", "files/xyz789"]
}
```

### 4. `get_file`
Get detailed metadata about a specific file.

**Parameters:**
- `file_name` (required): The file name (e.g., "files/abc123")

### 5. `delete_file`
Delete a file from Gemini File API.

**Parameters:**
- `file_name` (required): The file name to delete

## Usage Examples

### Example 1: Upload and Search Documents

1. Upload a PDF document:
   ```
   User: Upload the file at /home/user/research-paper.pdf
   Claude: [Uses upload_file tool]
   ```

2. Search the document:
   ```
   User: What does the research paper say about neural networks?
   Claude: [Uses search_files tool with the query]
   ```

### Example 2: Manage Multiple Documents

1. List all uploaded files:
   ```
   User: Show me all uploaded files
   Claude: [Uses list_files tool]
   ```

2. Search across all files:
   ```
   User: Find information about machine learning across all documents
   Claude: [Uses search_files without file_uris to search all files]
   ```

3. Delete old files:
   ```
   User: Delete the file named files/abc123
   Claude: [Uses delete_file tool]
   ```

## Supported File Types

- **Documents**: PDF, DOCX, TXT, Markdown
- **Data**: JSON, CSV
- **Code**: JavaScript, TypeScript, Python, Java, C++, C, HTML, CSS

## Pricing

- **Indexing**: $0.15 per 1 million tokens (one-time cost per file)
- **Storage**: Free
- **Search queries**: Standard Gemini API pricing applies

## Troubleshooting

### "GEMINI_API_KEY environment variable is required"
Make sure you've set the `GEMINI_API_KEY` in your environment or config file.

### "File processing failed"
Some files may fail to process if they're corrupted or in an unsupported format. Check the file and try again.

### "No files available to search"
Upload files using the `upload_file` tool before searching.

## Development

### Watch Mode
```bash
npm run watch
```

### Project Structure
```
mcp-gemini-file-search/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                 # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## How It Works

1. **File Upload**: Files are uploaded to Gemini's File API and automatically chunked and indexed
2. **Vector Search**: When you search, Gemini uses vector embeddings to find relevant chunks
3. **Context Generation**: Relevant chunks are provided as context to Gemini
4. **Response with Citations**: Gemini generates a response with citations showing which documents were used

## Learn More

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Gemini File Search Docs](https://ai.google.dev/gemini-api/docs/file-search)
- [Google AI Studio](https://aistudio.google.com/)

## License

MIT
