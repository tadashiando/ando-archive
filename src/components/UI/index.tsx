// src/components/UI/index.tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// === BUTTON COMPONENT ===
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "sage-btn-primary focus:ring-green-500",
        secondary: "sage-btn-secondary focus:ring-green-300",
        ghost: "sage-text-mist hover:sage-text-cream hover:sage-bg-medium",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// === INPUT COMPONENT ===
const inputVariants = cva(
  "w-full font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed sage-search focus:ring-2 focus:ring-green-500",
  {
    variants: {
      variant: {
        default: "",
        ghost:
          "bg-transparent sage-text-cream placeholder-sage-light border-sage-light focus:border-sage-mist",
      },
      inputSize: {
        sm: "px-3 py-2 text-sm rounded-lg",
        md: "px-4 py-3 text-base rounded-xl",
        lg: "px-5 py-4 text-lg rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, ...props }, ref) => {
    return (
      <input
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// === TEXTAREA COMPONENT ===
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, inputSize, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          inputVariants({ variant, inputSize, className }),
          "resize-none"
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// === CARD COMPONENT ===
const cardVariants = cva("rounded-xl transition-all", {
  variants: {
    variant: {
      default: "sage-card",
      ghost: "sage-bg-medium sage-border border",
      category: "sage-category cursor-pointer",
      selected: "sage-category selected",
      document: "sage-card cursor-pointer sage-text-cream",
      upload:
        "sage-bg-medium border-2 border-dashed sage-border hover:sage-border-mist hover:sage-bg-light transition-all cursor-pointer group",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "lg",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, padding, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// === DOCUMENT CARD SPECIFIC COMPONENT ===
export interface DocumentCardProps extends Omit<CardProps, "variant"> {
  title: string;
  description?: string;
  date: string;
  attachmentTypes: string[];
  onView?: () => void;
  onEdit?: () => void;
}

export const DocumentCard = React.forwardRef<HTMLDivElement, DocumentCardProps>(
  (
    {
      title,
      description,
      date,
      attachmentTypes,
      onView,
      onEdit,
      className,
      ...props
    },
    ref
  ) => {
    const getFileTypeBadgeVariant = (
      type: string
    ): "text" | "image" | "pdf" | "video" => {
      return type as "text" | "image" | "pdf" | "video";
    };

    return (
      <Card
        ref={ref}
        variant="document"
        padding="lg"
        className={className}
        {...props}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-xl sage-text-cream leading-tight">
              {title}
            </h3>
            <div className="flex space-x-2 ml-3 flex-shrink-0">
              {attachmentTypes.map((type, index) => (
                <Badge
                  key={`${type}-${index}`}
                  variant={getFileTypeBadgeVariant(type)}
                  size="sm"
                >
                  {type === "text"
                    ? "📜"
                    : type === "image"
                    ? "🖼️"
                    : type === "pdf"
                    ? "📄"
                    : "🎬"}
                </Badge>
              ))}
            </div>
          </div>

          {description && (
            <p className="sage-text-mist text-sm leading-relaxed">
              {description}
            </p>
          )}

          <div className="flex justify-between items-center text-sm pt-2">
            <span className="sage-text-light font-medium">{date}</span>
            <div className="flex space-x-3">
              {onView && (
                <IconButton
                  variant="ghost"
                  icon={<span className="text-lg">👁️</span>}
                  onClick={onView}
                />
              )}
              {onEdit && (
                <IconButton
                  variant="ghost"
                  icon={<span className="text-lg">✏️</span>}
                  onClick={onEdit}
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }
);
DocumentCard.displayName = "DocumentCard";

// === CREATE DOCUMENT CARD ===
export interface CreateDocumentCardProps extends Omit<CardProps, "variant"> {
  title: string;
  subtitle: string;
  icon?: string;
}

export const CreateDocumentCard = React.forwardRef<
  HTMLDivElement,
  CreateDocumentCardProps
>(({ title, subtitle, icon = "🌱", className, ...props }, ref) => {
  return (
    <Card
      ref={ref}
      variant="upload"
      padding="xl"
      className={cn(
        "flex items-center justify-center min-h-[280px]",
        className
      )}
      {...props}
    >
      <div className="text-center">
        <div className="w-20 h-20 sage-bg-gold rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
          <span className="text-4xl text-gray-800">{icon}</span>
        </div>
        <p className="sage-text-cream font-bold text-xl mb-3">{title}</p>
        <p className="sage-text-mist leading-relaxed">{subtitle}</p>
      </div>
    </Card>
  );
});
CreateDocumentCard.displayName = "CreateDocumentCard";

// === BADGE COMPONENT ===
const badgeVariants = cva(
  "inline-flex items-center rounded-full text-xs font-bold",
  {
    variants: {
      variant: {
        default: "sage-bg-medium sage-text-cream",
        primary: "sage-bg-gold text-gray-800",
        text: "sage-tag-text",
        image: "sage-tag-image",
        pdf: "sage-tag-pdf",
        video: "sage-tag-video",
      },
      size: {
        sm: "px-2 py-0.5",
        md: "px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

// === LABEL COMPONENT ===
export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        className={cn(
          "block text-sm font-bold sage-text-cream mb-2",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
        {required && <span className="sage-text-gold ml-1">*</span>}
      </label>
    );
  }
);
Label.displayName = "Label";

// === ICON BUTTON COMPONENT ===
export interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={cn("rounded-lg", className)}
        title={label}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

// === LOADING SPINNER ===
export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-16 w-16",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-b-2 border-green-400",
        sizeClasses[size],
        className
      )}
    />
  );
};

// === CONTAINER COMPONENT ===
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "full", ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-2xl",
      md: "max-w-4xl",
      lg: "max-w-6xl",
      xl: "max-w-7xl",
      full: "w-full",
    };

    return (
      <div
        className={cn("mx-auto", sizeClasses[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";
