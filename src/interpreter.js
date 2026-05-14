/**
 * interpreter.js
 * Intérprete para MiniJS — recorre el AST y ejecuta el código.
 */

class RuntimeError extends Error {
    constructor(message, line) {
        super(message);
        this.line = line;
    }
}

class Interpreter {
    constructor() {
        this.env    = {};   // variable store
        this.output = [];   // collected output lines
    }

    run(ast) {
        this.visitProgram(ast);
    }

    emit(value) {
        const str = String(value);
        this.output.push(str);
        console.log(str);
    }

    // ── Visitors ────────────────────────────────────────────────────────────────

    visit(node) {
        const method = 'visit' + node.nodeType;
        if (!this[method]) throw new RuntimeError(`Nodo desconocido: ${node.nodeType}`, node.line);
        return this[method](node);
    }

    visitProgram(node) {
        for (const stmt of node.statements) this.visit(stmt);
    }

    visitArrayDeclaration(node) {
        const values = node.list ? node.list.exprs.map(e => this.visit(e)) : [];
        this.env[node.name] = values;
    }

    visitForStatement(node) {
        this.visit(node.init);
        let guard = 0;
        while (this.visit(node.cond) && guard++ < 100000) {
            this.visit(node.block);
            this.visit(node.update);
        }
    }

    visitAssignmentStatement(node) {
        const val = this.visit(node.value);
        this.env[node.name] = val;
        return val;
    }

    visitConsoleStatement(node) {
        const val = this.visit(node.expr);
        this.emit(val);
    }

    visitBlock(node) {
        for (const stmt of node.statements) this.visit(stmt);
    }

    visitExpression(node) {
        let result = this.visit(node.left);
        for (let i = 0; i < node.ops.length; i++) {
            const right = this.visit(node.rights[i]);

            // Comparison operators (used in for condition)
            switch (node.ops[i]) {
                case '+': result = result + right; break;
                case '-': result = result - right; break;
                case '*': result = result * right; break;
                case '/': result = Math.trunc(result / right); break;
                case '<': return result < right ? 1 : 0;
                case '>': return result > right ? 1 : 0;
                case '<=': return result <= right ? 1 : 0;
                case '>=': return result >= right ? 1 : 0;
            }
        }
        return result;
    }

    visitIdentifier(node) {
        if (!(node.name in this.env)) {
            throw new RuntimeError(`Variable no definida: "${node.name}"`, node.line);
        }
        return this.env[node.name];
    }

    visitNumber(node) {
        return node.value;
    }

    visitGroupExpr(node) {
        return this.visit(node.expr);
    }
}

module.exports = { Interpreter };
