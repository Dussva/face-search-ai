"""
Скрипт 6: Сборка composite изображений для каждой пробы
Запуск: python 6_make_composites.py

set_size=4 → сетка 2×2
set_size=8 → сетка 4×2
Фон: нейтральный серый (#808080)
"""
import csv
from pathlib import Path
from PIL import Image

CELL  = 256
PAD   = 20
BG    = 128   # серый для grayscale

def get_img_path(filename, stimuli_processed):
    if filename.startswith("real_"):
        return stimuli_processed / "real_faces" / filename
    elif filename.startswith("ai_"):
        return stimuli_processed / "ai_faces" / filename
    elif filename.startswith("obj_"):
        return stimuli_processed / "objects" / filename
    return None

def load_img(path):
    with Image.open(path) as img:
        return img.convert("L").resize((CELL,CELL), Image.LANCZOS).copy()

def make_grid(imgs, set_size):
    cols = 2 if set_size == 4 else 4
    rows = 2
    W = cols*(CELL+PAD)+PAD
    H = rows*(CELL+PAD)+PAD
    canvas = Image.new("L",(W,H),BG)
    for i,img in enumerate(imgs[:set_size]):
        c = i % cols
        r = i // cols
        x = PAD + c*(CELL+PAD)
        y = PAD + r*(CELL+PAD)
        canvas.paste(img,(x,y))
    return canvas

def process(csv_path, stimuli_processed, comp_dir, prefix):
    comp_dir.mkdir(parents=True, exist_ok=True)
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    fieldnames = list(rows[0].keys())

    ok, fail = 0, 0
    for row in rows:
        set_size = int(row["set_size"])
        slots = [row.get(f"slot{i}","") for i in range(1,9)]
        slots = [s for s in slots if s][:set_size]

        imgs = []
        for fname in slots:
            p = get_img_path(fname, stimuli_processed)
            if p and p.exists():
                try:
                    imgs.append(load_img(p))
                except:
                    imgs.append(Image.new("L",(CELL,CELL),100))
            else:
                imgs.append(Image.new("L",(CELL,CELL),100))

        grid = make_grid(imgs, set_size)
        comp_name = f"{prefix}_{int(row['trial_id']):04d}.png"
        grid.save(comp_dir / comp_name)
        row["composite_image"] = comp_name
        ok += 1

    with open(csv_path,"w",newline="",encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader(); w.writerows(rows)

    print(f"  {prefix}: {ok} composite изображений → {comp_dir}")

def main():
    sp = Path("stimuli_processed")

    print("face-face composites...")
    process(
        Path("trials/trials_face_face.csv"), sp,
        Path("trials/composite/face_face"), "ff"
    )
    print("face-object composites...")
    process(
        Path("trials/trials_face_object.csv"), sp,
        Path("trials/composite/face_object"), "fo"
    )
    print("Все composite готовы!")

if __name__ == "__main__":
    main()
