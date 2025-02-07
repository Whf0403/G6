import { Graph } from '@antv/g6';

fetch('https://assets.antv.antgroup.com/g6/cluster.json')
  .then((res) => res.json())
  .then((data) => {
    const graph = new Graph({
      container: 'container',
      data,
      layout: {
        type: 'fruchterman',
        gravity: 10,
        speed: 5,
        clustering: true,
        nodeClusterBy: 'cluster',
      },
      node: {
        style: {
          size: 20,
          labelPlacement: 'center',
          labelText: (d) => d.id,
          labelBackground: false,
        },
        palette: {
          type: 'group',
          field: 'cluster',
        },
      },
      edge: {
        style: {
          endArrow: true,
        },
      },
      behaviors: ['drag-canvas', 'drag-element'],
      animation: true,
    });

    graph.render();
  });
