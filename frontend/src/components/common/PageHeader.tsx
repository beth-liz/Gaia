import React from "react";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  badge?: string;
  theme?: "default" | "light";
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  theme = "default",
}) => {
  const isLight = theme === "light";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b mb-6 ${
        isLight ? "border-white/20" : "border-emerald-950/10"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={`p-2.5 rounded-2xl shadow-md shrink-0 border ${
              isLight
                ? "bg-emerald-950/80 border-emerald-500/30 text-amber-300"
                : "bg-emerald-900 border-transparent text-amber-300"
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1
              className={`text-xl font-extrabold tracking-tight ${
                isLight ? "text-white drop-shadow-sm" : "text-emerald-950"
              }`}
            >
              {title}
            </h1>
            {badge && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isLight
                    ? "bg-white/20 text-white border border-white/30 backdrop-blur-sm"
                    : "bg-emerald-100 text-emerald-900"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            className={`text-xs font-medium mt-0.5 ${
              isLight ? "text-emerald-100/90 drop-shadow-xs" : "text-emerald-800/70"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};
