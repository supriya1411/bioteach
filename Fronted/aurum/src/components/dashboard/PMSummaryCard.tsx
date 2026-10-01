'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Gauge } from '../ui/Gauge';
import { useAurumStore } from '@/store/useStore';

export const PMSummaryCard: React.FC = () => {
  const { pmSchedules } = useAurumStore();

  const completed = pmSchedules.filter((p) => p.status === 'completed').length;
  const overdue = pmSchedules.filter((p) => p.status === 'overdue').length;
  const total = pmSchedules.length || 1;
  const complianceRate = Math.round((completed / (completed + overdue || 1)) * 100);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-indigo-500" />
            <span>Preventive Maintenance</span>
          </div>
        }
        subtitle="Schedule execution & compliance cadence"
        action={
          <Link
            href="/maintenance"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Schedule</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardContent>
        <div className="flex items-center justify-around gap-4">
          <div className="space-y-2 text-center">
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-[10px] font-semibold text-emerald-800">Completed</p>
              <p className="text-lg font-bold text-emerald-700">{completed}</p>
            </div>
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
              <p className="text-[10px] font-semibold text-rose-800">Overdue</p>
              <p className="text-lg font-bold text-rose-700">{overdue}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Gauge
              value={complianceRate}
              size={90}
              strokeWidth={8}
              colorScheme="health"
              label="Compliance"
              sublabel="Cadence SLA"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
