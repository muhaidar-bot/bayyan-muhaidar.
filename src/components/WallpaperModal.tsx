/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon } from 'lucide-react';
import { saveWallpaperPreference } from '../lib/chat';
import { UserPreferences } from '../lib/supabase';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrefs: UserPreferences;
  onSelectWallpaper: (prefs: UserPreferences) => void;
}

export const PRESET_WALLPAPERS = [
  {
    id: 'dark-plum-celestial',
    name: 'Celestial Dark Plum',
    description: 'Starry stardust and velvet bokeh',
    url: '/src/assets/images/wallpaper_dark_plum_1793031400874.jpg',
    thumbnail: '/src/assets/images/wallpaper_dark_plum_1793031400874.jpg',
  },
  {
    id: 'rose-velvet-glow',
    name: 'Romantic Rose Glow',
    description: 'Petals, warm candles & bokeh twilight',
    url: '/src/assets/images/wallpaper_rose_glow_1793031400031.jpg',
    thumbnail: '/src/assets/images/wallpaper_rose_glow_1793031400031.jpg',
  },
  {
    id: 'deep-wine-gradient',
    name: 'Midnight Wine Velvet',
    description: 'Minimalist deep wine and dark plum radial',
    url: 'linear-gradient(180deg, #1f061f 0%, #300c28 50%, #15031b 100%)',
    thumbnail: '',
  },
  {
    id: 'twilight-burgundy',
    name: 'Twilight Burgundy',
    description: 'Deep romantic dusk glow',
    url: 'linear-gradient(180deg, #2c0b24 0%, #160419 100%)',
    thumbnail: '',
  },
];

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  currentPrefs,
  onSelectWallpaper,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPref: UserPreferences = {
        ...currentPrefs,
        wallpaper_url: dataUrl,
        wallpaper_type: 'custom',
        updated_at: new Date().toISOString(),
      };
      saveWallpaperPreference(newPref);
      onSelectWallpaper(newPref);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string, type: 'preset' | 'gradient') => {
    const newPref: UserPreferences = {
      ...currentPrefs,
      wallpaper_url: url,
      wallpaper_type: type,
      updated_at: new Date().toISOString(),
    };
    saveWallpaperPreference(newPref);
    onSelectWallpaper(newPref);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1d0822] border border-rose-950/60 rounded-3xl p-6 shadow-2xl text-rose-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-950/50">
          <div>
            <h2 className="text-xl font-serif font-bold text-rose-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-400" />
              Chat Wallpaper
            </h2>
            <p className="text-xs text-rose-300/70 mt-0.5">
              Personalize your romantic conversation backdrop
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-full flex items-center justify-center text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="mt-5 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Custom Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCustomUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl border border-dashed border-rose-600/50 hover:border-rose-400 bg-rose-950/30 hover:bg-rose-900/40 text-rose-200 hover:text-rose-100 font-medium text-sm transition-colors"
            >
              <Upload className="w-4 h-4 text-rose-400" />
              Choose photo from device gallery
            </button>
          </div>

          {/* Preset list */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {PRESET_WALLPAPERS.map((preset) => {
              const isSelected = currentPrefs.wallpaper_url === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() =>
                    handleSelectPreset(
                      preset.url,
                      preset.thumbnail ? 'preset' : 'gradient'
                    )
                  }
                  className={`group relative flex flex-col items-start p-2 rounded-2xl border transition-all text-left overflow-hidden ${
                    isSelected
                      ? 'border-rose-400 ring-2 ring-rose-500/40 bg-rose-950/60'
                      : 'border-rose-950/60 hover:border-rose-800 bg-rose-950/20'
                  }`}
                >
                  <div className="relative w-full aspect-[9/14] rounded-xl overflow-hidden mb-2">
                    {preset.thumbnail ? (
                      <img
                        src={preset.thumbnail}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: preset.url }}
                      />
                    )}

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-rose-100 line-clamp-1">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-rose-300/60 line-clamp-1 mt-0.5">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-rose-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-medium text-xs shadow-lg shadow-rose-950/50 transition-all"
          >
            Apply &amp; Done
          </button>
        </div>
      </div>
    </div>
  );
};
