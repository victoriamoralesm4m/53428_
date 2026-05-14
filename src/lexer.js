/**
 * lexer.js
 * Analizador Léxico para MiniJS
 * Implementado siguiendo la especificación ANTLR4 de MiniJS.g4
 *
 * Tokens:
 *   LET, FOR, CONSOLE, LOG,
 *   ASSIGN, SEMI, COMMA, DOT,
 *   LBRACKET, RBRACKET, LPAREN, RPAREN, LBRACE, RBRACE,
 *   PLUS, MINUS, MULT, DIV,
 *   IDENTIFIER, NUMBER
 */

const TOKEN_TYPES = {
    // Keywords
    LET:        'LET',
    FOR:        'FOR',
    CONSOLE:    'CONSOLE',
    LOG:        'LOG',
    // Symbols
    ASSIGN:     'ASSIGN',
    SEMI:       'SEMI',
    COMMA:      'COMMA',
    DOT:        'DOT',
    LBRACKET:   'LBRACKET',
    RBRACKET:   'RBRACKET',
    LPAREN:     'LPAREN',
    RPAREN:     'RPAREN',
    LBRACE:     'LBRACE',
    RBRACE:     'RBRACE',
    // Operators
    PLUS:       'PLUS',
    MINUS:      'MINUS',
    MULT:       'MULT',
    DIV:        'DIV',
    // Literals / identifiers
    IDENTIFIER: 'IDENTIFIER',
    NUMBER:     'NUMBER',
    // Special
    EOF:        'EOF',
};

const KEYWORDS = {
    'let':     TOKEN_TYPES.LET,
    'for':     TOKEN_TYPES.FOR,
    'console': TOKEN_TYPES.CONSOLE,
    'log':     TOKEN_TYPES.LOG,
};

const SINGLE_CHAR = {
    '=': TOKEN_TYPES.ASSIGN,
    ';': TOKEN_TYPES.SEMI,
    ',': TOKEN_TYPES.COMMA,
    '.': TOKEN_TYPES.DOT,
    '[': TOKEN_TYPES.LBRACKET,
    ']': TOKEN_TYPES.RBRACKET,
    '(': TOKEN_TYPES.LPAREN,
    ')': TOKEN_TYPES.RPAREN,
    '{': TOKEN_TYPES.LBRACE,
    '}': TOKEN_TYPES.RBRACE,
    '+': TOKEN_TYPES.PLUS,
    '-': TOKEN_TYPES.MINUS,
    '*': TOKEN_TYPES.MULT,
    '/': TOKEN_TYPES.DIV,
};

class LexerError extends Error {
    constructor(message, line, column) {
        super(message);
        this.line   = line;
        this.column = column;
    }
}

class Token {
    constructor(type, lexeme, line) {
        this.type   = type;
        this.lexeme = lexeme;
        this.line   = line;
    }
    toString() {
        return `Token(${this.type}, "${this.lexeme}", line=${this.line})`;
    }
}

/**
 * Tokenize source code.
 * Returns { tokens, errors }
 * errors is an array of { line, column, message }
 */
function tokenize(source) {
    const tokens = [];
    const errors = [];
    let pos = 0;
    let line = 1;
    let lineStart = 0;

    function column() { return pos - lineStart + 1; }

    function peek(offset = 0) { return source[pos + offset]; }

    function advance() {
        const ch = source[pos++];
        if (ch === '\n') { line++; lineStart = pos; }
        return ch;
    }

    while (pos < source.length) {
        const startPos  = pos;
        const startLine = line;
        const ch = peek();

        // Skip whitespace
        if (/\s/.test(ch)) { advance(); continue; }

        // Skip line comments  //...
        if (ch === '/' && peek(1) === '/') {
            while (pos < source.length && peek() !== '\n') advance();
            continue;
        }

        // Numbers
        if (/[0-9]/.test(ch)) {
            let num = '';
            while (pos < source.length && /[0-9]/.test(peek())) num += advance();
            tokens.push(new Token(TOKEN_TYPES.NUMBER, num, startLine));
            continue;
        }

        // Identifiers / keywords
        if (/[a-zA-Z]/.test(ch)) {
            let ident = '';
            while (pos < source.length && /[a-zA-Z0-9_]/.test(peek())) ident += advance();
            const type = KEYWORDS[ident] || TOKEN_TYPES.IDENTIFIER;
            tokens.push(new Token(type, ident, startLine));
            continue;
        }

        // Single-char tokens
        if (SINGLE_CHAR[ch] !== undefined) {
            advance();
            tokens.push(new Token(SINGLE_CHAR[ch], ch, startLine));
            continue;
        }

        // Unknown character
        errors.push({
            line: startLine,
            column: column(),
            message: `Carácter no reconocido: '${ch}'`
        });
        advance(); // consume to avoid infinite loop
    }

    tokens.push(new Token(TOKEN_TYPES.EOF, '<EOF>', line));
    return { tokens, errors };
}

module.exports = { TOKEN_TYPES, Token, tokenize };
