<template>
  <ul ref="scrollerRef" @scroll="handleScroll" :style="`--end-offset: translateY(${heightSum}px)`">
    <item
      v-for="(item, i) in visibleData"
      :ref="(el) => updateItemRefs(el, i)"
      :data="item"
      :key="item.index"
      :style="`transform: translateY(${cacheOffsetY[item.index]}px)`"
      @resize="updateItemHeight(item)"
    />
  </ul>
</template>

<script lang="ts">
import { defineComponent, onBeforeUpdate, onMounted, onUnmounted, ref } from 'vue'
import Item from 'src/components/Item.vue'
import { fetchData, rafThrottle } from 'src/util/util'
import type { DataItem } from 'src/types'
import { addResizeListener, removeResizeListener } from './util/resize-event'

export default defineComponent({
  setup() {
    /** 缓冲区数量 */
    const BUFFER_SIZE = 3
    /** 盒子默认高度 */
    const ESTIMATED_HEIGHT = 180

    /** 原始数据 */
    const listData: DataItem[] = []
    /** 显示数据 */
    const visibleData = ref<DataItem[]>([])
    const visibleCount = ref(0)
    const visibleRange: [number, number] = [0, 0]
    /** 显示项的必要数据，el，index */
    const visibleItems: { el: HTMLElement, index: number }[] = []
    const cacheHeight: number[] = []
    const cacheOffsetY = ref([0])
    const heightSum = ref(0)
    let lastScrollTop = 0
    let revising = false
    const toBeUpdateIndex = new Set<number>()

    const scrollerRef = ref<HTMLElement>()

    onBeforeUpdate(() => {
      visibleItems.length = 0
    })
    function updateItemRefs(el: any, i: number) {
      if (el) visibleItems[i] = { el: el.$el, index: el.data.index }
    }

    function updateData(num?: number) {
      const data = fetchData(num)
      listData.push(...data)
    }

    const updateHeight = rafThrottle(function() {
      // TODO: 当滚动过快时
      const startIndex = visibleItems.findIndex(item => toBeUpdateIndex.has(item.index))
      if (startIndex === -1) {
        console.log(visibleItems.map(m => m.index))
        toBeUpdateIndex.clear();
        return
      }
      updateCacheHeight(startIndex)
      updateCacheOffsetY(startIndex + 1)
    })
    /** 更新高度缓存 */
    function updateCacheHeight(start = 0) {
      for (let i = start; i < visibleItems.length; i++) {
        const { el, index } = visibleItems[i]
        if (!toBeUpdateIndex.has(index)) continue
        const { height } = el.getBoundingClientRect()
        cacheHeight[index] = height
      }
      toBeUpdateIndex.clear()
    }
    /** 更新偏移量缓存 */
    function updateCacheOffsetY(start = 1) {
      let offsetY = cacheHeight.slice(0, start).reduce((a, b) => a + b, 0)
      for (let i = start; i < cacheHeight.length; i++) {
        cacheOffsetY.value[i] = offsetY
        offsetY += cacheHeight[i]
      }
      heightSum.value = offsetY
    }
    function updateItemHeight(item: DataItem) {
      toBeUpdateIndex.add(item.index)
      updateHeight()
    }

    function handleScroll() {
      if (revising || !scrollerRef.value) return
      const { scrollTop } = scrollerRef.value
      const delta = scrollTop - lastScrollTop
      lastScrollTop = scrollTop
      updateVisibleRange(delta)
      // TODO: 根据情况加载数据
    }

    function updateVisibleCount() {
      const { offsetHeight } = scrollerRef.value!
      const mean = cacheHeight.length ? heightSum.value / cacheHeight.length : ESTIMATED_HEIGHT
      const min = Math.ceil(offsetHeight / mean)
      // 最小显示8个
      return (visibleCount.value = Math.max(min << 1, min + BUFFER_SIZE << 1, 8))
    }

    function createRange(startY: number, endY: number) {
      const list = cacheOffsetY.value
      const len = list.length
      const range: [number, number] = [0, len]
      for (let i = 0; i < len; i++) {
        if (list[i] >= startY) {
          range[0] = i
          for (let j = i + 1; j < len; j++) {
            if (list[j] >= endY) {
              range[1] = j + 1
              break;
            }
          }
          break
        }
      }
      return range
    }

    function updateVisibleRange(offset: number) {
      if (offset === 0) return
      const { scrollTop: startOffset, offsetHeight } = scrollerRef.value!
      const endOffset = startOffset + offsetHeight
      const [oldStart, oldEnd] = visibleRange
      const [start, end] = createRange(startOffset, endOffset)
      console.log(offset, ...visibleRange, start, end, heightSum.value, endOffset)
      if (start > oldStart && end < oldEnd) return
      if (offset > 0) { // 下
        visibleRange[0] = Math.max(start - BUFFER_SIZE, 0)
        visibleRange[1] = Math.min(visibleRange[0] + visibleCount.value, listData.length)
      } else {
        visibleRange[1] = Math.min(end + BUFFER_SIZE, listData.length)
        visibleRange[0] = Math.max(visibleRange[1] - visibleCount.value, 0)
      }
      if (visibleRange[1] >= listData.length) updateData()
      updateVisibleData(...visibleRange)
    }

    function updateVisibleData(start: number, end: number) {
      if (end >= listData.length) return
      if (start === visibleData.value[0].index && end === visibleData.value.slice(-1)[0].index) return
      visibleData.value = listData.slice(start, end)
    }

    const handleResize = rafThrottle(function() {
      updateVisibleCount()
    })

    onMounted(() => {
      addResizeListener(scrollerRef.value, handleResize)
      const count = updateVisibleCount()
      visibleRange[1] = count
      updateData(count << 1)
      visibleData.value = listData.slice(...visibleRange)
    })
    onUnmounted(() => {
      removeResizeListener(scrollerRef.value, handleResize)
    })

    return {
      ESTIMATED_HEIGHT,
      visibleData,
      scrollerRef,
      cacheOffsetY,
      heightSum,

      handleScroll,
      updateItemRefs,
      updateItemHeight
    }
  },
  components: { Item },
});
</script>

<style scoped lang="scss">
ul {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  height: 100%;
  background-color: #eee;
  list-style: none;
  &,
  &::after,
  & > li {
    position: absolute;
    top: 0;
    // contain: layout;
    will-change: transform;
    box-sizing: border-box;
  }
  &::after {
    content: '';
    height: 1px;
    width: 100%;
    pointer-events: none;
    transform: var(--end-offset);
    margin-top: -1px;
  }
}
</style>