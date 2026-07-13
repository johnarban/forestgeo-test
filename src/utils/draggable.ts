export function titleBarPredicate(element: HTMLElement): boolean {
  return element.closest(".v-toolbar") != null;
}
