import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { invitationId, payload } = await req.json();

    if (!invitationId) {
      return NextResponse.json({ error: "Missing invitation ID" }, { status: 400 });
    }

    if (!payload) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/update/${invitationId}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to update invitation" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    let message = "Invalid request body";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
