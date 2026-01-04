import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const form = await req.formData();
  const token = form.get("token") as string;
  const file = form.get("file") as File;

  const buffer = Buffer.from(await file.arrayBuffer());

  // Загружаем паспорт или ID
  const upload = await supabase.storage
    .from("kyc")
    .upload(`${token}.jpg`, buffer, {
      contentType: file.type,
      upsert: true,
    });

  // Обновляем статус KYC
  await supabase
    .from("kyc_tokens")
    .update({ status: "submitted" })
    .eq("token", token);

  return NextResponse.json({ ok: true });
}
