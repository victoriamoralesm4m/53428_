grammar MiniJS;

// ===================== PARSER RULES =====================

program
    : statement* EOF
    ;

statement
    : arrayDeclaration
    | forStatement
    | consoleStatement
    ;

arrayDeclaration
    : LET IDENTIFIER ASSIGN LBRACKET expressionList? RBRACKET SEMI
    ;

expressionList
    : expression (COMMA expression)*
    ;

forStatement
    : FOR LPAREN assignmentStatement expression SEMI assignmentStatement RPAREN block
    ;

assignmentStatement
    : IDENTIFIER ASSIGN expression
    ;

consoleStatement
    : CONSOLE DOT LOG LPAREN expression RPAREN SEMI
    ;

block
    : LBRACE statement* RBRACE
    ;

expression
    : term ((PLUS | MINUS | MULT | DIV) term)*
    ;

term
    : IDENTIFIER
    | NUMBER
    | LPAREN expression RPAREN
    ;

// ===================== LEXER RULES =====================

// Keywords
LET     : 'let' ;
FOR     : 'for' ;
CONSOLE : 'console' ;
LOG     : 'log' ;

// Symbols
ASSIGN  : '=' ;
SEMI    : ';' ;
COMMA   : ',' ;
DOT     : '.' ;
LBRACKET: '[' ;
RBRACKET: ']' ;
LPAREN  : '(' ;
RPAREN  : ')' ;
LBRACE  : '{' ;
RBRACE  : '}' ;

// Operators
PLUS    : '+' ;
MINUS   : '-' ;
MULT    : '*' ;
DIV     : '/' ;

// Identifiers & Numbers
IDENTIFIER : [a-zA-Z][a-zA-Z0-9_]* ;
NUMBER     : [0-9]+ ;

// Whitespace & newlines (skip)
WS      : [ \t\r\n]+ -> skip ;

// Single-line comments (skip)
LINE_COMMENT : '//' ~[\r\n]* -> skip ;
