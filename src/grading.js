function normalizeText(value) {
  return value
    .trim()
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.!。]+$/g, "")
    .replaceAll('"', "'")
    .toLowerCase();
}

function tokenize(source) {
  const tokens = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if ("[]{}(),:".includes(char)) {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }
    if (char === "'" || char === '"') {
      const quote = char;
      let value = "";
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === "\\" && index + 1 < source.length) {
          index += 1;
          const escaped = source[index];
          value += escaped === "n" ? "\n" : escaped === "t" ? "\t" : escaped;
        } else {
          value += source[index];
        }
        index += 1;
      }
      if (source[index] !== quote) throw new Error("닫히지 않은 문자열");
      index += 1;
      tokens.push({ type: "string", value });
      continue;
    }

    const number = source.slice(index).match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)/);
    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      index += number[0].length;
      continue;
    }

    const name = source.slice(index).match(/^[A-Za-z_가-힣][\w가-힣]*/);
    if (name) {
      tokens.push({ type: "name", value: name[0] });
      index += name[0].length;
      continue;
    }
    throw new Error("해석할 수 없는 문자");
  }
  return tokens;
}

function parsePythonLiteral(source) {
  const tokens = tokenize(source);
  let position = 0;
  const peek = (type) => tokens[position]?.type === type;
  const take = (type) => {
    if (!peek(type)) throw new Error(`${type} 토큰 필요`);
    return tokens[position++];
  };

  function parseSequence(close, tuple) {
    const values = [];
    if (peek(close)) {
      take(close);
      return tuple ? { type: "tuple", values } : values;
    }
    values.push(parseValue());
    let hasComma = false;
    while (peek(",")) {
      hasComma = true;
      take(",");
      if (peek(close)) break;
      values.push(parseValue());
    }
    take(close);
    if (tuple) return hasComma ? { type: "tuple", values } : values[0];
    return values;
  }

  function parseBraces() {
    if (peek("}")) {
      take("}");
      return { type: "dict", entries: [] };
    }
    const first = parseValue();
    if (peek(":")) {
      const entries = [];
      take(":");
      entries.push([first, parseValue()]);
      while (peek(",")) {
        take(",");
        if (peek("}")) break;
        const key = parseValue();
        take(":");
        entries.push([key, parseValue()]);
      }
      take("}");
      return { type: "dict", entries };
    }
    const values = [first];
    while (peek(",")) {
      take(",");
      if (peek("}")) break;
      values.push(parseValue());
    }
    take("}");
    return { type: "set", values };
  }

  function parseValue() {
    if (peek("string")) return take("string").value;
    if (peek("number")) return take("number").value;
    if (peek("[")) {
      take("[");
      return parseSequence("]", false);
    }
    if (peek("(")) {
      take("(");
      return parseSequence(")", true);
    }
    if (peek("{")) {
      take("{");
      return parseBraces();
    }
    if (peek("name")) {
      const name = String(take("name").value).toLowerCase();
      if (name === "true") return true;
      if (name === "false") return false;
      if (name === "none" || name === "null") return null;
    }
    throw new Error("Python 리터럴이 아님");
  }

  const result = parseValue();
  if (position !== tokens.length) throw new Error("남은 토큰");
  return result;
}

function canonical(value) {
  if (value === null) return "null";
  if (typeof value === "number") return `number:${value}`;
  if (typeof value === "boolean") return `boolean:${value}`;
  if (typeof value === "string") return `string:${value}`;
  if (Array.isArray(value)) return `list:[${value.map(canonical).join(",")}]`;
  if (value.type === "tuple") return `tuple:(${value.values.map(canonical).join(",")})`;
  if (value.type === "set") {
    return `set:{${value.values.map(canonical).sort().join(",")}}`;
  }
  if (value.type === "dict") {
    const entries = value.entries
      .map(([key, item]) => `${canonical(key)}:${canonical(item)}`)
      .sort();
    return `dict:{${entries.join(",")}}`;
  }
  return String(value);
}

export function checkShortAnswer(expected, actual) {
  if (!actual.trim()) return false;
  try {
    return canonical(parsePythonLiteral(expected)) === canonical(parsePythonLiteral(actual));
  } catch {
    return normalizeText(expected) === normalizeText(actual);
  }
}

