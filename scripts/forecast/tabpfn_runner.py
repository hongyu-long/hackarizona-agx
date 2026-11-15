"""Local pretrained inference. Never trains on validation/test labels."""
import json
import sys
import os
from importlib.metadata import version

from tabpfn import TabPFNClassifier

with open(sys.argv[1], encoding="utf-8") as handle:
    experiment = json.load(handle)
train = experiment["train"]
if not train or {row["label"] for row in train} != {0, 1}:
    raise ValueError("Training partition must contain both inversion classes")
model_path = os.environ.get("FORECAST_MODEL_PATH")
model = TabPFNClassifier(device="cpu", random_state=0, **({"model_path": model_path} if model_path else {}))
model.fit([row["features"] for row in train], [row["label"] for row in train])
positive_index = list(model.classes_).index(1)
from tabpfn.settings import settings
result = {"version": "tabpfn-" + version("tabpfn") + "/" + str(settings.tabpfn.model_version), "model_path": model_path, "device": "cpu", "seed": 0, "parameters": str(model.get_params())}
for partition in ("validation", "test"):
    rows = experiment[partition]
    probabilities = model.predict_proba([row["features"] for row in rows]) if rows else []
    result[partition] = [
        {"id": row["id"], "probability": float(probabilities[i][positive_index])}
        for i, row in enumerate(rows)
    ]
with open(sys.argv[2], "w", encoding="utf-8") as handle:
    json.dump(result, handle, allow_nan=False)
