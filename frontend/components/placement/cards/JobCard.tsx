import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DomainBadge } from '@/components/placement/shared/DomainBadge';

export type Domain = 'Web' | 'DSA' | 'ML' | 'Cloud';

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  domain: Domain;
  minScore: number;
  maxPositions: number;
  applicants?: number;
  onApply?: (jobId: string) => void;
  applied?: boolean;
}

export function JobCard({
  id,
  title,
  company,
  domain,
  minScore,
  maxPositions,
  applicants = 0,
  onApply,
  applied = false,
}: JobCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{company}</p>
          </div>
          <DomainBadge domain={domain} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Min Score</p>
            <p className="font-semibold text-foreground">{minScore}+</p>
          </div>
          <div>
            <p className="text-muted-foreground">Positions</p>
            <p className="font-semibold text-foreground">{maxPositions}</p>
          </div>
        </div>
        {applicants > 0 && (
          <p className="text-xs text-muted-foreground">
            {applicants} applicants
          </p>
        )}
        <Button
          onClick={() => onApply?.(id)}
          disabled={applied}
          className="w-full"
          variant={applied ? 'outline' : 'default'}
        >
          {applied ? 'Applied' : 'Apply Now'}
        </Button>
      </CardContent>
    </Card>
  );
}
