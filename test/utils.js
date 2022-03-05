const isTTY = process.stdout.isTTY

export function get_hrtime(start) {
  let diff
  if (start) {
    diff = process.hrtime(start)
    return (diff[0] * 1e9 + diff[1]) / 1000000
  }
  return process.hrtime()
}

export function announce(str) {
  let stars = '****'

  for (let i = str.length - 1; i >= 0; i -= 1) {
    stars += '*'
  }

  note(stars)
  note('* ' + str + ' *')
  note(stars)
}

export function color(color_code, str) {
  if (process.stdout.isTTY) {
    str = '\u001B[' + color_code + 'm' + str + '\u001B[0m'
  }

  console.log(str)
}

export function note(str) {
  color(36, str)
}

export function good(str) {
  color(32, str)
}

function error(str) {
  color(31, str)
}

export function display_result(str, pass) {
  if (pass) {
    good(str)
  } else {
    error(str)
  }
}

export function progress(percent) {
  if (isTTY) {
    process.stdout.cursorTo(0)
    if (percent > 0 && percent < 1) {
      process.stdout.write((percent * 100).toFixed(2) + '%')
    }
  }
}

export function compare(a, b) {
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

  if (Buffer.isBuffer(a) && !Buffer.isBuffer(b) && Array.isArray(b)) {
    b = new Buffer(b)
  } else if (Buffer.isBuffer(b) && !Buffer.isBuffer(a) && Array.isArray(a)) {
    a = new Buffer(a)
  }

  for (let i = a.length - 1; i >= 0; --i) {
    if (a[i] !== b[i]) {
      error('BAD VAL (' + i + '): ' + a[i] + ' !== ' + b[i])
      return false
    }
  }

  return true
}

export function display_time(total_time) {
  console.log('Total Time: ' + get_hrtime(total_time) + ' ms')
}
