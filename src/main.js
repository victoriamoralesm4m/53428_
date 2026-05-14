/**
 * main.js
 * ─────────────────────────────────────────────────────────────────
 * Analizador MiniJS  —  Tema 39568_15
 * ─────────────────────────────────────────────────────────────────
 * Fases:
 *  1. Análisis léxico   → tabla de lexemas/tokens + errores léxicos
 *  2. Análisis sintáctico → árbol concreto (texto) + errores sintácticos
 *  3. Interpretación    → ejecuta el código si no hay errores
 * ─────────────────────────────────────────────────────────────────
 * Uso:  node src/main.js <archivo.txt>
 */

const fs = require('fs');
const { tokenize }   = require('./lexer');
const { Parser }     = require('./parser');
const { Interpreter }= require('./interpreter');
require('./treePrinter');

// ── 0. Read input ────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Uso: node src/main.js <archivo_entrada>');
    process.exit(1);
}
const inputFile = args[0];
if (!fs.existsSync(inputFile)) {
    console.error(`Error: No se encontró el archivo "${inputFile}"`);
    process.exit(1);
}
const sourceCode = fs.readFileSync(inputFile, 'utf-8');

// ── Banner ───────────────────────────────────────────────────────
const BAR = '═'.repeat(62);
const bar  = '─'.repeat(62);

console.log(BAR);
console.log('   ANALIZADOR MiniJS  ·  Tema 39568_15');
console.log(BAR);
console.log(`\n  Archivo: ${inputFile}\n`);

// ════════════════════════════════════════════════════════════════
// FASE 1 — ANÁLISIS LÉXICO
// ════════════════════════════════════════════════════════════════
const { tokens, errors: lexErrors } = tokenize(sourceCode);

console.log(bar);
console.log('  FASE 1 · TABLA DE LEXEMAS — TOKENS');
console.log(bar);
console.log(pad('LEXEMA', 20) + pad('TOKEN', 18) + 'LÍNEA');
console.log(bar);

// Print all tokens except EOF
const visibleTokens = tokens.filter(t => t.type !== 'EOF');
for (const tok of visibleTokens) {
    console.log(pad(tok.lexeme, 20) + pad(tok.type, 18) + tok.line);
}
console.log(bar);
console.log(`  Total de tokens reconocidos: ${visibleTokens.length}`);

// Lexical errors
if (lexErrors.length > 0) {
    console.log(`\n  ✗ Errores léxicos (${lexErrors.length}):`);
    for (const e of lexErrors) {
        console.log(`    Línea ${e.line}, col ${e.column}: ${e.message}`);
    }
} else {
    console.log('\n  ✓ Sin errores léxicos.');
}

// ════════════════════════════════════════════════════════════════
// FASE 2 — ANÁLISIS SINTÁCTICO
// ════════════════════════════════════════════════════════════════
console.log(`\n${bar}`);
console.log('  FASE 2 · ANÁLISIS SINTÁCTICO');
console.log(bar);

const parser = new Parser(tokens);
const ast    = parser.parseProgram();
const synErrors = parser.errors;

if (synErrors.length === 0 && lexErrors.length === 0) {
    console.log('\n  ✓ La entrada es CORRECTA. Sin errores léxicos ni sintácticos.\n');
} else {
    const total = lexErrors.length + synErrors.length;
    console.log(`\n  ✗ Se encontraron ${total} error(es):\n`);
    for (const e of lexErrors) {
        console.log(`  [Léxico]     Línea ${e.line}: ${e.message}`);
    }
    for (const e of synErrors) {
        console.log(`  [Sintáctico] Línea ${e.line}: ${e.message}`);
    }
    console.log();
}

// ════════════════════════════════════════════════════════════════
// FASE 3 — ÁRBOL DE ANÁLISIS SINTÁCTICO
// ════════════════════════════════════════════════════════════════
console.log(bar);
console.log('  FASE 3 · ÁRBOL DE ANÁLISIS SINTÁCTICO (formato texto)');
console.log(bar);
console.log();
printFullTree(ast);
console.log();

// ════════════════════════════════════════════════════════════════
// FASE 4 — INTERPRETACIÓN
// ════════════════════════════════════════════════════════════════
console.log(bar);
console.log('  FASE 4 · INTERPRETACIÓN');
console.log(bar);

const hasErrors = lexErrors.length > 0 || synErrors.length > 0;

if (hasErrors) {
    console.log('\n  ⚠ No se puede interpretar: el código contiene errores.\n');
} else {
    console.log('\n  Código fuente:\n');
    const numberedLines = sourceCode.split('\n').map((l, i) => `  ${String(i+1).padStart(3)}: ${l}`);
    console.log(numberedLines.join('\n'));
    console.log('\n  Salida de ejecución:\n');
    try {
        const interp = new Interpreter();
        interp.run(ast);
        if (interp.output.length === 0) {
            console.log('  (sin salida)');
        }
    } catch (e) {
        console.error(`\n  ✗ Error en tiempo de ejecución: ${e.message}`);
    }
}

console.log(`\n${BAR}\n`);

// ── Helpers ──────────────────────────────────────────────────────
function pad(str, len) {
    str = String(str);
    return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
}

function printFullTree(root) {
    console.log('(program)');
    const children = _kids(root);
    children.forEach((child, i) => {
        _renderFull(child, '', i === children.length - 1);
    });
}

function _renderFull(node, prefix, isLast) {
    if (!node || typeof node !== 'object') return;

    const connector = isLast ? '└── ' : '├── ';
    const childPfx  = isLast ? '    ' : '│   ';

    console.log(prefix + connector + _label(node));

    const children = _kids(node);
    children.forEach((child, i) => {
        _renderFull(child, prefix + childPfx, i === children.length - 1);
    });
}

function _label(node) {
    switch (node.nodeType) {
        case 'Program':            return `(program)`;
        case 'ArrayDeclaration':   return `(arrayDeclaration)  let ${node.name} = [...]`;
        case 'ExpressionList':     return `(expressionList)`;
        case 'ForStatement':       return `(forStatement)  línea ${node.line}`;
        case 'AssignmentStatement':return `(assignmentStatement)  ${node.name} = ...`;
        case 'ConsoleStatement':   return `(consoleStatement)  console.log(...)`;
        case 'Block':              return `(block)`;
        case 'Expression':         return `(expression)  ops=[${node.ops.join(',')}]`;
        case 'Identifier':         return `(term)  IDENTIFIER "${node.name}"`;
        case 'Number':             return `(term)  NUMBER ${node.value}`;
        case 'GroupExpr':          return `(term)  ( expression )`;
        default:                   return `(${node.nodeType})`;
    }
}

function _kids(node) {
    switch (node.nodeType) {
        case 'Program':            return node.statements;
        case 'ArrayDeclaration':   return node.list ? [node.list] : [];
        case 'ExpressionList':     return node.exprs;
        case 'ForStatement':       return [node.init, node.cond, node.update, node.block];
        case 'AssignmentStatement':return [node.value];
        case 'ConsoleStatement':   return [node.expr];
        case 'Block':              return node.statements;
        case 'Expression':         return [node.left, ...node.rights];
        case 'GroupExpr':          return [node.expr];
        default:                   return [];
    }
}
