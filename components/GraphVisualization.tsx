
import React, { useEffect, useRef, useState } from 'react';
import { GraphData, Node, Link } from '../types';
import { SearchIcon } from './icons';

declare const d3: any;

interface GraphVisualizationProps {
  data: GraphData;
  onNodeClick: (node: Node) => void;
  selectedNodeTypes: Set<string>;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({ data, onNodeClick, selectedNodeTypes }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const selectionsRef = useRef<{ node?: any; link?: any; linkLabel?: any }>({});

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

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const parent = svg.node().parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const nodes = data.nodes.map(d => ({...d}));
    const links = data.links.map(d => ({...d}));
    
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    const g = svg.append("g");

    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5);

    const linkLabel = g.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .text((d: any) => d.label)
      .attr("fill", "#aaa")
      .attr("font-size", 10)
      .attr("text-anchor", "middle");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(drag(simulation) as any);
      
    node.on("click", (event: any, d: any) => {
        onNodeClick(d);
        event.stopPropagation();
    });

    node.append("circle")
      .attr("r", 10)
      .attr("fill", (d: any) => color(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 15)
      .attr("y", 5)
      .attr("fill", "#eee")
      .attr("font-size", 12)
      .attr("paint-order", "stroke")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    node.append("title")
        .text((d: any) => `${d.label} (${d.type})`);
    
    node.on("mouseover", (event: any, d: any) => {
        link
            .attr("stroke", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? "#06b6d4" : "#999")
            .attr("stroke-opacity", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 1.0 : 0.6);
        linkLabel
            .attr("fill", (l: any) => (l.source.id === d.id || l.target.id === d.id) ? "#06b6d4" : "#aaa");
    }).on("mouseout", () => {
        link.attr("stroke", "#999").attr("stroke-opacity", 0.6);
        linkLabel.attr("fill", "#aaa");
    });
    
    selectionsRef.current = { node, link, linkLabel };

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
    });
    
    const zoom = d3.zoom().on("zoom", (event: any) => {
        g.attr("transform", event.transform);
    });

    svg.call(zoom);

  }, [data, onNodeClick]);

  useEffect(() => {
    const { node, link, linkLabel } = selectionsRef.current;
    if (!node || !link || !linkLabel) return;

    const query = searchQuery.trim().toLowerCase();

    // Node Type Filtering
    const typeFilteredNodeIds = new Set(data.nodes.filter(n => selectedNodeTypes.has(n.type)).map(n => n.id));

    let finalVisibleNodeIds: Set<string>;

    if (!query) {
      finalVisibleNodeIds = typeFilteredNodeIds;
    } else {
      // Search Filtering (on top of type filter)
      const matchingNodeIds = new Set(
        data.nodes
          .filter(n => typeFilteredNodeIds.has(n.id) && (n.id.toLowerCase().includes(query) || n.label.toLowerCase().includes(query)))
          .map(n => n.id)
      );
      
      const searchVisibleNodeIds = new Set(matchingNodeIds);
      data.links.forEach((l: Link) => {
        // A link can make a node visible only if both its source and target are of a selected type
        if (typeFilteredNodeIds.has(l.source) && typeFilteredNodeIds.has(l.target)) {
            if (matchingNodeIds.has(l.source) || matchingNodeIds.has(l.target)) {
                searchVisibleNodeIds.add(l.source);
                searchVisibleNodeIds.add(l.target);
            }
        }
      });
      finalVisibleNodeIds = searchVisibleNodeIds;
    }

    node
      .style('opacity', (d: Node) => finalVisibleNodeIds.has(d.id) ? 1 : 0.1)
      .style('pointer-events', (d: Node) => finalVisibleNodeIds.has(d.id) ? 'all' : 'none');
      
    link
      .style('opacity', (d: any) => finalVisibleNodeIds.has(d.source.id) && finalVisibleNodeIds.has(d.target.id) ? 0.6 : 0.05);

    linkLabel
      .style('opacity', (d: any) => finalVisibleNodeIds.has(d.source.id) && finalVisibleNodeIds.has(d.target.id) ? 1 : 0.05);
      
  }, [searchQuery, data, selectedNodeTypes]);

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
