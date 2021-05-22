import faker from 'faker'

export const sleep = (t = 0) => new Promise(resolve => setTimeout(resolve, t))

export const fetchData = (count = 30) => Array.from(Array(count), () => Object.assign(faker.helpers.contextualCard(), {
  paragraph: faker.lorem.paragraph(),
  img: { width: `${faker.datatype.number({ min: 100, max: 700 })}px`, src: `images/${faker.datatype.number({ min: 1, max: 20 })}.jpeg` }
}))
