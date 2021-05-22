export type ImgData = {
  width: number
  height?: number
  src: string
  loaded?: boolean
}

export type DataItem = {
  paragraph: string
  index: number
  img: ImgData
} & Faker.ContextualCard
