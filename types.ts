
export interface Node {
  id: string;
  label: string;
  type: string;
}

export interface Link {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}
