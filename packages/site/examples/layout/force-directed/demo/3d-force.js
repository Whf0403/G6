import { CameraSetting, ExtensionCategory, Graph, register } from '@antv/g6';
import { Light, Line3D, ObserveCanvas3D, Sphere, ZoomCanvas3D, renderer } from '@antv/g6-extension-3d';

register(ExtensionCategory.PLUGIN, '3d-light', Light);
register(ExtensionCategory.NODE, 'sphere', Sphere);
register(ExtensionCategory.EDGE, 'line3d', Line3D);
register(ExtensionCategory.PLUGIN, 'camera-setting', CameraSetting);
register(ExtensionCategory.BEHAVIOR, 'zoom-canvas-3d', ZoomCanvas3D);
register(ExtensionCategory.BEHAVIOR, 'observe-canvas-3d', ObserveCanvas3D);

fetch('https://assets.antv.antgroup.com/g6/d3-force-3d.json')
  .then((res) => res.json())
  .then((data) => {
    const graph = new Graph({
      container: 'container',
      animation: true,
      renderer,
      data,
      layout: {
        type: 'd3-force-3d',
      },
      node: {
        type: 'sphere',
        style: {
          materialType: 'phong',
        },
        palette: {
          color: 'tableau',
          type: 'group',
          field: 'group',
        },
      },
      edge: {
        type: 'line3d',
      },
      behaviors: ['observe-canvas-3d', 'zoom-canvas-3d'],
      plugins: [
        {
          type: 'camera-setting',
          projectionMode: 'perspective',
          near: 0.1,
          far: 1000,
          fov: 45,
          aspect: 1,
        },
        {
          type: '3d-light',
          directional: {
            direction: [0, 0, 1],
          },
        },
      ],
    });

    graph.render();
  });
