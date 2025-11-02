var nodes = new vis.DataSet([
  { id: 'A', label: 'Alta Calidad' },
  { id: 'B', label: 'Media' },
  { id: 'C', label: 'Defectuosa' },
  { id: 'D', label: 'Rechazada' }
]);

var edges = new vis.DataSet([
  { from: 'A', to: 'B', label: '0.20' },
  { from: 'A', to: 'C', label: '0.08' },
  { from: 'A', to: 'D', label: '0.02' },
  { from: 'B', to: 'A', label: '0.30' },
  { from: 'B', to: 'C', label: '0.15' },
  { from: 'C', to: 'B', label: '0.20' },
  { from: 'C', to: 'D', label: '0.20' }
]);

var container = document.getElementById('network');
var network = new vis.Network(container, { nodes, edges }, {
  edges: {
    arrows: 'to',
    color: 'gray'
  },
  nodes: {
    shape: 'circle',
    color: '#8de4af'
  }
});
