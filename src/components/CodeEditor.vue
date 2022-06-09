<template>
  <div ref="editor"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue"
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view"
import { Compartment, EditorState } from "@codemirror/state"
import { basicSetup } from "codemirror"
import { oneDark } from "@codemirror/theme-one-dark"
import { LanguageSupport } from "@codemirror/language"
import { tags as t } from "@lezer/highlight"

const props = withDefaults(
  defineProps<{
    lang: (() => LanguageSupport) | null,
    modelValue: string
    selection: null | [number, number]
  }>(), {
    selection: null
  }
)

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
}>()

const editor = ref<HTMLElement>()
const cachedValue = ref("")

const cm = ref<EditorView>()

const langCompartment = new Compartment()

watch(() => props.lang, (lang) => {
  cm.value?.dispatch({
    effects: [
      langCompartment.reconfigure(
        lang?.() ?? []
      )
    ]
  })
})

watch(() => props.selection, (selection) => {
  if (selection) {
    const [from, to] = selection
    cm.value?.dispatch({
      selection: {
        anchor: from,
        head: to
      }
    })
  }
})

watch(() => props.modelValue, (val) => {
  if (val !== cachedValue.value)
    cm.value?.dispatch({
      filter: false,
      changes: {
        from: 0,
        to: cm.value.state.doc.length,
        insert: val,
      },
    })

  cachedValue.value = val
})

onMounted(() => {
  cachedValue.value = props.modelValue

  cm.value = new EditorView({
    parent: editor.value,
    state: EditorState.create({
      extensions: [
        basicSetup,
        oneDark,
        langCompartment.of(
          props.lang?.() ?? []
        ),
        ViewPlugin.fromClass(
          class {
            update(update: ViewUpdate) {
              if (update.docChanged) {
                cachedValue.value = update.state.doc
                  .toJSON()
                  .join(update.state.lineBreak)
                
                emit("update:modelValue", cachedValue.value)
              }
            }
          }
        )
      ],
      doc: props.modelValue
    })
  })
})

onBeforeUnmount(() => {
  cm.value?.destroy()
  cm.value = undefined
})
</script>