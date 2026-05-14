/**
 * parser.js
 * Analizador Sintáctico (Descenso Recursivo) para MiniJS
 *
 * Gramática implementada:
 *   Program         ::= { Statement }
 *   Statement       ::= ArrayDeclaration | ForStatement | ConsoleStatement
 *   ArrayDeclaration::= "let" Identifier "=" "[" [ ExpressionList ] "]" ";"
 *   ExpressionList  ::= Expression { "," Expression }
 *   ForStatement    ::= "for" "(" AssignmentStatement Expression ";" AssignmentStatement ")" Block
 *   AssignmentStatement ::= Identifier "=" Expression
 *   ConsoleStatement::= "console" "." "log" "(" Expression ")" ";"
 *   Block           ::= "{" { Statement } "}"
 *   Expression      ::= Term { ("+" | "-" | "*" | "/") Term }
 *   Term            ::= Identifier | Number | "(" Expression ")"
 */

const { TOKEN_TYPES } = require('./lexer');

class ParseError extends Error {
    constructor(message, line) {
        super(message);
        this.line = line;
    }
}

// ─── AST node types ───────────────────────────────────────────────────────────
function node(type, props) {
    return { nodeType: type, ...props };
}

class Parser {
    constructor(tokens) {
        this.tokens  = tokens;
        this.pos     = 0;
        this.errors  = [];
    }

    // ── Token helpers ──────────────────────────────────────────────────────────
    peek() { return this.tokens[this.pos]; }

    advance() {
        const tok = this.tokens[this.pos];
        if (tok.type !== TOKEN_TYPES.EOF) this.pos++;
        return tok;
    }

    check(type) { return this.peek().type === type; }

    match(...types) {
        for (const t of types) {
            if (this.check(t)) { return this.advance(); }
        }
        return null;
    }

    expect(type, description) {
        if (this.check(type)) return this.advance();
        const tok = this.peek();
        const msg = `Se esperaba ${description} pero se encontró "${tok.lexeme}"`;
        this.errors.push({ line: tok.line, message: msg });
        throw new ParseError(msg, tok.line);
    }

    // ── Synchronisation: skip tokens until we find a safe restart point ───────
    synchronize() {
        while (!this.check(TOKEN_TYPES.EOF)) {
            const t = this.peek().type;
            if (t === TOKEN_TYPES.SEMI ||
                t === TOKEN_TYPES.LET  ||
                t === TOKEN_TYPES.FOR  ||
                t === TOKEN_TYPES.CONSOLE) {
                if (t === TOKEN_TYPES.SEMI) this.advance();
                return;
            }
            this.advance();
        }
    }

    // ── Grammar rules ──────────────────────────────────────────────────────────

    /** Program ::= { Statement } */
    parseProgram() {
        const stmts = [];
        const n = node('Program', { statements: stmts, line: 1 });
        while (!this.check(TOKEN_TYPES.EOF)) {
            try {
                stmts.push(this.parseStatement());
            } catch(e) {
                this.synchronize();
            }
        }
        return n;
    }

    /** Statement ::= ArrayDeclaration | ForStatement | ConsoleStatement */
    parseStatement() {
        const tok = this.peek();
        if (tok.type === TOKEN_TYPES.LET)     return this.parseArrayDeclaration();
        if (tok.type === TOKEN_TYPES.FOR)     return this.parseForStatement();
        if (tok.type === TOKEN_TYPES.CONSOLE) return this.parseConsoleStatement();

        const msg = `Sentencia inválida: token inesperado "${tok.lexeme}"`;
        this.errors.push({ line: tok.line, message: msg });
        throw new ParseError(msg, tok.line);
    }

    /** ArrayDeclaration ::= "let" Identifier "=" "[" [ ExpressionList ] "]" ";" */
    parseArrayDeclaration() {
        const letTok = this.expect(TOKEN_TYPES.LET, '"let"');
        const id     = this.expect(TOKEN_TYPES.IDENTIFIER, 'identificador');
        this.expect(TOKEN_TYPES.ASSIGN, '"="');
        this.expect(TOKEN_TYPES.LBRACKET, '"["');
        let list = null;
        if (!this.check(TOKEN_TYPES.RBRACKET)) {
            list = this.parseExpressionList();
        }
        this.expect(TOKEN_TYPES.RBRACKET, '"]"');
        this.expect(TOKEN_TYPES.SEMI, '";"');
        return node('ArrayDeclaration', { name: id.lexeme, list, line: letTok.line });
    }

