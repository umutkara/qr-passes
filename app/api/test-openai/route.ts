import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {
  console.log("🧪 Testing OpenAI API...");

  console.log("🔑 OPENAI KEY EXISTS =", !!process.env.OPENAI_API_KEY);
  console.log("🔑 OPENAI KEY VALUE (first 10 chars):", process.env.OPENAI_API_KEY?.slice(0, 10));

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: "OPENAI_API_KEY is missing",
      key_exists: false
    }, { status: 500 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say OK" }],
    });

    const response = completion.choices[0].message.content;

    console.log("✅ OpenAI test successful:", response);

    return NextResponse.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ OpenAI test failed:", error);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


