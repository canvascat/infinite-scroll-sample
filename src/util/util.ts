import faker from 'faker'
import type { ImgData, DataItem } from 'src/types'

export const sleep = (t = 0) => new Promise(resolve => setTimeout(resolve, t))

export const random = (max: number, min = 0, precision?: number) => faker.datatype.number({ min, max, precision })

let startIndex = 0;

export const creatRandomImage: () => ImgData = () => {
  const width = random(700, 400, 100)
  const height = random(400, 200, 100)
  const src = faker.image.imageUrl(width, height)
  return { width, height, src }
}

export const fetchData: (count?: number) => DataItem[] = (count = 30) => Array.from(Array(count), () => Object.assign(faker.helpers.contextualCard(), {
  paragraph: faker.lorem.paragraph(),
  img: creatRandomImage(),
  index: startIndex++
}))

export type AnyFunction<T> = (...args: any[]) => T

const CustomRafThrottleSymbol = Symbol.for('CustomRafThrottleSymbol');
export function rafThrottle<T extends AnyFunction<any>>(fn: T): AnyFunction<void> {
  if (typeof (fn as any)[CustomRafThrottleSymbol] === 'function') {
    return Object.defineProperty(fn, CustomRafThrottleSymbol, {
      value: (fn as any)[CustomRafThrottleSymbol],
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }
  let locked = false
  function cfn(args: any[]) {
    if (locked) return
    locked = true
    window.requestAnimationFrame(() => {
      // @ts-ignore
      fn.apply(this, args)
      locked = false
    })
  }
  Object.setPrototypeOf(cfn, Object.getPrototypeOf(fn));
  Object.defineProperty(cfn, CustomRafThrottleSymbol, {
    value: cfn,
    enumerable: false,
    writable: false,
    configurable: true,
  });
  return Object.defineProperties(cfn, Object.getOwnPropertyDescriptors(fn));
}