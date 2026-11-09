import { useState, useRef } from 'react';
import { Upload, FileJson, FileImage, FileText, X } from 'lucide-react';
import { PlanData } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (plan: PlanData) => void;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'json' | 'svg' | 'image'>('json');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    
    // Определяем тип по расширению
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'json') {
      setImportType('json');
    } else if (ext === 'svg') {
      setImportType('svg');
    } else if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
      setImportType('image');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      let plan: PlanData;

      if (importType === 'json') {
        plan = await importJSON(selectedFile);
      } else if (importType === 'svg') {
        plan = await importSVG(selectedFile);
      } else {
        plan = await importImage(selectedFile);
      }

      onImport(plan);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('Ошибка при импорте файла. Проверьте формат и содержимое файла.');
    }
  };

  const importJSON = async (file: File): Promise<PlanData> => {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Валидация структуры
    if (!data.room || !data.zones || !data.objects) {
      throw new Error('Invalid JSON structure');
    }

    return {
      id: uuidv4(),
      name: data.name || 'Импортированный план',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: data.room,
      zones: data.zones,
      objects: data.objects,
    };
  };

  const importSVG = async (file: File): Promise<PlanData> => {
    const text = await file.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(text, 'image/svg+xml');
    const svg = svgDoc.querySelector('svg');

    if (!svg) {
      throw new Error('Invalid SVG file');
    }

    // Получаем размеры из viewBox или width/height
    const viewBox = svg.getAttribute('viewBox');
    let width = 10, height = 10;

    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
      width = vbWidth / 50; // Конвертируем пиксели в метры
      height = vbHeight / 50;
    } else {
      const w = parseFloat(svg.getAttribute('width') || '500');
      const h = parseFloat(svg.getAttribute('height') || '500');
      width = w / 50;
      height = h / 50;
    }

    // Создаём базовый план с одной зоной
    return {
      id: uuidv4(),
      name: file.name.replace('.svg', ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: {
        id: uuidv4(),
        name: 'Помещение',
        width,
        height,
        walls: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
      },
      zones: [
        {
          id: uuidv4(),
          name: 'Основная зона',
          type: 'service',
          points: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height },
          ],
          color: '#3B82F6',
        },
      ],
      objects: [],
    };
  };

  const importImage = async (file: File): Promise<PlanData> => {
    // Для изображений создаём план с фоновым изображением
    // В реальной реализации здесь была бы трассировка
    return {
      id: uuidv4(),
      name: file.name.replace(/\.(png|jpg|jpeg)$/i, ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: {
        id: uuidv4(),
        name: 'Помещение',
        width: 10,
        height: 10,
        walls: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
      },
      zones: [
        {
          id: uuidv4(),
          name: 'Основная зона',
          type: 'service',
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          color: '#3B82F6',
        },
      ],
      objects: [],
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] rounded-2xl p-8 w-[600px] shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            Импорт схемы
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
          }`}
        >
          <Upload size={48} className="mx-auto mb-4 text-slate-400" />
          <p className="text-white text-sm font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Перетащите файл сюда или нажмите для выбора
          </p>
          <p className="text-slate-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            Поддерживаемые форматы: JSON, SVG, PNG, JPG
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.svg,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Selected file info */}
        {selectedFile && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              {importType === 'json' && <FileJson size={24} className="text-blue-400" />}
              {importType === 'svg' && <FileText size={24} className="text-green-400" />}
              {importType === 'image' && <FileImage size={24} className="text-purple-400" />}
              <div className="flex-1">
                <div className="text-white text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedFile.name}
                </div>
                <div className="text-slate-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Format info */}
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              {importType === 'json' && '✓ JSON файл будет импортирован с полной структурой (помещение, зоны, объекты)'}
              {importType === 'svg' && '✓ SVG файл будет преобразован в план. Зоны и объекты можно добавить вручную'}
              {importType === 'image' && '✓ Изображение будет использовано как основа. Зоны и объекты можно добавить вручную'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Отмена
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile}
            className="flex-1 px-4 py-2.5 rounded-md text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: selectedFile
                ? 'radial-gradient(ellipse 82.43% 77.80% at 50.00% 50.00%, #0052CC 25%, white 100%)'
                : '#333',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Импортировать
          </button>
        </div>
      </div>
    </div>
  );
}
