import React, { useRef, useState, ChangeEvent } from 'react';
import { UploadIcon, DocumentIcon, LoadingSpinner, TrashIcon, DownloadIcon, PanelCollapseIcon, AnalyticsIcon, UsersIcon, GitCompareIcon } from './icons';
import { AnalysisType } from '../App';
import { Node } from '../types';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
  isLoading: boolean;
  isGraphSaved: boolean;
  onClearStorage: () => void;
  onTogglePanel: () => void;
  onExportGraph: () => void;
  aiProvider: 'gemini' | 'azure';
  onAiProviderChange: (provider: 'gemini' | 'azure') => void;
  uniqueNodeTypes: string[];
  selectedNodeTypes: Set<string>;
  onNodeTypeChange: (nodeType: string, isSelected: boolean) => void;
  analysisType: AnalysisType;
  onAnalysisTypeChange: (type: AnalysisType) => void;
  centralityTopN: number;
  onCentralityTopNChange: (value: number) => void;
  isCompareMode: boolean;
  onToggleCompareMode: () => void;
  comparisonNode1: Node | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  isLoading, 
  isGraphSaved, 
  onClearStorage,
  onTogglePanel,
  onExportGraph,
  aiProvider,
  onAiProviderChange,
  uniqueNodeTypes,
  selectedNodeTypes,
  onNodeTypeChange,
  analysisType,
  onAnalysisTypeChange,
  centralityTopN,
  onCentralityTopNChange,
  isCompareMode,
  onToggleCompareMode,
  comparisonNode1
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onFileUpload(text);
      };
      reader.readAsText(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearClick = () => {
    onClearStorage();
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async () => {
    if (isLoading) return;
    try {
      const response = await fetch('/sample-document.txt');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const text = await response.text();
      setFileName('sample-document.txt');
      onFileUpload(text);
    } catch (error) {
      console.error("Failed to load sample document:", error);
    }
  };
  
  return (
    <div className="flex flex-col h-full relative">
       <button 
        onClick={onTogglePanel}
        disabled={isLoading}
        className="absolute -top-2 -right-2 p-1 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
        aria-label="Hide controls panel"
      >
        <PanelCollapseIcon className="w-6 h-6" />
      </button>
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Controls</h2>
        
        <div className="mb-6">
            <label className="text-sm font-semibold text-gray-300 mb-2 block">AI Provider</label>
            <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${aiProvider === 'gemini' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                    onClick={() => onAiProviderChange('gemini')}
                    disabled={isLoading}
                >
                    Gemini
                </button>
                <button
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${aiProvider === 'azure' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                    onClick={() => onAiProviderChange('azure')}
                    disabled={isLoading}
                >
                    Azure OpenAI
                </button>
            </div>
        </div>
        
        <div className="flex flex-col space-y-4 mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt"
          />
          <button
            onClick={handleButtonClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><LoadingSpinner className="w-5 h-5"/>Processing...</>
            ) : (
              <><UploadIcon className="w-5 h-5"/>Upload Document</>
            )}
          </button>
          {fileName && !isLoading && (
              <p className="text-sm text-center text-slate-400 truncate">
                  File: {fileName}
              </p>
          )}
        </div>

        {isGraphSaved && (
          <>
            <div className="space-y-6 border-t border-slate-700 pt-6">
              {uniqueNodeTypes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Node Type Filters</h3>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar border border-slate-700 rounded-lg p-3 bg-slate-900/30">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {uniqueNodeTypes.map(type => (
                        <label key={type} className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedNodeTypes.has(type)}
                            onChange={(e) => onNodeTypeChange(type, e.target.checked)}
                            className="h-4 w-4 rounded bg-slate-700 border-slate-500 text-cyan-500 focus:ring-cyan-600"
                          />
                          <span className="truncate" title={type}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Graph Analysis</h3>
                <div className="flex bg-slate-700 rounded-lg p-1 text-sm text-center font-semibold">
                  {([['none', 'None'], ['centrality', 'Importance'], ['clusters', 'Clusters']] as const).map(([type, label]) => (
                    <button key={type} onClick={() => onAnalysisTypeChange(type)} className={`flex-1 py-1.5 rounded-md transition-colors ${analysisType === type ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {analysisType === 'centrality' && (
                   <div className="mt-4">
                      <label htmlFor="centrality-slider" className="text-xs text-slate-400 mb-2 block">Highlight top {centralityTopN}% most important nodes</label>
                      <input id="centrality-slider" type="range" min="1" max="50" value={centralityTopN} onChange={e => onCentralityTopNChange(parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                   </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Interactive Tools</h3>
                 <button
                  onClick={onToggleCompareMode}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed ${isCompareMode ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-slate-700 text-gray-200 hover:bg-slate-600'}`}
                >
                  <GitCompareIcon className="w-5 h-5" />
                  {isCompareMode ? (comparisonNode1 ? 'Select 2nd Node...' : 'Select 1st Node...') : 'Compare Nodes'}
                </button>
                {isCompareMode && (
                    <button onClick={onToggleCompareMode} className="text-xs text-slate-400 hover:text-white text-center w-full mt-2">Cancel Comparison</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-700 flex-shrink-0">
        <div className="mb-6">
          <h3 className="font-semibold text-gray-300 mb-2">Don't have a file?</h3>
          <button
            onClick={handleLoadSample}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-gray-200 rounded-lg font-semibold hover:bg-slate-600 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <DocumentIcon className="w-5 h-5" />
            Load Sample Document
          </button>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-300 mb-2">Manage Graph</h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={onExportGraph}
              disabled={!isGraphSaved || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <DownloadIcon className="w-5 h-5" />
              Export Graph (JSON)
            </button>
            <button
              onClick={handleClearClick}
              disabled={!isGraphSaved || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-800/80 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <TrashIcon className="w-5 h-5" />
              Clear Saved Graph
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};