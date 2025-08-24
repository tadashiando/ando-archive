import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Button } from "../../UI";

interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class EditorErrorBoundary extends React.Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  constructor(props: EditorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for debugging
    console.error("Editor Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <EditorErrorFallback
          onReset={this.handleReset}
          error={this.state.error}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
const EditorErrorFallback: React.FC<{
  onReset: () => void;
  error?: Error;
}> = ({ onReset, error }) => {
  const { t } = useTranslation();

  return (
    <Card
      variant="ghost"
      padding="lg"
      className="sage-bg-medium border-red-500 border-2"
    >
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-400">
          {t("editor.error.title", "Editor Error")}
        </h3>
        <p className="sage-text-mist">
          {t(
            "editor.error.description",
            "The editor encountered an error. You can try to reset it or refresh the page."
          )}
        </p>

        {/* Error details for development */}
        {process.env.NODE_ENV === "development" && error && (
          <details className="text-left text-xs sage-text-mist bg-red-900/20 p-3 rounded">
            <summary className="cursor-pointer font-medium">
              Error Details (Development)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
            <pre className="mt-1 text-xs opacity-75">{error.stack}</pre>
          </details>
        )}

        <div className="flex space-x-3 justify-center">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            {t("editor.error.refresh", "Refresh Page")}
          </Button>
          <Button variant="primary" onClick={onReset}>
            {t("editor.error.reset", "Reset Editor")}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EditorErrorBoundary;
