// Adapted using Google Gemini - derived from documentation https://github.com/SortableJS/Sortable
export interface SortableFilterEvent {
  item: HTMLElement; // The HTMLElement that received the mousedown/tapstart event.
}

export interface SortableChooseEvent {
  item: HTMLElement; // The dragged HTMLElement.
  from: HTMLElement; // The source list's HTMLElement.
  oldIndex?: number; // The element's index within its parent.
}

export interface SortableStartEvent {
  item: HTMLElement; // The dragged HTMLElement.
  from: HTMLElement; // The source list's HTMLElement.
  oldIndex?: number; // The element's index within its parent.
}

/**
 * Event type for a drag end, add, update, sort, or remove event.
 */
export interface SortableEndEvent {
  item: HTMLElement; // The dragged HTMLElement.
  to: HTMLElement; // The target list's HTMLElement.
  from: HTMLElement; // The source list's HTMLElement.
  oldIndex?: number; // The element's old index within its old parent.
  newIndex?: number; // The element's new index within its new parent.
  oldDraggableIndex?: number; // Old index, counting only draggable elements.
  newDraggableIndex?: number; // New index, counting only draggable elements.
  clone: HTMLElement; // The clone of the dragged element.
  pullMode?: 'clone' | boolean; // 'clone' if cloning, true if moving.
}

/**
 * Event type for a move event.
 * Properties: `dragged`, `draggedRect`, `related`, `relatedRect`, `willInsertAfter`
 * Returns:
 *  - `false` to cancel
 *  - `-1` to insert before
 *  - `1` to insert after
 *  - `true` or `void` keep default insertion point based on the direction
 */
export interface SortableMoveEvent {
  dragged: HTMLElement; // The dragged HTMLElement.
  draggedRect: DOMRect; // The DOMRect of the dragged element.
  related: HTMLElement; // The HTMLElement the mouse is currently over.
  relatedRect: DOMRect; // The DOMRect of the related element.
  willInsertAfter: boolean; // True if Sortable will insert the element after the related one.
}

export interface SortableCloneEvent {
  item: HTMLElement; // The original element.
  clone: HTMLElement; // The cloned element.
}
export interface SortableChangeEvent {
  newIndex?: number; // The dragging element's current index.
}

// Full options interface for Sortable.js
export interface SortableOptions {
  group?: string | {
    name: string;
    pull?: 'clone' | boolean | string[];
    put?: boolean | string[];
  };
  sort?: boolean;
  delay?: number;
  delayOnTouchOnly?: boolean;
  touchStartThreshold?: number;
  disabled?: boolean;
  // store?: any; // A more specific type could be defined if needed
  animation?: number;
  easing?: string;
  handle?: string;
  filter?: string | ((event: MouseEvent) => boolean);
  preventOnFilter?: boolean;
  draggable?: string;
  dataIdAttr?: string;
  ghostClass?: string;
  chosenClass?: string;
  dragClass?: string;
  swapThreshold?: number;
  invertSwap?: boolean;
  invertedSwapThreshold?: number;
  direction?: 'horizontal' | 'vertical';
  forceFallback?: boolean;
  fallbackClass?: string;
  fallbackOnBody?: boolean;
  fallbackTolerance?: number;
  dragoverBubble?: boolean;
  removeCloneOnHide?: boolean;
  emptyInsertThreshold?: number;
}

export interface SortableEmits {
  setData?: (dataTransfer: DataTransfer, dragEl: HTMLElement) => void;
  onChoose?: (evt: SortableChooseEvent) => void;
  onUnchoose?: (evt: SortableEndEvent) => void;
  onStart?: (evt: SortableStartEvent) => void;
  onEnd?: (evt: SortableEndEvent) => void;
  onAdd?: (evt: SortableEndEvent) => void;
  onUpdate?: (evt: SortableEndEvent) => void;
  onSort?: (evt: SortableEndEvent) => void;
  onRemove?: (evt: SortableEndEvent) => void;
  onFilter?: (evt: SortableFilterEvent) => void;
  onMove?: (evt: SortableMoveEvent, originalEvent: MouseEvent) => boolean | 1 | -1 | void;
  onClone?: (evt: SortableCloneEvent) => void;
  onChange?: (evt: SortableChangeEvent) => void;
}