
import { GoogleGenAI, Type } from "@google/genai";
import { GraphData, Node, Link } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const graphSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            description: "A list of unique entities (nodes) found in the text.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description: "A unique identifier for the node (e.g., the entity name itself, normalized).",
                    },
                    label: {
                        type: Type.STRING,
                        description: "The display name for the entity.",
                    },
                    type: {
                        type: Type.STRING,
                        description: "The category or type of the entity (e.g., 'Person', 'Location', 'Concept').",
                    },
                },
                required: ["id", "label", "type"],
            },
        },
        links: {
            type: Type.ARRAY,
            description: "A list of relationships (links) between the entities.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: {
                        type: Type.STRING,
                        description: "The 'id' of the source node for this relationship.",
                    },
                    target: {
                        type: Type.STRING,
                        description: "The 'id' of the target node for this relationship.",
                    },
                    label: {
                        type: Type.STRING,
                        description: "A description of the relationship (e.g., 'discovered', 'located in', 'is a').",
                    },
                },
                required: ["source", "target", "label"],
            },
        },
    },
    required: ["nodes", "links"],
};


export const generateGraphFromText = async (text: string): Promise<GraphData> => {
    const prompt = `Based on the following document, extract entities and their relationships to form a knowledge graph. Identify distinct entities as nodes and the connections between them as links.

Document:
---
${text}
---
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: graphSchema,
            },
        });
        const jsonText = response.text;
        const parsedJson = JSON.parse(jsonText);

        // Basic validation
        if (!parsedJson.nodes || !Array.isArray(parsedJson.nodes) || !parsedJson.links || !Array.isArray(parsedJson.links)) {
            throw new Error("Invalid graph structure from API: 'nodes' or 'links' is not an array.");
        }
        
        // Data integrity check: Ensure all links refer to existing nodes.
        const nodeIds = new Set(parsedJson.nodes.map((node: Node) => node.id));
        
        const validLinks = parsedJson.links.filter((link: Link) => {
            const sourceExists = nodeIds.has(link.source);
            const targetExists = nodeIds.has(link.target);
            if (!sourceExists) {
                console.warn(`Filtering link: source node '${link.source}' not found. Link: ${JSON.stringify(link)}`);
            }
            if (!targetExists) {
                console.warn(`Filtering link: target node '${link.target}' not found. Link: ${JSON.stringify(link)}`);
            }
            return sourceExists && targetExists;
        });

        if (validLinks.length < parsedJson.links.length) {
            console.log(`Filtered ${parsedJson.links.length - validLinks.length} invalid link(s) due to missing nodes.`);
        }
        
        return {
            nodes: parsedJson.nodes,
            links: validLinks,
        };

    } catch (error) {
        console.error("Error generating graph from text:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI model's JSON response.");
        }
        throw new Error("Failed to communicate with the AI model.");
    }
};

export const queryGraphWithText = async (graphData: GraphData, question: string): Promise<string> => {
    const graphString = JSON.stringify(graphData, null, 2);

    const prompt = `You are an expert Q&A system. Your task is to answer the user's question based *only* on the information provided in the following knowledge graph. If the answer cannot be found in the graph, state that clearly. Do not use any external knowledge.

Knowledge Graph (JSON format):
---
${graphString}
---

Question:
${question}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error querying graph:", error);
        throw new Error("Failed to get an answer from the AI model.");
    }
};
