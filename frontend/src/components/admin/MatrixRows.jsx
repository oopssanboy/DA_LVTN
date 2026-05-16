import React from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const difficultyOptions = [
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
];

export default function MatrixRows({ matrices, setMatrices }) {
  const addRow = () => {
    setMatrices([...matrices, { topic: '', difficulty: 'easy', quantity: 1 }]);
  };

  const removeRow = (index) => {
    const newMatrices = matrices.filter((_, i) => i !== index);
    setMatrices(newMatrices);
  };

  const updateRow = (index, field, value) => {
    const newMatrices = [...matrices];
    newMatrices[index][field] = value;
    setMatrices(newMatrices);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">Ma trận đề thi</label>
        <button type="button" onClick={addRow} className="text-orange-600 text-sm flex items-center gap-1">
          <PlusIcon className="h-4 w-4" /> Thêm dòng
        </button>
      </div>
      {matrices.map((row, idx) => (
        <div key={idx} className="flex gap-3 items-end border p-3 rounded-lg bg-gray-50">
          <div className="flex-1">
            <label className="block text-xs text-gray-500">Chủ đề</label>
            <input
              type="text"
              value={row.topic}
              onChange={(e) => updateRow(idx, 'topic', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-xs text-gray-500">Độ khó</label>
            <select
              value={row.difficulty}
              onChange={(e) => updateRow(idx, 'difficulty', e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              {difficultyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500">Số câu</label>
            <input
              type="number"
              min="1"
              value={row.quantity}
              onChange={(e) => updateRow(idx, 'quantity', parseInt(e.target.value) || 1)}
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <button type="button" onClick={() => removeRow(idx)} className="text-red-500 p-1 mt-5">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
      {matrices.length === 0 && <p className="text-sm text-gray-400">Chưa có dòng ma trận nào.</p>}
    </div>
  );
}