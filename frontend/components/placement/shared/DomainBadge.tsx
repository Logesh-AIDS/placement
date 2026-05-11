import { Badge } from '@/components/ui/badge';

type Domain = 'Web' | 'DSA' | 'ML' | 'Cloud';

interface DomainBadgeProps {
  domain: Domain;
  className?: string;
}

const domainConfig = {
  Web: {
    label: 'Web Development',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  DSA: {
    label: 'Data Structures & Algorithms',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  },
  ML: {
    label: 'Machine Learning',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  Cloud: {
    label: 'Cloud Computing',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  },
};

export function DomainBadge({ domain, className }: DomainBadgeProps) {
  const config = domainConfig[domain];
  return (
    <Badge variant="outline" className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}
