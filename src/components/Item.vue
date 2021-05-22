<template>
  <li class="item" ref="liRef" :data-index="data.index">
    <div class="item__wrapper" :class="{ 'is-fixed': fixedHeight }" >
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
import faker from 'faker'
import { sleep } from 'src/util'
import type { PropType } from 'vue'
import type { DataItem } from 'src/types'

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
    },
    index: {
      default: 0
    }
  },

  setup (props, context) {
    const defferImgSrc = ref('')
    const liRef = ref<HTMLLIElement>()
    const ro = ref<ResizeObserver>()
    // 模拟图片加载时间
    if (props.data.img.loaded) {
      defferImgSrc.value = props.data.img.src;
    } else {
      sleep(faker.datatype.number({ min: 300, max: 5000 }))
        .then(() => {
          defferImgSrc.value = props.data.img.src;
          props.data.img.loaded = true;
        })
    }
    onMounted(() => {
      if (props.fixedHeight) return;
      ro.value = new ResizeObserver((entries, observer) => {
        context.emit('size-change', props.data.index)
      });
      ro.value.observe(liRef.value!);
    })
    onUnmounted(() => {
      ro.value?.disconnect.bind(ro.value)
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
  padding: .5rem 1rem;
  width: 100%;
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
    border-radius: .5rem;
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
    border-radius: .5rem;
    overflow: hidden;
  }
  &__name,
  &__date,
  &__text,
  &__paragraph {
    max-width: 100%;
    font-size: .8rem;
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