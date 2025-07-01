import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { XMLValidationResult } from "@/lib/xml-validator"

interface XMLValidatorPanelProps {
  validationResult: XMLValidationResult | null
  isValidating?: boolean
}

export default function XMLValidatorPanel({ 
  validationResult, 
  isValidating = false 
}: XMLValidatorPanelProps) {
  if (!validationResult && !isValidating) {
    return null
  }

  return (
    <Card className="border-muted bg-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isValidating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Validating XML...
            </>
          ) : validationResult?.isValid ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Valid XML
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              XML Issues Found
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      {validationResult && validationResult.errors.length > 0 && (
        <CardContent className="pt-0 space-y-2 max-h-48 overflow-y-auto">
          {validationResult.errors.map((error, index) => (
            <Alert 
              key={index} 
              variant={error.severity === 'error' ? 'destructive' : 'default'}
              className="text-xs"
            >
              <AlertCircle className="h-3 w-3" />
              <AlertTitle className="text-xs">
                Line {error.line}, Column {error.column}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {error.message}
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
