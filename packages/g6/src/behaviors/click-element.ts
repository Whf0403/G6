import { isFunction } from '@antv/util';
import { CommonEvent } from '../constants';
import { ELEMENT_TYPES } from '../constants/element';
import type { RuntimeContext } from '../runtime/types';
import type { Element, ElementType, ID, IPointerEvent, State } from '../types';
import { idsOf } from '../utils/id';
import { getElementNthDegreeIds } from '../utils/relation';
import type { ShortcutKey } from '../utils/shortcut';
import { Shortcut } from '../utils/shortcut';
import type { BaseBehaviorOptions } from './base-behavior';
import { BaseBehavior } from './base-behavior';

/**
 * <zh/> 点击元素交互配置项
 *
 * <en/> Click element behavior options
 */
export interface ClickElementOptions extends BaseBehaviorOptions {
  /**
   * <zh/> 是否启用动画
   *
   * <en/> Whether to enable animation
   * @defaultValue true
   */
  animation?: boolean;
  /**
   * <zh/> 是否启用点击元素的功能
   *
   * <en/> Whether to enable the function of clicking the element
   * @defaultValue true
   * @remarks
   * <zh/> 可以通过函数的方式动态控制是否启用，例如只有节点被选中时才启用。
   *
   * <en/> Whether to enable can be dynamically controlled by functions, such as only when nodes are selected.
   *
   * ```json
   * { enable: event => event.targetType === 'node'}
   * ```
   */
  enable?: boolean | ((event: IPointerEvent) => boolean);
  /**
   * <zh/> 是否允许多选
   *
   * <en/> Whether to allow multiple selection
   * @defaultValue false
   */
  multiple?: boolean;
  /**
   * <zh/> 按下该快捷键配合鼠标点击进行多选
   *
   * <en/> Press this shortcut key to apply multiple selection with mouse click
   * @defaultValue ['shift']
   */
  trigger?: ShortcutKey;
  /**
   * <zh/> 选中时应用的状态
   *
   * <en/> The state to be applied when select.
   * @defaultValue 'selected'
   */
  selectedState?: State;
  /**
   * <zh/> 当有元素被选中时，其他未选中的元素应用的状态
   *
   * <en/> The state to be applied on other unselected elements when some elements are selected
   * @defaultValue undefined
   */
  unselectedState?: State;
  /**
   * <zh/> 选中元素的度，即决定了影响范围
   *
   * <en/> The degree to determine the scope of influence
   * @defaultValue 0
   * @remarks
   * <zh/> 对于节点来说，`0` 表示只选中当前节点，`1` 表示选中当前节点及其直接相邻的节点和边，以此类推。
   *
   * <zh/> 对于边来说，`0` 表示只选中当前边，`1` 表示选中当前边及其直接相邻的节点，以此类推。
   *
   * <en/> For nodes, `0` means only the current node is selected, `1` means the current node and its directly adjacent nodes and edges are selected, etc.
   *
   * <en/> For edges, `0 `means only the current edge is selected,`1` means the current edge and its directly adjacent nodes are selected, etc.
   */
  degree?: number;
}

/**
 * <zh/> 点击元素
 *
 * <en/> Click Element
 * @remarks
 * <zh/> 当鼠标点击元素时，可以激活元素的状态，例如选中节点或边。当 degree 设置为 `1` 时，点击节点会高亮当前节点及其直接相邻的节点和边。
 *
 * <en/> When the mouse clicks on an element, you can activate the state of the element, such as selecting nodes or edges. When the degree is 1, clicking on a node will highlight the current node and its directly adjacent nodes and edges.
 */
export class ClickElement extends BaseBehavior<ClickElementOptions> {
  private selectedElementIds: ID[] = [];

  private shortcut: Shortcut;

  static defaultOptions: Partial<ClickElementOptions> = {
    animation: true,
    enable: true,
    multiple: false,
    trigger: ['shift'],
    selectedState: 'selected',
    unselectedState: undefined,
    degree: 0,
  };

  constructor(context: RuntimeContext, options: ClickElementOptions) {
    super(context, Object.assign({}, ClickElement.defaultOptions, options));
    this.shortcut = new Shortcut(context.graph);
    this.bindEvents();
  }

  private bindEvents() {
    const { graph } = this.context;
    this.unbindEvents();
    ELEMENT_TYPES.forEach((type) => {
      graph.on(`${type}:${CommonEvent.CLICK}`, this.onClickElement);
    });
    graph.on(`canvas:${CommonEvent.CLICK}`, this.onClickCanvas);
  }

  private onClickElement = (event: IPointerEvent) => {
    if (!this.validate(event)) return;
    this.updateElementsState(event, false);
    this.updateElementsState(event, true);
  };

  private onClickCanvas = (event: IPointerEvent) => {
    if (!this.validate(event)) return;
    this.updateElementsState(event, false);
    this.selectedElementIds = [];
  };

  private updateElementsState = (event: IPointerEvent, add: boolean) => {
    if (!this.options.selectedState && !this.options.unselectedState) return;

    const { graph } = this.context;
    const { targetType, target } = event as { targetType: ElementType; target: Element };

    if (add) {
      // 如果当前元素已经被选中，则取消选中 | If the current element is already selected, deselect it
      if (this.selectedElementIds.includes(target.id)) {
        this.selectedElementIds = this.selectedElementIds.filter((id) => id !== target.id);
      } else {
        const selectedElementIds = getElementNthDegreeIds(graph, targetType, target.id, this.options.degree);
        const isMultiple = this.options.multiple && this.shortcut.match(this.options.trigger);
        if (!isMultiple) {
          this.selectedElementIds = selectedElementIds;
        } else {
          this.selectedElementIds.push(...selectedElementIds);
        }
      }
    }
    if (!this.selectedElementIds.length) return;

    const states: Record<ID, State[]> = {};

    if (this.options.selectedState) {
      Object.assign(states, this.getElementsState(this.selectedElementIds, this.options.selectedState, add));
    }

    if (this.options.unselectedState) {
      const inactiveIds = idsOf(graph.getData(), true).filter((id) => !this.selectedElementIds.includes(id));
      Object.assign(states, this.getElementsState(inactiveIds, this.options.unselectedState, add));
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
      graph.off(`${type}:${CommonEvent.CLICK}`, this.onClickElement);
    });
    graph.off(`canvas:${CommonEvent.CLICK}`, this.onClickCanvas);
  }

  public destroy() {
    this.unbindEvents();
    super.destroy();
  }
}
