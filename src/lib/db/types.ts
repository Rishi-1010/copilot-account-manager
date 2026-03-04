export interface UsageItem {
  product: string;
  sku: string;
  model: string;
  unitType: string;
  pricePerUnit: number;
  grossQuantity: number;
  grossAmount: number;
  discountQuantity: number;
  discountAmount: number;
  netQuantity: number;
  netAmount: number;
}

export interface UsageData {
  timePeriod: {
    year: number;
    month?: number;
  };
  totalRequests: number;
  totalAmount: number;
  currency: string;
  items: UsageItem[];
}

export interface CopilotAccount {
  id: number;
  login: string;
  avatarUrl: string;
  plan: string;
  accessTypeSku: string;
  premiumPercentRemaining: number;
  premiumUnitsRemaining: number;
  premiumEntitlement: number;
  chatUnlimited: boolean;
  completionsUnlimited: boolean;
  quotaResetDateUtc: string;
  lastSnapshotUtc: string;
  tokenEncrypted: string;
  createdAt: Date;
  updatedAt: Date;
  usageData?: UsageData | null;
}

export interface CreateAccountInput {
  login: string;
  avatarUrl: string;
  plan: string;
  accessTypeSku: string;
  tokenEncrypted: string;
}

export interface UpdateAccountInput {
  id: number;
  premiumPercentRemaining: number;
  premiumUnitsRemaining: number;
  premiumEntitlement: number;
  chatUnlimited: boolean;
  completionsUnlimited: boolean;
  quotaResetDateUtc: string;
  lastSnapshotUtc: string;
  tokenEncrypted?: string; // Optional: only update if provided
  usageData?: UsageData | null; // Optional: usage data from GitHub API
}
