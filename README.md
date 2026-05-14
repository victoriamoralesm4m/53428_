# Analizador MiniJS — Tema 39568_15

Analizador **léxico y sintáctico** para un subconjunto reducido de JavaScript, implementado en Node.js siguiendo el diseño de gramáticas ANTLR4.

---

## Gramática soportada

```
Program         ::= { Statement }
Statement       ::= ArrayDeclaration | ForStatement | ConsoleStatement
ArrayDeclaration::= "let" Identifier "=" "[" [ ExpressionList ] "]" ";"
ExpressionList  ::= Expression { "," Expression }
ForStatement    ::= "for" "(" AssignmentStatement Expression ";" AssignmentStatement ")" Block
AssignmentStatement ::= Identifier "=" Expression
ConsoleStatement::= "console" "." "log" "(" Expression ")" ";"
Block           ::= "{" { Statement } "}"
Expression      ::= Term { ("+" | "-" | "*" | "/") Term }
Term            ::= Identifier | Number | "(" Expression ")"
Identifier      ::= letter { letter | digit | "_" }
Number          ::= digit { digit }
```

---

## Requisitos

- [Node.js](https://nodejs.org/) v14 o superior
- No se requieren dependencias externas (el proyecto es 100% puro Node.js)

---

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/<tu-usuario>/<tu-legajo>.git
cd <tu-legajo>
```

No es necesario ejecutar `npm install` ya que el proyecto no usa paquetes externos.

---

## Ejecución

```bash
# Con el archivo de entrada por defecto (input.txt)
node src/main.js input.txt

# Con los ejemplos incluidos
node src/main.js examples/correct1.txt   # Entrada correcta 1
node src/main.js examples/correct2.txt   # Entrada correcta 2
node src/main.js examples/error1.txt     # Entrada con error 1
node src/main.js examples/error2.txt     # Entrada con error 2
```

También se pueden usar los scripts npm:

```bash
npm start               # → input.txt
npm run example1        # → examples/correct1.txt
npm run example2        # → examples/correct2.txt
npm run example3        # → examples/error1.txt
npm run example4        # → examples/error2.txt
```

---

## Salida del analizador

El programa produce **4 secciones** de salida:

### 1. Tabla de Lexemas–Tokens
Lista todos los tokens reconocidos con su tipo y número de línea.

```
LEXEMA              TOKEN             LÍNEA
──────────────────────────────────────────
let                 LET               1
numeros             IDENTIFIER        1
=                   ASSIGN            1
...
```

### 2. Análisis léxico y sintáctico
Informa si la entrada es correcta o lista los errores con línea y causa:

```
✓ La entrada es CORRECTA. Sin errores léxicos ni sintácticos.
```

o bien:

```
✗ Se encontraron 2 error(es):
  [Sintáctico] Línea 1: Se esperaba ";" pero se encontró "console"
```

### 3. Árbol de Análisis Sintáctico (formato texto)

```
(program)
├── (arrayDeclaration)  let numeros = [...]
│   └── (expressionList)
│       ├── (term)  NUMBER 1
│       └── (term)  NUMBER 2
└── (consoleStatement)  console.log(...)
    └── (term)  IDENTIFIER "numeros"
```

### 4. Interpretación
Muestra el código fuente con numeración de líneas y ejecuta el programa:

```
Código fuente:
  1: let numeros = [1, 2, 3];
  2: for (i = 3 i; i = i - 1) {
  ...

Salida de ejecución:
3
2
1
0
```

---

## Estructura del proyecto

```
analizador-minijs/
├── src/
│   ├── main.js          ← Punto de entrada principal
│   ├── lexer.js         ← Analizador léxico
│   ├── parser.js        ← Analizador sintáctico (descenso recursivo)
│   ├── interpreter.js   ← Intérprete (recorre el AST)
│   ├── treePrinter.js   ← Impresión del árbol sintáctico
│   └── MiniJS.g4        ← Gramática ANTLR4 de referencia
├── examples/
│   ├── correct1.txt     ← Ejemplo correcto 1
│   ├── correct2.txt     ← Ejemplo correcto 2
│   ├── error1.txt       ← Ejemplo con error 1 (falta ";")
│   └── error2.txt       ← Ejemplo con error 2 (for mal formado)
├── input.txt            ← Archivo de entrada por defecto
├── gramatica.txt        ← Gramática en formato texto
├── package.json
└── README.md
```

---

## Notas sobre la gramática

- Las declaraciones con `let` sólo admiten **arrays**: `let x = [1, 2, 3];`
- Las expresiones sólo admiten operadores aritméticos: `+  -  *  /`
- En el `for`, la condición es una Expression (cualquier valor distinto de 0 es verdadero)
- El inicializador del `for` **no lleva punto y coma**; sólo la separación entre condición y actualización lleva `;`

---

## Autor

Tema: **39568_15**
