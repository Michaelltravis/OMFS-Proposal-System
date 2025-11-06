# Quick Start Guide

## 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key

## 2. Setup

```bash
# Navigate to the MCP server directory
cd mcp-gemini-file-search

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your API key
# GEMINI_API_KEY=your_actual_api_key_here

# Build the project
npm run build
```

## 3. Configure Claude

### For Claude Desktop:

1. Find your config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "gemini-file-search": {
      "command": "node",
      "args": ["/FULL/PATH/TO/mcp-gemini-file-search/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here"
      }
    }
  }
}
```

3. Replace `/FULL/PATH/TO/` with the actual absolute path
4. Restart Claude Desktop

### For Claude Code (CLI):

Add to your MCP settings configuration.

## 4. Test It Out

### Test 1: Upload a File

In Claude, say:
```
Upload the file at /path/to/your/document.pdf using the gemini file search
```

### Test 2: List Files

```
List all files uploaded to Gemini
```

### Test 3: Search Your Files

```
Search my uploaded files for information about [your topic]
```

### Test 4: Clean Up

```
Delete the file named files/[file-id]
```

## 5. Example Workflow

Here's a complete example workflow:

```
You: I have a research paper at ~/Downloads/ai-research.pdf.
     Upload it to Gemini file search.

Claude: [Uploads the file]

You: What are the main findings in this paper?

Claude: [Searches and provides answer with citations]

You: Are there any limitations mentioned?

Claude: [Searches again and provides answer]

You: List all my uploaded files

Claude: [Shows all files]

You: Delete the research paper file

Claude: [Deletes the file]
```

## Troubleshooting

### Can't find the config file?
- On macOS, use Finder > Go > Go to Folder > paste the path
- On Windows, paste the path in File Explorer

### MCP server not showing up in Claude?
1. Check that the path in config is absolute (not relative)
2. Verify the build directory exists: `ls mcp-gemini-file-search/build/`
3. Restart Claude Desktop completely
4. Check Claude's logs for errors

### API key errors?
- Verify your API key is correct
- Check you have API access enabled at https://aistudio.google.com/
- Ensure the key is in the correct format (no extra spaces)

## What You Can Do

✅ Upload PDFs, DOCX, TXT, JSON, and code files
✅ Search across all your documents at once
✅ Get answers with automatic citations
✅ Manage your document library
✅ Use with any Gemini-supported file type

## Cost

- Uploading and indexing: $0.15 per 1 million tokens (one-time)
- Storage: FREE
- Searching: Standard Gemini API pricing

Most documents cost fractions of a cent to index!

## Next Steps

- Try uploading multiple related documents
- Use complex queries across all your files
- Experiment with different file types
- Check the full README.md for advanced usage
