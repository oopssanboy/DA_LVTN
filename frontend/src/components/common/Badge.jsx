
export default function Badge({ variant = 'default', children }) {
  const variants = {
    success: 'bg-green-100 text-green-700 border border-green-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}