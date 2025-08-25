import React from "react";
import { useTranslation } from "react-i18next";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button, Card } from "../../UI";

interface EditorErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface EditorErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
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
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Editor Error:", error, errorInfo);
    this.setState({
      hasError: true,
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

// Functional component for error display
const EditorErrorFallback: React.FC<{
  onReset: () => void;
  error?: Error;
}> = ({ onReset, error }) => {
  const { t } = useTranslation();

  return (
    <Card className="sage-bg-medium border sage-border p-8 min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-16 h-16 sage-bg-red-500/10 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-bold sage-text-cream">
            {t("editor.error.title", "Editor Error")}
          </h3>
          <p className="sage-text-mist text-sm">
            {t(
              "editor.error.description",
              "The editor encountered an unexpected error. Try resetting it to continue editing."
            )}
          </p>
          {error && (
            <details className="text-xs sage-text-light bg-red-900/20 rounded-lg p-3 text-left">
              <summary className="cursor-pointer hover:sage-text-cream">
                {t("editor.error.technicalDetails", "Technical Details")}
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={onReset}
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {t("editor.error.resetEditor", "Reset Editor")}
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            size="sm"
          >
            {t("editor.error.reloadApp", "Reload App")}
          </Button>
        </div>

        <p className="text-xs sage-text-light">
          {t(
            "editor.error.dataNote",
            "Your document title and attachments are preserved. Only the editor content may need to be re-entered."
          )}
        </p>
      </div>
    </Card>
  );
};

export default EditorErrorBoundary;
