import { NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params;

  try {
    const res = await fetch(
      `${process.env.API_URL_SERVER}/invitations/${param}/ready`,
      {
        method: "GET",
        headers: { cookie: req.headers.get("cookie") || "" },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to check readiness" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in ready route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
