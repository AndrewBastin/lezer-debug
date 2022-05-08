<template>
  <div
    flex="~ row"
    w="full"
    h="screen"
  >
    <div
      flex="1"
      bg="dark-200"
      border="r-white solid"
      h="min-screen max-screen"
      overflow="auto"
    >
      <div
        v-if="E.isLeft(grammarParser)"
        bg="red-600"
        color="white"
        font="sans"
        p="2"
        pos="sticky top-0"
        z="50"
      >
        {{ grammarParser.left }}
      </div>
      <CodeEditor 
        v-model="grammarText"
        :lang="lezer" 
      />
    </div>

    <div
      flex="~ col 1"
      bg="dark-200"
      h="min-screen max-screen"
      overflow="auto"
    >
      <div flex="initial" overflow="y-auto" h="2/3">
        <CodeEditor 
          v-model="exampleText"
          :lang="grammarLangSupport"
          :selection="exampleSelection"
        />
      </div>

      <div 
        flex="initial" 
        h="1/3" 
        color="white" 
        overflow="y-auto" 
        font="mono"
      >
        <span v-if="E.isLeft(exampleTree)">
          Parser Error!
        </span>

        <SyntaxTree
          v-else
          :tree="exampleTree.right"
          :text="exampleText"
          @select="onSyntaxEntrySelect"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { refDebounced, useLocalStorage } from "@vueuse/core"
import { lezer } from "@codemirror/lang-lezer"
import * as E from "fp-ts/Either"
import * as Tr from "fp-ts/Tree"
import { pipe, identity, flow } from "fp-ts/function"
import { buildParser } from "@lezer/generator"
import CodeEditor from "./components/CodeEditor.vue"
import { LanguageSupport, LRLanguage } from "@codemirror/language"
import { lrTreeToSyntaxTree, SyntaxTreeEntry } from "./LRTree"
import SyntaxTree from "./components/SyntaxTree.vue"

const exampleText = useLocalStorage("text-example", "")

const grammarText = useLocalStorage("text-grammar", "")
const debouncedGrammarText = refDebounced(grammarText, 1000)

const grammarParser = computed(() => 
  pipe(
    E.tryCatch(
      () => buildParser(debouncedGrammarText.value),
      identity
    ),
    E.map((parser) =>
      parser.configure({
        // TODO: Ability to declare highlighters
      })
    )
  )
)

const grammarLangSupport = computed(() =>
  pipe(
    grammarParser.value,
    E.fold(
      () => null,
      (parser) => () =>
        new LanguageSupport(LRLanguage.define({ parser }))
    )
  )
)

const exampleTree = computed(() => {
  exampleText.value;

  return pipe(
    grammarParser.value,
    E.map(flow(
      (parser) => parser.parse(exampleText.value),
      lrTreeToSyntaxTree,
    ))
  )
})

const exampleSelection = ref<null | [number, number]>(null)

const onSyntaxEntrySelect = ({from, to}: SyntaxTreeEntry) => {
  exampleSelection.value = [from, to]
}

</script>

<style>
body {
  margin: 0
}
pre {
  margin: 0
}
</style>
