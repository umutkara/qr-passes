#!/bin/bash
echo '=== PASSGUARD KYC MODEL INSTALLER ==='

set -e

mkdir -p models/face_rec
mkdir -p models/anti_spoof

echo '--- Downloading YOLOv10 (document detector) ---'
wget -O models/yolov10n.onnx https://huggingface.co/onnx-models/yolov10/resolve/main/yolov10n.onnx

echo '--- Downloading InsightFace (buffalo_l) ---'
wget -O models/face_rec/scrfd_2.5g.onnx https://huggingface.co/InsightFace/insightface/resolve/main/models/buffalo_l/scrfd_2.5g.onnx
wget -O models/face_rec/w600k_r50.onnx https://huggingface.co/InsightFace/insightface/resolve/main/models/buffalo_l/w600k_r50.onnx
wget -O models/face_rec/1k3d68.onnx https://huggingface.co/InsightFace/insightface/resolve/main/models/buffalo_l/1k3d68.onnx
wget -O models/face_rec/2d106det.onnx https://huggingface.co/InsightFace/insightface/resolve/main/models/buffalo_l/2d106det.onnx
wget -O models/face_rec/det_10g.onnx https://huggingface.co/InsightFace/insightface/resolve/main/models/buffalo_l/det_10g.onnx
wget -O models/face_rec/genderage.onnx https://huggingface.co/InsightFace/insightface/resolve/main/models/buffalo_l/genderage.onnx

echo '--- Downloading Anti-Spoof (MiniFASNetV2_80x80) ---'
wget -O models/anti_spoof/MiniFASNetV2_80x80.onnx \
  https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/raw/master/resources/anti_spoof_models/2.7_80x80_MiniFASNetV2.onnx

echo '=== All models downloaded successfully! ==='
