import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function HEAD() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("utilisateur").select("id_utilisateur").limit(1);

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

export async function GET() {
  return HEAD();
}