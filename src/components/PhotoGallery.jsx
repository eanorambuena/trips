import { useState, useRef } from 'react';
import { generatePhotoId } from '../lib/storage';

export function PhotoGallery({ photos = [], onAdd, onRemove, editable = true }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photo = {
          id: generatePhotoId(),
          url: event.target.result,
          caption: '',
          createdAt: Date.now(),
        };
        onAdd?.(photo);
      };
      reader.readAsDataURL(file);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCaptionChange = (photoId, caption) => {
    const photo = photos.find((p) => p.id === photoId);
    if (photo) {
      onAdd?.({ ...photo, caption }, true);
    }
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt={photo.caption || 'Foto'}
                className="w-full h-24 object-cover rounded cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              />
              {editable && (
                <button
                  onClick={() => onRemove?.(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && (
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            {uploading ? '⏳' : '📷'} Agregar foto
          </button>
        </div>
      )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Foto'}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {editable && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={selectedPhoto.caption || ''}
                  onChange={(e) => {
                    const newCaption = e.target.value;
                    setSelectedPhoto((prev) => ({ ...prev, caption: newCaption }));
                    handleCaptionChange(selectedPhoto.id, newCaption);
                  }}
                  placeholder="Agregar descripción..."
                  className="flex-1 border rounded px-3 py-2 text-white bg-white/10"
                />
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-white bg-white/20 px-4 py-2 rounded hover:bg-white/30"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}