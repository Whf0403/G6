import type { BaseNodeStyleProps } from '../../elements/nodes';
import type { CallableObject } from '../../types';
import type { NodeData } from '../data';
import type { AnimationOptions } from './animation';
import type { PaletteOptions } from './palette';

/**
 * <zh/> 节点配置项
 *
 * <en/> Node spec
 */
export interface NodeOptions {
  /**
   * <zh/> 节点类型
   *
   * <en/> Node type
   */
  type?: string | ((datum: NodeData) => string);
  /**
   * <zh/> 节点样式
   *
   * <en/> Node style
   */
  style?: CallableObject<NodeStyle, NodeData>;
  /**
   * <zh/> 节点状态样式
   *
   * <en/> Node state style
   */
  state?: Record<string, CallableObject<NodeStyle, NodeData>>;
  /**
   * <zh/> 节点动画
   *
   * <en/> Node animation
   */
  animation?: AnimationOptions;
  /**
   * <zh/> 色板
   *
   * <en/> Palette
   */
  palette?: PaletteOptions;
}

export interface StaticNodeOptions {
  style?: NodeStyle;
  state?: Record<string, NodeStyle>;
  animation?: AnimationOptions;
  palette?: PaletteOptions;
}

export interface NodeStyle extends Partial<BaseNodeStyleProps> {
  [key: string]: any;
}
