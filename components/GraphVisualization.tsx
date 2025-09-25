import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GraphData, Node, Link } from '../types';
import { SearchIcon } from './icons';
import { AnalysisType } from '../App';

declare const d3: any;

interface GraphVisualizationProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  selectedNodeTypes: Set<string>;
  analysisType: AnalysisType;
  analysisResults: {
    centrality?: Map<string, number>;
    clusters?: Map<string, number>;
  };
  centralityTopN: number;
  isCompareMode: boolean;
  comparisonNodes: { node1: Node | null, node2: Node | null };
  comparisonResults: {
    path: string[] | null;
    pathLinks: {source: string, target: string}[] | null;
    commonNeighbors: string[] | null;
  } | null;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ 
    data, 
    onNodeClick, 
    selectedNodeTypes,
    analysisType,
    analysisResults,
    centralityTopN,
    isCompareMode,
    comparisonNodes,
    comparisonResults
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const selectionsRef = useRef<{ node?: any; link?: any; linkLabel?: any; g?: any }>({});

  const drag = (simulation: any) => {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
  
  const importantNodeIds = useMemo(() => {
    if (analysisType !== 'centrality' || !analysisResults.centrality) return new Set();
    const sortedNodes = [...analysisResults.centrality.entries()].sort((a, b) => b[1] - a[1]);
    const count = Math.ceil(sortedNodes.length * (centralityTopN / 100));
    return new Set(sortedNodes.slice(0, count).map(entry => entry[0]));
  }, [analysisType, analysisResults.centrality, centralityTopN]);

  // Initial setup effect
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const parent = svg.node().parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const g = svg.append("g");
    selectionsRef.current.g = g;

    const nodes = data.nodes.map(d => ({...d}));
    const links = data.links.map(d => ({...d}));
    
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    const link = g.append("g").selectAll("line");
    const linkLabel = g.append("g").selectAll("text");
    const node = g.append("g").selectAll("g");

    selectionsRef.current = { node, link, linkLabel, g };
    
    // Re-bind data and update visualization
    selectionsRef.current.link = link.data(links).join("line")
      .attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", 1.5);
      
    selectionsRef.current.linkLabel = linkLabel.data(links).join("text")
      .text((d: any) => d.label).attr("fill", "#aaa").attr("font-size", 10).attr("text-anchor", "middle");

    selectionsRef.current.node = node.data(nodes, (d:any) => d.id).join("g")
      .style("cursor", "pointer").call(drag(simulation) as any);
      
    selectionsRef.current.node.on("click", (event: any, d: any) => {
        onNodeClick(d);
        event.stopPropagation();
    });

    selectionsRef.current.node.append("circle")
      .attr("r", 10).attr("stroke", "#fff").attr("stroke-width", 1.5);

    selectionsRef.current.node.append("text")
      .text((d: any) => d.label).attr("x", 15).attr("y", 5).attr("fill", "#eee")
      .attr("font-size", 12).attr("paint-order", "stroke").attr("stroke", "#1e293b").attr("stroke-width", 3);

    selectionsRef.current.node.append("title").text((d: any) => `${d.label} (${d.type})`);
    
    simulation.on("tick", () => {
        selectionsRef.current.link
            .attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
        selectionsRef.current.node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        selectionsRef.current.linkLabel
            .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
            .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
    });
    
    const zoom = d3.zoom().on("zoom", (event: any) => g.attr("transform", event.transform));
    svg.call(zoom as any);

  }, [data, onNodeClick]);

  // Update effect for filtering, analysis, and comparison
  useEffect(() => {
    const { node, link, linkLabel } = selectionsRef.current;
    if (!node || !link || !linkLabel) return;

    // --- BASE FILTERING ---
    const query = searchQuery.trim().toLowerCase();
    const typeFilteredNodeIds = new Set<string>(data.nodes.filter(n => selectedNodeTypes.has(n.type)).map(n => n.id));
    let searchFilteredNodeIds: Set<string>;

    if (!query) {
      searchFilteredNodeIds = typeFilteredNodeIds;
    } else {
      const matchingNodeIds = new Set<string>(
        data.nodes
          .filter(n => typeFilteredNodeIds.has(n.id) && (n.id.toLowerCase().includes(query) || n.label.toLowerCase().includes(query)))
          .map(n => n.id)
      );
      const visibleFromSearch = new Set<string>(matchingNodeIds);
      data.links.forEach((l: Link) => {
// FIX: Corrected typo from `typeFilteredNodeTypes` to `typeFilteredNodeIds`
        if (typeFilteredNodeIds.has(l.source) && typeFilteredNodeIds.has(l.target)) {
            if (matchingNodeIds.has(l.source) || matchingNodeIds.has(l.target)) {
                visibleFromSearch.add(l.source);
                visibleFromSearch.add(l.target);
            }
        }
      });
      searchFilteredNodeIds = visibleFromSearch;
    }

    // --- VISUAL STYLES ---
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const clusterColor = d3.scaleOrdinal(d3.schemePastel1);
    
    const getNodeFill = (d: Node) => {
        if (analysisType === 'clusters' && analysisResults.clusters) {
            return clusterColor(analysisResults.clusters.get(d.id));
        }
        return color(d.type);
    };

    const getNodeRadius = (d: Node) => {
        if (isCompareMode) return 10;
        if (analysisType === 'centrality' && importantNodeIds.has(d.id)) {
            return 15;
        }
        return 10;
    }
    
    // --- COMPARISON MODE LOGIC ---
    let comparisonHighlightIds = new Set<string>();
    let comparisonPathNodeIds = new Set<string>();
    let comparisonPathLinkIds = new Set<string>();

    if (isCompareMode && comparisonResults) {
        if (comparisonNodes.node1) comparisonHighlightIds.add(comparisonNodes.node1.id);
        if (comparisonNodes.node2) comparisonHighlightIds.add(comparisonNodes.node2.id);
        if (comparisonResults.commonNeighbors) {
            comparisonResults.commonNeighbors.forEach(id => comparisonHighlightIds.add(id));
        }
        if (comparisonResults.path) {
            comparisonResults.path.forEach(id => comparisonPathNodeIds.add(id));
        }
        if (comparisonResults.pathLinks) {
            comparisonResults.pathLinks.forEach(l => {
                comparisonPathLinkIds.add(`${l.source}-${l.target}`);
                comparisonPathLinkIds.add(`${l.target}-${l.source}`);
            });
        }
    }

    // --- APPLY UPDATES ---
    node.selectAll('circle')
        .transition().duration(300)
        .attr('r', getNodeRadius)
        .attr('fill', getNodeFill)
        .attr('stroke', (d: Node) => {
            if (isCompareMode && comparisonHighlightIds.has(d.id)) return '#f43f5e'; // rose-500
            if (isCompareMode && comparisonPathNodeIds.has(d.id)) return '#38bdf8'; // sky-400
            return '#fff';
        })
        .attr('stroke-width', (d: Node) => isCompareMode && (comparisonHighlightIds.has(d.id) || comparisonPathNodeIds.has(d.id)) ? 3 : 1.5);
    
    node
      .style('opacity', (d: Node) => {
        const isVisible = searchFilteredNodeIds.has(d.id);
        if (!isVisible) return 0.1;
        if (isCompareMode && comparisonResults && !comparisonHighlightIds.has(d.id) && !comparisonPathNodeIds.has(d.id)) return 0.2;
        return 1;
      })
      .style('pointer-events', (d: Node) => searchFilteredNodeIds.has(d.id) ? 'all' : 'none');
      
    link
      .style('opacity', (d: any) => (searchFilteredNodeIds.has(d.source.id) && searchFilteredNodeIds.has(d.target.id)) ? 0.6 : 0.05)
      .transition().duration(300)
      .attr('stroke', (d: any) => isCompareMode && comparisonPathLinkIds.has(`${d.source.id}-${d.target.id}`) ? '#38bdf8' : '#999')
      .attr('stroke-width', (d: any) => isCompareMode && comparisonPathLinkIds.has(`${d.source.id}-${d.target.id}`) ? 3 : 1.5);

    linkLabel
      .style('opacity', (d: any) => (searchFilteredNodeIds.has(d.source.id) && searchFilteredNodeIds.has(d.target.id)) ? 1 : 0.05);

  }, [searchQuery, data, selectedNodeTypes, analysisType, analysisResults, importantNodeIds, isCompareMode, comparisonNodes, comparisonResults]);

  return (
    <div className="w-full h-full relative">
       <div className="absolute top-2 left-2 z-10 flex items-center bg-slate-900/70 rounded-lg backdrop-blur-sm border border-slate-700">
        <div className="pl-3 pr-2 text-slate-400">
          <SearchIcon className="w-5 h-5"/>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search graph..."
          className="w-64 bg-transparent py-2 pr-4 text-white placeholder-slate-400 focus:outline-none"
          aria-label="Search graph nodes"
        />
      </div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};
