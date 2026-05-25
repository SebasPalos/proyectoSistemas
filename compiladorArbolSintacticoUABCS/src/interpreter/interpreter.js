/** Este archivo ejecuta las instrucciones del arbol para obtener el resultado del programa. */
function createEnvironment(parent = null) {
  return {
    values: new Map(),
    parent
  };
}

function define(env, name, value) {
  env.values.set(name, value);
  return value;
}

function assign(env, name, value) {
  if (env.values.has(name)) {
    env.values.set(name, value);
    return value;
  }
  if (env.parent) return assign(env.parent, name, value);
  throw new Error(`Variable no definida: ${name}`);
}

function get(env, name) {
  if (env.values.has(name)) return env.values.get(name);
  if (env.parent) return get(env.parent, name);
  throw new Error(`Variable no definida: ${name}`);
}

function isTruthy(value) {
  return Boolean(value);
}

function evaluateExpression(node, env) {
  switch (node.type) {
    case "Literal":
      return node.value;
    case "Identifier":
      return get(env, node.name);
    case "BinaryExpression": {
      const left = evaluateExpression(node.left, env);
      const right = evaluateExpression(node.right, env);
      switch (node.operator) {
        case "+": return left + right;
        case "-": return left - right;
        case "*": return left * right;
        case "/": return left / right;
        case "<": return left < right;
        case "<=": return left <= right;
        case ">": return left > right;
        case ">=": return left >= right;
        case "==": return left === right;
        case "!=": return left !== right;
        default: throw new Error(`Operador no soportado: ${node.operator}`);
      }
    }
    case "UnaryExpression": {
      const value = evaluateExpression(node.argument, env);
      if (node.operator === "-") return -value;
      if (node.operator === "!") return !value;
      throw new Error(`Operador unario no soportado: ${node.operator}`);
    }
    case "AssignmentExpression": {
      const value = evaluateExpression(node.right, env);
      assign(env, node.left.name, value);
      return value;
    }
    default:
      throw new Error(`Expresion no soportada: ${node.type}`);
  }
}

function executeStatement(node, env, output) {
  switch (node.type) {
    case "Program":
      node.body.forEach(statement => executeStatement(statement, env, output));
      return;
    case "BlockStatement": {
      const blockEnv = createEnvironment(env);
      node.body.forEach(statement => executeStatement(statement, blockEnv, output));
      return;
    }
    case "VariableDeclaration":
      define(env, node.id.name, evaluateExpression(node.init, env));
      return;
    case "ExpressionStatement":
      evaluateExpression(node.expression, env);
      return;
    case "PrintStatement":
      output.push(String(evaluateExpression(node.argument, env)));
      return;
    case "IfStatement":
      if (isTruthy(evaluateExpression(node.test, env))) {
        executeStatement(node.consequent, env, output);
      } else if (node.alternate) {
        executeStatement(node.alternate, env, output);
      }
      return;
    case "WhileStatement":
      while (isTruthy(evaluateExpression(node.test, env))) {
        executeStatement(node.body, env, output);
      }
      return;
    case "ForStatement": {
      const loopEnv = createEnvironment(env);
      if (node.init) {
        if (node.init.type === "VariableDeclaration") {
          executeStatement(node.init, loopEnv, output);
        } else {
          evaluateExpression(node.init, loopEnv);
        }
      }
      while (!node.test || isTruthy(evaluateExpression(node.test, loopEnv))) {
        executeStatement(node.body, loopEnv, output);
        if (node.update) evaluateExpression(node.update, loopEnv);
      }
      return;
    }
    default:
      throw new Error(`Sentencia no soportada: ${node.type}`);
  }
}

export function execute(ast) {
  const env = createEnvironment();
  const output = [];
  executeStatement(ast, env, output);
  return { output, env };
}
