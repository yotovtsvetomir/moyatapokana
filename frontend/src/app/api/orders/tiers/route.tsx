import { NextResponse } from 'next/server';

export const GET = async (req: Request) => {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const url = new URL(req.url);
    const currency = url.searchParams.get('currency');

    const backendUrl = new URL(`${process.env.API_URL_SERVER}/orders/tiers/pricing`);
    if (currency) {
      backendUrl.searchParams.append('currency', currency);
    }

    const res = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching price tiers:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
