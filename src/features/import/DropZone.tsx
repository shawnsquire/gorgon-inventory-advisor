import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';

interface DropZoneProps {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function DropZone({ onFiles, disabled, children }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(e.target.files);
      e.target.value = '';
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileRef.current?.click()}
      className={`
        border-2 border-dashed rounded-2xl p-20 text-center cursor-pointer
        transition-all duration-200 max-w-xl w-full
        ${dragOver
          ? 'border-action-green bg-action-green/5'
          : 'border-gorgon-border-light bg-gorgon-panel'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gorgon-text-dim'}
      `}
    >
      {children}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".json"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
