/** Este archivo dibuja en pantalla el arbol del programa para que sea mas facil entenderlo. */
export function renderTree(ast) {
  const container = document.getElementById('tree-container');

  if (!container) {
    console.error('[renderTree] No se encontró el elemento #tree-container en el DOM.');
    return;
  }

  container.innerHTML = '';

  injectStyles();

  if (!ast) {
    container.textContent = 'AST vacío.';
    return;
  }

  const rootList = document.createElement('ul');
  rootList.className = 'ast-tree';
  rootList.appendChild(buildNodeElement(ast));
  container.appendChild(rootList);

  const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
  container.scrollLeft = maxScrollLeft / 2;
}


function buildNodeElement(node) {
  const li = document.createElement('li');

  li.appendChild(buildNodeBox(node));

  const children = extractChildren(node);
  if (children.length > 0) {
    const childList = document.createElement('ul');
    children.forEach(child => childList.appendChild(buildNodeElement(child)));
    li.appendChild(childList);
  }

  return li;
}

function buildNodeBox(node) {
  const box = document.createElement('div');
  box.className = 'ast-node';

  const typeEl = document.createElement('span');
  typeEl.className = 'ast-node__type';
  typeEl.textContent = translateNodeType(node.type ?? 'Node');
  box.appendChild(typeEl);

  const { label, value } = resolveValue(node);
  if (value !== null) {
    const valueEl = document.createElement('span');
    valueEl.className = 'ast-node__value';
    valueEl.textContent = label ? `${label}: ${value}` : value;
    box.appendChild(valueEl);
  }

  return box;
}


function resolveValue(node) {
  if (node.name     !== undefined && node.name     !== null) return { label: translatePropLabel('name'),     value: String(node.name) };
  if (node.value    !== undefined && node.value    !== null) return { label: translatePropLabel('value'),    value: String(node.value) };
  if (node.operator !== undefined)                           return { label: translatePropLabel('operator'), value: String(node.operator) };
  return { label: null, value: null };
}

function extractChildren(node) {
  if (Array.isArray(node.children)) {
    return node.children.filter(isAstNode);
  }

  const children = [];
  const scalarProps  = ['left', 'right', 'id', 'init', 'test', 'consequent',
                        'alternate', 'expression', 'argument', 'callee', 'object', 'property'];
  const arrayProps   = ['body', 'declarations', 'arguments', 'elements', 'params'];
  const skipProps    = new Set(['type', 'value', 'name', 'operator', 'start', 'end', 'loc', 'raw']);

  scalarProps.forEach(key => {
    if (isAstNode(node[key])) children.push(node[key]);
  });

  arrayProps.forEach(key => {
    if (Array.isArray(node[key])) {
      children.push(...node[key].filter(isAstNode));
    } else if (isAstNode(node[key])) {
      children.push(node[key]);
    }
  });

  Object.keys(node).forEach(key => {
    if (skipProps.has(key) || scalarProps.includes(key) || arrayProps.includes(key)) return;

    const val = node[key];
    if (Array.isArray(val)) {
      val.filter(isAstNode).forEach(child => {
        if (!children.includes(child)) children.push(child);
      });
    } else if (isAstNode(val) && !children.includes(val)) {
      children.push(val);
    }
  });

  return children;
}

function isAstNode(node) {
  return node !== null && typeof node === 'object' && !Array.isArray(node);
}


