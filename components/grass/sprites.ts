import type { Sprite } from './pixel'

/*
 * Hand-placed pixel art for the meadow's props. One character per pixel, '.'
 * is empty. (The cat is built in cat-art.ts.)
 *
 * Leaf key: q outline · g leaf · u vein
 * Other:    b/e butterfly wing/edge · o body · f/y petal/flower centre
 *           n/h heart · z sleepy Z
 */

// ── Props and particles ────────────────────────────────────────────────────

/** A big leaf held over the cat in the rain, 17 × 5 */
export const LEAF: Sprite = [
  '....qqqqqqqqq....',
  '..qqgggguggggqq..',
  '.qgggguuuuuggggq.',
  'qgggggggggggggggq',
  '.qq.qqqqqqqqq.qq.',
]

export const HEART: Sprite = ['nn.nn', 'nhnnn', '.nnn.', '..n..']

export const ZED: Sprite = ['zzzz', '..z.', '.z..', 'zzzz']
export const ZED_SMALL: Sprite = ['zzz', '.z.', 'zzz']

/** Wing beat: open, half, closed, half… seen from above, 7 × 5 */
export const BUTTERFLY: Sprite[] = [
  ['..o.o..', 'ebbobbe', 'ebbobbe', '.bbobb.', '..e.e..'],
  ['..o.o..', '.ebobe.', '.bbobb.', '..bob..', '.......'],
  ['..o.o..', '..eoe..', '..bob..', '...o...', '.......'],
]

export const FLOWER: Sprite = ['.f.', 'fyf', '.f.']
export const BUD: Sprite = ['f']
