"use client"

import { Folder, File, ChevronRight, ChevronDown } from "lucide-react"
import { useState } from "react"

interface FileExplorerProps {
  files: string[]
  selectedFile: string | null
  onFileSelect: (path: string) => void
}

interface FolderStructure {
  [key: string]: {
    type: "folder" | "file"
    children?: FolderStructure
  }
}

export default function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["customXml"]))

  const folderStructure: FolderStructure = {}

  files.forEach((path) => {
    const parts = path.split("/")
    let current = folderStructure

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current[part] = { type: "file" }
      } else {
        if (!current[part]) {
          current[part] = { type: "folder", children: {} }
        }
        current = current[part].children as FolderStructure
      }
    })
  })

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (structure: FolderStructure, currentPath = "") => {
    return Object.entries(structure).map(([name, item]) => {
      const path = currentPath ? `${currentPath}/${name}` : name

      if (item.type === "folder") {
        const isExpanded = expandedFolders.has(path)

        return (
          <div key={path}>
            <div
              className="flex items-center gap-1 py-1 px-2 hover:bg-muted cursor-pointer"
              onClick={() => toggleFolder(path)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <Folder className="h-4 w-4 text-accent" />
              <span className="text-sm">{name}</span>
            </div>

            {isExpanded && item.children && <div className="pl-4">{renderFolder(item.children, path)}</div>}
          </div>
        )
      } else {
        const isSelected = path === selectedFile
        const isXml = name.endsWith(".xml")

        return (
          <div
            key={path}
            className={`flex items-center gap-1 py-1 px-2 pl-6 hover:bg-muted cursor-pointer ${
              isSelected ? "bg-primary/20 text-primary" : ""
            } ${isXml ? "font-medium" : ""}`}
            onClick={() => onFileSelect(path)}
          >
            <File className={`h-4 w-4 ${isXml ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm truncate">{name}</span>
          </div>
        )
      }
    })
  }

  return (
    <div className="h-full overflow-auto">
      <div className="font-medium p-2 border-b sticky top-0 bg-card text-primary">Files</div>
      {renderFolder(folderStructure)}
    </div>
  )
}
