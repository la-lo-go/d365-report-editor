"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

let monaco: any;
let nord: any;

if (typeof window !== 'undefined') {
  monaco = require('monaco-editor');
  nord = require('monaco-themes/themes/Nord.json');
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
}

export default function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (monaco && monaco.editor) {
      monaco.editor.defineTheme('nord', nord as any)
      monaco.editor.setTheme('nord')
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current) return
    setIsLoading(true)

    if (editorRef.current.offsetHeight === 0 || editorRef.current.offsetWidth === 0) {
      console.error("Editor container has zero dimensions")
    }
    if (monacoEditorRef.current) {
      monacoEditorRef.current.dispose()
    }

    const initTimeout = setTimeout(() => {
      if (!editorRef.current) return

      try {
        if (!monaco || !monaco.editor || !editorRef.current) {
          console.error("Monaco editor not available or container not ready");
          setIsLoading(false);
          return;
        }

        monacoEditorRef.current = monaco.editor.create(editorRef.current, {
          value,
          language,
          theme: 'nord',
          automaticLayout: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          wordWrap: 'off',
          fontSize: 14,
          renderWhitespace: 'all',
          renderControlCharacters: true,
          fixedOverflowWidgets: true,
          maxTokenizationLineLength: 100000000,
          bracketPairColorization: { enabled: true },
          folding: false,
          foldingStrategy: 'auto',
          largeFileOptimizations: false,
          renderValidationDecorations: 'on',
          fastScrollSensitivity: 5,
        })
        monacoEditorRef.current.onDidChangeModelContent(() => {
          if (monacoEditorRef.current) {
            onChange(monacoEditorRef.current.getValue())
          }
        })

        window.requestAnimationFrame(() => {
          if (monacoEditorRef.current) {
            monacoEditorRef.current.layout()
            setIsLoading(false)
          }
        })
      } catch (error) {
        console.error("Error creating Monaco editor:", error)
        setIsLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(initTimeout)
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentPosition = monacoEditorRef.current.getPosition()

      if (value !== monacoEditorRef.current.getValue()) {
        if (value.length > 100000) {
          setIsLoading(true)
        }

        setTimeout(() => {
          if (monacoEditorRef.current) {
            const model = monacoEditorRef.current.getModel()
            if (model && monaco && monaco.editor) {
              const editorModel = monaco.editor.getModel(model.uri);
              if (editorModel) {
                editorModel.updateOptions({
                  tabSize: 2,
                  insertSpaces: true,
                  trimAutoWhitespace: true,
                });
              }
            }

            monacoEditorRef.current.setValue(value)

            if (currentPosition) {
              monacoEditorRef.current.setPosition(currentPosition)
            }

            if (language === "xml") {
              monacoEditorRef.current.trigger("editor", "editor.action.formatDocument", null)
            }

            setIsLoading(false)
          }
        }, 0)
      }
    }
  }, [value, language]) 

  useEffect(() => {
    if (monacoEditorRef.current && monaco && monaco.editor) {
      const model = monacoEditorRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language])

  useEffect(() => {
    const handleResize = () => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.layout()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading file...</span>
        </div>
      )}
      <div ref={editorRef} className="h-full w-full" style={{ position: "relative" }} />
    </div>
  )
}
