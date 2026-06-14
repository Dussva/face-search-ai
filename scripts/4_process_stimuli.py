"""
Скрипт 4: Обработка финальных стимулов
Запуск: python 4_process_stimuli.py

Что делает:
- real_faces и ai_faces берёт из stimuli_raw/
- objects берёт только строки с include_manual=1 из CSV
- Конвертирует в grayscale, resize 256×256, CLAHE нормализация
- Переименовывает: real_001.png, ai_001.png, obj_001.png
- Сохраняет manifest CSV
"""
import csv, shutil
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

SIZE = 256
IMG_EXTS = {".jpg",".jpeg",".png",".bmp",".webp"}

def process_image(src: Path, dst: Path):
    with Image.open(src) as img:
        img = img.convert("RGB").convert("L")
        img = img.resize((SIZE, SIZE), Image.LANCZOS)
    arr = np.array(img)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    arr   = clahe.apply(arr)
    Image.fromarray(arr).save(dst)

def approved_objects():
    csv_path = Path("stimuli_selected/objects_candidates.csv")
    if not csv_path.exists():
        print("[!] objects_candidates.csv не найден. Берём все объекты без фильтра.")
        return None
    approved = set()
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if str(row.get("include_manual","")).strip() == "1":
                approved.add(row["filename"])
    return approved

def process_category(src_dir: Path, dst_dir: Path, prefix: str, filter_set=None):
    dst_dir.mkdir(parents=True, exist_ok=True)
    imgs = sorted([f for f in src_dir.rglob("*") if f.suffix.lower() in IMG_EXTS])
    if filter_set is not None:
        imgs = [f for f in imgs if f.name in filter_set]
    print(f"\n{prefix}: {len(imgs)} изображений → {dst_dir}")
    manifest = []
    for i, src in enumerate(imgs, 1):
        dst_name = f"{prefix}_{i:03d}.png"
        dst = dst_dir / dst_name
        try:
            process_image(src, dst)
            manifest.append({"new_filename": dst_name, "category": prefix,
                              "original": src.name})
            print(f"  ✓ {dst_name}")
        except Exception as e:
            print(f"  [!] Ошибка {src.name}: {e}")
    return manifest

def main():
    manifest = []

    # Реальные лица — из stimuli_raw (уже отобраны вручную через CFD)
    manifest += process_category(
        Path("stimuli_raw/real_faces"),
        Path("stimuli_processed/real_faces"),
        "real"
    )
    # ИИ-лица — из stimuli_raw
    manifest += process_category(
        Path("stimuli_raw/ai_faces"),
        Path("stimuli_processed/ai_faces"),
        "ai"
    )
    # Объекты — из candidates, только include_manual=1
    approved = approved_objects()
    manifest += process_category(
        Path("stimuli_selected/objects_candidates"),
        Path("stimuli_processed/objects"),
        "obj",
        filter_set=approved
    )

    # Сохраняем манифест
    mpath = Path("stimuli_processed/stimuli_manifest.csv")
    with open(mpath, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["new_filename","category","original"])
        w.writeheader()
        w.writerows(manifest)

    counts = {}
    for r in manifest:
        counts[r["category"]] = counts.get(r["category"],0)+1
    print(f"\nМанифест: {mpath}")
    print(f"Итого: {counts}")
    print("Готово!")

if __name__ == "__main__":
    main()
