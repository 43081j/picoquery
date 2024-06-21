export function splitByIndexPattern(input: string): string[] {
  const firstIndex = input.indexOf('[');
  if (firstIndex === -1) {
    return [input];
  }

  const result: string[] = [];
  const inputLength = input.length;
  let offset = 0;
  let open = false;

  for (let i = firstIndex; i < inputLength; i++) {
    const chr = input[i];
    if (chr === '[' && !open) {
      if (offset !== i) {
        result.push(input.substring(offset, i));
      }
      open = true;
      offset = i + 1;
    } else if (chr === ']' && open) {
      result.push(input.substring(offset, i));
      open = false;
      offset = i + 1;
    }
  }

  if (open) {
    return [input];
  }

  if (offset !== inputLength) {
    result.push(input.substring(offset));
  }

  return result;
}

// This function is taken from Node.js project.
// Full implementation can be found from https://github.com/nodejs/node/blob/main/lib/internal/querystring.js

const hexTable = Array.from(
  {length: 256},
  (_, i) => '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase()
);

// These characters do not need escaping when generating query strings:
// ! - . _ ~
// ' ( ) *
// digits
// alpha (uppercase)
// alpha (lowercase)
const noEscape = new Int8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0
]);

/**
 * @param {string} str
 * @returns {string}
 */
export function encodeString(str: string): string {
  const len = str.length;
  if (len === 0) {
    return '';
  }

  let out = '';
  let lastPos = 0;
  let i = 0;

  outer: for (; i < len; i++) {
    let c = str.charCodeAt(i);

    // ASCII
    while (c < 0x80) {
      if (noEscape[c] !== 1) {
        if (lastPos < i) out += str.slice(lastPos, i);
        lastPos = i + 1;
        out += hexTable[c];
      }

      if (++i === len) break outer;

      c = str.charCodeAt(i);
    }

    if (lastPos < i) out += str.slice(lastPos, i);

    // Multi-byte characters ...
    if (c < 0x800) {
      lastPos = i + 1;
      out += hexTable[0xc0 | (c >> 6)] + hexTable[0x80 | (c & 0x3f)];
      continue;
    }
    if (c < 0xd800 || c >= 0xe000) {
      lastPos = i + 1;
      out +=
        hexTable[0xe0 | (c >> 12)] +
        hexTable[0x80 | ((c >> 6) & 0x3f)] +
        hexTable[0x80 | (c & 0x3f)];
      continue;
    }
    // Surrogate pair
    ++i;

    // This branch should never happen because all URLSearchParams entries
    // should already be converted to USVString. But, included for
    // completion's sake anyway.
    if (i >= len) {
      throw new Error('URI malformed');
    }

    const c2 = str.charCodeAt(i) & 0x3ff;

    lastPos = i + 1;
    c = 0x10000 + (((c & 0x3ff) << 10) | c2);
    out +=
      hexTable[0xf0 | (c >> 18)] +
      hexTable[0x80 | ((c >> 12) & 0x3f)] +
      hexTable[0x80 | ((c >> 6) & 0x3f)] +
      hexTable[0x80 | (c & 0x3f)];
  }
  if (lastPos === 0) return str;
  if (lastPos < len) return out + str.slice(lastPos);
  return out;
}
