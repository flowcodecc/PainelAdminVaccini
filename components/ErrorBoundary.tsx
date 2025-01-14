'use client'
import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-vaccini-primary-light flex items-center justify-center">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <h2 className="text-xl font-bold text-red-600">Oops, something went wrong</h2>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{this.state.error?.message || "An unexpected error occurred."}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-vaccini-primary text-white hover:bg-vaccini-primary/90 transition-colors duration-200 ease-in-out"
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

