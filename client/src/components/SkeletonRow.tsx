export function SkeletonRow() {
  return (
    <tr className="border-b border-paper-border animate-pulse">
      <td className="px-4 py-3">
        <div className="w-4 h-4 bg-paper-border rounded-sm" />
      </td>
      <td className="px-4 py-3">
        <div className="w-24 h-4 bg-paper-border rounded-sm" />
      </td>
      <td className="px-4 py-3">
        <div className="w-32 h-4 bg-paper-border rounded-sm mb-1" />
        <div className="w-40 h-3 bg-paper-border rounded-sm" />
      </td>
      <td className="px-4 py-3">
        <div className="w-12 h-4 bg-paper-border rounded-sm" />
      </td>
      <td className="px-4 py-3">
        <div className="w-20 h-4 bg-paper-border rounded-sm" />
      </td>
      <td className="px-4 py-3">
        <div className="w-16 h-4 bg-paper-border rounded-sm" />
      </td>
    </tr>
  );
}