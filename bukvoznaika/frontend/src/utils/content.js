// Полный алфавит с контентом для уроков
export const ALPHABET_DATA = [
  { letter: 'А', word: 'Арбуз', emoji: '🍉', color: '#FF6B6B', sound: 'А-А-Арбуз' },
  { letter: 'Б', word: 'Белка', emoji: '🐿️', color: '#FF9F43', sound: 'Б-Б-Белка' },
  { letter: 'В', word: 'Волк', emoji: '🐺', color: '#A29BFE', sound: 'В-В-Волк' },
  { letter: 'Г', word: 'Гусь', emoji: '🦢', color: '#74B9FF', sound: 'Г-Г-Гусь' },
  { letter: 'Д', word: 'Дом', emoji: '🏠', color: '#55EFC4', sound: 'Д-Д-Дом' },
  { letter: 'Е', word: 'Ежевика', emoji: '🫐', color: '#6C5CE7', sound: 'Е-Е-Ежевика' },
  { letter: 'Ё', word: 'Ёж', emoji: '🦔', color: '#00B894', sound: 'Ё-Ё-Ёж' },
  { letter: 'Ж', word: 'Жираф', emoji: '🦒', color: '#FDCB6E', sound: 'Ж-Ж-Жираф' },
  { letter: 'З', word: 'Заяц', emoji: '🐰', color: '#FD79A8', sound: 'З-З-Заяц' },
  { letter: 'И', word: 'Игла', emoji: '🪡', color: '#E17055', sound: 'И-И-Игла' },
  { letter: 'Й', word: 'Йогурт', emoji: '🥛', color: '#74B9FF', sound: 'Й-Й-Йогурт' },
  { letter: 'К', word: 'Кот', emoji: '🐱', color: '#A29BFE', sound: 'К-К-Кот' },
  { letter: 'Л', word: 'Лиса', emoji: '🦊', color: '#FF6B35', sound: 'Л-Л-Лиса' },
  { letter: 'М', word: 'Мышь', emoji: '🐭', color: '#B2BEC3', sound: 'М-М-Мышь' },
  { letter: 'Н', word: 'Нос', emoji: '👃', color: '#FAB1A0', sound: 'Н-Н-Нос' },
  { letter: 'О', word: 'Облако', emoji: '☁️', color: '#74B9FF', sound: 'О-О-Облако' },
  { letter: 'П', word: 'Петух', emoji: '🐓', color: '#FF7675', sound: 'П-П-Петух' },
  { letter: 'Р', word: 'Рыба', emoji: '🐟', color: '#0984E3', sound: 'Р-Р-Рыба' },
  { letter: 'С', word: 'Слон', emoji: '🐘', color: '#636E72', sound: 'С-С-Слон' },
  { letter: 'Т', word: 'Тигр', emoji: '🐯', color: '#FDCB6E', sound: 'Т-Т-Тигр' },
  { letter: 'У', word: 'Утка', emoji: '🦆', color: '#00CEC9', sound: 'У-У-Утка' },
  { letter: 'Ф', word: 'Фонарь', emoji: '🔦', color: '#FFEAA7', sound: 'Ф-Ф-Фонарь' },
  { letter: 'Х', word: 'Хлеб', emoji: '🍞', color: '#E17055', sound: 'Х-Х-Хлеб' },
  { letter: 'Ц', word: 'Цапля', emoji: '🦢', color: '#81ECEC', sound: 'Ц-Ц-Цапля' },
  { letter: 'Ч', word: 'Чайник', emoji: '🫖', color: '#FD79A8', sound: 'Ч-Ч-Чайник' },
  { letter: 'Ш', word: 'Шар', emoji: '🎈', color: '#FF6B9D', sound: 'Ш-Ш-Шар' },
  { letter: 'Щ', word: 'Щука', emoji: '🐟', color: '#00B894', sound: 'Щ-Щ-Щука' },
  { letter: 'Ъ', word: 'Объект', emoji: '📦', color: '#B2BEC3', sound: 'Твёрдый знак' },
  { letter: 'Ы', word: 'Рыба', emoji: '🐠', color: '#74B9FF', sound: 'Ы-Ы-Рыба' },
  { letter: 'Ь', word: 'Мягкий', emoji: '🌿', color: '#55EFC4', sound: 'Мягкий знак' },
  { letter: 'Э', word: 'Эхо', emoji: '🔊', color: '#A29BFE', sound: 'Э-Э-Эхо' },
  { letter: 'Ю', word: 'Юла', emoji: '🪀', color: '#FD79A8', sound: 'Ю-Ю-Юла' },
  { letter: 'Я', word: 'Яблоко', emoji: '🍎', color: '#FF6B6B', sound: 'Я-Я-Яблоко' },
];

