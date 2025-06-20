"use client"

import dynamic from 'next/dynamic'
import { Loader2 } from "lucide-react"

const CodeEditor = dynamic(
  () => import('./code-editor'),
  {    loading: () => (
      <div className="flex items-center justify-center h-full w-full bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading editor...</span>
      </div>
    ),
    ssr: false
  }
)

export default CodeEditor;
