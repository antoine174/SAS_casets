const VARIANTS = {
  green:  'bg-emerald-100 text-emerald-800 border border-emerald-300',
  blue:   'bg-blue-100 text-blue-800 border border-blue-300',
  red:    'bg-red-100 text-red-800 border border-red-300',
  amber:  'bg-amber-100 text-amber-800 border border-amber-300',
  slate:  'bg-slate-100 text-slate-700 border border-slate-300',
};

export default function Badge({ variant = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-none ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
