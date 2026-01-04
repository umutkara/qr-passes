import axios from "axios";

export interface KycVerifyParams {
  sessionId: number;
  documentUrl: string;
  selfieUrl?: string | null;
  videoUrl?: string | null;
  country: string;
  documentType: string;
}

export interface KycVerifyResponse {
  sessionId: number;
  status: "approved" | "rejected" | "manual_review";
  checks: {
    face_match: {
      ok: boolean;
      score?: number;
      reason?: string | null;
    };
    liveness: {
      ok: boolean;
      score?: number;
      reason?: string | null;
    };
    document_quality: {
      ok: boolean;
      score?: number;
      reason?: string | null;
    };
    document_expired: {
      ok: boolean;
      score?: number;
      reason?: string | null;
    };
  };
  fields: {
    first_name?: string | null;
    last_name?: string | null;
    document_number?: string | null;
    birthday?: string | null;
    expiry_date?: string | null;
    raw_text?: string | null;
  };
  mode: string;
}

// --------------------------------------------
// MAIN FUNCTION: вызов ML сервиса
// --------------------------------------------
export async function callKycVerify(
  params: KycVerifyParams
): Promise<KycVerifyResponse> {
  const ML_URL = process.env.ML_SERVICE_URL;

  if (!ML_URL) {
    throw new Error("❌ ML_SERVICE_URL is not set in .env.bot");
  }

  // Строим payload (убираем пустые поля)
  const payload: any = {
    sessionId: params.sessionId,
    documentUrl: params.documentUrl,
    country: params.country,
    documentType: params.documentType,
  };

  if (params.videoUrl) payload.videoUrl = params.videoUrl;
  if (!params.videoUrl && params.selfieUrl)
    payload.selfieUrl = params.selfieUrl;

  // -------------------------------
  // Лог отправки
  // -------------------------------
  console.log("📤 Отправка запроса в ML-сервис:", {
    url: `${ML_URL}/verify`,
    data: payload,
  });

  try {
    const response = await axios.post(`${ML_URL}/verify`, payload, {
      timeout: 20000, // 20 sec
    });

    console.log("📥 ML ответ:", response.data);

    return response.data as KycVerifyResponse;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    console.error("❌ ML KYC error:", {
      status,
      statusText: err?.response?.statusText,
      data,
      requestData: JSON.stringify(payload),
    });

    throw new Error(
      `KYC ML service error: ${status} - ${JSON.stringify(data)}`
    );
  }
}
