const numerals: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** The Roman numeral of a position (1-based), for "Plate IV". */
export function roman(n: number): string {
  let out = ''
  let rest = Math.max(1, Math.floor(n))
  for (const [value, symbol] of numerals) {
    while (rest >= value) {
      out += symbol
      rest -= value
    }
  }
  return out
}
