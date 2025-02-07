import type { DisplayObjectConfig } from '@antv/g';
import type { PathArray } from '@antv/util';
import { deepMix } from '@antv/util';
import type { BaseEdgeStyleProps } from './base-edge';
import { BaseEdge } from './base-edge';

/**
 * <zh/> 直线样式配置项
 *
 * <en/> Line style properties
 */
export interface LineStyleProps extends BaseEdgeStyleProps {}

type ParsedLineStyleProps = Required<LineStyleProps>;

/**
 * <zh/> 直线
 *
 * <en/> Line
 * @remarks
 * <img width="300" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*YbpvTa4liAEAAAAAAAAAAAAADmJ7AQ/original" />
 */
export class Line extends BaseEdge {
  static defaultStyleProps: Partial<LineStyleProps> = {};

  constructor(options: DisplayObjectConfig<LineStyleProps>) {
    super(deepMix({}, { style: Line.defaultStyleProps }, options));
  }

  protected getKeyPath(attributes: ParsedLineStyleProps): PathArray {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes);
    return [
      ['M', sourcePoint[0], sourcePoint[1]],
      ['L', targetPoint[0], targetPoint[1]],
    ];
  }
}