// Числа с контентом
export const NUMBERS_DATA = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1;
  const items = ['🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍉',
                 '🌟','🌈','🦋','🌺','🐝','🐞','🦄','🐬','🦁','🐯'];
  const colors = ['#FF6B6B','#FF9F43','#FFD93D','#6BCB77','#4D96FF',
                  '#FF6B9D','#A29BFE','#74B9FF','#55EFC4','#FDCB6E',
                  '#FD79A8','#E17055','#00B894','#0984E3','#6C5CE7',
                  '#A3CB38','#FC427B','#1289A7','#EE5A24','#009432'];
  const names = ['Один','Два','Три','Четыре','Пять','Шесть','Семь','Восемь',
                 'Девять','Десять','Одиннадцать','Двенадцать','Тринадцать',
                 'Четырнадцать','Пятнадцать','Шестнадцать','Семнадцать',
                 'Восемнадцать','Девятнадцать','Двадцать'];
  return { number: n, name: names[i], emoji: items[i], color: colors[i] };
});

// Генератор упражнений на распознавание букв
export function generateLetterExercises(letterData) {
  const others = ALPHABET_DATA.filter(l => l.letter !== letterData.letter);
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  // Упражнение 1: Найди букву
  const distractors1 = shuffle(others).slice(0, 3).map(l => l.letter);
  const options1 = shuffle([letterData.letter, ...distractors1]);

  // Упражнение 2: Найди слово по букве
  const distractors2 = shuffle(others).slice(0, 3).map(l => ({ word: l.word, emoji: l.emoji }));
  const options2 = shuffle([{ word: letterData.word, emoji: letterData.emoji }, ...distractors2]);

  // Упражнение 3: Сопоставление
  const pairs = shuffle(ALPHABET_DATA).slice(0, 4);
  if (!pairs.find(p => p.letter === letterData.letter)) { pairs[0] = letterData; }

  return [
    {
      type: 'recognition',
      question: `Найди букву ${letterData.letter}!`,
      options: options1,
      correct: letterData.letter,
    },
    {
      type: 'matching',
      question: `Какое слово начинается на ${letterData.letter}?`,
      options: options2,
      correct: letterData.word,
    },
    {
      type: 'tracing',
      letter: letterData.letter,
      instruction: `Обведи букву ${letterData.letter}`,
    }
  ];
}

// Генератор упражнений на счёт
export function generateNumberExercises(numberData) {
  const n = numberData.number;
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  // Упражнение 1: Пересчитай предметы
  const items = Array(n).fill(numberData.emoji);

  // Упражнение 2: Выбери правильное число
  const nums = Array.from({ length: 20 }, (_, i) => i + 1);
  const distractors = shuffle(nums.filter(x => x !== n)).slice(0, 3);
  const options = shuffle([n, ...distractors]);

  // Упражнение 3: Простая арифметика (для чисел > 2)
  let mathEx = null;
  if (n >= 3 && n <= 10) {
    const a = Math.floor(Math.random() * (n - 1)) + 1;
    const b = n - a;
    mathEx = { a, b, result: n, type: 'add' };
  } else if (n > 10) {
    const sub = Math.floor(Math.random() * 5) + 1;
    mathEx = { a: n, b: sub, result: n - sub, type: 'sub' };
  }

  return [
    { type: 'counting', items, correct: n, question: 'Сколько предметов?' },
    { type: 'recognition', options, correct: n, question: `Покажи число ${n}` },
    ...(mathEx ? [{ type: 'math', ...mathEx }] : [])
  ];
}

export const AVATARS = [
  { id: 'bear', emoji: '🐻', name: 'Медвежонок', bg: '#FDCB6E' },
  { id: 'bunny', emoji: '🐰', name: 'Зайчик', bg: '#FD79A8' },
  { id: 'fox', emoji: '🦊', name: 'Лисёнок', bg: '#E17055' },
  { id: 'cat', emoji: '🐱', name: 'Котёнок', bg: '#A29BFE' },
  { id: 'dog', emoji: '🐶', name: 'Щенок', bg: '#74B9FF' },
  { id: 'panda', emoji: '🐼', name: 'Панда', bg: '#B2BEC3' },
];

export const LENYA_MESSAGES = {
  correct: ['Молодец! 🎉', 'Отлично! ⭐', 'Ура! Правильно! 🌟', 'Ты лучший! 🏆', 'Замечательно! 🎈'],
  wrong: ['Попробуй ещё! 💪', 'Не страшно! Давай снова! 😊', 'Почти! Попробуй ещё раз 🤗'],
  start: ['Начнём учиться! 📚', 'Привет! Готов учиться? 🌟', 'Давай изучим что-то новое! ✨'],
  complete: ['Урок завершён! Ты молодец! 🎊', 'Так держать! Ты умница! ⭐', 'Урок пройден! Продолжай в том же духе! 🚀'],
};
