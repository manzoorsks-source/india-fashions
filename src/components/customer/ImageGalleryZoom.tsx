import React, { useState } from 'react';
import { ProductMedia } from '../../../shared/types.js';
import { ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryZoomProps {
  media: ProductMedia[];
  productName: string;
}

export const ImageGalleryZoom: React.FC<ImageGalleryZoomProps> = ({ media, productName }) => {
  const sortedMedia = [...(media || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const currentPhoto = sortedMedia[selectedIndex] || {
    file_path: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    alt_text: productName
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Main Image Stage */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '125%', // 4:5 luxury portrait ratio
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: '#EDE6DA',
          border: '1px solid var(--color-border-subtle)',
          cursor: isZoomed ? 'zoom-out' : 'zoom-in'
        }}
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={currentPhoto.file_path}
          alt={currentPhoto.alt_text || productName}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
            transition: isZoomed ? 'none' : 'transform 0.3s ease'
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: 'rgba(15, 95, 86, 0.85)',
            color: '#FAF7F2',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none'
          }}
        >
          <ZoomIn size={13} color="var(--color-gold)" />
          <span>Hover / Tap to Zoom Weave</span>
        </div>
      </div>

      {/* Thumbnails row */}
      {sortedMedia.length > 1 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {sortedMedia.map((m, idx) => (
            <button
              key={m.id || idx}
              onClick={() => setSelectedIndex(idx)}
              style={{
                width: '70px',
                height: '88px',
                borderRadius: '6px',
                overflow: 'hidden',
                flexShrink: 0,
                border: selectedIndex === idx ? '2px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
                opacity: selectedIndex === idx ? 1 : 0.65,
                transition: 'all 0.2s',
                padding: 0
              }}
            >
              <img
                src={m.file_path}
                alt={m.alt_text || `Thumbnail ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
