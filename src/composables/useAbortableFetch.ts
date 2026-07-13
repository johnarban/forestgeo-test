import { ref } from 'vue';


/** composeable
 * @description 
 * A composable providing an abortable fetch function using the AbortController API.
 * 
 * Usage:
 * ```
 * const { loading, error, abortController, abortableFetch, abort } = useAbortableFetch();
 * ```
 * - `loading`: provides access to current loading state
 * - `error`: provides access to non-abort errors encountered during fetch (all errors are thrown, include abort)
 * - `abortController`: provides access to the current AbortController, if any
 * - `abort(msg)`: aborts the current fetch request and clears the controller (set to null)
 * 
 * adapted from https://stackoverflow.com/a/62992971/11594175
 */
export function useAbortableFetch() {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const abortController = ref<AbortController | null>(null);


  function abortableFetch(input: string | Request | URL, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const signal = controller.signal;
    abortController.value = controller;

    loading.value = true;
    error.value = null;
    

    return fetch(input, { ...init, signal: signal })
      .then((response) => response) // directly return the response. Handle HTTP errors when calling it
      .catch((err: Error) => { // rethrow the error to avoid returning Promise<void>
        if (err.name === 'AbortError') {
          console.error('useKML: Fetch aborted with message:', err.message);
        } else {
          error.value = err;
        }
        throw err;
      })
      .finally(() => {
        loading.value = false;
        abortController.value = null;
      });
  }

  function abort(msg: string = 'Fetch aborted by Abort Controller'): void {
    if (abortController.value) {
      abortController.value.abort(msg);
      abortController.value = null;
    }
  }

  return {
    loading,
    error,
    abortController,
    abortableFetch,
    abort,
  };
}