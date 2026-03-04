import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { token, username } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Sanitize token: remove whitespace and non-ASCII characters
    token = token.trim().replace(/[^\x00-\x7F]/g, '');
    
    // Validate token format
    if (!/^[a-zA-Z0-9_]+$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format. Token should only contain letters, numbers, and underscores.' },
        { status: 400 }
      );
    }

    // If username not provided, fetch it first
    if (!username) {
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Copilot-Account-Manager',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        username = userData.login;
      } else {
        return NextResponse.json(
          { error: 'Failed to fetch user information' },
          { status: 401 }
        );
      }
    }

    // Fetch billing usage data from GitHub
    console.log(`[QUOTA] Fetching billing data for user: ${username}`);
    const billingResponse = await fetch(
      `https://api.github.com/users/${username}/settings/billing/premium_request/usage`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Copilot-Account-Manager',
        },
      }
    );

    console.log(`[QUOTA] Billing API response status: ${billingResponse.status}`);

    if (!billingResponse.ok) {
      const errorText = await billingResponse.text();
      console.error(`[QUOTA] GitHub Billing API error (${billingResponse.status}):`, errorText);
      
      // Return default values - no billing data available
      return NextResponse.json({
        premiumPercentRemaining: 100,
        premiumUnitsRemaining: 0,
        premiumEntitlement: 0,
        chatUnlimited: false,
        completionsUnlimited: false,
        quotaResetDateUtc: new Date().toISOString(),
        plan: 'active',
        accessTypeSku: 'copilot',
        warning: 'Billing data unavailable. Token may lack billing scope.',
        usageData: null,
      });
    }

    const usageData = await billingResponse.json();
    console.log(`[QUOTA] Billing data received:`, JSON.stringify(usageData, null, 2));

    // Extract Copilot usage information
    let totalRequests = 0;
    let totalAmount = 0;
    let copilotSku = 'copilot';

    if (usageData.usageItems && Array.isArray(usageData.usageItems)) {
      console.log(`[QUOTA] Found ${usageData.usageItems.length} usage items`);
      const copilotItems = usageData.usageItems.filter((item: any) => 
        item.product === 'Copilot' || item.sku?.includes('Copilot')
      );

      console.log(`[QUOTA] Found ${copilotItems.length} Copilot items`);
      
      copilotItems.forEach((item: any) => {
        // Use grossQuantity to see actual usage (netQuantity is 0 if discounted/free)
        totalRequests += item.grossQuantity || 0;
        totalAmount += item.grossAmount || 0;
        if (item.sku) copilotSku = item.sku;
      });
      
      console.log(`[QUOTA] Total requests: ${totalRequests}, Total amount: $${totalAmount}`);
    } else {
      console.log(`[QUOTA] No usageItems array found in response`);
    }

    // Note: GitHub doesn't provide quota limits via API
    // We're returning usage data instead
    return NextResponse.json({
      premiumPercentRemaining: 100, // Not available via API
      premiumUnitsRemaining: Math.round(totalRequests), // Round to integer
      premiumEntitlement: Math.round(totalRequests), // Round to integer
      chatUnlimited: false,
      completionsUnlimited: false,
      quotaResetDateUtc: new Date().toISOString(),
      plan: 'premium',
      accessTypeSku: copilotSku,
      usageData: {
        timePeriod: usageData.timePeriod,
        totalRequests,
        totalAmount,
        currency: 'USD',
        items: usageData.usageItems,
      },
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
