import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge'; // Based on typical modal sizes
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    small: 'sm:max-w-sm', // e.g. 384px
    medium: 'sm:max-w-md', // e.g. 512px (Shopify modals often around this width)
    large: 'sm:max-w-lg',  // e.g. 576px or wider
    xlarge: 'sm:max-w-xl', // e.g. 672px
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden transition-opacity duration-300 ease-in-out"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-neutralDarker bg-opacity-60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Dialog */}
      <div
        className={`relative mx-auto my-8 w-full p-4 bg-white rounded-radiusLarge shadow-xl
                    transform transition-all duration-300 ease-in-out
                    flex flex-col
                    ${sizeClasses[size]}
                    max-h-[calc(100vh-4rem)]`} // Ensure modal doesn't exceed viewport height
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between p-4 border-b border-neutralLight rounded-t-radiusLarge">
            <h3 className="text-lg font-semibold text-neutralDark" id="modal-title">
              {title}
            </h3>
            <button
              type="button"
              className="p-1 text-neutralTextSecondary hover:text-neutralDark transition-colors"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-5 flex-grow overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end p-4 space-x-3 border-t border-neutralLight rounded-b-radiusLarge">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
