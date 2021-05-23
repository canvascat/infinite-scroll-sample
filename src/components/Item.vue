<template>
  <li class="item" ref="liRef" :data-index="data.index">
    <div class="item__wrapper" :class="{ 'is-fixed': fixedHeight }">
      <div class="item__info">
        <img :src="data.avatar" class="item__avatar" />
        <p class="item__name">{{ data.name }}</p>
        <p class="item__date">{{ data.dob.toLocaleString() }}</p>
      </div>
      <template v-if="fixedHeight">
        <p class="item__text">E-mail: {{ data.email }}</p>
        <p class="item__text">Phone: {{ data.phone }}</p>
        <p class="item__text">City: {{ data.address.city }}</p>
        <p class="item__text">Street: {{ data.address.street }}</p>
      </template>
      <template v-else>
        <p class="item__paragraph">{{ data.paragraph }}</p>
        <img loading="lazy" :src="defferImgSrc" class="item__img" />
        <img loading="lazy" :src="data.img.src" class="item__img" />
      </template>
    </div>
  </li>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { sleep, random } from 'src/util'
import { addResizeListener, removeResizeListener } from 'src/resize-event'
import type { PropType } from 'vue'
import type { DataItem } from 'src/types'
import type { ResizableElement } from 'src/resize-event'

export default defineComponent({
  name: 'item',
  props: {
    data: {
      type: Object as PropType<DataItem>,
      required: true
    },
    fixedHeight: {
      type: Boolean,
      default: true,
    }
  },

  emits: ['resize'],

  setup(props, context) {
    const defferImgSrc = ref('')
    const liRef = ref<HTMLElement>()
    // 模拟图片加载时间
    if (props.data.img.loaded) {
      defferImgSrc.value = props.data.img.src
    } else {
      sleep(random(5000, 300))
        .then(() => {
          defferImgSrc.value = props.data.img.src
          props.data.img.loaded = true
        })
    }
    function emitResize() {
      context.emit('resize', props.data.index)
    }
    onMounted(() => {
      if (props.fixedHeight) return
      liRef.value && addResizeListener(liRef.value as ResizableElement, emitResize)
    })
    onUnmounted(() => {
      liRef.value && removeResizeListener(liRef.value as ResizableElement, emitResize)
    })
    return {
      defferImgSrc,
      liRef
    }
  }
});
</script>

<style scoped lang="scss">
.item {
  padding: 0.5rem 1rem;
  width: 100%;
  &::after {
    content: "index: " attr(data-index);
    position: absolute;
    top: 1.5rem;
    right: 2rem;
    pointer-events: none;
  }
  &.is-fixed {
    &__name,
    &__date,
    &__text,
    &__paragraph {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
  &__wrapper {
    padding: 1rem;
    background-color: #fff;
    border: 1px solid #eaeaea;
    border-radius: 0.5rem;
  }
  &__info {
    padding-bottom: 1rem;
    padding-left: 4rem;
    position: relative;
  }
  &__avatar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3rem;
    height: 3rem;
    background-color: #eaeaea;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  &__name,
  &__date,
  &__text,
  &__paragraph {
    max-width: 100%;
    font-size: 0.8rem;
    margin: 0;
  }
  &__name,
  &__date {
    font-weight: bold;
    line-height: 2;
  }
  &__text,
  &__paragraph {
    text-align: justify;
    line-height: 1.5;
  }
  &__img {
    margin-top: 10px;
    max-width: 100% !important;
    border-radius: 5px;
  }
}
</style>