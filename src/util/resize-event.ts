export type ResizableElement = HTMLElement & {
  __resizeListeners__?: Array<(...args: unknown[]) => unknown>
  __ro__?: ResizeObserver
}

const resizeHandler = (entries: ResizeObserverEntry[]) =>
  entries.forEach(({ target }) => (target as ResizableElement).__resizeListeners__?.forEach(fn => fn()))

export const addResizeListener = function (
  element: Nullable<ResizableElement>,
  fn: (...args: unknown[]) => unknown,
): void {
  if (!element) return
  if (!element.__resizeListeners__) {
    element.__resizeListeners__ = []
    element.__ro__ = new ResizeObserver(resizeHandler)
    element.__ro__.observe(element)
  }
  element.__resizeListeners__.push(fn)
}

export const removeResizeListener = function (
  element: Nullable<ResizableElement>,
  fn: (...args: unknown[]) => unknown,
): void {
  if (!element || !element.__resizeListeners__) return
  element.__resizeListeners__.splice(
    element.__resizeListeners__.indexOf(fn),
    1,
  )
  if (!element.__resizeListeners__.length) {
    element.__ro__?.disconnect()
  }
}