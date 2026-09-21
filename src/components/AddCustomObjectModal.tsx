import { useState } from 'react';
import { X } from 'lucide-react';
import { CustomObjectType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AddCustomObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (obj: CustomObjectType) => void;
}

export default function AddCustomObjectModal({ isOpen, onClose, onAdd }: AddCustomObjectModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Оборудование');
  const [width, setWidth] = useState(1.0);
  const [height, setHeight] = useState(1.0);
  const [color, setColor] = useState('#6366F1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Введите название объекта');
      return;
    }

    const newObject: CustomObjectType = {
      id: uuidv4(),
      name: name.trim(),
      icon: '🔷',
      defaultWidth: width,
      defaultHeight: height,
      defaultColor: color,
      category: category.trim() || 'Оборудование',
    };

    onAdd(newObject);
    onClose();
    
    // Reset form
    setName('');
    setCategory('Оборудование');
    setWidth(1.0);
    setHeight(1.0);
    setColor('#6366F1');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] rounded-2xl p-8 w-[500px] shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            Добавить объект в библиотеку
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Название объекта *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Стойка регистрации"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'Inter, sans-serif' }}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Категория
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Оборудование"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Ширина (м)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value) || 1.0)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Высота (м)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={height}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 1.0)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Цвет
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border border-slate-700"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Предварительный просмотр
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: color + '30', border: `2px solid ${color}` }}
              >
                🔷
              </div>
              <div>
                <div className="text-white font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {name || 'Название объекта'}
                </div>
                <div className="text-slate-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {width}м × {height}м • {category || 'Оборудование'}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-md text-white text-sm font-medium transition-all hover:opacity-90"
              style={{
                background: 'radial-gradient(ellipse 82.43% 77.80% at 50.00% 50.00%, #0052CC 25%, white 100%)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
