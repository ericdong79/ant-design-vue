import { useInjectTreeContext } from './contextTypes';
import { getDataAndAria } from './util';
import Indent from './Indent';
import { convertNodePropsToEventData } from './utils/treeUtil';
import { computed, defineComponent, getCurrentInstance, onMounted, onUpdated, ref } from 'vue';
import { treeNodeProps } from './props';
import classNames from '../_util/classNames';

const ICON_OPEN = 'open';
const ICON_CLOSE = 'close';

const defaultTitle = '---';

export default defineComponent({
  name: 'TreeNode',
  inheritAttrs: false,
  props: treeNodeProps,
  isTreeNode: 1,
  slots: ['title', 'icon', 'switcherIcon'],
  setup(props, { attrs, expose, slots }) {
    const dragNodeHighlight = ref(false);
    const context = useInjectTreeContext();
    const instance = getCurrentInstance();
    const selectHandle = ref();

    const hasChildren = computed(() => {
      const { eventKey } = props;
      const { keyEntities } = context.value;
      const { children } = keyEntities[eventKey] || {};

      return !!(children || []).length;
    });

    const isLeaf = computed(() => {
      const { isLeaf, loaded } = props;
      const { loadData } = context.value;

      const has = hasChildren.value;

      if (isLeaf === false) {
        return false;
      }

      return isLeaf || (!loadData && !has) || (loadData && loaded && !has);
    });
    const nodeState = computed(() => {
      const { expanded } = props;

      if (isLeaf.value) {
        return null;
      }

      return expanded ? ICON_OPEN : ICON_CLOSE;
    });

    const isDisabled = computed(() => {
      const { disabled } = props;
      const { disabled: treeDisabled } = context.value;

      return !!(treeDisabled || disabled);
    });

    const isCheckable = computed(() => {
      const { checkable } = props;
      const { checkable: treeCheckable } = context.value;

      // Return false if tree or treeNode is not checkable
      if (!treeCheckable || checkable === false) return false;
      return treeCheckable;
    });

    const isSelectable = computed(() => {
      const { selectable } = props;
      const { selectable: treeSelectable } = context.value;

      // Ignore when selectable is undefined or null
      if (typeof selectable === 'boolean') {
        return selectable;
      }

      return treeSelectable;
    });

    const onSelectorDoubleClick = (e: MouseEvent) => {
      const { onNodeDoubleClick } = context.value;
      onNodeDoubleClick(e, convertNodePropsToEventData(props));
    };

    const onSelect = (e: MouseEvent) => {
      if (isDisabled.value) return;

      const { onNodeSelect } = context.value;
      e.preventDefault();
      onNodeSelect(e, convertNodePropsToEventData(props));
    };

    const onCheck = (e: MouseEvent) => {
      if (isDisabled.value) return;

      const { disableCheckbox, checked } = props;
      const { onNodeCheck } = context.value;

      if (!isCheckable.value || disableCheckbox) return;

      e.preventDefault();
      const targetChecked = !checked;
      onNodeCheck(e, convertNodePropsToEventData(props), targetChecked);
    };

    const onSelectorClick = (e: MouseEvent) => {
      // Click trigger before select/check operation
      const { onNodeClick } = context.value;
      onNodeClick(e, convertNodePropsToEventData(props));

      if (isSelectable.value) {
        onSelect(e);
      } else {
        onCheck(e);
      }
    };

    const onMouseEnter = (e: MouseEvent) => {
      const { onNodeMouseEnter } = context.value;
      onNodeMouseEnter(e, convertNodePropsToEventData(props));
    };

    const onMouseLeave = (e: MouseEvent) => {
      const { onNodeMouseLeave } = context.value;
      onNodeMouseLeave(e, convertNodePropsToEventData(props));
    };

    const onContextmenu = (e: MouseEvent) => {
      const { onNodeContextMenu } = context.value;
      onNodeContextMenu(e, convertNodePropsToEventData(props));
    };

    const onDragStart = (e: DragEvent) => {
      const { onNodeDragStart } = context.value;

      e.stopPropagation();
      dragNodeHighlight.value = true;
      onNodeDragStart(e, instance.vnode);

      try {
        // ie throw error
        // firefox-need-it
        e.dataTransfer.setData('text/plain', '');
      } catch (error) {
        // empty
      }
    };

    const onDragEnter = (e: DragEvent) => {
      const { onNodeDragEnter } = context.value;

      e.preventDefault();
      e.stopPropagation();
      onNodeDragEnter(e, instance.vnode);
    };

    const onDragOver = (e: DragEvent) => {
      const { onNodeDragOver } = context.value;

      e.preventDefault();
      e.stopPropagation();
      onNodeDragOver(e, instance.vnode);
    };

    const onDragLeave = (e: DragEvent) => {
      const { onNodeDragLeave } = context.value;

      e.stopPropagation();
      onNodeDragLeave(e, instance.vnode);
    };

    const onDragEnd = (e: DragEvent) => {
      const { onNodeDragEnd } = context.value;

      e.stopPropagation();
      dragNodeHighlight.value = false;
      onNodeDragEnd(e, instance.vnode);
    };

    const onDrop = (e: DragEvent) => {
      const { onNodeDrop } = context.value;

      e.preventDefault();
      e.stopPropagation();
      dragNodeHighlight.value = false;
      onNodeDrop(e, instance.vnode);
    };

    // Disabled item still can be switch
    const onExpand = e => {
      const { onNodeExpand } = context.value;
      if (props.loading) return;
      onNodeExpand(e, convertNodePropsToEventData(props));
    };

    const renderSwitcherIconDom = (isLeaf: boolean) => {
      const { switcherIcon: switcherIconFromProps = slots.switcherIcon } = props;
      const { switcherIcon: switcherIconFromCtx } = context.value;

      const switcherIcon = switcherIconFromProps || switcherIconFromCtx;
      // if switcherIconDom is null, no render switcher span
      if (typeof switcherIcon === 'function') {
        return switcherIcon({ ...props, isLeaf });
      }
      return switcherIcon;
    };

    // Load data to avoid default expanded tree without data
    const syncLoadData = () => {
      const { expanded, loading, loaded } = props;
      const { loadData, onNodeLoad } = context.value;

      if (loading) {
        return;
      }

      // read from state to avoid loadData at same time
      if (loadData && expanded && !isLeaf.value) {
        // We needn't reload data when has children in sync logic
        // It's only needed in node expanded
        if (!hasChildren.value && !loaded) {
          onNodeLoad(convertNodePropsToEventData(props));
        }
      }
    };

    onMounted(() => {
      syncLoadData();
    });
    onUpdated(() => {
      syncLoadData();
    });

    // Switcher
    const renderSwitcher = () => {
      const { expanded } = props;
      const { prefixCls } = context.value;

      if (isLeaf.value) {
        // if switcherIconDom is null, no render switcher span
        const switcherIconDom = renderSwitcherIconDom(true);

        return switcherIconDom !== false ? (
          <span class={classNames(`${prefixCls}-switcher`, `${prefixCls}-switcher-noop`)}>
            {switcherIconDom}
          </span>
        ) : null;
      }

      const switcherCls = classNames(
        `${prefixCls}-switcher`,
        `${prefixCls}-switcher_${expanded ? ICON_OPEN : ICON_CLOSE}`,
      );

      const switcherIconDom = renderSwitcherIconDom(false);

      return switcherIconDom !== false ? (
        <span onClick={onExpand} class={switcherCls}>
          {switcherIconDom}
        </span>
      ) : null;
    };

    // Checkbox
    const renderCheckbox = () => {
      const { checked, halfChecked, disableCheckbox } = props;
      const { prefixCls } = context.value;

      const disabled = isDisabled.value;
      const checkable = isCheckable.value;

      if (!checkable) return null;

      // [Legacy] Custom element should be separate with `checkable` in future
      const $custom = typeof checkable !== 'boolean' ? checkable : null;

      return (
        <span
          class={classNames(
            `${prefixCls}-checkbox`,
            checked && `${prefixCls}-checkbox-checked`,
            !checked && halfChecked && `${prefixCls}-checkbox-indeterminate`,
            (disabled || disableCheckbox) && `${prefixCls}-checkbox-disabled`,
          )}
          onClick={onCheck}
        >
          {$custom}
        </span>
      );
    };

    const renderIcon = () => {
      const { loading } = props;
      const { prefixCls } = context.value;

      return (
        <span
          class={classNames(
            `${prefixCls}-iconEle`,
            `${prefixCls}-icon__${nodeState.value || 'docu'}`,
            loading && `${prefixCls}-icon_loading`,
          )}
        />
      );
    };

    const renderDropIndicator = () => {
      const { disabled, eventKey } = props;
      const {
        draggable,
        dropLevelOffset,
        dropPosition,
        prefixCls,
        indent,
        dropIndicatorRender,
        dragOverNodeKey,
        direction,
      } = context.value;
      const mergedDraggable = draggable !== false;
      // allowDrop is calculated in Tree.tsx, there is no need for calc it here
      const showIndicator = !disabled && mergedDraggable && dragOverNodeKey === eventKey;
      return showIndicator
        ? dropIndicatorRender({ dropPosition, dropLevelOffset, indent, prefixCls, direction })
        : null;
    };

    // Icon + Title
    const renderSelector = () => {
      const { title = slots.title, selected, icon = slots.icon, loading, data } = props;
      const {
        prefixCls,
        showIcon,
        icon: treeIcon,
        draggable,
        loadData,
        titleRender,
      } = context.value;
      const disabled = isDisabled.value;
      const mergedDraggable = typeof draggable === 'function' ? draggable(data) : draggable;

      const wrapClass = `${prefixCls}-node-content-wrapper`;

      // Icon - Still show loading icon when loading without showIcon
      let $icon;

      if (showIcon) {
        const currentIcon = icon || treeIcon;

        $icon = currentIcon ? (
          <span class={classNames(`${prefixCls}-iconEle`, `${prefixCls}-icon__customize`)}>
            {typeof currentIcon === 'function' ? currentIcon(props) : currentIcon}
          </span>
        ) : (
          renderIcon()
        );
      } else if (loadData && loading) {
        $icon = renderIcon();
      }

      // Title
      let titleNode: any;
      if (typeof title === 'function') {
        titleNode = title(data);
      } else if (titleRender) {
        titleNode = titleRender(data);
      } else {
        titleNode = title === undefined ? defaultTitle : title;
      }

      const $title = <span class={`${prefixCls}-title`}>{titleNode}</span>;

      return (
        <span
          ref={selectHandle}
          title={typeof title === 'string' ? title : ''}
          class={classNames(
            `${wrapClass}`,
            `${wrapClass}-${nodeState.value || 'normal'}`,
            !disabled && (selected || dragNodeHighlight) && `${prefixCls}-node-selected`,
            !disabled && mergedDraggable && 'draggable',
          )}
          draggable={(!disabled && mergedDraggable) || undefined}
          aria-grabbed={(!disabled && mergedDraggable) || undefined}
          onMouseenter={onMouseEnter}
          onMouseleave={onMouseLeave}
          onContextmenu={onContextmenu}
          onClick={onSelectorClick}
          onDblclick={onSelectorDoubleClick}
          onDragstart={mergedDraggable ? onDragStart : undefined}
        >
          {$icon}
          {$title}
          {renderDropIndicator()}
        </span>
      );
    };
    return () => {
      const {
        eventKey,
        dragOver,
        dragOverGapTop,
        dragOverGapBottom,
        isLeaf,
        isStart,
        isEnd,
        expanded,
        selected,
        checked,
        halfChecked,
        loading,
        domRef,
        active,
        data,
        onMousemove,
        ...otherProps
      } = { ...props, ...attrs };
      const { prefixCls, filterTreeNode, draggable, keyEntities, dropContainerKey, dropTargetKey } =
        context.value;
      const disabled = isDisabled.value;
      const dataOrAriaAttributeProps = getDataAndAria(otherProps);
      const { level } = keyEntities[eventKey] || {};
      const isEndNode = isEnd[isEnd.length - 1];
      const mergedDraggable = typeof draggable === 'function' ? draggable(data) : draggable;
      return (
        <div
          ref={domRef}
          class={classNames(attrs.class, `${prefixCls}-treenode`, {
            [`${prefixCls}-treenode-disabled`]: disabled,
            [`${prefixCls}-treenode-switcher-${expanded ? 'open' : 'close'}`]: !isLeaf,
            [`${prefixCls}-treenode-checkbox-checked`]: checked,
            [`${prefixCls}-treenode-checkbox-indeterminate`]: halfChecked,
            [`${prefixCls}-treenode-selected`]: selected,
            [`${prefixCls}-treenode-loading`]: loading,
            [`${prefixCls}-treenode-active`]: active,
            [`${prefixCls}-treenode-leaf-last`]: isEndNode,

            'drop-target': dropTargetKey === eventKey,
            'drop-container': dropContainerKey === eventKey,
            'drag-over': !disabled && dragOver,
            'drag-over-gap-top': !disabled && dragOverGapTop,
            'drag-over-gap-bottom': !disabled && dragOverGapBottom,
            'filter-node': filterTreeNode && filterTreeNode(convertNodePropsToEventData(props)),
          })}
          style={attrs.style}
          onDragenter={mergedDraggable ? onDragEnter : undefined}
          onDragover={mergedDraggable ? onDragOver : undefined}
          onDragleave={mergedDraggable ? onDragLeave : undefined}
          onDrop={mergedDraggable ? onDrop : undefined}
          onDragend={mergedDraggable ? onDragEnd : undefined}
          onMousemove={onMousemove}
          {...dataOrAriaAttributeProps}
        >
          <Indent prefixCls={prefixCls} level={level} isStart={isStart} isEnd={isEnd} />
          {renderSwitcher()}
          {renderCheckbox()}
          {renderSelector()}
        </div>
      );
    };
  },
});