import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl animate-fadeIn">
        <div className="flex items-center gap-3 text-amber-600 mb-4"><AlertTriangle size={24} /><h3 className="text-lg font-bold">{title}</h3></div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
        </div>
      </div>
    </div>
  );
}