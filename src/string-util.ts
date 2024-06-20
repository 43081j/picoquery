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
