"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FileUploader from "@/components/file-uploader"
import FileExplorer from "@/components/file-explorer"
import CodeEditor from "@/components/dynamic-code-editor"
import { extractZip, saveAsDocx } from "@/lib/file-utils"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function Home() {
  const [files, setFiles] = useState<{ [path: string]: string }>({})
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [originalFileName, setOriginalFileName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = () => {
    setFiles({})
    setSelectedFile(null)
    setFileContent("")
    setOriginalFileName("")
    setError(null)
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
        console.log(`File automatically selected: ${largestFile} (size: ${maxLength} characters)`)
      }
    } catch (error) {
      console.error("Error processing file:", error)
      setError("Error processing file. Please try with a different file.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (path: string) => {
    setSelectedFile(path)
    setFileContent(files[path])
  }

  const handleContentChange = (content: string) => {
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
    <main className="container mx-auto p-4 max-w-full bg-background text-foreground min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">D365 Report Editor</h1>

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
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-primary">Editing: {originalFileName}</h2>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" className="border-muted hover:bg-muted">New File</Button>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">Save as DOCX</Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 h-[calc(100vh-180px)]">
            {/* File Explorer - Left Side */}
            <div className="col-span-1 border rounded-md overflow-hidden border-muted bg-card">
              <FileExplorer files={Object.keys(files)} selectedFile={selectedFile} onFileSelect={handleFileSelect} />
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
        </div>
      )}
    </main>
  )
}
