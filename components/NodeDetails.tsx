
import React, { useMemo } from 'react';
import { Node, GraphData } from '../types';
import { XIcon } from './icons';

interface NodeDetailsProps {
  node: Node;
  graphData: GraphData;
  onClose: () => void;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, graphData, onClose }) => {
  const connectedLinks = useMemo(() => {
    return graphData.links.filter(link => link.source === node.id || link.target === node.id);
  }, [node, graphData.links]);

  const getNodeLabel = (nodeId: string) => {
    const foundNode = graphData.nodes.find(n => n.id === nodeId);
    return foundNode ? foundNode.label : nodeId;
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-slate-800/80 backdrop-blur-sm shadow-2xl rounded-lg z-20 flex flex-col animate-slide-in">
      <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-100 truncate pr-4" title={node.label}>
          Node: {node.label}
        </h2>
        <button 
          onClick={onClose} 
          className="p-1 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Close node details"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
        <div className="mb-6">
          <h3 className="font-semibold text-cyan-400 mb-2">Properties</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between items-center">
              <span className="text-slate-400">ID:</span>
              <span className="font-mono bg-slate-700 px-2 py-1 rounded text-gray-200">{node.id}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-slate-400">Type:</span>
              <span className="font-semibold bg-slate-700 px-2 py-1 rounded text-gray-200">{node.type}</span>
            </li>
          </ul>
        </div>
        
        <div>
           <h3 className="font-semibold text-cyan-400 mb-3">Connections ({connectedLinks.length})</h3>
           {connectedLinks.length > 0 ? (
             <ul className="space-y-3">
               {connectedLinks.map((link, index) => (
                 <li key={index} className="text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                   {link.source === node.id ? (
                     <div className="flex items-center justify-between">
                        <span className="text-indigo-400 font-semibold">{getNodeLabel(link.target)}</span>
                        <div className="text-center mx-2">
                          <p className="text-xs text-slate-400">-- {link.label} --&gt;</p>
                        </div>
                     </div>
                   ) : (
                     <div className="flex items-center justify-between">
                       <span className="text-indigo-400 font-semibold">{getNodeLabel(link.source)}</span>
                       <div className="text-center mx-2">
                          <p className="text-xs text-slate-400">&lt;-- {link.label} --</p>
                       </div>
                     </div>
                   )}
                 </li>
               ))}
             </ul>
           ) : (
             <p className="text-sm text-slate-400 italic">This node has no connections.</p>
           )}
        </div>
      </div>
    </div>
  );
};
