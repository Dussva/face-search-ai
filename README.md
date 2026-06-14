# face-search-ai
Visual search experiment: real vs AI-generated faces
# Visual Search: Real vs AI-Generated Faces

Курсовая работа, НИУ ВШЭ, 2026.
Образовательная программа «Вычислительные социальные науки».
Автор: Сысоева Евдокия Александровна.
Научный руководитель: Сапронов Фрол Алексеевич.

## Тема
Особенности зрительного поиска реальных и ИИ-сгенерированных лиц.

## Структура репозитория

| Файл | Описание |
|---|---|
| `experiment.js` | Код эксперимента (jsPsych 7.3, Cognition.run) |
| `experiment_style.css` | Стили интерфейса |
| `4_process_stimuli.py` | Обработка стимулов: grayscale, resize 256×256, CLAHE |
| `5_make_trials.py` | Генерация таблицы проб (FF-дизайн 2×2×2) |
| `6_make_composites.py` | Сборка composite-изображений (сетки 2×2 и 4×2) |
| `trials_face_face.csv` | Таблица проб основного блока |
| `combined_data.csv` | Объединённые данные 4 CSV из Cognition.run |
| `analysis.ipynb` | Анализ данных (Python, statsmodels) |

## Дизайн эксперимента
Match-to-sample visual search. Факторы:
- `target_origin`: real / ai
- `set_size`: 4 / 8
- `target_present`: true / false

N = 45 участников, 32 пробы каждый.

## Зависимости
```
pip install pandas numpy scipy statsmodels pillow opencv-python
```
