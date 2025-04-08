import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";
import { createWorker, createScheduler } from "tesseract.js";
// Create server instance
const server = new Server({
    name: "weather",
    version: "1.0.0"
}, {
    capabilities: {
        resources: {},
        tools: {},
    },
});
const scheduler = createScheduler();
const worker1 = await createWorker('eng');
const worker2 = await createWorker('eng');
async function getText(link) {
    scheduler.addWorker(worker1);
    scheduler.addWorker(worker2);
    /** Add 10 recognition jobs */
    const results = await Promise.all(Array(10).fill(0).map(() => (scheduler.addJob('recognize', link))));
    console.log(results);
    await scheduler.terminate(); // It also terminates all workers.
    return { toolResult: results.map((result) => result.data.text).join("\n") };
}
// register tools 
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [{
                name: "process-ocr-image",
                description: "Get text from an image file",
                inputSchema: {
                    type: "object", // should be "object"
                    properties: {
                        link: { type: "string" },
                    },
                    required: ["link"],
                }
            },
            // {
            //    name: "get-forecast",
            //    description: "Get weather forecast for a location",
            //    inputSchema: {
            //       type: "object", // should be "object"
            //       properties: {
            //          latitude: { type: "number" },
            //          longitude: { type: "number" },
            //       },
            //       required: ["latitude", "longitude"],
            //    }
            // }
        ]
    };
});
// Handle tool requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "process-ocr-image") {
        const arg = request.params.arguments;
        const link = arg.link;
        return getText(link);
    }
    // if (request.params.name === "get-forecast") {
    //    const arg = request.params.arguments as { latitude: number, longitude: number };
    //    const latitude = arg.latitude;
    //    const longitude = arg.longitude;
    //    // return getForecast({ latitude, longitude });
    // }
    throw new McpError(ErrorCode.MethodNotFound, "Tool not found");
});
const transport = new StdioServerTransport();
await server.connect(transport);
