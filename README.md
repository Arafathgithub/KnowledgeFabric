# Knowledge Graph Visualizer

This application allows users to upload a text document, from which an AI-powered service generates a knowledge graph. The graph's entities and relationships are then visualized interactively using D3.js. Users can explore the graph with advanced analysis tools and query it through a chat interface to gain deep insights from the document.

### Features

*   **Document Processing & Graph Generation**
    *   **Upload & Sample Data:** Upload `.txt` files or load a sample document to get started quickly.
    *   **AI-Powered Generation:** Utilizes Google Gemini to extract entities (nodes) and relationships (links) from text, automatically constructing a knowledge graph.
    *   **Provider Selection:** Switch between AI providers (Note: Azure OpenAI is currently a placeholder).

*   **Interactive Graph Visualization**
    *   **Dynamic Rendering:** Renders the knowledge graph using D3.js, with smooth zoom, pan, and drag-and-drop functionalities.
    *   **Node Inspection:** Click on any node to view its properties and all its direct connections in a detailed side panel.
    *   **Node Filtering:** Dynamically filter the graph by node type using checkboxes to focus on specific entity categories.
    *   **Graph Search:** Instantly search for nodes by name to quickly locate specific entities within complex graphs.

*   **Advanced Analysis & Insights**
    *   **Centrality Analysis:** Identify the most influential nodes by highlighting a user-defined percentage of the most connected entities ("Importance").
    *   **Community Detection:** Automatically detect and color-code clusters or communities of closely related nodes.
    *   **Node Comparison:** A dedicated mode to select any two nodes and analyze their relationship, showing the shortest path and common neighbors.
    *   **Conversational Q&A:** Ask questions about the document's content in natural language via an integrated chat interface that queries the graph.

*   **Utilities & Data Management**
    *   **Persistent Storage:** Automatically saves the last generated graph to the browser's local storage for easy access in future sessions.
    *   **Export Functionality:** Download the complete graph data as a structured JSON file.
    *   **Collapsible Controls:** A clean UI with a side panel for controls that can be collapsed to maximize visualization space.
    *   **Responsive Design:** Optimized for various screen sizes, from large desktops to smaller devices.

### Tech Stack
*   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Data Visualization:** [D3.js](https://d3js.org/)
*   **AI Model:** [Google Gemini API](https://ai.google.dev/)

---

## Setup and Running Locally

#### 1. Prerequisites
*   A modern web browser.
*   A Google Gemini API key.

#### 2. Environment Variables
This project requires a Google Gemini API key to function. The application is configured to read the key from an environment variable named `API_KEY`.

The execution environment (whether local development or a deployed server) **must** have the `API_KEY` variable set. The application will not prompt for a key and will fail if it's not available.

For local development, you will need to ensure this environment variable is available when you run the application.

#### 3. Running the Application
This project is designed to run in an environment that supports modern JavaScript with modules, such as a simple web server or a development environment like Vite.

To run with a simple server:
1.  Make sure you have [Node.js](https://nodejs.org/) installed.
2.  Install a simple server package globally, for example `serve`:
    ```bash
    npm install -g serve
    ```
3.  Navigate to the project directory and run the server:
    ```bash
    serve .
    ```
4.  Open your browser and navigate to the local address provided by the server (e.g., `http://localhost:3000`).

---

## Deployment

This application is a static single-page application (SPA). You can deploy it to any static site hosting service.

1.  **Build Step:** There is no explicit build step required for this setup, as it uses ES modules and CDNs directly. You can simply deploy the existing files.
2.  **Hosting:** Deploy the entire project folder to a service like:
    *   [Vercel](https://vercel.com/)
    *   [Netlify](https://www.netlify.com/)
    *   [GitHub Pages](https://pages.github.com/)
    *   [Firebase Hosting](https://firebase.google.com/docs/hosting)
3.  **Environment Variable:** Make sure to configure the `API_KEY` environment variable in your hosting provider's settings. Refer to your provider's documentation for instructions on how to set environment variables for your deployment.

---

## Project Structure
```
.
├── components/                 # React components
│   ├── ChatInterface.tsx
│   ├── FileUpload.tsx
│   ├── GraphVisualization.tsx
│   ├── NodeDetails.tsx
│   └── icons.tsx
├── services/                   # Logic for communicating with AI APIs
│   ├── geminiService.ts
│   └── azureOpenAIService.ts   # Placeholder
├── App.tsx                     # Main application component
├── index.html                  # Main HTML file
├── index.tsx                   # React app entry point
├── metadata.json               # Application metadata
├── README.md                   # This file
├── sample-document.txt         # A sample document for testing
└── types.ts                    # TypeScript type definitions
```

---

## Notes on AI Providers

*   **Gemini:** The primary and fully implemented AI provider. It uses the `@google/genai` SDK to generate the graph and answer chat queries.
*   **Azure OpenAI:** This is a **placeholder** and is **not implemented**. Selecting this provider will result in an error. The service file (`azureOpenAIService.ts`) contains commented-out boilerplate for a potential future implementation.