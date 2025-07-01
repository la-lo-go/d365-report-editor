export interface XMLValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}

export interface XMLValidationResult {
  isValid: boolean
  errors: XMLValidationError[]
}

export function validateXML(xmlContent: string): XMLValidationResult {
  const errors: XMLValidationError[] = []
  
  if (!xmlContent.trim()) {
    return { isValid: true, errors: [] }
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'application/xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      const errorText = parseError.textContent || 'Unknown XML parsing error'
      
      const lineMatch = errorText.match(/line\s*(?:number)?\s*(\d+)/i) || 
                       errorText.match(/línea\s*(\d+)/i) ||
                       errorText.match(/(\d+)\s*:\s*\d+/) ||
                       errorText.match(/at\s+line\s+(\d+)/i)
      
      const columnMatch = errorText.match(/column\s*(\d+)/i) || 
                         errorText.match(/columna\s*(\d+)/i) ||
                         errorText.match(/\d+\s*:\s*(\d+)/) ||
                         errorText.match(/character\s+(\d+)/i)
      
      let cleanMessage = errorText
        .replace(/Location:.*$/gm, '')
        .replace(/Ubicación:.*$/gm, '')
        .replace(/----\^/g, '')
        .replace(/XML parsing error:\s*/i, 'XML Error: ')
        .replace(/Error de lectura XML:\s*/i, 'XML Error: ')
        .trim()
      
      if (cleanMessage.length > 150) {
        const contextMatch = cleanMessage.match(/<[^>]*>/);
        if (contextMatch) {
          cleanMessage = `XML syntax error near: ${contextMatch[0]}`;
        } else {
          cleanMessage = 'XML syntax error - malformed document';
        }
      }
      
      console.log('🔍 Error parsing details:', { 
        original: errorText, 
        lineMatch: lineMatch?.[1], 
        columnMatch: columnMatch?.[1] 
      })
      
      errors.push({
        line: lineMatch ? parseInt(lineMatch[1]) : 1,
        column: columnMatch ? parseInt(columnMatch[1]) : 1,
        message: cleanMessage,
        severity: 'error'
      })
    }
  } catch (error) {
    errors.push({
      line: 1,
      column: 1,
      message: `XML parsing failed: ${error instanceof Error ? error.message.replace(/Location:.*$/gm, '').trim() : 'Unknown error'}`,
      severity: 'error'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function formatXML(xmlContent: string): string {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'application/xml')
    
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      console.warn('🚫 Cannot format XML: Document contains syntax errors')
      return xmlContent
    }
    
    if (!doc.documentElement) {
      console.warn('🚫 Cannot format XML: No root element found')
      return xmlContent
    }

    function formatNode(node: Node, indent = 0): string {
      const indentStr = '  '.repeat(indent)
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        return text ? text : ''
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tagName = element.tagName
        const attributes = Array.from(element.attributes)
          .map(attr => ` ${attr.name}="${attr.value}"`)
          .join('')
        
        const children = Array.from(element.childNodes)
        const hasElementChildren = children.some(child => child.nodeType === Node.ELEMENT_NODE)
        const hasTextContent = children.some(child => 
          child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
        )
        
        if (children.length === 0) {
          return `${indentStr}<${tagName}${attributes}/>`
        }
        
        if (!hasElementChildren && hasTextContent) {
          const textContent = children
            .filter(child => child.nodeType === Node.TEXT_NODE)
            .map(child => child.textContent?.trim())
            .join('')
          return `${indentStr}<${tagName}${attributes}>${textContent}</${tagName}>`
        }
        
        const formattedChildren = children
          .map(child => formatNode(child, indent + 1))
          .filter(str => str.length > 0)
          .join('\n')
        
        if (formattedChildren) {
          return `${indentStr}<${tagName}${attributes}>\n${formattedChildren}\n${indentStr}</${tagName}>`
        } else {
          return `${indentStr}<${tagName}${attributes}></${tagName}>`
        }
      }
      
      return ''
    }
    
    if (doc.documentElement) {
      let result = ''
      
      if (xmlContent.includes('<?xml')) {
        const xmlDeclaration = xmlContent.match(/<\?xml[^>]*\?>/)?.[0]
        if (xmlDeclaration) {
          result += xmlDeclaration + '\n'
        }
      }
      
      result += formatNode(doc.documentElement, 0)
      
      return result
    }
    return xmlContent
  } catch (error) {
    console.warn('🚫 XML formatting failed:', error instanceof Error ? error.message : 'Unknown error')
    return xmlContent
  }
}
