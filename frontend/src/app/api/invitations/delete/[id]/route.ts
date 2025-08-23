import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/delete/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return NextResponse.json({ error: data?.detail || "Failed to delete invitation" }, { status: res.status });
    }

    return NextResponse.json({}, { status: 204 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
