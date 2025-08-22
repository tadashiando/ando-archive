import React from "react";
import { DocumentTextIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "../../UI";

interface AttachmentFile {
  file: File;
  preview?: string;
  type: "image" | "video" | "pdf" | "other";
  existingId?: number;
  existingPath?: string;
}

interface AttachmentPreviewProps {
  attachment: AttachmentFile | null;
  placeholder?: string;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
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
            {placeholder || t("modal.createDocument.attachmentsPlaceholder")}
          </p>
        </div>
      </div>
    );
  }

  const { file, preview, type, existingPath } = attachment;

  // Debug para desenvolvimento
  console.log("Preview Debug:", {
    fileName: file.name,
    hasPreview: !!preview,
    type,
    existingPath,
  });

  switch (type) {
    case "image":
      // Se é anexo existente, usar filepath convertido
      if (existingPath) {
        const imageUrl = convertFileSrc(existingPath);
        return (
          <img
            src={imageUrl}
            alt={file.name}
            className="w-full h-full object-contain rounded-xl"
            onLoad={() => console.log("✅ Imagem existente carregada!")}
            onError={(e) => {
              console.error("❌ Erro ao carregar imagem existente:", imageUrl);
              // Fallback para ícone
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = document.createElement("div");
              fallback.className = "flex items-center justify-center h-full";
              fallback.innerHTML = `
                <div class="text-center">
                  <span class="text-6xl mb-4 block">🖼️</span>
                  <p class="sage-text-mist">${file.name}</p>
                  <p class="sage-text-mist text-sm">Erro ao carregar imagem</p>
                </div>
              `;
              target.parentNode?.appendChild(fallback);
            }}
          />
        );
      }

      // Se é anexo novo, usar preview base64
      if (preview) {
        return (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-contain rounded-xl"
          />
        );
      }

      // Enquanto carrega o preview
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <span className="text-4xl mb-2 block">🖼️</span>
            <p className="sage-text-mist text-sm">Carregando preview...</p>
          </div>
        </div>
      );

    case "video":
      if (existingPath) {
        const videoUrl = convertFileSrc(existingPath);
        return (
          <video
            controls
            className="w-full h-full rounded-xl"
            src={videoUrl}
            preload="metadata"
            onError={() =>
              console.error("❌ Erro ao carregar vídeo:", videoUrl)
            }
          >
            {t("common.browserNotSupported")}
          </video>
        );
      }
      return (
        <video
          controls
          className="w-full h-full rounded-xl"
          src={URL.createObjectURL(file)}
          preload="metadata"
        >
          {t("common.browserNotSupported")}
        </video>
      );

    case "pdf":
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <DocumentIcon className="h-16 w-16 mx-auto sage-text-mist mb-4" />
            <p className="sage-text-cream font-bold">{file.name}</p>
            <p className="sage-text-mist text-sm">
              {existingPath
                ? "Arquivo salvo"
                : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                const url = existingPath
                  ? convertFileSrc(existingPath)
                  : URL.createObjectURL(file);
                window.open(url, "_blank");
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
            <p className="sage-text-cream font-bold">{file.name}</p>
            <p className="sage-text-mist text-sm">
              {existingPath
                ? "Arquivo salvo"
                : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
            </p>
          </div>
        </div>
      );
  }
};

export default AttachmentPreview;
