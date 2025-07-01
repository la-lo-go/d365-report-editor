"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FileUploader from "@/components/file-uploader"
import FileExplorer from "@/components/file-explorer"
import CodeEditor from "@/components/dynamic-code-editor"
import { extractZip, saveAsDocx } from "@/lib/file-utils"
import { validateXML, XMLValidationResult } from "@/lib/xml-validator"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Footer from "@/components/footer"
import XMLValidatorPanel from "@/components/xml-validator-panel"

export default function Home() {
  const [files, setFiles] = useState<{ [path: string]: string }>({})
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [originalFileName, setOriginalFileName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<XMLValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const isChangingFile = useRef(false)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync file content with state
  useEffect(() => {
    if (selectedFile && files[selectedFile] !== undefined) {
      console.log(`📁 Syncing: ${selectedFile} (${files[selectedFile]?.length} chars)`)
    }
  }, [selectedFile])

  // Validación XML con debounce
  useEffect(() => {
    if (selectedFile && selectedFile.endsWith('.xml') && fileContent) {
      setIsValidating(true)
      
      // Limpiar timeout anterior
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
      
      // Validar después de 500ms de inactividad
      validationTimeoutRef.current = setTimeout(() => {
        console.log(`🔍 Validating XML: ${selectedFile}`)
        const result = validateXML(fileContent)
        setValidationResult(result)
        setIsValidating(false)
        
        if (!result.isValid) {
          console.log(`❌ XML validation failed: ${result.errors.length} errors`)
        } else {
          console.log(`✅ XML validation passed`)
        }
      }, 500)
    } else {
      setValidationResult(null)
      setIsValidating(false)
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [selectedFile, fileContent])

  const handleReset = () => {
    setFiles({})
    setSelectedFile(null)
    setFileContent("")
    setOriginalFileName("")
    setError(null)
    setValidationResult(null)
    setIsValidating(false)
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file || !file.name.endsWith(".docx")) {
      alert("Please upload a valid .docx file")
      return
    }

    setOriginalFileName(file.name)
    setIsLoading(true)
    setError(null)

    try {
      const extractedFiles = await extractZip(file)
      setFiles(extractedFiles)

      const customXmlFiles = Object.keys(extractedFiles).filter(
        (path) => path.startsWith("customXml/") && path.endsWith(".xml"),
      )

      if (customXmlFiles.length > 0) {
        let largestFile = customXmlFiles[0]
        let maxLength = extractedFiles[largestFile].length

        for (const xmlFile of customXmlFiles) {
          const fileLength = extractedFiles[xmlFile].length
          if (fileLength > maxLength) {
            maxLength = fileLength
            largestFile = xmlFile
          }
        }

        setSelectedFile(largestFile)
        setFileContent(extractedFiles[largestFile])
        console.log(`🎯 Auto-selected: ${largestFile} (${maxLength} chars)`)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      setError("Error processing file. Please try with a different file.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (path: string) => {
    console.log(`🔄 Switching: ${selectedFile || 'none'} → ${path}`)
    
    isChangingFile.current = true
    
    // Guardar cambios del archivo anterior si existen
    if (selectedFile && fileContent !== files[selectedFile]) {
      console.log(`💾 Saving changes for: ${selectedFile}`)
      setFiles((prev) => ({
        ...prev,
        [selectedFile]: fileContent,
      }))
    }
    
    // Cambiar archivo y contenido de inmediato para evitar problemas de sincronización
    setSelectedFile(path)
    setFileContent(files[path] || "")
    
    // Resetear flag después de un pequeño delay
    setTimeout(() => {
      isChangingFile.current = false
    }, 100)
  }

  const handleContentChange = (content: string) => {
    // Ignorar cambios de contenido si estamos en medio de un cambio de archivo
    if (isChangingFile.current) {
      console.log("⏭️ Ignoring content change during file switch")
      return
    }
    
    setFileContent(content)
    if (selectedFile) {
      setFiles((prev) => ({
        ...prev,
        [selectedFile]: content,
      }))
    }
  }

  const handleSave = async () => {
    try {
      await saveAsDocx(files, originalFileName.replace(".docx", "_modified.docx"))
      alert("File saved successfully")
    } catch (error) {
      console.error("Error saving file:", error)
      alert("Error saving file")
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <main className="container mx-auto p-4 max-w-full bg-background text-foreground flex-1 flex flex-col">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">D365 Report Editor</h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {Object.keys(files).length === 0 ? (
          <Card className="mb-6 max-w-3xl mx-auto border-muted bg-card">
            <CardHeader>
              <CardTitle className="text-primary">Upload Report</CardTitle>
              <CardDescription>Upload a Dynamics 365 .docx file to edit its XML content</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
              {/* File Explorer and XML Validator - Left Side */}
              <div className="col-span-1 flex flex-col gap-4 h-full">
                <div className="border rounded-md overflow-hidden border-muted bg-card flex-1">
                  <FileExplorer 
                    files={Object.keys(files)} 
                    selectedFile={selectedFile} 
                    onFileSelect={handleFileSelect}
                    fileName={originalFileName}
                  />
                </div>
                
                {/* XML Validator Panel */}
                {selectedFile && selectedFile.endsWith('.xml') && (
                  <div className="flex-shrink-0" style={{ height: '200px' }}>
                    <XMLValidatorPanel
                      validationResult={validationResult}
                      isValidating={isValidating}
                    />
                  </div>
                )}
              </div>

              {/* Code Editor - Right Side */}
              <div className="col-span-3 border rounded-md overflow-hidden border-muted">
                {selectedFile ? (
                  <div className="h-full w-full">
                    <CodeEditor
                      value={fileContent}
                      onChange={handleContentChange}
                      language={selectedFile.endsWith(".xml") ? "xml" : "text"}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a file to edit
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Below Editor */}
            <div className="flex justify-end gap-2 pt-4 pb-2">
              <Button onClick={handleReset} variant="outline" className="border-muted hover:bg-muted">New File</Button>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save as DOCX</Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
