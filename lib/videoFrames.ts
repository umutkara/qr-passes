import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function extractJpgFramesFromVideoUrl(params: {
  videoUrl: string;
  outDir: string;          // например ".tmp-frames"
  fileBase: string;        // например `frame_${sessionId}`
  frameCount?: number;     // 3 по умолчанию
}) {
  const { videoUrl, outDir, fileBase, frameCount = 3 } = params;

  // Будем резать 3 кадра: примерно 0.5s, 1.5s, 2.5s
  const timestamps = Array.from({ length: frameCount }, (_, i) => 0.5 + i * 1.0);
  const outputs: string[] = [];

  try {
    // Создаём FFmpeg команду для извлечения кадров
    // Используем filter_complex для одновременного извлечения нескольких кадров
    const selectFilters = timestamps.map((timestamp, index) =>
      `[0:v]select=eq(n\\,0),setpts=PTS-STARTPTS[frame${index}]`
    ).join('; ');

    const outputMappings = timestamps.map((_, index) =>
      `-map [frame${index}] "${path.join(outDir, `${fileBase}_${index + 1}.jpg`)}"`
    ).join(' ');

    // Более простая версия: извлекаем кадры последовательно
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const outputFile = path.join(outDir, `${fileBase}_${i + 1}.jpg`);

      // FFmpeg команда для извлечения одного кадра в заданное время
      const command = `ffmpeg -y -ss ${timestamp} -i "${videoUrl}" -vf "scale=720:-1" -frames:v 1 "${outputFile}"`;

      await execAsync(command);
      outputs.push(outputFile);
    }

    return outputs;
  } catch (error) {
    throw new Error(`FFmpeg frame extraction failed: ${error}`);
  }
}

