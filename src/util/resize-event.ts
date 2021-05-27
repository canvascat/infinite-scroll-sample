/**
 * 对 ResizeObserver 重新包装，用于监听元素尺寸变化
 */

const CustomResizeListenersSymbol = Symbol.for('CustomResizeListenersSymbol')
const CustomResizeObserverSymbol = Symbol.for('CustomResizeObserverSymbol')

export type ResizableElement = HTMLElement & {
  [CustomResizeListenersSymbol]?: Array<(...args: unknown[]) => unknown>
  [CustomResizeObserverSymbol]?: ResizeObserver
}

const resizeHandler = (entries: ResizeObserverEntry[]) =>
  entries.forEach(({ target }) => (target as ResizableElement)[CustomResizeListenersSymbol]?.forEach(fn => fn()))

export const addResizeListener = function (
  element: Nullable<ResizableElement>,
  fn: (...args: unknown[]) => unknown,
): void {
  if (!element) return
  if (!element[CustomResizeListenersSymbol]) {
    element[CustomResizeListenersSymbol] = []
    element[CustomResizeObserverSymbol] = new ResizeObserver(resizeHandler)
    element[CustomResizeObserverSymbol]!.observe(element)
  }
  element[CustomResizeListenersSymbol]!.push(fn)
}

export const removeResizeListener = function (
  element: Nullable<ResizableElement>,
  fn: (...args: unknown[]) => unknown,
): void {
  if (!element || !element[CustomResizeListenersSymbol]) return
  element[CustomResizeListenersSymbol]!.splice(
    element[CustomResizeListenersSymbol]!.indexOf(fn),
    1,
  )
  if (!element[CustomResizeListenersSymbol]!.length) {
    element[CustomResizeObserverSymbol]?.disconnect()
  }
}