import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { storefront_id, ...updatedFields } = await req.json();

    if (!storefront_id) {
      return NextResponse.json(
        { error: "storefront_id is required" },
        { status: 400 }
      );
    }

    console.log("Updating storefront:", { storefront_id, ...updatedFields });

    const { error } = await supabase
      .from("storefront")
      .update(updatedFields)
      .eq("id", storefront_id);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Internal server error:", error); // ✅ Now logging the error properly
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, POST",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
