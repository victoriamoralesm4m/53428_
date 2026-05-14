/**
 * treePrinter.js
 * Imprime el Árbol de Análisis Sintáctico Concreto en formato de texto.
 */

function printTree(ast) {
    const lines = [];
    renderNode(ast, '', true, lines);
    return lines.join('\n');
}

function renderNode(node, prefix, isLast, lines) {
    if (!node || typeof node !== 'object') return;

    const connector = isLast ? '└── ' : '├── ';
    const childPfx  = isLast ? '    ' : '│   ';

    const label = nodeLabel(node);
    lines.push(prefix + connector + label);

    const children = getChildren(node);
    children.forEach((child, i) => {
        const last = (i === children.length - 1);
        renderNode(child, prefix + childPfx, last, lines);
    });
}

function nodeLabel(node) {
    switch (node.nodeType) {
        case 'Program':            return `(program)`;
        case 'ArrayDeclaration':   return `(arrayDeclaration) let ${node.name}`;
        case 'ExpressionList':     return `(expressionList)`;
        case 'ForStatement':       return `(forStatement) — línea ${node.line}`;
        case 'AssignmentStatement':return `(assignmentStatement) ${node.name} =`;
        case 'ConsoleStatement':   return `(consoleStatement) console.log(...)`;
        case 'Block':              return `(block)`;
        case 'Expression':         return `(expression) ops: [${node.ops.join(', ')}]`;
        case 'Identifier':         return `(term/identifier) "${node.name}"`;
        case 'Number':             return `(term/number) ${node.value}`;
        case 'GroupExpr':          return `(term/grouped)`;
        default:                   return `(${node.nodeType})`;
    }
}

function getChildren(node) {
    switch (node.nodeType) {
        case 'Program':
            return node.statements;
        case 'ArrayDeclaration':
            return node.list ? [node.list] : [];
        case 'ExpressionList':
            return node.exprs;
        case 'ForStatement':
            return [node.init, node.cond, node.update, node.block];
        case 'AssignmentStatement':
            return [node.value];
        case 'ConsoleStatement':
            return [node.expr];
        case 'Block':
            return node.statements;
        case 'Expression': {
            const kids = [node.left];
            for (const r of node.rights) kids.push(r);
            return kids;
        }
        case 'GroupExpr':
            return [node.expr];
        default:
            return [];
    }
}

module.exports = { printTree };
