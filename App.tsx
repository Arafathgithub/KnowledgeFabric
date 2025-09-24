
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { GraphVisualization } from './components/GraphVisualization';
import { ChatInterface } from './components/ChatInterface';
import { NodeDetails } from './components/NodeDetails';
import { LoadingSpinner, BrainCircuitIcon, PanelExpandIcon } from './components/icons';
import * as geminiService from './services/geminiService';
import * as azureOpenAIService from './services/azureOpenAIService';
import { GraphData, ChatMessage, Node } from './types';

const App: React.FC = () => {
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [isAnsweringChat, setIsAnsweringChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGraphSaved, setIsGraphSaved] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'azure'>('gemini');
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<Set<string>>(new Set());

  const aiServices = {
    gemini: geminiService,
    azure: azureOpenAIService,
  };

  const uniqueNodeTypes = useMemo(() => {
    if (!graphData) return [];
    const types = new Set(graphData.nodes.map(node => node.type));
    return Array.from(types).sort();
  }, [graphData]);

  useEffect(() => {
    try {
      const savedGraphJSON = localStorage.getItem('knowledgeGraph');
      if (savedGraphJSON) {
        const savedGraph = JSON.parse(savedGraphJSON);
        if (savedGraph.nodes && savedGraph.links) {
          setGraphData(savedGraph);
          setSelectedNodeTypes(new Set(savedGraph.nodes.map((n: Node) => n.type)));
          setChatMessages([{
            sender: 'ai',
            text: 'Loaded saved knowledge graph. Ask me anything!'
          }]);
          setIsGraphSaved(true);
        } else {
            localStorage.removeItem('knowledgeGraph');
        }
      }
    } catch (err) {
        console.error("Failed to load or parse graph from localStorage", err);
        localStorage.removeItem('knowledgeGraph');
    }
  }, []);

  const handleFileUpload = useCallback(async (text: string) => {
    setDocumentText(text);
    setGraphData(null);
    setChatMessages([]);
    setError(null);
    setIsLoadingGraph(true);
    setIsPanelCollapsed(false);
    setSelectedNode(null);
    setSelectedNodeTypes(new Set());

    try {
      const service = aiServices[aiProvider];
      const newGraphData = await service.generateGraphFromText(text);
      setGraphData(newGraphData);
      setSelectedNodeTypes(new Set(newGraphData.nodes.map(n => n.type)));
      setChatMessages([{
          sender: 'ai',
          text: `Knowledge graph generated with ${aiProvider}. Ask me anything about the document!`
      }]);
      localStorage.setItem('knowledgeGraph', JSON.stringify(newGraphData));
      setIsGraphSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate knowledge graph. Please try again.');
    } finally {
      setIsLoadingGraph(false);
    }
  }, [aiProvider]);

  const handleClearStorage = useCallback(() => {
    localStorage.removeItem('knowledgeGraph');
    setIsGraphSaved(false);
    setGraphData(null);
    setChatMessages([]);
    setDocumentText(null);
    setError(null);
    setIsPanelCollapsed(false);
    setSelectedNode(null);
    setSelectedNodeTypes(new Set());
  }, []);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!graphData) return;

    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text: message }];
    setChatMessages(newMessages);
    setIsAnsweringChat(true);
    setSelectedNode(null);

    try {
      const service = aiServices[aiProvider];
      const response = await service.queryGraphWithText(graphData, message);
      setChatMessages([...newMessages, { sender: 'ai', text: response }]);
    } catch (err) {
      console.error(err);
      setChatMessages([...newMessages, { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsAnsweringChat(false);
    }
  }, [graphData, chatMessages, aiProvider]);

  const handleTogglePanel = () => {
      setIsPanelCollapsed(prev => !prev);
  }
  
  const handleExportGraph = useCallback(() => {
    if (!graphData) return;

    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge-graph.json';
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [graphData]);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleCloseNodeDetails = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeTypeChange = useCallback((nodeType: string, isSelected: boolean) => {
    setSelectedNodeTypes(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(nodeType);
      } else {
        newSet.delete(nodeType);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans p-4 lg:p-6 flex flex-col">
      <header className="flex items-center justify-between pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <BrainCircuitIcon className="w-8 h-8 text-cyan-400"/>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
            Knowledge Graph Visualizer
          </h1>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 relative">
        {isPanelCollapsed && (
            <button
                onClick={handleTogglePanel}
                className="absolute top-4 left-0 z-20 bg-slate-800/80 p-2 rounded-r-lg hover:bg-slate-700 transition-colors"
                aria-label="Show controls panel"
            >
                <PanelExpandIcon className="w-5 h-5 text-gray-200" />
            </button>
        )}
        <aside className={`lg:col-span-3 bg-slate-800/50 rounded-lg p-6 flex-col h-full ${isPanelCollapsed ? 'hidden' : 'flex'}`}>
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isLoading={isLoadingGraph} 
            isGraphSaved={isGraphSaved}
            onClearStorage={handleClearStorage}
            onTogglePanel={handleTogglePanel}
            onExportGraph={handleExportGraph}
            aiProvider={aiProvider}
            onAiProviderChange={setAiProvider}
            uniqueNodeTypes={uniqueNodeTypes}
            selectedNodeTypes={selectedNodeTypes}
            onNodeTypeChange={handleNodeTypeChange}
          />
        </aside>

        <div className={`${isPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-9'} grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-3 gap-6 relative`}>
          <div className="lg:col-span-2 bg-slate-800/50 rounded-lg p-4 relative min-h-[400px] lg:min-h-0 flex items-center justify-center">
            {isLoadingGraph && (
              <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center z-10 rounded-lg">
                <LoadingSpinner className="w-12 h-12" />
                <p className="mt-4 text-lg">Generating Knowledge Graph...</p>
              </div>
            )}
            {error && !isLoadingGraph && (
              <div className="text-center text-red-400 p-4">
                <p className="font-semibold">An Error Occurred</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            {!graphData && !isLoadingGraph && !error && (
               <div className="text-center text-slate-400 flex flex-col items-center">
                 <BrainCircuitIcon className="w-16 h-16 mb-4 text-slate-600"/>
                 <h3 className="text-xl font-semibold mb-2">Graph Visualization</h3>
                 <p>Upload a document or load a saved graph.</p>
               </div>
            )}
            {graphData && <GraphVisualization key={isPanelCollapsed ? 'collapsed' : 'expanded'} data={graphData} onNodeClick={handleNodeClick} selectedNodeTypes={selectedNodeTypes} />}
          </div>

          <div className="lg:col-span-1 bg-slate-800/50 rounded-lg flex flex-col">
            <ChatInterface 
              messages={chatMessages} 
              onSendMessage={handleSendMessage}
              isAnswering={isAnsweringChat}
              isReady={!!graphData}
            />
          </div>

          {selectedNode && graphData && (
            <NodeDetails 
              node={selectedNode} 
              graphData={graphData} 
              onClose={handleCloseNodeDetails} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
