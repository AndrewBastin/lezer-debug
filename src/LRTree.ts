import { Tree as LRTree, SyntaxNode, IterMode } from "@lezer/common"
import { v4 as uuid } from "uuid"
import * as Tr from "fp-ts/Tree"

type InterimTree = {
  entry: SyntaxTreeEntry
  children: InterimTree[]
}

export type SyntaxTreeEntry = {
  id: string
  name: string
  from: number
  to: number
}


const makeTree = (tree: InterimTree): Tr.Tree<SyntaxTreeEntry> => 
  Tr.make(tree.entry, tree.children.map(makeTree))

export const lrTreeToSyntaxTree = (tree: LRTree) => {
  const stack: InterimTree[] = []

  tree.iterate({
    enter({ name, from, to }) {
      stack.push({
        entry: { id: uuid(), name, from, to },
        children: [],
      })
    },
    leave() {
      if (stack.length !== 1) {
        const tree = stack.pop()!
        stack.at(-1)!.children.push(tree)
      }
    }
  })

  return makeTree(stack[0])
}