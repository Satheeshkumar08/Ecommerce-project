'use client';

import React, { useState } from 'react';

interface ImageGalleryProps {
  images: Array<{ id?: string; url: string; alt?: string; isPrimary?: boolean }>;
  productName: string;
}

export default function ImageGallery({ images = [], productName }: ImageGalleryProps) {
  const defaultImage =
    images.length > 0
      ? images.find((i) => i.isPrimary)?.url || images[0].url
      : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  const [activeImage, setActiveImage] = useState<string>(defaultImage);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnail Selector */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[500px] flex-shrink-0">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setActiveImage(img.url)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition ${
                activeImage === img.url
                  ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <img
                src={img.url}
                alt={img.alt || `${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Display Image */}
      <div className="flex-1 aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-inner">
        <img
          src={activeImage}
          alt={productName}
          className="w-full h-full object-cover object-center transition-all duration-300"
        />
      </div>
    </div>
  );
}
