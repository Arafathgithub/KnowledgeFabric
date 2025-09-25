import React, { useMemo } from 'react';
import { Node, GraphData } from '../types';
import { XIcon, GitCompareIcon } from './icons';

interface NodeComparisonDetailsProps {
  node1: Node;
  node2: Node;
  results: {
    path: string[] | null;
    commonNeighbors: string[] | null;
  };
  graphData: GraphData;
  onClose: () => void;
}

export const NodeComparisonDetails: React.FC<NodeComparisonDetailsProps> = ({ node1, node2, results, graphData, onClose }) => {
    
  const getNodeLabel = (nodeId: string): string => {
    return graphData.nodes.find(n => n.id === nodeId)?.label || nodeId;
  };
  
  const pathLength = useMemo(() => {
    return results.path ? results.path.length - 1 : -1;
  }, [results.path]);

  return (
    <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-slate-800/80 backdrop-blur-sm shadow-2xl rounded-lg z-20 flex flex-col animate-slide-in">
      <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <GitCompareIcon className="w-6 h-6 text-rose-400"/>
          <h2 className="text-xl font-semibold text-gray-100 truncate pr-4">
            Node Comparison
          </h2>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Close comparison details"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
            <div className="text-center w-2/5">
                <p className="text-sm text-slate-400">Node 1</p>
                <p className="font-semibold text-lg text-rose-400 truncate" title={node1.label}>{node1.label}</p>
            </div>
            <div className="text-sm text-slate-500">vs</div>
            <div className="text-center w-2/5">
                <p className="text-sm text-slate-400">Node 2</p>
                <p className="font-semibold text-lg text-rose-400 truncate" title={node2.label}>{node2.label}</p>
            </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-cyan-400 mb-2">Shortest Path</h3>
          {pathLength > -1 ? (
             <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-300">Path Length:</span>
                <span className="font-bold text-xl text-white">{pathLength}</span>
                <span className="text-slate-400">{pathLength === 1 ? 'hop' : 'hops'}</span>
             </div>
          ) : (
             <p className="text-sm text-slate-400 italic">No path found between these nodes.</p>
          )}
        </div>

        <div>
           <h3 className="font-semibold text-cyan-400 mb-3">Common Neighbors ({results.commonNeighbors?.length || 0})</h3>
           {results.commonNeighbors && results.commonNeighbors.length > 0 ? (
             <ul className="space-y-2">
               {results.commonNeighbors.map((nodeId) => (
                 <li key={nodeId} className="text-sm bg-slate-700/50 px-3 py-2 rounded-md text-indigo-300 font-medium">
                   {getNodeLabel(nodeId)}
                 </li>
               ))}
             </ul>
           ) : (
             <p className="text-sm text-slate-400 italic">These nodes have no common neighbors.</p>
           )}
        </div>
      </div>
    </div>
  );
};
