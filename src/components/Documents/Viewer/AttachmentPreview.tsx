import React from "react";
import { DocumentTextIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "../../UI";

// Versão específica para o Viewer (com dados do banco)
interface ViewerAttachmentFile {
  id: number;
  filename: string;
  filepath: string;
  filetype: "image" | "video" | "pdf" | "other";
  filesize: number;
}

interface AttachmentPreviewViewerProps {
  attachment: ViewerAttachmentFile | null;
  placeholder?: string;
}

const AttachmentPreviewViewer: React.FC<AttachmentPreviewViewerProps> = ({
  attachment,
  placeholder,
}) => {
  const { t } = useTranslation();

  if (!attachment) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📎</span>
          <p className="sage-text-mist">
            {placeholder || "Selecione um anexo"}
          </p>
        </div>
      </div>
    );
  }

  const { filename, filepath, filetype, filesize } = attachment;

  // Debug para desenvolvimento
  console.log("Viewer Preview Debug:", {
    filename,
    filepath,
    filetype,
  });

  switch (filetype) {
    case "image": {
      const imageUrl = convertFileSrc(filepath);
      return (
        <img
          src={imageUrl}
          alt={filename}
          className="w-full h-full object-contain rounded-xl"
          onError={(e) => {
            console.error("❌ Erro ao carregar imagem no viewer:", imageUrl);
            // Fallback para ícone
            const target = e.currentTarget;
            target.style.display = "none";
            const fallback = document.createElement("div");
            fallback.className = "flex items-center justify-center h-full";
            fallback.innerHTML = `
              <div class="text-center">
                <span class="text-6xl mb-4 block">🖼️</span>
                <p class="sage-text-mist">${filename}</p>
                <p class="sage-text-mist text-sm">Erro ao carregar imagem</p>
              </div>
            `;
            target.parentNode?.appendChild(fallback);
          }}
        />
      );
    }

    case "video": {
      const videoUrl = convertFileSrc(filepath);
      return (
        <video
          controls
          className="w-full h-full rounded-xl"
          src={videoUrl}
          preload="metadata"
          onError={() =>
            console.error("❌ Erro ao carregar vídeo no viewer:", videoUrl)
          }
        >
          {t("common.browserNotSupported")}
        </video>
      );
    }

    case "pdf":
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <DocumentIcon className="h-16 w-16 mx-auto sage-text-mist mb-4" />
            <p className="sage-text-cream font-bold">{filename}</p>
            <p className="sage-text-mist text-sm">
              {(filesize / 1024 / 1024).toFixed(2)} MB
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                const pdfUrl = convertFileSrc(filepath);
                window.open(pdfUrl, "_blank");
              }}
            >
              {t("common.openPdf")}
            </Button>
          </div>
        </div>
      );

    default:
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <DocumentTextIcon className="h-16 w-16 mx-auto sage-text-mist mb-4" />
            <p className="sage-text-cream font-bold">{filename}</p>
            <p className="sage-text-mist text-sm">
              {(filesize / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      );
  }
};

export default AttachmentPreviewViewer;
