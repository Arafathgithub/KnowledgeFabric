
import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { GraphVisualization } from './components/GraphVisualization';
import { ChatInterface } from './components/ChatInterface';
import { LoadingSpinner, BrainCircuitIcon } from './components/icons';
import { generateGraphFromText, queryGraphWithText } from './services/geminiService';
import { GraphData, ChatMessage } from './types';

const App: React.FC = () => {
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [isAnsweringChat, setIsAnsweringChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGraphSaved, setIsGraphSaved] = useState(false);

  useEffect(() => {
    try {
      const savedGraphJSON = localStorage.getItem('knowledgeGraph');
      if (savedGraphJSON) {
        const savedGraph = JSON.parse(savedGraphJSON);
        if (savedGraph.nodes && savedGraph.links) {
          setGraphData(savedGraph);
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

    try {
      const newGraphData = await generateGraphFromText(text);
      setGraphData(newGraphData);
      setChatMessages([{
          sender: 'ai',
          text: 'Knowledge graph generated. Ask me anything about the document!'
      }]);
      localStorage.setItem('knowledgeGraph', JSON.stringify(newGraphData));
      setIsGraphSaved(true);
    } catch (err) {
      console.error(err);
      setError('Failed to generate knowledge graph. Please try again.');
    } finally {
      setIsLoadingGraph(false);
    }
  }, []);

  const handleClearStorage = useCallback(() => {
    localStorage.removeItem('knowledgeGraph');
    setIsGraphSaved(false);
    setGraphData(null);
    setChatMessages([]);
    setDocumentText(null);
    setError(null);
  }, []);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!graphData) return;

    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text: message }];
    setChatMessages(newMessages);
    setIsAnsweringChat(true);

    try {
      const response = await queryGraphWithText(graphData, message);
      setChatMessages([...newMessages, { sender: 'ai', text: response }]);
    } catch (err) {
      console.error(err);
      setChatMessages([...newMessages, { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsAnsweringChat(false);
    }
  }, [graphData, chatMessages]);

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

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <aside className="lg:col-span-3 bg-slate-800/50 rounded-lg p-6 flex flex-col h-full">
          <FileUpload 
            onFileUpload={handleFileUpload} 
            isLoading={isLoadingGraph} 
            isGraphSaved={isGraphSaved}
            onClearStorage={handleClearStorage}
          />
        </aside>

        <div className="lg:col-span-9 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 rounded-lg p-4 relative min-h-[400px] lg:min-h-0 flex items-center justify-center">
            {isLoadingGraph && (
              <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center z-10 rounded-lg">
                <LoadingSpinner className="w-12 h-12" />
                <p className="mt-4 text-lg">Generating Knowledge Graph...</p>
              </div>
            )}
            {error && !isLoadingGraph && (
              <div className="text-center text-red-400">
                <p>Error: {error}</p>
              </div>
            )}
            {!graphData && !isLoadingGraph && !error && (
               <div className="text-center text-slate-400 flex flex-col items-center">
                 <BrainCircuitIcon className="w-16 h-16 mb-4 text-slate-600"/>
                 <h3 className="text-xl font-semibold mb-2">Graph Visualization</h3>
                 <p>Upload a document or load a saved graph.</p>
               </div>
            )}
            {graphData && <GraphVisualization data={graphData} />}
          </div>

          <div className="lg:col-span-1 bg-slate-800/50 rounded-lg flex flex-col">
            <ChatInterface 
              messages={chatMessages} 
              onSendMessage={handleSendMessage}
              isAnswering={isAnsweringChat}
              isReady={!!graphData}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
