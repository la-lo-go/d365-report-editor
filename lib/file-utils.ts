"use client"

import JSZip from "jszip"

export async function extractZip(file: File): Promise<{ [path: string]: string }> {
  const zip = new JSZip()
  const contents: { [path: string]: string } = {}

  try {
    const zipContents = await zip.loadAsync(file)

    const promises = Object.keys(zipContents.files).map(async (filename) => {
      const zipEntry = zipContents.files[filename]

      if (zipEntry.dir) return

      if (
        filename.endsWith(".xml") ||
        filename.endsWith(".rels") ||
        filename.endsWith(".txt") ||
        filename.endsWith(".json")
      ) {
        try {
          let content: string | null = null

          try {
            content = await zipEntry.async("string")
          } catch (e) {
            console.warn(`UTF-8 decoding failed for ${filename}, trying binary`)
          }

          if (!content || content.trim().length === 0) {
            const binaryContent = await zipEntry.async("uint8array")

            try {
              const decoder = new TextDecoder("utf-8", { fatal: false })
              content = decoder.decode(binaryContent)
            } catch (e) {
              console.warn(`TextDecoder failed for ${filename}`)

              const base64Content = await zipEntry.async("base64")
              contents[filename] = `data:application/octet-stream;base64,${base64Content}`
              return
            }
          }

          if (content && content.length > 0) {
            contents[filename] = content
          } else {
            throw new Error("Empty content")
          }
        } catch (error) {
          console.error(`Error reading text file ${filename}:`, error)
          const content = await zipEntry.async("base64")
          contents[filename] = `data:application/octet-stream;base64,${content}`
        }
      } else {
        const content = await zipEntry.async("base64")
        contents[filename] = `data:application/octet-stream;base64,${content}`
      }
    })

    await Promise.all(promises)
    return contents
  } catch (error) {
    console.error("Error extracting zip:", error)
    throw new Error("Failed to extract the DOCX file")
  }
}

export async function saveAsDocx(files: { [path: string]: string }, filename: string): Promise<void> {
  const zip = new JSZip()

  Object.entries(files).forEach(([path, content]) => {
    if (content.startsWith("data:application/octet-stream;base64,")) {
      const base64Content = content.replace("data:application/octet-stream;base64,", "")
      zip.file(path, base64Content, { base64: true })
    } else {
      zip.file(path, content)
    }
  })

  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  })

  const url = URL.createObjectURL(content)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
