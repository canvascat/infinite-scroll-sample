<template>
  <li class="item" ref="liRef">
    <div class="item__wrapper" :class="{ 'is-fixed': fixedHeight }" >
      <div class="item__info">
        <img :src="data.avatar" class="item__avatar" />
        <p class="item__name">{{ index }}. {{ data.name }}</p>
        <p class="item__date">{{ data.dob }}</p>
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
    index: {
      type: Number,
      default: 0,
    },
    data: {
      type: Object as PropType<DataItem>,
      required: true
    },
    fixedHeight: {
      type: Boolean,
      default: true,
    },
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
        context.emit('size-change', props.index)
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
  padding: 11px 20px;
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
    padding: 20px;
    padding-top: 0;
    background-color: #fff;
    border: 1px solid #eaeaea;
    border-radius: 5px;
  }
  &__info {
    padding: 20px 0 20px 60px;
    position: relative;
  }
  &__avatar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    margin: auto 0;
    width: 50px;
    height: 50px;
    background-color: #eaeaea;
    border-radius: 100%;
    overflow: hidden;
  }
  &__name,
  &__date,
  &__text,
  &__paragraph {
    margin-bottom: 4px;
    max-width: 100%;
    font-weight: bold;
    font-size: 12px;
  }
  &__text,
  &__paragraph {
    font-weight: normal;
  }
  &__img {
    margin-top: 10px;
    max-width: 100% !important;
    border-radius: 5px;
  }
}
</style>