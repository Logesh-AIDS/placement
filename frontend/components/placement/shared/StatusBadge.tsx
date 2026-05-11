import { Badge } from '@/components/ui/badge';

type Status = 'qualified' | 'partial' | 'rejected' | 'pending';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  qualified: {
    label: 'Qualified',
    className: 'bg-qualified text-qualified-foreground hover:bg-qualified/90',
  },
  partial: {
    label: 'Partial',
    className: 'bg-partial text-partial-foreground hover:bg-partial/90',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
