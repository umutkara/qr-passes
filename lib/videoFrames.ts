import ffmpeg from "fluent-ffmpeg";

export async function extractJpgFramesFromVideoUrl(params: {
  videoUrl: string;
  outDir: string;          // например ".tmp-frames"
  fileBase: string;        // например `frame_${sessionId}`
  frameCount?: number;     // 3 по умолчанию
}) {
  const { videoUrl, outDir, fileBase, frameCount = 3 } = params;

  // Будем резать 3 кадра: примерно 0.5s, 1.5s, 2.5s
  const timestamps = Array.from({ length: frameCount }, (_, i) => 0.5 + i * 1.0);

  return new Promise<string[]>((resolve, reject) => {
    const outputs: string[] = [];

    // Берём кадры по timestamp'ам.
    // ffmpeg сам скачает видео по URL.
    ffmpeg(videoUrl)
      .on("error", (err) => reject(err))
      .on("end", () => resolve(outputs))
      .screenshots({
        timestamps,
        filename: `${fileBase}_%i.jpg`,
        folder: outDir,
        size: "720x?", // чтобы не было огромных файлов
      });

    // fluent-ffmpeg не даёт просто так список файлов,
    // поэтому генерим ожидаемые имена сами:
    for (let i = 1; i <= frameCount; i++) {
      outputs.push(`${outDir}/${fileBase}_${i}.jpg`);
    }
  });
}

