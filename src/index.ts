import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { v7 as uuidv7 } from "uuid";
import type { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Create the server
const server = new Server(
  { name: "uuid-mcp-provider", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Advertise our generateUuid tool, accepting an optional `count`
server.setRequestHandler(
  ListToolsRequestSchema,
  async () => {
    return {
      tools: [
        {
          name: "generateUuid",
          description: "Generate one or more UUID v7s (timestamp-based). Specify `count` to get multiple.",
          inputSchema: {
            type: "object",
            properties: {
              count: {
                type: "integer",
                minimum: 1,
                description: "How many UUID v7 strings to generate (defaults to 1)"
              }
            },
            additionalProperties: false
          }
        }
      ]
    };
  }
);

// Handle calls to generateUuid and generate `count` UUIDs
server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    if (request.params.name === "generateUuid") {
      // Pull from params.arguments per MCP spec
      const raw = request.params.arguments?.count;
      const count = typeof raw === "number" && raw >= 1 ? raw : 1;

      const uuids: string[] = [];
      for (let i = 0; i < count; i++) {
        uuids.push(uuidv7());
      }

      return {
        content: [
          {
            type: "text",
            text: uuids.join("\n")
          }
        ]
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  }
);

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("UUID MCP Provider running on stdio...");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main();

