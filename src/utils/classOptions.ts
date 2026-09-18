export const gradeOptions = [5, 6, 7, 8, 9];

export const classLetterOptions = [
  "А",
  "Б",
  "В",
  "Г",
  "Д",
  "Е",
  "Ё",
  "Ж",
  "З",
  "И",
  "Й",
  "К",
  "Л",
  "М",
  "Н",
  "О",
  "П",
  "Р",
  "С",
  "Т",
  "У",
  "Ф",
  "Х",
  "Ц",
  "Ч",
  "Ш",
  "Щ",
  "Ъ",
  "Ы",
  "Ь",
  "Э",
  "Ю",
  "Я",
];

const classLetterOrder = new Map(
  classLetterOptions.map((letter, index) => [letter, index]),
);

export const sortClassLetters = (letters: string[]) =>
  [...new Set(letters.map((letter) => letter.trim().toUpperCase()).filter(Boolean))]
    .filter((letter) => classLetterOrder.has(letter))
    .sort(
      (left, right) =>
        (classLetterOrder.get(left) ?? 999) - (classLetterOrder.get(right) ?? 999),
    );
