import { Github, ExternalLink } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-muted bg-card flex-shrink-0">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Created by</span>
            <a
              href="https://lalogo.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              la-lo-go
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/la-lo-go/d365-report-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}