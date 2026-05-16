// src/components/common/ConfirmDialog.jsx
import { FaQuestionCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

export default function ConfirmDialog({ show, type = 'confirm', title, message, onConfirm, onCancel }) {
  if (!show) return null;

  const iconMap = {
    confirm: <FaQuestionCircle className="text-5xl text-primary" />,
    error: <FaTimesCircle className="text-5xl text-danger" />,
    info: <FaInfoCircle className="text-5xl text-blue-600" />,
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md p-8 rounded-xl shadow-2xl text-center">
        <div className="mb-4">{iconMap[type] || iconMap.confirm}</div>
        <h3 className="text-xl font-bold text-text-primary mb-2">{title || 'Xác nhận'}</h3>
        <p className="text-text-secondary mb-6">{message}</p>
        <div className="flex gap-4">
          {onCancel && (
            <button onClick={onCancel} className="flex-1 py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition">
              Hủy
            </button>
          )}
          <button onClick={onConfirm} className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition">
            {type === 'error' ? 'Đã hiểu' : 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  );
}