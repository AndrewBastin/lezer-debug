<template>
  <div m="1">
    <a cursor="pointer" @click="expanded = !expanded">
      {{ expanded ? "-" : "+" }}
    </a>
    <span m="l2">{{tree.value.name}}</span>
    <span cursor="pointer" @click="$emit('select', tree.value)">
      <span m="l2" text="size-3 gray">{{linePart}}</span>
      <span m="l2" text="size-2 gray">
        &lt;{{tree.value.from}}, {{tree.value.to}}&gt;
      </span>
    </span>
    <div
      v-if="expanded"
      m="l5"
    >
      <SyntaxTree
        v-for="childTree in tree.forest"
        :key="childTree.value.id"
        :text="text"
        :tree="childTree"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import * as Tr from "fp-ts/Tree";
import { SyntaxTreeEntry } from "../LRTree";

defineEmits<{
  (e: "select", node: SyntaxTreeEntry): void
}>();

const props = defineProps<{
  tree: Tr.Tree<SyntaxTreeEntry>,
  text: string
}>();

const linePart = computed(() => {
  const { from, to } = props.tree.value
  const lineSplit = props.text.substring(from, to).split("\n")

  return lineSplit.length > 1
    ? `"${lineSplit[0]}" (+${lineSplit.length - 1} lines)`
    : `"${lineSplit[0]}"`
})

const expanded = ref(true);
</script>