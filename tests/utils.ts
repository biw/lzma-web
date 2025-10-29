export function get_hrtime(
  start?: [number, number],
): [number, number] | number {
  let diff: [number, number]
  if (start) {
    diff = process.hrtime(start)
    return (diff[0] * 1e9 + diff[1]) / 1000000
  }
  return process.hrtime()
}

export function color(color_code: number, str: string): void {
  let output = str
  if (process.stdout.isTTY) {
    output = '\u001B[' + color_code + 'm' + str + '\u001B[0m'
  }

  console.log(output)
}

export function note(str: string): void {
  color(36, str)
}

export function good(str: string): void {
  color(32, str)
}

function error(str: string): void {
  color(31, str)
}

export function display_result(str: string, pass: boolean): void {
  if (pass) {
    good(str)
  } else {
    error(str)
  }
}

export function compare(
  a: string | Uint8Array | Buffer,
  b: string | Uint8Array | Buffer,
): boolean {
  if (typeof a !== typeof b) {
    error('BAD TYPES:' + typeof a + ' !== ' + typeof b)
    return false
  }

  if (a.length !== b.length) {
    error('BAD LENGTH: ' + a.length + ' !== ' + b.length)
    return false
  }

  if (typeof a === 'string') {
    return a === b
  }

  let bufA = a as Buffer | Uint8Array
  let bufB = b as Buffer | Uint8Array

  if (Buffer.isBuffer(a) && !Buffer.isBuffer(b) && Array.isArray(b)) {
    bufB = Buffer.from(b)
  } else if (Buffer.isBuffer(b) && !Buffer.isBuffer(a) && Array.isArray(a)) {
    bufA = Buffer.from(a)
  }

  for (let i = bufA.length - 1; i >= 0; --i) {
    if (bufA[i] !== bufB[i]) {
      error('BAD VAL (' + i + '): ' + bufA[i] + ' !== ' + bufB[i])
      return false
    }
  }

  return true
}
