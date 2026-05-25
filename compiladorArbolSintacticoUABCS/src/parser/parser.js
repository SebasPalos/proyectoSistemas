/** Este archivo organiza los tokens para formar la estructura del programa. */
export function parse(tokens) {
  let current = 0;

  function peek() {
    return tokens[current];
  }

  function previous() {
    return tokens[current - 1];
  }

  function isAtEnd() {
    return peek().type === "EOF";
  }

  function advance() {
    if (!isAtEnd()) current += 1;
    return previous();
  }

  function check(type, value = null) {
    if (isAtEnd()) return false;
    if (peek().type !== type) return false;
    if (value !== null && peek().value !== value) return false;
    return true;
  }

  function match(type, value = null) {
    if (check(type, value)) {
      advance();
      return true;
    }
    return false;
  }

  function consume(type, message, value = null) {
    if (check(type, value)) return advance();
    const token = peek();
    const prev = current > 0 ? previous() : null;
    const missingCloser =
      type === "SEMICOLON" || type === "RPAREN" || type === "RBRACE";
    const line = missingCloser && prev ? prev.line : token.line;
    throw new Error(`${message} Línea aproximada: ${line}.`);
  }

  function parseProgram() {
    const body = [];
    while (!isAtEnd()) {
      body.push(parseStatement());
    }
    return { type: "Program", body };
  }

  function parseStatement() {
    if (check("KEYWORD", "let")) return parseVariableDeclaration(true);
    if (check("KEYWORD", "if")) return parseIfStatement();
    if (check("KEYWORD", "while")) return parseWhileStatement();
    if (check("KEYWORD", "for")) return parseForStatement();
    if (check("KEYWORD", "print")) return parsePrintStatement();
    if (check("LBRACE")) return parseBlockStatement();

    const expression = parseExpression();
    consume("SEMICOLON", 'Se esperaba ";" al final de la expresion.');
    return { type: "ExpressionStatement", expression };
  }

  function parseBlockStatement() {
    consume("LBRACE", 'Se esperaba "{".');
    const body = [];
    while (!check("RBRACE") && !isAtEnd()) {
      body.push(parseStatement());
    }
    consume("RBRACE", 'Se esperaba "}" al final del bloque.');
    return { type: "BlockStatement", body };
  }

  function parseVariableDeclaration(expectSemicolon) {
    consume("KEYWORD", 'Se esperaba la palabra clave "let".', "let");
    const identifier = consume(
      "IDENTIFIER",
      "Se esperaba un identificador después de let."
    );
    consume("EQUAL", 'Se esperaba "=" después del identificador.');
    const init = parseExpression();
    if (expectSemicolon) {
      consume("SEMICOLON", 'Se esperaba ";" al final de la declaracion.');
    }
    return {
      type: "VariableDeclaration",
      id: { type: "Identifier", name: identifier.value },
      init
    };
  }

  function parseIfStatement() {
    consume("KEYWORD", 'Se esperaba "if".', "if");
    consume("LPAREN", 'Se esperaba "(" despues de if.');
    const test = parseExpression();
    consume("RPAREN", 'Se esperaba ")" despues de la condicion.');
    const consequent = parseStatement();
    let alternate = null;
    if (match("KEYWORD", "else")) {
      alternate = parseStatement();
    }
    return { type: "IfStatement", test, consequent, alternate };
  }

  function parseWhileStatement() {
    consume("KEYWORD", 'Se esperaba "while".', "while");
    consume("LPAREN", 'Se esperaba "(" despues de while.');
    const test = parseExpression();
    consume("RPAREN", 'Se esperaba ")" despues de la condicion.');
    const body = parseStatement();
    return { type: "WhileStatement", test, body };
  }

  function parseForStatement() {
    consume("KEYWORD", 'Se esperaba "for".', "for");
    consume("LPAREN", 'Se esperaba "(" despues de for.');

    let init = null;
    if (!check("SEMICOLON")) {
      if (check("KEYWORD", "let")) {
        init = parseVariableDeclaration(false);
      } else {
        init = parseExpression();
      }
    }
    consume("SEMICOLON", 'Se esperaba ";" en la seccion inicial del for.');

    let test = null;
    if (!check("SEMICOLON")) {
      test = parseExpression();
    }
    consume("SEMICOLON", 'Se esperaba ";" en la condicion del for.');

    let update = null;
    if (!check("RPAREN")) {
      update = parseExpression();
    }
    consume("RPAREN", 'Se esperaba ")" al final del encabezado del for.');

    const body = parseStatement();
    return { type: "ForStatement", init, test, update, body };
  }

  function parsePrintStatement() {
    consume("KEYWORD", 'Se esperaba "print".', "print");
    consume("LPAREN", 'Se esperaba "(" despues de print.');
    const argument = parseExpression();
    consume("RPAREN", 'Se esperaba ")" despues del argumento de print.');
    consume("SEMICOLON", 'Se esperaba ";" al final de print.');
    return { type: "PrintStatement", argument };
  }

  function parseExpression() {
    return parseAssignment();
  }

  function parseAssignment() {
    const expression = parseEquality();

    if (match("EQUAL")) {
      const value = parseAssignment();
      if (expression.type !== "Identifier") {
        throw new Error("El lado izquierdo de una asignacion debe ser un identificador.");
      }
      return {
        type: "AssignmentExpression",
        operator: "=",
        left: expression,
        right: value
      };
    }

    return expression;
  }

  function parseEquality() {
    let expression = parseComparison();
    while (match("OPERATOR", "==") || match("OPERATOR", "!=")) {
      const operator = previous().value;
      const right = parseComparison();
      expression = { type: "BinaryExpression", operator, left: expression, right };
    }
    return expression;
  }

  function parseComparison() {
    let expression = parseTerm();
    while (
      match("OPERATOR", "<") ||
      match("OPERATOR", "<=") ||
      match("OPERATOR", ">") ||
      match("OPERATOR", ">=")
    ) {
      const operator = previous().value;
      const right = parseTerm();
      expression = { type: "BinaryExpression", operator, left: expression, right };
    }
    return expression;
  }

  function parseTerm() {
    let expression = parseFactor();
    while (match("OPERATOR", "+") || match("OPERATOR", "-")) {
      const operator = previous().value;
      const right = parseFactor();
      expression = { type: "BinaryExpression", operator, left: expression, right };
    }
    return expression;
  }

  function parseFactor() {
    let expression = parseUnary();
    while (match("OPERATOR", "*") || match("OPERATOR", "/")) {
      const operator = previous().value;
      const right = parseUnary();
      expression = { type: "BinaryExpression", operator, left: expression, right };
    }
    return expression;
  }

  function parseUnary() {
    if (match("OPERATOR", "-") || match("OPERATOR", "!")) {
      const operator = previous().value;
      const right = parseUnary();
      return { type: "UnaryExpression", operator, argument: right };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    if (check("NUMBER")) {
      const number = advance();
      return { type: "Literal", value: number.value };
    }

    if (check("KEYWORD", "true")) {
      advance();
      return { type: "Literal", value: true };
    }

    if (check("KEYWORD", "false")) {
      advance();
      return { type: "Literal", value: false };
    }

    if (check("IDENTIFIER")) {
      const identifier = advance();
      return { type: "Identifier", name: identifier.value };
    }

    if (match("LPAREN")) {
      const expression = parseExpression();
      consume("RPAREN", 'Se esperaba ")" despues de la expresion.');
      return expression;
    }

    const token = peek();
    throw new Error(
      `Expresion no valida cerca de "${token.value}". Linea aproximada: ${token.line}.`
    );
  }

  return parseProgram();
}
