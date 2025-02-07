import { isFunction } from '@antv/util';
import { CommonEvent } from '../constants';
import type { RuntimeContext } from '../runtime/types';
import type { ID, IPointerEvent } from '../types';
import { isElement } from '../utils/element';
import type { BaseBehaviorOptions } from './base-behavior';
import { BaseBehavior } from './base-behavior';

/**
 * <zh/> 展开/收起组合元素交互配置项
 *
 * <en/> Collapse/Expand combo behavior options
 */
export interface CollapseExpandOptions extends BaseBehaviorOptions {
  /**
   * <zh/> 是否启用动画
   *
   * <en/> Whether to enable animation
   * @defaultValue true
   */
  animation?: boolean;
  /**
   * <zh/> 是否启用展开/收起功能
   *
   * <en/> Whether to enable the expand/collapse function
   * @defaultValue true
   */
  enable?: boolean | ((event: IPointerEvent) => boolean);
  /**
   * <zh/> 完成收起时的回调
   *
   * <en/> Callback when collapse is completed
   */
  onCollapse?: (id: ID) => void;
  /**
   * <zh/> 完成展开时的回调
   *
   * <en/> Callback when expand is completed
   */
  onExpand?: (id: ID) => void;
}

/**
 * <zh/> 展开/收起组合元素交互
 *
 * <en/> Collapse/Expand Combo behavior
 * @remarks
 * <zh/> 通过双击 Combo 进行展开或收起 Combo。
 *
 * <en/> Expand or collapse a Combo by double-clicking on it.
 */
export class CollapseExpand extends BaseBehavior<CollapseExpandOptions> {
  static defaultOptions: Partial<CollapseExpandOptions> = {
    enable: true,
    animation: true,
  };

  constructor(context: RuntimeContext, options: CollapseExpandOptions) {
    super(context, Object.assign({}, CollapseExpand.defaultOptions, options));

    this.bindEvents();
  }

  private bindEvents() {
    const { graph } = this.context;
    this.unbindEvents();

    graph.on(`combo:${CommonEvent.DBLCLICK}`, this.onCollapseExpand);
  }

  private unbindEvents() {
    const { graph } = this.context;
    graph.off(`combo:${CommonEvent.DBLCLICK}`, this.onCollapseExpand);
  }

  private onCollapseExpand = async (event: IPointerEvent) => {
    if (!this.validate(event)) return;
    const { target } = event;
    if (!isElement(target)) return;

    const id = target.id;
    const { model, graph } = this.context;
    const data = model.getComboData([id])[0];
    if (!data) return false;

    const { onCollapse, onExpand, animation } = this.options;
    const isCollapse = data.style?.collapsed;
    if (isCollapse) {
      await graph.expandElement(id, animation);
      onExpand?.(id);
    } else {
      await graph.collapseElement(id, animation);
      onCollapse?.(id);
    }
  };

  private validate(event: IPointerEvent): boolean {
    if (this.destroyed) return false;
    const { enable } = this.options;
    if (isFunction(enable)) return enable(event);
    return !!enable;
  }

  public destroy(): void {
    this.unbindEvents();
    super.destroy();
  }
}