export function translateNodeType(type) {
  const TRANSLATIONS = {
    Program:               'Programa',
    BlockStatement:        'Bloque',

    VariableDeclaration:   'Declaración de Variable',
    VariableDeclarator:    'Declarador de Variable',
    FunctionDeclaration:   'Declaración de Función',
    ClassDeclaration:      'Declaración de Clase',

    ExpressionStatement:   'Instrucción',
    PrintStatement:        'Impresión',
    ReturnStatement:       'Retorno',
    IfStatement:           'Condicional Si',
    WhileStatement:        'Ciclo Mientras',
    ForStatement:          'Ciclo Para',
    ForInStatement:        'Ciclo Para-En',
    ForOfStatement:        'Ciclo Para-De',
    SwitchStatement:       'Selector Switch',
    SwitchCase:            'Caso',
    BreakStatement:        'Interrupción',
    ContinueStatement:     'Continuar',
    ThrowStatement:        'Lanzar Error',
    TryStatement:          'Intento',
    CatchClause:           'Captura de Error',
    DoWhileStatement:      'Ciclo Hacer-Mientras',

    BinaryExpression:      'Expresión Binaria',
    AssignmentExpression:  'Asignación',
    LogicalExpression:     'Expresión Lógica',
    UnaryExpression:       'Expresión Unaria',
    UpdateExpression:      'Actualización',
    ConditionalExpression: 'Expresión Condicional',
    CallExpression:        'Llamada de Función',
    NewExpression:         'Nueva Instancia',
    MemberExpression:      'Acceso a Propiedad',
    ArrowFunctionExpression: 'Función Flecha',
    FunctionExpression:    'Expresión de Función',
    SequenceExpression:    'Secuencia',
    TemplateLiteral:       'Plantilla de Texto',
    TaggedTemplateExpression: 'Plantilla Etiquetada',
    SpreadElement:         'Expansión',
    AssignmentPattern:     'Patrón de Asignación',
    ObjectPattern:         'Patrón de Objeto',
    ArrayPattern:          'Patrón de Arreglo',
    RestElement:           'Elemento Resto',

    Identifier:            'Identificador',
    Literal:               'Valor',
    TemplateElement:       'Fragmento de Plantilla',
    RegExpLiteral:         'Expresión Regular',

    ObjectExpression:      'Objeto',
    Property:              'Propiedad',
    ArrayExpression:       'Arreglo',

    ClassBody:             'Cuerpo de Clase',
    MethodDefinition:      'Definición de Método',
    ClassExpression:       'Expresión de Clase',

    ImportDeclaration:     'Importación',
    ExportNamedDeclaration: 'Exportación',
    ExportDefaultDeclaration: 'Exportación por Defecto',
    ImportSpecifier:       'Especificador de Importación',
    ExportSpecifier:       'Especificador de Exportación',
    ImportDefaultSpecifier: 'Importación por Defecto',
  };

  return TRANSLATIONS[type] ?? type;
}

export function translatePropLabel(prop) {
  const LABELS = {
    name:     'nombre',
    value:    'valor',
    operator: 'operador',
    left:     'izquierda',
    right:    'derecha',
    body:     'cuerpo',
    test:     'condición',
    init:     'inicio',
    update:   'actualización',
    callee:   'función',
    object:   'objeto',
    property: 'propiedad',
    argument: 'argumento',
    id:       'identificador',
  };

  return LABELS[prop] ?? prop;
}


function injectStyles() {
  const STYLE_ID = 'ast-tree-styles';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #tree-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 40px 48px;
      overflow: auto;
      background: #f1f5f9;
      min-height: 300px;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    }
    .ast-tree,
    .ast-tree ul {
      display: flex;
      justify-content: center;
      width: max-content;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .ast-tree {
      padding: 0 16px;
    }

    .ast-tree li {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 12px 0;
      position: relative;
    }
    .ast-tree li > ul::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      height: 24px;
      border-left: 2px solid #94a3b8;
      transform: translateX(-50%);
    }
    .ast-tree li::before,
    .ast-tree li::after {
      content: '';
      position: absolute;
      top: 0;
      width: 50%;
      height: 24px;
      border-top: 2px solid #94a3b8;
    }
    .ast-tree li::before { right: 50%; }
    .ast-tree li::after  { left:  50%; }
    .ast-tree li:only-child::before,
    .ast-tree li:only-child::after { border: none; }
    .ast-tree li:only-child         { padding-top: 0; }
    .ast-tree li:first-child::before,
    .ast-tree li:last-child::after  { border: none; }

    .ast-tree li:first-child::after {
      border-left: 2px solid #94a3b8;
      border-radius: 6px 0 0 0;
    }
    .ast-tree li:last-child::before {
      border-right: 2px solid #94a3b8;
      border-radius: 0 6px 0 0;
    }
    .ast-node {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 110px;
      padding: 14px 20px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06);
      position: relative;
      z-index: 1;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      cursor: default;
    }

    .ast-node:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08);
      border-color: #6366f1;
    }
    .ast-node__type {
      font-size: 0.88rem;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .ast-node__value {
      font-size: 0.82rem;
      font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
      color: #0369a1;
      background: #e0f2fe;
      padding: 3px 10px;
      border-radius: 6px;
      max-width: 200px;
      word-break: break-word;
      text-align: center;
    }
  `;

  document.head.appendChild(style);
}

