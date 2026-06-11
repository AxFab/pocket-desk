<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  value: { required: true },
  keyName: { type: String, default: null },
  depth: { type: Number, default: 0 },
  last: { type: Boolean, default: true },
  isRoot: { type: Boolean, default: false }
})

const open = ref(props.depth < 2)

const isArray = computed(() => Array.isArray(props.value))
const isObject = computed(() => props.value !== null && typeof props.value === 'object' && !Array.isArray(props.value))
const isPrimitive = computed(() => !isArray.value && !isObject.value)

const objectKeys = computed(() => isObject.value ? Object.keys(props.value) : [])

function primitiveClass(v) {
  if (typeof v === 'number') return 'j-num'
  if (typeof v === 'boolean') return 'j-bool'
  if (v === null) return 'j-null'
  return 'j-str'
}

function primitiveText(v) {
  if (v === null) return 'null'
  return JSON.stringify(v)
}
</script>

<template>
  <!-- Array -->
  <div v-if="isArray">
    <template v-if="value.length === 0">
      <div class="j-line">
        <span v-if="keyName !== null"><span class="j-key">"{{ keyName }}"</span><span class="j-punct">: </span></span>
        <span class="j-punct">[]</span>
        <span v-if="!last" class="j-punct">,</span>
      </div>
    </template>
    <template v-else>
      <div class="j-line j-fold" @click="open = !open">
        <span class="j-caret" :class="{ open }">▸</span>
        <span v-if="keyName !== null"><span class="j-key">"{{ keyName }}"</span><span class="j-punct">: </span></span>
        <span class="j-punct">[</span>
        <template v-if="!open">
          <span class="j-collapsed">{{ value.length }} élément{{ value.length > 1 ? 's' : '' }}</span>
          <span class="j-punct">]</span>
          <span v-if="!last" class="j-punct">,</span>
        </template>
      </div>
      <div v-if="open" class="j-children">
        <JsonView
          v-for="(item, i) in value"
          :key="i"
          :value="item"
          :key-name="null"
          :depth="depth + 1"
          :last="i === value.length - 1"
        />
        <div class="j-line"><span class="j-punct">]</span><span v-if="!last" class="j-punct">,</span></div>
      </div>
    </template>
  </div>

  <!-- Object -->
  <div v-else-if="isObject">
    <template v-if="objectKeys.length === 0">
      <div class="j-line">
        <span v-if="keyName !== null"><span class="j-key">"{{ keyName }}"</span><span class="j-punct">: </span></span>
        <span class="j-punct">{}</span>
        <span v-if="!last" class="j-punct">,</span>
      </div>
    </template>
    <template v-else>
      <div class="j-line j-fold" @click="open = !open">
        <span class="j-caret" :class="{ open }">▸</span>
        <span v-if="keyName !== null"><span class="j-key">"{{ keyName }}"</span><span class="j-punct">: </span></span>
        <span class="j-punct">{</span>
        <template v-if="!open">
          <span class="j-collapsed">{{ objectKeys.length }} champ{{ objectKeys.length > 1 ? 's' : '' }}</span>
          <span class="j-punct">}</span>
          <span v-if="!last" class="j-punct">,</span>
        </template>
      </div>
      <div v-if="open" class="j-children">
        <JsonView
          v-for="(k, i) in objectKeys"
          :key="k"
          :value="value[k]"
          :key-name="k"
          :depth="depth + 1"
          :last="i === objectKeys.length - 1"
        />
        <div class="j-line"><span class="j-punct">}</span><span v-if="!last" class="j-punct">,</span></div>
      </div>
    </template>
  </div>

  <!-- Primitive -->
  <div v-else class="j-line">
    <span v-if="keyName !== null">
      <span class="j-key">"{{ keyName }}"</span>
      <span class="j-punct">: </span>
    </span>
    <span :class="[primitiveClass(value), keyName === '_id' ? 'j-id' : '']">{{ primitiveText(value) }}</span>
    <span v-if="!last" class="j-punct">,</span>
  </div>
</template>
