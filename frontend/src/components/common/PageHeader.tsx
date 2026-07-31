import React from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  badge?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/10 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-2xl bg-emerald-900 text-amber-300 shadow-md shrink-0">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-emerald-950 tracking-tight">{title}</h1>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-800/70 font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
