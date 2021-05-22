<template>
  <ul
    ref="scrollerRef"
    class="height-dynamic"
    @scroll="handleScroll"
  >
    <!-- 负责撑开 ul 的高度 -->
    <li
      class="height-dynamic__scroll-runway"
      ref="scrollRunway"
      :style="`transform: translate(0, ${scrollRunwayEnd}px)`"
    ></li>
    <!-- 下拉占位符 -->
    <place-holder
      class="height-dynamic__placeholder"
      v-for="(item, index) in topPlaceholders"
      :key="-index - 1"
      :style="`transform: translate(0, ${cachedScrollY[firstAttachedItem] - ESTIMATED_HEIGHT * (index + 1)}px)`"
    />
    <item
      class="height-dynamic__item"
      v-for="item in visibleData"
      ref="itemRefs"
      :data="item"
      :fixed-height="false"
      :key="item.username + item.phone"
      :index="item.index"
      :style="`transform: translate(0, ${cachedScrollY[item.index] || item.index * ESTIMATED_HEIGHT}px)`"
      @size-change="calItemScrollY"
    />
    <!-- 上拉占位符 -->
    <place-holder
      class="height-dynamic__placeholder"
      v-for="(item, index) in bottomPlaceholders"
      :key="index + 1"
      :style="`transform: translate(0, ${cachedScrollY[lastAttachedItem - 1] + cachedHeight[lastAttachedItem - 1] + ESTIMATED_HEIGHT * (index + 1)}px)`"
    />
  </ul>
</template>

<script lang="ts">
import { computed, DefineComponent, defineComponent, nextTick, onMounted, ref } from 'vue';
import Item from './components/Item.vue';
import PlaceHolder from './components/PlaceHolder.vue'
import { fetchData } from './helpers';



