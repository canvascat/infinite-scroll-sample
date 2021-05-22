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
