import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, PhotoIcon, DocumentIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useEditor, EditorContent } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import StarterKit from '@tiptap/starter-kit';
import { db } from '../../database';
import type { Category } from '../../database';
import { Button, Input, Textarea, Label, Card, Badge, IconButton } from '../UI';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: Category;
  onDocumentCreated: () => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onDocumentCreated
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Editor TipTap
  const editor = useEditor({
    extensions: [StarterKit],
    content: `<p>${t('modal.createDocument.contentPlaceholder')}</p>`,
    editorProps: {
      attributes: {
        class: 'sage-bg-medium sage-text-cream p-4 rounded-lg min-h-[200px] focus:outline-none prose prose-invert max-w-none',
      },
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <PhotoIcon className="h-5 w-5" />;
    if (type === 'application/pdf') return <DocumentIcon className="h-5 w-5" />;
    if (type.startsWith('video/')) return <VideoCameraIcon className="h-5 w-5" />;
    return <DocumentTextIcon className="h-5 w-5" />;
  };

  const getFileTypeBadgeVariant = (file: File): "text" | "image" | "pdf" | "video" => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'pdf';
    if (type.startsWith('video/')) return 'video';
    return 'text';
  };

  const getFileTypeLabel = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return t('fileTypes.image');
    if (type === 'application/pdf') return t('fileTypes.pdf');
    if (type.startsWith('video/')) return t('fileTypes.video');
    return t('fileTypes.text');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !editor) return;

    setIsLoading(true);
    try {
      // Criar documento no banco
      const textContent = editor.getHTML();
      const newDocument = await db.createDocument(
        title.trim(),
        description.trim(),
        textContent,
        selectedCategory.id
      );

      console.log('Documento criado:', newDocument);
      
      // TODO: Salvar anexos (implementaremos depois)
      console.log('Anexos para salvar:', attachments);

      // Resetar formulário
      setTitle('');
      setDescription('');
      setAttachments([]);
      editor.commands.setContent(`<p>${t('modal.createDocument.contentPlaceholder')}</p>`);

      // Notificar sucesso
      onDocumentCreated();
      onClose();
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl sage-bg-dark sage-border border-2 rounded-2xl p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🌱</span>
                    <div>
                      <Dialog.Title className="text-2xl font-bold sage-text-white">
                        {t('modal.createDocument.title')}
                      </Dialog.Title>
                      <p className="sage-text-mist">
                        {t('modal.createDocument.subtitle', { category: selectedCategory.name })}
                      </p>
                    </div>
                  </div>
                  <IconButton
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isLoading}
                    icon={<XMarkIcon className="h-6 w-6" />}
                    label={t('common.close')}
                  />
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Título */}
                  <div>
                    <Label required>
                      {t('modal.createDocument.titleField')}
                    </Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('modal.createDocument.titlePlaceholder')}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label>
                      {t('modal.createDocument.descriptionField')}
                    </Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('modal.createDocument.descriptionPlaceholder')}
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Editor de Texto Rico */}
                  <div>
                    <Label>
                      {t('modal.createDocument.contentField')}
                    </Label>
                    
                    {/* Toolbar do Editor */}
                    {editor && (
                      <div className="sage-bg-light sage-border border rounded-t-xl p-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={editor.isActive('bold') ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => editor.chain().focus().toggleBold().run()}
                          disabled={isLoading}
                        >
                          {t('editor.bold')}
                        </Button>
                        <Button
                          type="button"
                          variant={editor.isActive('italic') ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => editor.chain().focus().toggleItalic().run()}
                          disabled={isLoading}
                        >
                          {t('editor.italic')}
                        </Button>
                        <Button
                          type="button"
                          variant={editor.isActive('heading', { level: 2 }) ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                          disabled={isLoading}
                        >
                          {t('editor.heading')}
                        </Button>
                        <Button
                          type="button"
                          variant={editor.isActive('bulletList') ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => editor.chain().focus().toggleBulletList().run()}
                          disabled={isLoading}
                        >
                          {t('editor.bulletList')}
                        </Button>
                      </div>
                    )}
                    
                    <div className="sage-border border border-t-0 rounded-b-xl">
                      <EditorContent editor={editor} />
                    </div>
                  </div>

                  {/* Upload de Anexos */}
                  <div>
                    <Label>
                      {t('modal.createDocument.attachmentsField')}
                    </Label>
                    <Card variant="ghost" padding="lg" className="border-2 border-dashed sage-border">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center space-y-3"
                      >
                        <span className="text-4xl">📎</span>
                        <div className="text-center">
                          <p className="sage-text-cream font-medium">
                            {t('modal.createDocument.attachmentsPlaceholder')}
                          </p>
                          <p className="sage-text-mist text-sm">
                            {t('modal.createDocument.attachmentsSubtitle')}
                          </p>
                        </div>
                      </label>
                    </Card>

                    {/* Lista de Anexos */}
                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm sage-text-cream font-medium">
                          {t('modal.createDocument.attachmentsSelected')}
                        </p>
                        {attachments.map((file, index) => (
                          <Card key={index} variant="ghost" padding="sm" className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Badge variant={getFileTypeBadgeVariant(file)}>
                                {getFileIcon(file)}
                              </Badge>
                              <div>
                                <p className="sage-text-cream font-medium text-sm">
                                  {file.name}
                                </p>
                                <p className="sage-text-mist text-xs">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB • {getFileTypeLabel(file)}
                                </p>
                              </div>
                            </div>
                            <IconButton
                              variant="ghost"
                              onClick={() => removeAttachment(index)}
                              disabled={isLoading}
                              icon={<XMarkIcon className="h-5 w-5" />}
                              label={t('common.delete')}
                            />
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      {t('modal.createDocument.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading || !title.trim()}
                    >
                      {isLoading ? t('modal.createDocument.creating') : t('modal.createDocument.create')}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateDocumentModal;