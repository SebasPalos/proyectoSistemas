/** Este archivo crea nodos con un formato comun para representar el programa en memoria. */

export function createProgram(body = []) {
  return { type: "Program", body };
}

export function createVariableDeclaration(id, init) {
  return { type: "VariableDeclaration", id, init };
}

export function createBinaryExpression(operator, left, right) {
  return { type: "BinaryExpression", operator, left, right };
}

export function createIdentifier(name) {
  return { type: "Identifier", name };
}

export function createLiteral(value) {
  return { type: "Literal", value };
}
