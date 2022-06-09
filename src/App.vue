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
      <div 
        flex="~ col 1" 
        bg="dark-200" 
        h="screen" 
      >
        <div 
          flex="initial" 
          overflow="y-auto"
          h="2/3"
        >
          <CodeEditor 
            v-model="grammarText"
            :lang="lezer" 
          />
        </div>

        <div
          flex="initial"
          h="1/3"
          color="white"
          overflow="y-auto"
        >
          <CodeEditor 
            v-model="tagJSONText"
            :lang="json"
          />
        </div>
      </div>
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
          :text="exampleTextDebounced"
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
import { json } from "@codemirror/lang-json"
import { styleTags, Tag, tags } from "@lezer/highlight"
import * as S from "fp-ts/string"
import * as O from "fp-ts/Option"
import * as R from "fp-ts/Record"
import * as E from "fp-ts/Either"
import * as J from "fp-ts/Json"
import { pipe, flow } from "fp-ts/function"
import { buildParser } from "@lezer/generator"
import CodeEditor from "./components/CodeEditor.vue"
import { LanguageSupport, LRLanguage } from "@codemirror/language"
import { lrTreeToSyntaxTree, SyntaxTreeEntry } from "./LRTree"
import SyntaxTree from "./components/SyntaxTree.vue"

const DEBOUNCE_TIME_PERIOD = 1000

const exampleText = useLocalStorage("text-example", "")
const grammarText = useLocalStorage("text-grammar", "")
const tagJSONText = useLocalStorage("text-tags", "{}")

const exampleTextDebounced = refDebounced(exampleText, DEBOUNCE_TIME_PERIOD)

const grammarTextDebounced = refDebounced(grammarText, DEBOUNCE_TIME_PERIOD)

const tagJSONTextDebounced = refDebounced(tagJSONText, DEBOUNCE_TIME_PERIOD)

const getHighlightTag = (tagName: string) => pipe(
  tags,
  R.lookup(tagName),
  O.filter((el): el is Tag => typeof el !== "function")
)

const highlightProps = computed(() =>
  pipe(
    tagJSONTextDebounced.value,
    J.parse,
    E.mapLeft(() => "TAGS_INVALID_JSON" as const),
    E.filterOrElseW(
      (obj): obj is J.JsonRecord => typeof obj === "object" && obj !== null,
      () => "TAGS_INVALID_ROOT" as const
    ),
    E.chainW(flow(
      R.map(
        flow(
          O.fromPredicate(S.isString),
          O.chain(getHighlightTag)
        )
      ),
      R.sequence(O.Applicative),
      E.fromOption(() => "TAGS_INVALID_TAG_NAME" as const)
    )),
  )
)

const grammarParser = computed(() =>
  pipe(
    E.Do,

    E.bindW("parser", () =>
      E.tryCatch(
        () => buildParser(grammarTextDebounced.value),
        (e) => e as Error
      )
    ),

    E.bindW("props", () => highlightProps.value),

    E.map(({ parser, props }) => 
      parser.configure({
        props: [styleTags(props)]
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
  exampleTextDebounced.value;

  return pipe(
    grammarParser.value,
    E.map(flow(
      (parser) => parser.parse(exampleTextDebounced.value),
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
