import { Graph } from '@/src';
import data from '@@/dataset/element-edges.json';

export const elementEdgeLine: TestCase = async (context) => {
  const graph = new Graph({
    ...context,
    data,
    edge: {
      type: 'line', // 👈🏻 Edge shape type.
      style: {
        labelText: (d) => d.id!,
        labelBackground: true,
        endArrow: true,
      },
    },
    layout: {
      type: 'radial',
      unitRadius: 220,
      linkDistance: 220,
    },
  });

  await graph.render();

  return graph;
};
