/**
 * Quota configuration for calculating usage percentages
 * Since GitHub doesn't provide quota limits via API, we use assumed monthly limits
 */

export const QUOTA_CONFIG = {
  // GitHub Copilot Premium monthly request limit
  MONTHLY_REQUEST_LIMIT: 300,
  
  // Assumed monthly budget limit in USD (Premium costs vary, $40-50/month typical)
  MONTHLY_BUDGET_LIMIT: 50,
  
  // Color thresholds
  THRESHOLDS: {
    CRITICAL: 90, // 90%+ is critical (red)
    WARNING: 70,  // 70%+ is warning (yellow)
    HEALTHY: 50,  // 50%+ is watch (orange)
    // Below 50% is healthy (green)
  },
} as const;

export function calculateUsagePercentage(
  used: number,
  limit: number
): number {
  if (limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
}

export function getUsageStatus(percentage: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (percentage >= QUOTA_CONFIG.THRESHOLDS.CRITICAL) {
    return {
      label: 'Critical',
      color: 'text-red-500',
      bgColor: '[&>div]:bg-red-500',
    };
  }
  if (percentage >= QUOTA_CONFIG.THRESHOLDS.WARNING) {
    return {
      label: 'Warning',
      color: 'text-yellow-500',
      bgColor: '[&>div]:bg-yellow-500',
    };
  }
  if (percentage >= QUOTA_CONFIG.THRESHOLDS.HEALTHY) {
    return {
      label: 'Watch',
      color: 'text-orange-500',
      bgColor: '[&>div]:bg-orange-500',
    };
  }
  return {
    label: 'Healthy',
    color: 'text-green-500',
    bgColor: '[&>div]:bg-green-500',
  };
}
