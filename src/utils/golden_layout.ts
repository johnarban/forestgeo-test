import { watchContainerSize } from "./dom";

/**
 * Get the size of the nearest containing Golden Layout container.
 */
export function getGoldenLayoutContainerSize(element: HTMLElement): { width: number; height: number } | null {
    
  const container = element.closest('.lm_content');
  if (container) {
    const rect = container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  }
  return null;
}
  
export function watchGoldenLayoutContainerSize(
  element: HTMLElement,
  callback: (size: { width: number; height: number }) => void
): ResizeObserver | null {
  return watchContainerSize(element, ".lm_content", callback);
}
