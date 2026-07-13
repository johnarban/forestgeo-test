// useURLState.ts
// Helpers for adding state variables to the url

import { ref, watch, Ref } from 'vue';


export const shareUrl = ref(new URL(window.location.href)); // Store the current URL for sharing
export const currentUrl = ref(new URL(window.location.href)); // Store the current URL for tracking changes




/* Store a reference in the URL, and watch the ref for changes */
export function storeRefInUrl<T>(refValue: Ref<T>, key: string, shareOnly: boolean = false, transform?: (T) => string) {
  
  function stringify(value: T): string {
    if (transform) {
      return transform(value);
    }
    return `${value}`;
  }
  
  function updateUrls(value: T) {
    currentUrl.value.searchParams.set(key, stringify(value));
    if (!shareOnly) {
      shareUrl.value.searchParams.set(key, stringify(value));
    }
    if (!shareOnly) {
      try { // just in case the URL can't be set for some reason (some testing environments)
        window.history.replaceState({}, '', currentUrl.value.toString());
      } catch (error) {
        console.error('Error updating window url:', error);
      }
    }
  }
  
  updateUrls(refValue.value); // Initialize the URLs with the current value
  
  watch(refValue, (newValue) => {
    updateUrls(newValue);
  });
  
  return { currentUrl, shareUrl };
}

/** get a value from the url */
export function getUrlValue(key: string, defaultValue: unknown = ''): string {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key) || `${defaultValue}`;
}