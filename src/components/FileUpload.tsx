import { useRef, useState } from 'react';

interface Props {
  onFileLoaded: (text: string) => void;
}

export function FileUpload({ onFileLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) onFileLoaded(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div
      className={`file-upload ${dragging ? 'file-upload--dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) readFile(file);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
        }}
      />
      <div className="file-upload__content">
        <div className="file-upload__icon">📄</div>
        <p>Перетягніть .txt файл сюди або натисніть для вибору</p>
        <p className="file-upload__hint">
          Формат: ПЕРСОНАЖ. текст репліки
        </p>
      </div>
    </div>
  );
}