export default defineComponent({
  name: 'height-dynamic',
  setup () {
    const PLACEHOLDER_COUNT = 6;
    const BUFFER_SIZE = 3;
    const ESTIMATED_HEIGHT = 180;
    let VISIBLE_COUNT = BUFFER_SIZE * 2;

    let anchorItem = { index: 0, offset: 0 }
    const listData = []
    const visibleData = ref<any[]>([])
    const topPlaceholders = ref(0)
    const bottomPlaceholders = ref(0)
    const firstAttachedItem = ref(0)
    const lastAttachedItem = ref(0)
    const cachedScrollY = ref<number[]>([])
    const cachedHeight = ref<number[]>([])
    let lastScrollTop = 0
    let revising = false

    const scrollerRef = ref<HTMLElement>()
    const itemRefs = ref<DefineComponent[]>([])

    const scrollRunwayEnd = computed(() => {
      const maxScrollY = cachedHeight.value.reduce((sum, h) => (sum += h || ESTIMATED_HEIGHT), 0);
      const currentAverageH = maxScrollY / cachedHeight.value.length;
      if (isNaN(currentAverageH)) {
        return listData.length * ESTIMATED_HEIGHT;
      } else {
        return maxScrollY + (listData.length - cachedHeight.value.length) * currentAverageH;
      }
    })

    function updateData() {
      const len = listData.length;
      // 给每个 item 打上序号标记
      const data = fetchData().map((item, index) => (item.index = index + len, item))
      listData.push(...data)
      updateVisibleData()
    }
    function handleLoadMore() {
      const { scrollTop, offsetHeight } = scrollerRef.value!
      const scrollEnd = scrollTop + offsetHeight + ESTIMATED_HEIGHT;
      if (scrollEnd >= scrollRunwayEnd.value || anchorItem.index === listData.length - 1) {
        updateData()
      }
    }
    function updateVisibleData() {
      const start = (firstAttachedItem.value = Math.max(0, anchorItem.index - BUFFER_SIZE))
      lastAttachedItem.value = firstAttachedItem.value + VISIBLE_COUNT + BUFFER_SIZE * 2;
      const end = Math.min(lastAttachedItem.value, listData.length);
      visibleData.value = listData.slice(start, end)
    }
    function updatePlaceholder(isPositive: boolean) {
      if (isPositive) {
        topPlaceholders.value = 0;
        bottomPlaceholders.value = Math.min(PLACEHOLDER_COUNT, Math.abs(listData.length - lastAttachedItem.value));
      } else {
        topPlaceholders.value = Math.min(PLACEHOLDER_COUNT, firstAttachedItem.value);
        bottomPlaceholders.value = 0;
      }
    }

    async function updateAnchorItem(delta: number) {
      const { index: lastIndex, offset: lastOffset } = anchorItem
      delta += lastOffset;
      let index = lastIndex;
      if (delta >= 0) {
        while (index < listData.length && delta > (cachedHeight.value[index] || ESTIMATED_HEIGHT)) {
          cachedHeight.value[index] ||= ESTIMATED_HEIGHT
          delta -= cachedHeight.value[index]
          index++
        }
        if (index >= listData.length) {
          anchorItem = { index: listData.length - 1, offset: 0 };
        } else {
          anchorItem = { index, offset: delta };
        }
      } else {
        while (delta < 0) {
          cachedHeight.value[index - 1] ||= ESTIMATED_HEIGHT
          delta += cachedHeight.value[index - 1];
          index--;
        }
        if (index < 0) {
          anchorItem = { index: 0, offset: 0 };
        } else {
          anchorItem = { index, offset: delta };
        }
      }
      // 修正拖动过快导致的滚动到顶端滚动条不足的偏差
      if (cachedScrollY.value[firstAttachedItem.value] <= -1) {
        console.log('revising insufficient');
        revising = true;
        const actualScrollY = cachedHeight.value.slice(0, Math.max(0, anchorItem.index)).reduce((sum, h) => (sum += h), 0);
        if (!scrollerRef.value) return
        lastScrollTop = scrollerRef.value.scrollTop = actualScrollY + anchorItem.offset
        if (scrollerRef.value.scrollTop === 0) {
          anchorItem = { index: 0, offset: 0 };
        }
        calItemScrollY()
        revising = false
      }
    }
    // 计算每一个 item 的 translateY 的高度
    async function calItemScrollY() {
      await nextTick();
      // 修正 vue diff 算法导致 item 顺序不正确的问题
      itemRefs.value.sort((a, b) => a.index - b.index)
      const anchorDomIndex = itemRefs.value.findIndex(item => item.index === anchorItem.index);
      const anchorDom = itemRefs.value[anchorDomIndex];
      const anchorDomHeight = anchorDom.$el.getBoundingClientRect().height;
      cachedScrollY.value[anchorItem.index] = scrollerRef.value!.scrollTop - anchorItem.offset
      cachedHeight.value[anchorItem.index] = anchorDomHeight
      // 计算 anchorItem 后面的 item scrollY
      for (let i = anchorDomIndex + 1; i < itemRefs.value.length; i++) {
        const item = itemRefs.value[i];
        const { height } = item.$el.getBoundingClientRect();
        cachedHeight.value[item.index] = height
        const scrollY = cachedScrollY.value[item.index - 1] + cachedHeight.value[item.index - 1];
        cachedScrollY.value[item.index] = scrollY
      }
      // 计算 anchorItem 前面的 item scrollY
      for (let i = anchorDomIndex - 1; i >= 0; i--) {
        const item = itemRefs.value[i];
        cachedHeight.value[item.index] = item.$el.getBoundingClientRect().height
        const scrollY = cachedScrollY.value[item.index + 1] - cachedHeight.value[item.index]
        cachedScrollY.value[item.index] = scrollY
      }
      // 修正拖动过快导致的滚动到顶端有空余的偏差
      if (cachedScrollY.value[0] > 0) {
        console.log('revising redundant');
        revising = true;
        const delta = cachedScrollY.value[0];
        const last = Math.min(lastAttachedItem.value, listData.length);
        for (let i = 0; i < last; i++) {
          cachedScrollY.value[i] = cachedScrollY.value[i] - delta
        }
        const scrollTop = cachedScrollY.value[anchorItem.index - 1]
          ? cachedScrollY.value[anchorItem.index - 1] + anchorItem.offset
          : anchorItem.offset;
        scrollerRef.value!.scrollTop = scrollTop;
        lastScrollTop = scrollerRef.value!.scrollTop;
        revising = false;
      }
    }

    function handleScroll() {
      if (revising) return
      const { scrollTop } = scrollerRef.value!
      const delta = scrollTop - lastScrollTop;
      lastScrollTop = scrollTop;
      updateAnchorItem(delta);
      updateVisibleData()
      updatePlaceholder(delta >= 0)
      handleLoadMore()
    }


    onMounted(() => {
      VISIBLE_COUNT = (scrollerRef.value!.offsetHeight / ESTIMATED_HEIGHT) >> 0
      lastAttachedItem.value = VISIBLE_COUNT + BUFFER_SIZE
      updateData()
      updateVisibleData()
    })
  
    return {
      ESTIMATED_HEIGHT,
      visibleData,
      topPlaceholders,
      bottomPlaceholders,
      firstAttachedItem,
      lastAttachedItem,
      cachedScrollY,
      cachedHeight,
      scrollRunwayEnd,
      scrollerRef,
      itemRefs,

      handleScroll,
      calItemScrollY
    }
  },

  components: { Item, PlaceHolder },
});
</script>

<style scoped lang="scss">
.height-dynamic {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  height: 100%;
  position: absolute;
  contain: layout;
  will-change: transform;
  background-color: #eee;
  &__item,
  &__placeholder {
    position: absolute;
    contain: layout;
    will-change: transform;
  }
  &__scroll-runway {
    position: absolute;
    width: 1px;
    height: 1px;
    transition: transform 0.2s;
  }
}
</style>