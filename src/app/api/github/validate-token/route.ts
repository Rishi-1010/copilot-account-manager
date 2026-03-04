import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Sanitize token: remove whitespace and non-ASCII characters
    token = token.trim().replace(/[^\x00-\x7F]/g, '');
    
    // Validate token format (GitHub tokens are alphanumeric with underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(token)) {
      return NextResponse.json(
        { error: 'Invalid token format. Token should only contain letters, numbers, and underscores.' },
        { status: 400 }
      );
    }

    // Fetch user data from GitHub API
    console.log(`[VALIDATE] Fetching user data...`);
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Copilot-Account-Manager',
      },
    });

    console.log(`[VALIDATE] User API response status: ${userResponse.status}`);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('GitHub user API error:', errorText);
      return NextResponse.json(
        { error: 'Invalid GitHub token or insufficient permissions' },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();
    console.log(`[VALIDATE] User data received: ${userData.login}`);

    // Fetch Copilot usage data from GitHub Billing API
    // Note: This returns historical usage, not real-time quota
    const billingEndpoint = `https://api.github.com/users/${userData.login}/settings/billing/premium_request/usage`;
    
    let plan = 'active';
    let accessTypeSku = 'copilot_individual';
    let usageData = null;
    
    try {
      const billingResponse = await fetch(billingEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Copilot-Account-Manager',
        },
      });

      if (billingResponse.ok) {
        usageData = await billingResponse.json();
        console.log(`[VALIDATE] Successfully fetched billing usage for ${userData.login}:`, JSON.stringify(usageData, null, 2));
        
        // Extract Copilot usage if available
        if (usageData.usageItems) {
          const copilotItem = usageData.usageItems.find((item: any) => 
            item.product === 'Copilot' || item.sku?.includes('Copilot')
          );
          if (copilotItem) {
            plan = 'premium';
            accessTypeSku = copilotItem.sku || 'copilot_premium';
          }
        }
      } else {
        const errorText = await billingResponse.text();
        console.error(`[VALIDATE] Could not fetch billing data (${billingResponse.status}):`, errorText);
        console.error(`[VALIDATE] Token may lack billing scope or user may not have direct billing access.`);
      }
    } catch (err) {
      console.warn('Error fetching billing data:', err);
    }

    // Return the formatted data
    console.log(`[VALIDATE] Returning validation response for ${userData.login}`);
    return NextResponse.json({
      login: userData.login,
      avatarUrl: userData.avatar_url || '',
      plan,
      accessTypeSku,
      usageData,
    });
  } catch (error) {
    console.error('Error validating GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to validate GitHub token' },
      { status: 500 }
    );
  }
}
