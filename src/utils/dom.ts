export async function getElementRect(element: Element): Promise<DOMRectReadOnly> {
  let rect: DOMRectReadOnly | null = null;
  let resolveRectPromise: (value: DOMRectReadOnly | PromiseLike<DOMRectReadOnly>) => void;
  const rectPromise = new Promise<DOMRectReadOnly>((resolve, _reject) => {
    resolveRectPromise = resolve;
  });
  const observer = new IntersectionObserver(entries => {
    rect = entries[0].boundingClientRect;
    resolveRectPromise(rect);

    observer.disconnect();
  });
  observer.observe(element);

  return rectPromise;
}

export function watchContainerSize(
  element: HTMLElement,
  containerSelector: string,
  callback: (size: { width: number; height: number }) => void,
): ResizeObserver | null {
  const container = element.closest(containerSelector);
  if (container) {
    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect; // there should be only one entry when we observe a single element
      callback({ width: rect.width, height: rect.height });
  
    });
    resizeObserver.observe(container);
    return resizeObserver;
  }
  return null;
}
