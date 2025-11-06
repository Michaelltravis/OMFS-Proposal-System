#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI } from "@google/genai";
import * as path from "path";

// Environment variable for API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "upload_file",
    description:
      "Upload a file to Gemini File API for file search. Supports PDF, DOCX, TXT, JSON, and common programming language files. Returns the file URI and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to upload",
        },
        display_name: {
          type: "string",
          description: "Optional display name for the file",
        },
        mime_type: {
          type: "string",
          description:
            "Optional MIME type. If not provided, will be inferred from file extension.",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "list_files",
    description:
      "List all files uploaded to Gemini File API. Returns file metadata including names, URIs, states, and timestamps.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "search_files",
    description:
      "Search through uploaded files using Gemini's File Search tool. Uses vector search with built-in citations. Provide a query and optional list of file URIs to search.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query or question to ask about the files",
        },
        file_uris: {
          type: "array",
          items: {
            type: "string",
          },
          description:
            "Optional array of specific file URIs to search. If not provided, searches all uploaded files.",
        },
        model: {
          type: "string",
          description:
            "Optional Gemini model to use. Defaults to 'gemini-2.0-flash-exp'",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "delete_file",
    description:
      "Delete a file from Gemini File API by its name or URI. Use list_files to get file names.",
    inputSchema: {
      type: "object",
      properties: {
        file_name: {
          type: "string",
          description: "The name of the file to delete (e.g., 'files/abc123')",
        },
      },
      required: ["file_name"],
    },
  },
  {
    name: "get_file",
    description:
      "Get detailed metadata about a specific file including state, size, MIME type, and timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        file_name: {
          type: "string",
          description: "The name of the file (e.g., 'files/abc123')",
        },
      },
      required: ["file_name"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "mcp-gemini-file-search",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to determine MIME type
function getMimeType(filePath: string, customMimeType?: string): string {
  if (customMimeType) return customMimeType;

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".js": "text/javascript",
    ".ts": "text/typescript",
    ".py": "text/x-python",
    ".java": "text/x-java",
    ".cpp": "text/x-c++",
    ".c": "text/x-c",
    ".html": "text/html",
    ".css": "text/css",
    ".md": "text/markdown",
    ".csv": "text/csv",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

// Helper function to wait for file processing
async function waitForFileActive(fileName: string): Promise<void> {
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const file = await genAI.files.get({ name: fileName });

      if (file.state === "ACTIVE") {
        return;
      }

      if (file.state === "FAILED") {
        throw new Error(`File processing failed for ${fileName}`);
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      throw new Error(`Error checking file status: ${error}`);
    }
  }

  throw new Error(`File processing timeout for ${fileName}`);
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "upload_file": {
        const { file_path, display_name, mime_type } = args as {
          file_path: string;
          display_name?: string;
          mime_type?: string;
        };

        const fileName = display_name || path.basename(file_path);
        const mimeType = getMimeType(file_path, mime_type);

        // Upload file using the new SDK
        const uploadResult = await genAI.files.upload({
          file: file_path,
          config: {
            mimeType,
            displayName: fileName,
          },
        });

        // Wait for file to be active
        if (uploadResult.name) {
          await waitForFileActive(uploadResult.name);
        }

        // Get final file details
        const file = uploadResult.name
          ? await genAI.files.get({ name: uploadResult.name })
          : uploadResult;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  file: {
                    name: file.name,
                    uri: file.uri,
                    displayName: file.displayName,
                    mimeType: file.mimeType,
                    sizeBytes: file.sizeBytes,
                    state: file.state,
                    createTime: file.createTime,
                  },
                  message: "File uploaded and processed successfully",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_files": {
        const pager = await genAI.files.list();

        const files: any[] = [];
        for await (const file of pager) {
          files.push({
            name: file.name,
            uri: file.uri,
            displayName: file.displayName,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            state: file.state,
            createTime: file.createTime,
            updateTime: file.updateTime,
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  count: files.length,
                  files,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "search_files": {
        const { query, file_uris, model = "gemini-2.0-flash-exp" } = args as {
          query: string;
          file_uris?: string[];
          model?: string;
        };

        // Get files to search
        let fileUrisToSearch: string[] = [];

        if (file_uris && file_uris.length > 0) {
          fileUrisToSearch = file_uris;
        } else {
          // Get all files if no specific URIs provided
          const pager = await genAI.files.list();
          for await (const file of pager) {
            if (file.uri) {
              fileUrisToSearch.push(file.uri);
            }
          }
        }

        if (fileUrisToSearch.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error:
                      "No files available to search. Please upload files first.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Create the content array with text and file parts
        const contentParts: any[] = [{ text: query }];

        // Add file URIs as parts
        for (const uri of fileUrisToSearch) {
          contentParts.push({
            fileData: {
              fileUri: uri,
              mimeType: "application/pdf", // This will be overridden by actual file type
            },
          });
        }

        // Perform search using Gemini with File Search tool
        const result = await genAI.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: contentParts,
            },
          ],
          config: {
            tools: [
              {
                fileSearch: {},
              } as any,
            ],
          },
        });

        const responseText = result.text || "";

        // Extract grounding metadata (citations) if available
        const groundingMetadata = (result as any).groundingMetadata || null;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  query,
                  model,
                  filesSearched: fileUrisToSearch.length,
                  response: responseText,
                  groundingMetadata,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "delete_file": {
        const { file_name } = args as { file_name: string };

        // Try to delete using the file name
        const deleteMethod = (genAI.files as any).delete;
        if (deleteMethod) {
          await deleteMethod.call(genAI.files, { name: file_name });
        } else {
          throw new Error("Delete method not available in this SDK version");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `File ${file_name} deleted successfully`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_file": {
        const { file_name } = args as { file_name: string };

        const file = await genAI.files.get({ name: file_name });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  file: {
                    name: file.name,
                    uri: file.uri,
                    displayName: file.displayName,
                    mimeType: file.mimeType,
                    sizeBytes: file.sizeBytes,
                    state: file.state,
                    createTime: file.createTime,
                    updateTime: file.updateTime,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Gemini File Search server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
