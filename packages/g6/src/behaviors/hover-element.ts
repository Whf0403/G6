import { isFunction } from '@antv/util';
import { CommonEvent } from '../constants';
import { ELEMENT_TYPES } from '../constants/element';
import type { RuntimeContext } from '../runtime/types';
import type { Element, ElementType, ID, IPointerEvent, State } from '../types';
import { idsOf } from '../utils/id';
import { getElementNthDegreeIds } from '../utils/relation';
import type { BaseBehaviorOptions } from './base-behavior';
import { BaseBehavior } from './base-behavior';

/**
 * <zh/> 悬浮元素交互配置项
 *
 * <en/> Hover element behavior options
 */
export interface HoverElementOptions extends BaseBehaviorOptions {
  /**
   * <zh/> 是否启用动画
   *
   * <en/> Whether to enable animation
   * @defaultValue true
   */
  animation?: boolean;
  /**
   * <zh/> 是否启用悬浮元素的功能
   *
   * <en/> Whether to enable hover element function
   * @defaultValue true
   */
  enable?: boolean | ((event: IPointerEvent) => boolean);
  /**
   * <zh/> 激活元素的n度关系
   * - 默认为 `0`，表示只激活当前节点
   * - `1` 表示激活当前节点及其直接相邻的节点和边，以此类推
   *
   * <en/> N-degree relationship of the hovered element
   * - default to `0`, which means only the current node is activated
   * - `1` means the current node and its directly adjacent nodes and edges are activated, etc
   * @defaultValue 0
   */
  degree?: number;
  /**
   * <zh/> 激活元素的状态，默认为 `active`
   *
   * <en/> Active element state, default to`active`
   * @defaultValue 'active'
   */
  activeState?: State;
  /**
   * <zh/> 非激活元素的状态，默认为不改变
   *
   * <en/> Inactive element state, default to no change
   */
  inactiveState?: State;
  /**
   * <zh/> 当元素被悬停时的回调
   *
   * <en/> Callback when the element is hovered
   */
  onHover?: (event: IPointerEvent) => void;
  /**
   * <zh/> 当悬停结束时的回调
   *
   * <en/> Callback when the hover ends
   */
  onHoverEnd?: (event: IPointerEvent) => void;
}

/**
 * <zh/> 悬浮元素交互
 *
 * <en/> Hover element behavior
 * @remarks
 * <zh/> 当鼠标悬停在元素上时，可以激活元素的状态，例如高亮节点或边。
 *
 * <en/> When the mouse hovers over an element, you can activate the state of the element, such as highlighting nodes or edges.
 */
export class HoverElement extends BaseBehavior<HoverElementOptions> {
  static defaultOptions: Partial<HoverElementOptions> = {
    animation: true,
    enable: true,
    degree: 0,
    activeState: 'active',
    inactiveState: undefined,
  };

  constructor(context: RuntimeContext, options: HoverElementOptions) {
    super(context, Object.assign({}, HoverElement.defaultOptions, options));
    this.bindEvents();
  }

  private bindEvents() {
    const { graph } = this.context;
    this.unbindEvents();

    ELEMENT_TYPES.forEach((type) => {
      graph.on(`${type}:${CommonEvent.POINTER_OVER}`, this.hoverElement);
      graph.on(`${type}:${CommonEvent.POINTER_OUT}`, this.hoverEndElement);
    });
  }

  private hoverElement = (event: IPointerEvent) => {
    if (!this.validate(event)) return;
    this.updateElementsState(event, true);
    this.options.onHover?.(event);
  };

  private hoverEndElement = (event: IPointerEvent) => {
    if (!this.validate(event)) return;
    this.updateElementsState(event, false);
    this.options.onHoverEnd?.(event);
  };

  private updateElementsState = (event: IPointerEvent, add: boolean) => {
    if (!this.options.activeState && !this.options.inactiveState) return;

    const { graph } = this.context;
    const { targetType, target } = event;

    const activeIds = getElementNthDegreeIds(
      graph,
      targetType as ElementType,
      (target as Element).id,
      this.options.degree,
    );

    const states: Record<ID, State[]> = {};

    if (this.options.activeState) {
      Object.assign(states, this.getElementsState(activeIds, this.options.activeState, add));
    }

    if (this.options.inactiveState) {
      const inactiveIds = idsOf(graph.getData(), true).filter((id) => !activeIds.includes(id));
      Object.assign(states, this.getElementsState(inactiveIds, this.options.inactiveState, add));
    }
    graph.setElementState(states, this.options.animation);
  };

  private getElementsState = (ids: ID[], state: State, add: boolean) => {
    const { graph } = this.context;
    const states: Record<ID, State[]> = {};
    ids.forEach((id) => {
      const currentState = graph.getElementState(id);
      const updatedState = add ? [...currentState, state] : currentState.filter((s) => s !== state);
      states[id] = updatedState;
    });
    return states;
  };

  private validate(event: IPointerEvent) {
    if (this.destroyed) return false;
    const { enable } = this.options;
    if (isFunction(enable)) return enable(event);
    return !!enable;
  }

  private unbindEvents() {
    const { graph } = this.context;

    ELEMENT_TYPES.forEach((type) => {
      graph.off(`${type}:${CommonEvent.POINTER_OVER}`, this.hoverElement);
      graph.off(`${type}:${CommonEvent.POINTER_OUT}`, this.hoverEndElement);
    });
  }

  public destroy() {
    this.unbindEvents();
    super.destroy();
  }
}
