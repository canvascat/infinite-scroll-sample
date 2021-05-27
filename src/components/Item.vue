<template>
  <li ref="liRef" :data-index="data.index">
    <article>
      <section>
        <img :src="data.avatar"/>
        <p><strong>{{ data.name }}</strong></p>
        <p><strong>{{ data.dob.toLocaleString() }}</strong></p>
      </section>
      <p>{{ data.paragraph }}</p>
      <img loading="lazy" :src="defferImgSrc"/>
      <img loading="lazy" :src="data.img.src"/>
    </article>
  </li>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { sleep, random } from 'src/util/util'
import { addResizeListener, removeResizeListener } from 'src/util/resize-event'
import type { PropType } from 'vue'
import type { DataItem } from 'src/types'
import type { ResizableElement } from 'src/util/resize-event'

export default defineComponent({
  props: {
    data: {
      type: Object as PropType<DataItem>,
      required: true
    },
    fixedHeight: {
      type: Boolean,
      default: false,
    }
  },

  emits: ['resize'],

  setup(props, context) {
    const defferImgSrc = ref('')
    const liRef = ref<HTMLElement>()
    let height = 0
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
      // **当元素被移除时也会触发**
      if (!liRef.value) return
      const currentHeight = liRef.value.getBoundingClientRect().height
      if (currentHeight === height) return
      height = currentHeight
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
li {
  padding: 0.5rem 1rem;
  width: 100%;
  &::after {
    content: "index: " attr(data-index);
    position: absolute;
    top: 1.5rem;
    right: 2rem;
    pointer-events: none;
  }
  > article {
    padding: 1rem;
    background-color: #fff;
    border: 1px solid #eaeaea;
    border-radius: 0.5rem;
    > p {
      text-align: justify;
      line-height: 1.5;
    }
    > img {
      margin-top: 10px;
      max-width: 100% !important;
      border-radius: 5px;
    }
  }
  p {
    max-width: 100%;
    font-size: 0.8rem;
    margin: 0;
  }
}
section {
  padding-bottom: 1rem;
  padding-left: 4rem;
  position: relative;
  > img {
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
  > p {
    line-height: 2;
  }
}
</style>