
export default function DataTable({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-text-secondary uppercase text-xs font-semibold">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left">{col.label}</th>
            ))}
            {actions && <th className="px-4 py-3 text-center">Thao tác</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-gray-50 transition">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-text-primary">{row[col.key]}</td>
              ))}
              {actions && <td className="px-4 py-3 text-center">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}