    /** ExpressionList ::= Expression { "," Expression } */
    parseExpressionList() {
        const exprs = [this.parseExpression()];
        while (this.match(TOKEN_TYPES.COMMA)) {
            exprs.push(this.parseExpression());
        }
        return node('ExpressionList', { exprs, line: exprs[0].line });
    }

    /**
     * ForStatement ::= "for" "(" AssignmentStatement Expression ";" AssignmentStatement ")" Block
     * Note: init AssignmentStatement has NO semicolon; only the separator between
     * condition and update expressions has one.
     */
    parseForStatement() {
        const forTok = this.expect(TOKEN_TYPES.FOR, '"for"');
        this.expect(TOKEN_TYPES.LPAREN, '"("');
        const init = this.parseAssignmentStatement();
        const cond = this.parseExpression();
        this.expect(TOKEN_TYPES.SEMI, '";"');
        const update = this.parseAssignmentStatement();
        this.expect(TOKEN_TYPES.RPAREN, '")"');
        const blk = this.parseBlock();
        return node('ForStatement', { init, cond, update, block: blk, line: forTok.line });
    }

    /** AssignmentStatement ::= Identifier "=" Expression */
    parseAssignmentStatement() {
        const id  = this.expect(TOKEN_TYPES.IDENTIFIER, 'identificador');
        this.expect(TOKEN_TYPES.ASSIGN, '"="');
        const val = this.parseExpression();
        return node('AssignmentStatement', { name: id.lexeme, value: val, line: id.line });
    }

    /** ConsoleStatement ::= "console" "." "log" "(" Expression ")" ";" */
    parseConsoleStatement() {
        const tok = this.expect(TOKEN_TYPES.CONSOLE, '"console"');
        this.expect(TOKEN_TYPES.DOT, '"."');
        this.expect(TOKEN_TYPES.LOG, '"log"');
        this.expect(TOKEN_TYPES.LPAREN, '"("');
        const expr = this.parseExpression();
        this.expect(TOKEN_TYPES.RPAREN, '")"');
        this.expect(TOKEN_TYPES.SEMI, '";"');
        return node('ConsoleStatement', { expr, line: tok.line });
    }

    /** Block ::= "{" { Statement } "}" */
    parseBlock() {
        const lbrace = this.expect(TOKEN_TYPES.LBRACE, '"{"');
        const stmts  = [];
        while (!this.check(TOKEN_TYPES.RBRACE) && !this.check(TOKEN_TYPES.EOF)) {
            try {
                stmts.push(this.parseStatement());
            } catch(e) {
                this.synchronize();
            }
        }
        this.expect(TOKEN_TYPES.RBRACE, '"}"');
        return node('Block', { statements: stmts, line: lbrace.line });
    }

    /** Expression ::= Term { ("+" | "-" | "*" | "/") Term } */
    parseExpression() {
        const left = this.parseTerm();
        const ops  = [];
        const rights = [];
        while (this.match(TOKEN_TYPES.PLUS, TOKEN_TYPES.MINUS, TOKEN_TYPES.MULT, TOKEN_TYPES.DIV)) {
            const op = this.tokens[this.pos - 1];
            ops.push(op.lexeme);
            rights.push(this.parseTerm());
        }
        if (ops.length === 0) return left;
        return node('Expression', { left, ops, rights, line: left.line });
    }

    /** Term ::= Identifier | Number | "(" Expression ")" */
    parseTerm() {
        const tok = this.peek();
        if (tok.type === TOKEN_TYPES.IDENTIFIER) {
            this.advance();
            return node('Identifier', { name: tok.lexeme, line: tok.line });
        }
        if (tok.type === TOKEN_TYPES.NUMBER) {
            this.advance();
            return node('Number', { value: parseInt(tok.lexeme, 10), line: tok.line });
        }
        if (tok.type === TOKEN_TYPES.LPAREN) {
            this.advance();
            const expr = this.parseExpression();
            this.expect(TOKEN_TYPES.RPAREN, '")"');
            return node('GroupExpr', { expr, line: tok.line });
        }
        const msg = `Se esperaba un término (identificador, número o expresión entre paréntesis) pero se encontró "${tok.lexeme}"`;
        this.errors.push({ line: tok.line, message: msg });
        throw new ParseError(msg, tok.line);
    }
}

module.exports = { Parser };
