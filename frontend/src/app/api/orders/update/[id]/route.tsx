import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    const body = await req.text();

    const res = await fetch(
      `${process.env.API_URL_SERVER}/orders/update/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
        body,
      }
    );

    if (!res.ok) {
      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = null;
      }

      return NextResponse.json(
        {
          error:
            typeof errorData === "object" &&
            errorData !== null &&
            "detail" in errorData
              ? (errorData as { detail: string }).detail
              : "Failed to update order",
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
