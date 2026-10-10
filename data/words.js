/* ═══════════════════════════════════════════════════════
   MATH MODULE 2 · WORD HELP (tap-a-word)
   Marcos 10/10: struggling readers need more than hints.
   When one of these words is in a question, a button for it
   shows under the question (Practice and both Reviews — not
   the tests). Tapping it opens a card: what the word means,
   an example, sometimes a picture, and a speaker.
   find  = the words or phrases in a question that bring up the card
   means = what it means, in short sentences
   ex    = an example with small numbers
   pic   = optional picture (same shapes as visuals.js)
   Nothing here names the answer to any question.
═══════════════════════════════════════════════════════ */
window.WORDS = [
  { key: 'sum', word: 'sum', find: ['sum'],
    means: 'The sum is the answer when you add.',
    ex: '3 + 4 = 7. The sum is 7.' },
  { key: 'difference', word: 'difference', find: ['difference'],
    means: 'The difference is the answer when you subtract.',
    ex: '9 − 4 = 5. The difference is 5.' },
  { key: 'more', word: 'how many more', find: ['how many more', 'how much greater'],
    means: 'This asks you to compare two numbers. Subtract to find how far apart they are.',
    ex: '8 is how many more than 5? 8 − 5 = 3.' },
  { key: 'fewer', word: 'how many fewer', find: ['how many fewer'],
    means: 'Fewer means less. This asks you to compare two numbers. Subtract to find how far apart they are.',
    ex: '5 is how many fewer than 8? 8 − 5 = 3.' },
  { key: 'perimeter', word: 'perimeter', find: ['perimeter'],
    means: 'Perimeter is the distance around a shape. Add all the sides.',
    ex: '4 + 4 + 2 + 2 = 12 feet.',
    pic: { rect: { l: 4, w: 2, unit: 'ft', sides: 'all' } } },
  { key: 'length', word: 'length', find: ['length', 'long'],
    means: 'The length is how long a shape is. It is the long side.',
    ex: 'A rectangle has two sides that are its length.',
    pic: { rect: { l: 5, w: 3, unit: '', sides: 'all', lenLabel: 'length', widLabel: 'width' } } },
  { key: 'width', word: 'width', find: ['width', 'wide'],
    means: 'The width is how wide a shape is. It is the short side.',
    ex: 'A rectangle has two sides that are its width.',
    pic: { rect: { l: 5, w: 3, unit: '', sides: 'all', lenLabel: 'length', widLabel: 'width' } } },
  { key: 'rectangle', word: 'rectangle', find: ['rectangle'],
    means: 'A rectangle has four sides. The sides across from each other are the same.',
    ex: 'A door is shaped like a rectangle.',
    pic: { rect: { l: 4, w: 2, unit: 'ft', sides: 'all' } } },
  { key: 'square', word: 'square', find: ['square'],
    means: 'A square has four sides. All four sides are the same.',
    ex: 'If one side is 2 feet, every side is 2 feet.',
    pic: { rect: { l: 2, w: 2, unit: 'ft', sides: 'all' } } },
  { key: 'round', word: 'round', find: ['round', 'rounded', 'rounds'],
    means: 'To round is to change a number to a close number that is easy to use.',
    ex: '3,812 is close to 4,000. So 3,812 rounds to 4,000.' },
  { key: 'estimate', word: 'estimate', find: ['estimate', 'estimated'],
    means: 'An estimate is a number that is close. It is not exact.',
    ex: '498 + 203 is about 500 + 200. The estimate is 700.' },
  { key: 'nearest', word: 'nearest thousand', find: ['nearest thousand'],
    means: 'Nearest means closest. Find the thousand that is closest to the number.',
    ex: '3,812 is between 3,000 and 4,000. It is closer to 4,000.' },
  { key: 'nearest100k', word: 'nearest hundred thousand', find: ['nearest hundred thousand'],
    means: 'Nearest means closest. Find the hundred thousand that is closest to the number.',
    ex: '280,000 is between 200,000 and 300,000. It is closer to 300,000.' },
  { key: 'expression', word: 'expression', find: ['expression'],
    means: 'An expression is numbers and signs. It has no equal sign.',
    ex: '2 + 2 + 6 + 6 is an expression.' },
  { key: 'reasonable', word: 'reasonable', find: ['reasonable'],
    means: 'Reasonable means it makes sense.',
    ex: 'You have 5 apples and eat 2. Is 3 left reasonable? Yes.' },
];
