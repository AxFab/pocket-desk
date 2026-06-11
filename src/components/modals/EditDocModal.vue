<script setup>
import { ref } from 'vue'
import ModalBase from './ModalBase.vue'
import AppIcon from '@/components/AppIcons.vue'

const props = defineProps({
  data: { type: Object, required: true }
  // data: { isNew: bool, doc: object }
})
const emit = defineEmits(['close', 'confirm'])

// ---- Mode: 'form' | 'json' -------------------------------------------------
const mode = ref('form')
const err  = ref(null)

// ---- Form state ------------------------------------------------------------
function valueType(v) {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

const fields = ref(
  Object.entries(props.data.doc).map(([k, v]) => ({ k, v, t: valueType(v) }))
)

const raw = ref(JSON.stringify(props.data.doc, null, 2))

// ---- Coerce ----------------------------------------------------------------
function coerce(t, rawVal) {
  if (t === 'number') return rawVal === '' ? 0 : Number(rawVal)
  if (t === 'boolean') return rawVal === true || rawVal === 'true'
  if (t === 'null') return null
  if (t === 'array' || t === 'object') {
    try { return JSON.parse(rawVal) } catch { return rawVal }
  }
  return rawVal
}

function setField(i, patch) {
  fields.value = fields.value.map((f, j) => j === i ? { ...f, ...patch } : f)
}
function removeField(i) {
  fields.value = fields.value.filter((_, j) => j !== i)
}
function addField() {
  fields.value = [...fields.value, { k: '', v: '', t: 'string' }]
}

// ---- Build object from fields ----------------------------------------------
function buildFromFields() {
  const o = {}
  for (const f of fields.value) {
    if (f.k === '') continue
    o[f.k] = f.v
  }
  return o
}

// ---- Switch modes ----------------------------------------------------------
function toJson() {
  raw.value = JSON.stringify(buildFromFields(), null, 2)
  err.value = null
  mode.value = 'json'
}
function toForm() {
  try {
    const obj = JSON.parse(raw.value)
    fields.value = Object.entries(obj).map(([k, v]) => ({ k, v, t: valueType(v) }))
    err.value = null
    mode.value = 'form'
  } catch (e) {
    err.value = 'JSON invalide : ' + e.message
  }
}

// ---- Save ------------------------------------------------------------------
function save() {
  let obj
  if (mode.value === 'json') {
    try { obj = JSON.parse(raw.value) } catch (e) { err.value = 'JSON invalide : ' + e.message; return }
  } else {
    obj = buildFromFields()
  }
  emit('confirm', obj)
}
</script>

<template>
  <ModalBase
    :title="data.isNew ? 'Nouveau document' : 'Éditer le document'"
    icon="Doc"
    :wide="true"
    @close="emit('close')"
  >
    <!-- Mode tabs -->
    <div class="editor-tabs">
      <button class="etab" :class="{ on: mode === 'form' }" @click="mode === 'json' ? toForm() : undefined">
        <AppIcon name="Form" :size="14" />Formulaire
      </button>
      <button class="etab" :class="{ on: mode === 'json' }" @click="mode === 'form' ? toJson() : undefined">
        <AppIcon name="Braces" :size="14" />JSON
      </button>
    </div>

    <!-- Error -->
    <div v-if="err" class="editor-err">
      <AppIcon name="Warning" :size="13" /> {{ err }}
    </div>

    <!-- Form mode -->
    <div v-if="mode === 'form'" class="form-edit">
      <div
        v-for="(f, i) in fields"
        :key="i"
        class="frow"
        :class="{ locked: f.k === '_id' }"
      >
        <!-- Key -->
        <input
          class="inp mono fkey"
          :value="f.k"
          placeholder="champ"
          :disabled="f.k === '_id'"
          @input="setField(i, { k: $event.target.value })"
        />
        <!-- Type -->
        <select
          class="inp tsel"
          :value="f.t"
          :disabled="f.k === '_id'"
          @change="e => {
            const t = e.target.value
            const complex = f.t === 'object' || f.t === 'array'
            setField(i, { t, v: coerce(t, complex ? JSON.stringify(f.v) : f.v) })
          }"
        >
          <option v-for="t in ['string','number','boolean','null','array','object']" :key="t" :value="t">{{ t }}</option>
        </select>
        <!-- Value -->
        <button
          v-if="f.t === 'boolean'"
          class="bool-toggle val"
          :class="{ on: f.v }"
          :disabled="f.k === '_id'"
          @click="setField(i, { v: !f.v })"
        >{{ String(!!f.v) }}</button>
        <div v-else-if="f.t === 'null'" class="inp val null-val">null</div>
        <textarea
          v-else-if="f.t === 'object' || f.t === 'array'"
          class="inp mono val cval"
          rows="1"
          :disabled="f.k === '_id'"
          :value="typeof f.v === 'string' ? f.v : JSON.stringify(f.v)"
          @input="setField(i, { v: coerce(f.t, $event.target.value) })"
        />
        <input
          v-else
          class="inp val"
          :class="{ mono: f.k === '_id' }"
          :value="f.v == null ? '' : f.v"
          :disabled="f.k === '_id'"
          @input="setField(i, { v: coerce(f.t, $event.target.value) })"
        />
        <!-- Delete field -->
        <button v-if="f.k !== '_id'" class="frow-del" @click="removeField(i)" title="Retirer le champ">
          <AppIcon name="Trash" :size="14" />
        </button>
      </div>
      <button class="add-field" @click="addField">
        <AppIcon name="Plus" :size="14" />Ajouter un champ
      </button>
    </div>

    <!-- JSON mode -->
    <textarea
      v-else
      class="json-edit mono"
      spellcheck="false"
      v-model="raw"
      @input="err = null"
    />

    <template #footer>
      <div class="foot-id">
        <code v-if="!data.isNew">_id: {{ data.doc._id }}</code>
      </div>
      <button class="btn ghost" @click="emit('close')">Annuler</button>
      <button class="btn primary" @click="save">
        {{ data.isNew ? 'Insérer' : 'Enregistrer' }}
      </button>
    </template>
  </ModalBase>
</template>
