"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function KycPage() {
  const { token } = useParams();
  const [file, setFile] = useState<File | null>(null);

  const send = async () => {
    const body = new FormData();
    body.append("file", file!);
    body.append("token", token as string);

    await fetch("/api/kyc/submit", {
      method: "POST",
      body,
    });

    alert("Submitted");
  };

  return (
    <div>
      <h1>KYC Verification</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={send}>Submit</button>
    </div>
  );
}
