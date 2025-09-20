import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { mint: string } }
) {
  const { mint } = params;

  if (!mint) {
    return NextResponse.json({ error: 'Mint address required' }, { status: 400 });
  }

  try {
    // First try Helius DAS API with API key
    const heliusApiKey = process.env.HELIUS_API_KEY;
    
    if (heliusApiKey) {
      try {
        const heliusResponse = await fetch(
          `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 'token-info',
              method: 'getAsset',
              params: {
                id: mint,
              },
            }),
          }
        );

        if (heliusResponse.ok) {
          const heliusData = await heliusResponse.json();
          
          if (heliusData.result && !heliusData.error) {
            const asset = heliusData.result;
            
            return NextResponse.json({
              name: asset.content?.metadata?.name || 'Unknown Token',
              symbol: asset.content?.metadata?.symbol || 'UNKNOWN',
              image: asset.content?.files?.[0]?.uri || asset.content?.metadata?.image,
              description: asset.content?.metadata?.description,
              verified: asset.authorities?.some((auth: any) => auth.scopes?.includes('full')) || false,
              source: 'helius',
            });
          }
        }
      } catch (heliusError) {
        console.warn('Helius API failed, falling back to Jupiter');
      }
    }

    // Fallback to Jupiter token list
    const jupiterResponse = await fetch(`https://tokens.jup.ag/token/${mint}`);
    
    if (jupiterResponse.ok) {
      const jupiterData = await jupiterResponse.json();
      
      return NextResponse.json({
        name: jupiterData.name || 'Unknown Token',
        symbol: jupiterData.symbol || 'UNKNOWN',
        image: jupiterData.logoURI,
        verified: jupiterData.tags?.includes('verified') || false,
        source: 'jupiter',
      });
    }

    // If neither works, try Solana token registry
    const registryResponse = await fetch(
      'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json'
    );

    if (registryResponse.ok) {
      const registryData = await registryResponse.json();
      const token = registryData.tokens.find((t: any) => t.address === mint);
      
      if (token) {
        return NextResponse.json({
          name: token.name || 'Unknown Token',
          symbol: token.symbol || 'UNKNOWN',
          image: token.logoURI,
          verified: true, // Tokens in Solana registry are considered verified
          source: 'solana-registry',
        });
      }
    }

    // If no metadata found, return basic info
    return NextResponse.json({
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      verified: false,
      source: 'unknown',
    });

  } catch (error) {
    console.error('Error fetching token info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token information' },
      { status: 500 }
    );
  }
}