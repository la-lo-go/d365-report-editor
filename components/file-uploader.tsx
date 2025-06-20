"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isLoading?: boolean
}

export default function FileUploader({ onFileUpload, isLoading = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        isDragging ? "border-primary bg-primary/10" : "border-muted"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".docx"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isLoading}
      />

      <div className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-primary/10 p-3">
          {isLoading ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-primary" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {isLoading ? "Processing file..." : "Drag and drop your .docx file here or"}
          </p>
          <p className="text-xs text-muted-foreground">Only Dynamics 365 .docx files are accepted</p>
        </div>
        <Button onClick={handleButtonClick} variant="outline" className="border-muted hover:bg-muted" disabled={isLoading}>
          {isLoading ? "Processing..." : "Select file"}
        </Button>
      </div>
    </div>
  )
}
