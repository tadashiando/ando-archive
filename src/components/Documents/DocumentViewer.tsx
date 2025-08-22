// src/components/Documents/DocumentViewer.tsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PencilIcon,
  DocumentTextIcon, 
  PhotoIcon, 
  DocumentIcon, 
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { db } from '../../database';
import type { Category, Document } from '../../database';
import { Button, Card, Badge, IconButton } from '../UI';

interface AttachmentFile {
  id: number;
  filename: string;
  filepath: string;
  filetype: 'image' | 'video' | 'pdf' | 'other';
  filesize: number;
}

interface DocumentViewerProps {
  documentId: number;
  selectedCategory: Category;
  onClose: () => void;
  onEdit: (documentId: number) => void;
  categories: Category[];
  onCategoryChange: (category: Category) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  selectedCategory,
  onClose,
  onEdit,
  categories,
  onCategoryChange
}) => {
  const { t } = useTranslation();
  const [document, setDocument] = useState<Document | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentFile | null>(null);
  const [categoryDocuments, setCategoryDocuments] = useState<Document[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocument();
    loadCategoryDocuments();
  }, [documentId, selectedCategory]);

  useEffect(() => {
    if (document) {
      loadAttachments();
    }
  }, [document]);

  useEffect(() => {
    // Encontrar índice do documento atual na lista da categoria
    const index = categoryDocuments.findIndex(doc => doc.id === documentId);
    setCurrentIndex(index);
  }, [documentId, categoryDocuments]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      // TODO: Implementar getDocumentById no database manager
      // Por enquanto, buscar na categoria
      const docs = await db.getDocumentsByCategory(selectedCategory.id);
      const foundDoc = docs.find(doc => doc.id === documentId);
      setDocument(foundDoc || null);
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDocuments = async () => {
    try {
      const docs = await db.getDocumentsByCategory(selectedCategory.id);
      setCategoryDocuments(docs);
    } catch (error) {
      console.error('Error loading category documents:', error);
    }
  };

  const loadAttachments = async () => {
    if (!document) return;
    
    try {
      const attachs = await db.getAttachments(document.id);
      const processedAttachments: AttachmentFile[] = attachs.map(att => ({
        id: att.id,
        filename: att.filename,
        filepath: att.filepath,
        filetype: getFileType(att.filetype),
        filesize: att.filesize
      }));
      
      setAttachments(processedAttachments);
      if (processedAttachments.length > 0) {
        setSelectedAttachment(processedAttachments[0]);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
    }
  };

  const getFileType = (filetype: string): 'image' | 'video' | 'pdf' | 'other' => {
    if (filetype.startsWith('image/')) return 'image';
    if (filetype.startsWith('video/')) return 'video';
    if (filetype === 'application/pdf') return 'pdf';
    return 'other';
  };

  const navigateDocument = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < categoryDocuments.length) {
      const newDocument = categoryDocuments[newIndex];
      // TODO: Implementar navegação (atualizar prop ou callback)
      console.log('Navigate to document:', newDocument.id);
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case "Receitas":
      case "Recipes":
        return "🌿";
      case "Construção":
      case "Construction":
        return "🏡";
      case "Arquitetura":
      case "Architecture":
        return "🏛️";
      case "Educação":
      case "Education":
        return "📚";
      default:
        return "📁";
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <PhotoIcon className="h-5 w-5" />;
      case 'pdf': return <DocumentIcon className="h-5 w-5" />;
      case 'video': return <VideoCameraIcon className="h-5 w-5" />;
      default: return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getBadgeVariant = (type: string): "text" | "image" | "pdf" | "video" => {
    return type as "text" | "image" | "pdf" | "video";
  };

  const renderAttachmentPreview = () => {
    if (!selectedAttachment) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📎</span>
            <p className="sage-text-mist">
              {attachments.length === 0 ? 'Nenhum anexo' : 'Selecione um anexo'}
            </p>
          </div>
        </div>
      );
    }

    const { filename, filepath, filetype, filesize } = selectedAttachment;

    switch (filetype) {
      case 'image':
        return (
          <img
            src={filepath}
            alt={filename}
            className="w-full h-full object-contain rounded-xl"
            onError={(e) => {
              // Fallback se imagem não carregar
              e.currentTarget.style.display = 'none';
            }}
          />
        );

      case 'video':
        return (
          <video
            controls
            className="w-full h-full rounded-xl"
            src={filepath}
          >
            {t('common.browserNotSupported')}
          </video>
        );

      case 'pdf':
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
                  // TODO: Abrir PDF (implementar visualizador ou download)
                  console.log('Open PDF:', filepath);
                }}
              >
                {t('common.openPdf')}
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-full sage-bg-deepest">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-4 sage-text-white">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar Colapsável - Categorias */}
      <aside className="w-80 sage-bg-dark sage-border border-r-2 p-6 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold sage-text-cream flex items-center">
            <span className="text-xl mr-2">🗂️</span>
            {t("navigation.categories")}
          </h3>
          <IconButton
            variant="ghost"
            onClick={onClose}
            icon={<XMarkIcon className="h-5 w-5" />}
            label={t('common.close')}
          />
        </div>

        {/* Lista de Categorias */}
        <div className="space-y-2">
          {categories.map((category) => {
            const isSelected = selectedCategory.id === category.id;
            
            return (
              <Card
                key={category.id}
                variant={isSelected ? "selected" : "category"}
                padding="md"
                onClick={() => onCategoryChange(category)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {getCategoryIcon(category.name)}
                  </span>
                  <span className={`font-bold text-sm ${
                    isSelected ? "text-gray-800" : "sage-text-cream"
                  }`}>
                    {category.name}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Navegação entre documentos */}
        <div className="border-t sage-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm sage-text-mist">
              {currentIndex + 1} de {categoryDocuments.length}
            </p>
            <div className="flex space-x-1">
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => navigateDocument('prev')}
                disabled={currentIndex <= 0}
                icon={<ChevronLeftIcon className="h-4 w-4" />}
                label="Documento anterior"
              />
              <IconButton
                variant="ghost"
                size="sm"
                onClick={() => navigateDocument('next')}
                disabled={currentIndex >= categoryDocuments.length - 1}
                icon={<ChevronRightIcon className="h-4 w-4" />}
                label="Próximo documento"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Área Principal - Conteúdo do Documento */}
      <div className="flex-1 flex flex-col">
        {/* Header do Document */}
        <div className="sage-header p-4 border-b sage-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold sage-text-white mb-1">
                {document.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm sage-text-mist">
                <span>Criado em {formatDate(document.created_at)}</span>
                {document.updated_at !== document.created_at && (
                  <span>• Atualizado em {formatDate(document.updated_at)}</span>
                )}
              </div>
            </div>
            
            <Button
              variant="primary"
              onClick={() => onEdit(document.id)}
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              {t('documents.edit')}
            </Button>
          </div>
        </div>

        {/* Layout Principal - 2 Colunas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conteúdo do Documento */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div 
              className="sage-text-cream prose prose-invert max-w-none prose-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: document.text_content }}
            />
          </div>

          {/* Sidebar Direita - Anexos */}
          {attachments.length > 0 && (
            <div className="w-96 sage-bg-dark border-l sage-border flex flex-col">
              {/* Header Anexos */}
              <div className="p-4 border-b sage-border">
                <h3 className="font-bold sage-text-cream mb-4">
                  Anexos ({attachments.length})
                </h3>

                {/* Lista de Anexos */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {attachments.map((attachment) => (
                    <Card
                      key={attachment.id}
                      variant="ghost"
                      padding="sm"
                      className={`cursor-pointer transition-colors ${
                        selectedAttachment?.id === attachment.id
                          ? 'sage-bg-light border-sage-gold'
                          : 'hover:sage-bg-medium'
                      }`}
                      onClick={() => setSelectedAttachment(attachment)}
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant={getBadgeVariant(attachment.filetype)} size="sm">
                          {getFileIcon(attachment.filetype)}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="sage-text-cream text-sm font-medium truncate">
                            {attachment.filename}
                          </p>
                          <p className="sage-text-mist text-xs">
                            {(attachment.filesize / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 p-4">
                <div className="h-full sage-bg-medium rounded-xl p-4">
                  {renderAttachmentPreview()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;