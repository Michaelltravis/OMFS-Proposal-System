# MCP Gemini File Search - Installation Guide

## Quick Installation

### 1. Navigate to the MCP server directory
```bash
cd mcp-gemini-file-search
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the project
```bash
npm run build
```

The build output will be in the `build/` directory.

### 4. Get your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key

### 5. Configure for Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration (replace paths and API key):

```json
{
  "mcpServers": {
    "gemini-file-search": {
      "command": "node",
      "args": ["/absolute/path/to/OMFS-Proposal-System/mcp-gemini-file-search/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_actual_gemini_api_key_here"
      }
    }
  }
}
```

**IMPORTANT**:
- Use the **absolute path** to the `build/index.js` file
- Replace `your_actual_gemini_api_key_here` with your real API key

### 6. Restart Claude Desktop

Completely quit and restart Claude Desktop for the changes to take effect.

### 7. Verify Installation

In Claude Desktop, you should now be able to use commands like:

```
List all files in Gemini
```

If the MCP server is working, Claude will have access to the file search tools.

## Configuration for Claude Code CLI

If you're using Claude Code CLI, configure the MCP server in your settings:

```json
{
  "mcpServers": {
    "gemini-file-search": {
      "command": "node",
      "args": ["/absolute/path/to/OMFS-Proposal-System/mcp-gemini-file-search/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_actual_gemini_api_key_here"
      }
    }
  }
}
```

## Testing the Installation

Once installed, try these commands in Claude:

1. **Upload a file**:
   ```
   Upload the file at /path/to/document.pdf to Gemini
   ```

2. **List files**:
   ```
   List all files in Gemini
   ```

3. **Search files**:
   ```
   Search my Gemini files for information about [topic]
   ```

## Troubleshooting

### "GEMINI_API_KEY environment variable is required"
- Make sure you've added the API key to the config file
- Verify the key is correct (no extra spaces)
- Restart Claude Desktop after making config changes

### MCP server not showing up
- Verify the path in the config is absolute (starts with `/` on macOS/Linux or `C:\` on Windows)
- Check that the build directory exists and contains `index.js`
- Look at Claude Desktop logs for error messages

### Build fails
- Make sure you have Node.js 18 or higher: `node --version`
- Try removing `node_modules` and reinstalling: `rm -rf node_modules package-lock.json && npm install`

## Development Mode

For development, you can use watch mode to automatically rebuild on changes:

```bash
npm run watch
```

## File Structure

```
mcp-gemini-file-search/
├── src/
│   └── index.ts          # TypeScript source code
├── build/
│   ├── index.js          # Compiled JavaScript (what Claude runs)
│   ├── index.d.ts        # TypeScript declarations
│   └── *.map             # Source maps
├── node_modules/         # Dependencies
├── package.json          # NPM configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Full documentation
├── QUICK_START.md        # Quick start guide
└── INSTALLATION.md       # This file
```

## Next Steps

After installation, see:
- [README.md](README.md) for full feature documentation
- [QUICK_START.md](QUICK_START.md) for usage examples
