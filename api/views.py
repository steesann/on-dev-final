import io
import json
from pathlib import Path

import numpy as np
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from sklearn.metrics import accuracy_score, log_loss

from services.ml_inference import run_inference


class UploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response({"detail": "Файл не передан"}, status=400)

        if not uploaded_file.name.endswith(".npz"):
            return Response({"detail": "Нужен .npz файл"}, status=400)

        try:
            npz_data = np.load(io.BytesIO(uploaded_file.read()), allow_pickle=True)
        except Exception:
            return Response({"detail": "Не удалось прочитать .npz"}, status=400)

        if "test_x" not in npz_data or "test_y" not in npz_data:
            return Response(
                {"detail": "В файле должны быть test_x и test_y"},
                status=400,
            )

        test_x = npz_data["test_x"]
        test_y = npz_data["test_y"]

        if len(test_x) != len(test_y):
            return Response(
                {"detail": "Длины test_x и test_y должны совпадать"},
                status=400,
            )

        if len(test_x) == 0:
            return Response({"detail": "Пустой тестовый набор"}, status=400)

        try:
            preds = run_inference(test_x)
        except Exception as e:
            return Response(
                {"detail": f"Ошибка инференса модели: {str(e)}"},
                status=500,
            )

        try:
            pred_labels = np.argmax(preds, axis=1)
            accuracy = float(accuracy_score(test_y, pred_labels))
            loss = float(log_loss(test_y, preds))
            per_sample = (pred_labels == test_y).astype(int).tolist()
        except Exception as e:
            return Response(
                {"detail": f"Ошибка расчёта метрик: {str(e)}"},
                status=500,
            )

        base_dir = Path(__file__).resolve().parents[1]
        artifacts_dir = base_dir / "artifacts"

        history = self._load_json(artifacts_dir / "history.json", default={
            "epochs": [],
            "val_accuracy": [],
            "train_loss": [],
            "val_loss": [],
        })

        class_counts_train = self._load_json(
            artifacts_dir / "class_counts_train.json",
            default=[],
        )

        class_counts_valid = self._load_json(
            artifacts_dir / "class_counts_valid.json",
            default=[],
        )

        return Response({
            "accuracy": accuracy,
            "loss": loss,
            "history": history,
            "class_counts_train": class_counts_train,
            "test_accuracy_per_sample": per_sample,
            "class_counts_valid": class_counts_valid,
        })

    @staticmethod
    def _load_json(path: Path, default):
        if not path.exists():
            return default
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default