import { NextRequest, NextResponse } from "next/server";

export const GET = async () => {
  try {
    const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/`);

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: res.status });
    }

    const posts = await res.json();

    return NextResponse.json(posts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
};
