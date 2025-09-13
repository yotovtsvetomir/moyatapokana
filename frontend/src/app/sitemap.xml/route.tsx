import { NextResponse } from 'next/server';

export async function GET() {
  const response = await fetch(`${process.env.API_URL_SERVER}/sitemap.xml`);
  const xml = await response.text();

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
