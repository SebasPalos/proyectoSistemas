/** Este archivo convierte el codigo escrito en una lista de piezas que el programa puede entender. */
const KEYWORDS = new Set(["let", "if", "else", "while", "for", "print", "true", "false"]);
const KEYWORD_CANDIDATES = [...KEYWORDS];

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function findKeywordSuggestion(value) {
  let suggestion = null;
  let bestDistance = Infinity;

  for (const keyword of KEYWORD_CANDIDATES) {
    const distance = levenshteinDistance(value, keyword);
    if (distance < bestDistance) {
      bestDistance = distance;
      suggestion = keyword;
    }
  }

  if (!suggestion) return null;

  const maxDistance = Math.max(1, Math.floor(suggestion.length * 0.4));
  return bestDistance <= maxDistance ? suggestion : null;
}

export function tokenize(sourceCode) {
  const tokens = [];
  let current = 0;
  let line = 1;
  let column = 1;

  function currentChar() {
    return sourceCode[current];
  }

  function advance() {
    const char = sourceCode[current];
    current += 1;
    if (char === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    return char;
  }

  function addToken(type, value, tokenLine, tokenColumn) {
    tokens.push({ type, value, line: tokenLine, column: tokenColumn });
  }

  while (current < sourceCode.length) {
    const char = currentChar();

    if (/\s/.test(char)) {
      advance();
      continue;
    }

    const tokenLine = line;
    const tokenColumn = column;
    if (/[0-9]/.test(char)) {
      let value = "";
      while (current < sourceCode.length && /[0-9]/.test(currentChar())) {
        value += advance();
      }
      addToken("NUMBER", Number(value), tokenLine, tokenColumn);
      continue;
    }
    if (/[a-zA-Z_]/.test(char)) {
      let value = "";
      while (
        current < sourceCode.length &&
        /[a-zA-Z0-9_]/.test(currentChar())
      ) {
        value += advance();
      }

      if (KEYWORDS.has(value)) {
        addToken("KEYWORD", value, tokenLine, tokenColumn);
      } else {
        const suggestion = findKeywordSuggestion(value);
        if (suggestion) {
          throw new Error(
            `Posible palabra reservada mal escrita "${value}" en línea ${tokenLine}, columna ${tokenColumn}. ¿Quisiste escribir "${suggestion}"?`
          );
        }
        addToken("IDENTIFIER", value, tokenLine, tokenColumn);
      }
      continue;
    }

    if (["+", "-", "*", "/"].includes(char)) {
      addToken("OPERATOR", advance(), tokenLine, tokenColumn);
      continue;
    }

    if (char === "<" || char === ">") {
      advance();
      if (current < sourceCode.length && sourceCode[current] === "=") {
        addToken("OPERATOR", `${char}=`, tokenLine, tokenColumn);
        advance();
      } else {
        addToken("OPERATOR", char, tokenLine, tokenColumn);
      }
      continue;
    }

    if (char === "=") {
      advance();
      if (current < sourceCode.length && sourceCode[current] === "=") {
        addToken("OPERATOR", "==", tokenLine, tokenColumn);
        advance();
      } else {
        addToken("EQUAL", "=", tokenLine, tokenColumn);
      }
      continue;
    }

    if (char === "!") {
      advance();
      if (current < sourceCode.length && sourceCode[current] === "=") {
        addToken("OPERATOR", "!=", tokenLine, tokenColumn);
        advance();
        continue;
      }
      throw new Error(
        `Carácter no reconocido "!" en línea ${line}, columna ${column}.`
      );
    }

    if (char === "(") {
      addToken("LPAREN", advance(), tokenLine, tokenColumn);
      continue;
    }

    if (char === ")") {
      addToken("RPAREN", advance(), tokenLine, tokenColumn);
      continue;
    }

    if (char === "{") {
      addToken("LBRACE", advance(), tokenLine, tokenColumn);
      continue;
    }

    if (char === "}") {
      addToken("RBRACE", advance(), tokenLine, tokenColumn);
      continue;
    }

    if (char === ",") {
      addToken("COMMA", advance(), tokenLine, tokenColumn);
      continue;
    }

    if (char === ";") {
      addToken("SEMICOLON", advance(), tokenLine, tokenColumn);
      continue;
    }

    throw new Error(
      `Carácter no reconocido "${char}" en línea ${line}, columna ${column}.`
    );
  }

  addToken("EOF", null, line, column);
  return tokens;
}

