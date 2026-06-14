"""
Скрипт 5: Генерация таблиц проб
Запуск: python 5_make_trials.py

face-face: 80 проб  (2 origin × 2 set_size × 2 present × 10 повторений)
face-obj:  48 проб  (3 условия × 2 set_size × 8 повторений)
"""
import csv, random
from pathlib import Path

random.seed(42)

def load_pool(folder: Path):
    return sorted([f.name for f in folder.glob("*.png")])

def fill_slots(items, n=8):
    """Дополняем до 8 слотов пустыми строками"""
    return (items + [""]*8)[:8]

def make_face_face(real, ai, n_per_cell=10):
    rows = []
    tid  = 1
    for origin in ["real","ai"]:
        pool = list(real if origin=="real" else ai)
        for set_size in [4,8]:
            for present in [True, False]:
                for _ in range(n_per_cell):
                    random.shuffle(pool)
                    if present:
                        cue = pool[0]
                        dist = random.sample([f for f in pool if f!=cue],
                                              min(set_size-1, len(pool)-1))
                        slots_raw = dist + [cue]
                        random.shuffle(slots_raw)
                        correct_key = "j"
                    else:
                        cue = pool[0]
                        dist = random.sample([f for f in pool if f!=cue],
                                              min(set_size, len(pool)-1))
                        slots_raw = dist
                        correct_key = "f"
                    s = fill_slots(slots_raw)
                    rows.append({
                        "trial_id": tid, "block":"face_face",
                        "target_origin": origin, "set_size": set_size,
                        "target_present": str(present).lower(),
                        "cue_image": cue,
                        "slot1":s[0],"slot2":s[1],"slot3":s[2],"slot4":s[3],
                        "slot5":s[4],"slot6":s[5],"slot7":s[6],"slot8":s[7],
                        "correct_key": correct_key,
                        "composite_image": "",
                    })
                    tid += 1
    random.shuffle(rows)
    for i,r in enumerate(rows,1): r["trial_id"]=i
    return rows

def make_face_object(real, ai, obj, n_per_cell=8):
    rows = []
    tid  = 1
    for set_size in [4,8]:
        # present real
        for _ in range(n_per_cell):
            face   = random.choice(real)
            dists  = random.sample(obj, set_size-1)
            slots_raw = dists + [face]
            random.shuffle(slots_raw)
            s = fill_slots(slots_raw)
            rows.append({
                "trial_id":tid,"block":"face_object",
                "face_origin":"real","set_size":set_size,
                "target_present":"true",
                "slot1":s[0],"slot2":s[1],"slot3":s[2],"slot4":s[3],
                "slot5":s[4],"slot6":s[5],"slot7":s[6],"slot8":s[7],
                "correct_key":"j","composite_image":"",
            }); tid+=1
        # present ai
        for _ in range(n_per_cell):
            face   = random.choice(ai)
            dists  = random.sample(obj, set_size-1)
            slots_raw = dists + [face]
            random.shuffle(slots_raw)
            s = fill_slots(slots_raw)
            rows.append({
                "trial_id":tid,"block":"face_object",
                "face_origin":"ai","set_size":set_size,
                "target_present":"true",
                "slot1":s[0],"slot2":s[1],"slot3":s[2],"slot4":s[3],
                "slot5":s[4],"slot6":s[5],"slot7":s[6],"slot8":s[7],
                "correct_key":"j","composite_image":"",
            }); tid+=1
        # absent
        for _ in range(n_per_cell):
            dists = random.sample(obj, set_size)
            s = fill_slots(dists)
            rows.append({
                "trial_id":tid,"block":"face_object",
                "face_origin":"none","set_size":set_size,
                "target_present":"false",
                "slot1":s[0],"slot2":s[1],"slot3":s[2],"slot4":s[3],
                "slot5":s[4],"slot6":s[5],"slot7":s[6],"slot8":s[7],
                "correct_key":"f","composite_image":"",
            }); tid+=1

    random.shuffle(rows)
    for i,r in enumerate(rows,1): r["trial_id"]=i
    return rows

def save_csv(rows, path):
    with open(path,"w",newline="",encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

def main():
    Path("trials").mkdir(exist_ok=True)
    real = load_pool(Path("stimuli_processed/real_faces"))
    ai   = load_pool(Path("stimuli_processed/ai_faces"))
    obj  = load_pool(Path("stimuli_processed/objects"))
    print(f"Стимулы: real={len(real)}, ai={len(ai)}, obj={len(obj)}")

    ff = make_face_face(real, ai)
    save_csv(ff, "trials/trials_face_face.csv")
    print(f"face-face: {len(ff)} проб")

    fo = make_face_object(real, ai, obj)
    save_csv(fo, "trials/trials_face_object.csv")
    print(f"face-object: {len(fo)} проб")
    print("Готово! → trials/")

if __name__ == "__main__":
    main()
