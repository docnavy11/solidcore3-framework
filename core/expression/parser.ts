// Safe Expression Parser - Minimal implementation for standard JavaScript expressions
// Supports: ==, !=, >, <, >=, <=, &&, ||, !, parentheses, string/number/boolean literals

export interface ParseResult {
  success: boolean;
  value?: boolean;
  error?: string;
}

export enum TokenType {
  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  IDENTIFIER = 'IDENTIFIER',
  
  // Comparison operators
  EQUALS = 'EQUALS',           // ==
  NOT_EQUALS = 'NOT_EQUALS',   // !=
  GREATER = 'GREATER',         // >
  LESS = 'LESS',              // <
  GREATER_EQ = 'GREATER_EQ',   // >=
  LESS_EQ = 'LESS_EQ',        // <=
  
  // Logical operators
  AND = 'AND',                // &&
  OR = 'OR',                  // ||
  NOT = 'NOT',                // !
  
  // Structure
  LPAREN = 'LPAREN',          // (
  RPAREN = 'RPAREN',          // )
  EOF = 'EOF'
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export class ExpressionLexer {
  private pos = 0;
  private current = '';
  
  constructor(private expression: string) {
    this.current = this.expression[0] || '';
  }
  
  private advance(): void {
    this.pos++;
    this.current = this.pos < this.expression.length ? this.expression[this.pos] : '';
  }
  
  private peek(offset = 1): string {
    const peekPos = this.pos + offset;
    return peekPos < this.expression.length ? this.expression[peekPos] : '';
  }
  
  private skipWhitespace(): void {
    while (this.current && /\s/.test(this.current)) {
      this.advance();
    }
  }
  
  private readString(): string {
    const quote = this.current;
    this.advance(); // Skip opening quote
    
    let value = '';
    while (this.current && this.current !== quote) {
      if (this.current === '\\') {
        this.advance();
        // Handle escape sequences
        switch (this.current) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += this.current; break;
        }
      } else {
        value += this.current;
      }
      this.advance();
    }
    
    if (this.current !== quote) {
      throw new Error(`Unterminated string starting at position ${this.pos}`);
    }
    
    this.advance(); // Skip closing quote
    return value;
  }
  
  private readNumber(): string {
    let value = '';
    while (this.current && /[\d.]/.test(this.current)) {
      value += this.current;
      this.advance();
    }
    return value;
  }
  
  private readIdentifier(): string {
    let value = '';
    while (this.current && /[a-zA-Z0-9_.]/.test(this.current)) {
      value += this.current;
      this.advance();
    }
    return value;
  }
  
  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.pos < this.expression.length) {
      this.skipWhitespace();
      
      if (!this.current) break;
      
      const startPos = this.pos;
      
      // String literals
      if (this.current === '"' || this.current === "'") {
        const value = this.readString();
        tokens.push({ type: TokenType.STRING, value, position: startPos });
        continue;
      }
      
      // Numbers
      if (/\d/.test(this.current)) {
        const value = this.readNumber();
        tokens.push({ type: TokenType.NUMBER, value, position: startPos });
        continue;
      }
      
      // Two-character operators
      if (this.current === '=' && this.peek() === '=') {
        tokens.push({ type: TokenType.EQUALS, value: '==', position: startPos });
        this.advance();
        this.advance();
        continue;
      }
      
      if (this.current === '!' && this.peek() === '=') {
        tokens.push({ type: TokenType.NOT_EQUALS, value: '!=', position: startPos });
        this.advance();
        this.advance();
        continue;
      }
      
      if (this.current === '>' && this.peek() === '=') {
        tokens.push({ type: TokenType.GREATER_EQ, value: '>=', position: startPos });
        this.advance();
        this.advance();
        continue;
      }
      
      if (this.current === '<' && this.peek() === '=') {
        tokens.push({ type: TokenType.LESS_EQ, value: '<=', position: startPos });
        this.advance();
        this.advance();
        continue;
      }
      
      if (this.current === '&' && this.peek() === '&') {
        tokens.push({ type: TokenType.AND, value: '&&', position: startPos });
        this.advance();
        this.advance();
        continue;
      }
      
      if (this.current === '|' && this.peek() === '|') {
        tokens.push({ type: TokenType.OR, value: '||', position: startPos });
        this.advance();
        this.advance();
        continue;
      }
      
      // Single-character operators
      switch (this.current) {
        case '>':
          tokens.push({ type: TokenType.GREATER, value: '>', position: startPos });
          this.advance();
          continue;
        case '<':
          tokens.push({ type: TokenType.LESS, value: '<', position: startPos });
          this.advance();
          continue;
        case '!':
          tokens.push({ type: TokenType.NOT, value: '!', position: startPos });
          this.advance();
          continue;
        case '(':
          tokens.push({ type: TokenType.LPAREN, value: '(', position: startPos });
          this.advance();
          continue;
        case ')':
          tokens.push({ type: TokenType.RPAREN, value: ')', position: startPos });
          this.advance();
          continue;
      }
      
      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(this.current)) {
        const value = this.readIdentifier();
        
        // Check for boolean literals
        if (value === 'true' || value === 'false') {
          tokens.push({ type: TokenType.BOOLEAN, value, position: startPos });
        } else {
          tokens.push({ type: TokenType.IDENTIFIER, value, position: startPos });
        }
        continue;
      }
      
      throw new Error(`Unexpected character '${this.current}' at position ${this.pos}`);
    }
    
    tokens.push({ type: TokenType.EOF, value: '', position: this.pos });
    return tokens;
  }
}

// AST Node types
export interface ASTNode {
  type: string;
}

export interface LiteralNode extends ASTNode {
  type: 'literal';
  value: string | number | boolean;
}

export interface IdentifierNode extends ASTNode {
  type: 'identifier';
  name: string;
}

export interface BinaryOpNode extends ASTNode {
  type: 'binary';
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode extends ASTNode {
  type: 'unary';
  operator: string;
  operand: ASTNode;
}

export class ExpressionParser {
  private tokens: Token[] = [];
  private pos = 0;
  private current: Token;
  
  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.current = tokens[0];
  }
  
  private advance(): void {
    this.pos++;
    this.current = this.pos < this.tokens.length ? this.tokens[this.pos] : this.tokens[this.tokens.length - 1];
  }
  
  private expect(tokenType: TokenType): Token {
    if (this.current.type !== tokenType) {
      throw new Error(`Expected ${tokenType} but got ${this.current.type} at position ${this.current.position}`);
    }
    const token = this.current;
    this.advance();
    return token;
  }
  
  parse(): ASTNode {
    const result = this.parseOrExpression();
    this.expect(TokenType.EOF);
    return result;
  }
  
  // OR has lowest precedence
  private parseOrExpression(): ASTNode {
    let left = this.parseAndExpression();
    
    while (this.current.type === TokenType.OR) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseAndExpression();
      left = { type: 'binary', operator, left, right } as BinaryOpNode;
    }
    
    return left;
  }
  
  // AND has higher precedence than OR
  private parseAndExpression(): ASTNode {
    let left = this.parseComparisonExpression();
    
    while (this.current.type === TokenType.AND) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseComparisonExpression();
      left = { type: 'binary', operator, left, right } as BinaryOpNode;
    }
    
    return left;
  }
  
  // Comparison operators
  private parseComparisonExpression(): ASTNode {
    let left = this.parseUnaryExpression();
    
    const comparisonOps = [
      TokenType.EQUALS, TokenType.NOT_EQUALS,
      TokenType.GREATER, TokenType.LESS,
      TokenType.GREATER_EQ, TokenType.LESS_EQ
    ];
    
    while (comparisonOps.includes(this.current.type)) {
      const operator = this.current.value;
      this.advance();
      const right = this.parseUnaryExpression();
      left = { type: 'binary', operator, left, right } as BinaryOpNode;
    }
    
    return left;
  }
  
  // Unary operators (!, etc.)
  private parseUnaryExpression(): ASTNode {
    if (this.current.type === TokenType.NOT) {
      const operator = this.current.value;
      this.advance();
      const operand = this.parseUnaryExpression();
      return { type: 'unary', operator, operand } as UnaryOpNode;
    }
    
    return this.parsePrimaryExpression();
  }
  
  // Primary expressions (literals, identifiers, parentheses)
  private parsePrimaryExpression(): ASTNode {
    switch (this.current.type) {
      case TokenType.STRING:
        const stringValue = this.current.value;
        this.advance();
        return { type: 'literal', value: stringValue } as LiteralNode;
        
      case TokenType.NUMBER:
        const numberValue = parseFloat(this.current.value);
        this.advance();
        return { type: 'literal', value: numberValue } as LiteralNode;
        
      case TokenType.BOOLEAN:
        const boolValue = this.current.value === 'true';
        this.advance();
        return { type: 'literal', value: boolValue } as LiteralNode;
        
      case TokenType.IDENTIFIER:
        const name = this.current.value;
        this.advance();
        return { type: 'identifier', name } as IdentifierNode;
        
      case TokenType.LPAREN:
        this.advance(); // Skip '('
        const expr = this.parseOrExpression();
        this.expect(TokenType.RPAREN);
        return expr;
        
      default:
        throw new Error(`Unexpected token ${this.current.type} at position ${this.current.position}`);
    }
  }
}

export class SafeExpressionEvaluator {
  evaluate(ast: ASTNode, context: Record<string, any>): any {
    switch (ast.type) {
      case 'literal':
        return (ast as LiteralNode).value;
        
      case 'identifier':
        const name = (ast as IdentifierNode).name;
        return this.resolveIdentifier(name, context);
        
      case 'binary':
        const binary = ast as BinaryOpNode;
        const left = this.evaluate(binary.left, context);
        const right = this.evaluate(binary.right, context);
        return this.evaluateBinaryOperation(binary.operator, left, right);
        
      case 'unary':
        const unary = ast as UnaryOpNode;
        const operand = this.evaluate(unary.operand, context);
        return this.evaluateUnaryOperation(unary.operator, operand);
        
      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }
  
  private resolveIdentifier(name: string, context: Record<string, any>): any {
    // Support dot notation for nested properties (e.g., "user.role")
    const parts = name.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value == null || typeof value !== 'object') {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  private evaluateBinaryOperation(operator: string, left: any, right: any): any {
    switch (operator) {
      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '>':
        return left > right;
      case '<':
        return left < right;
      case '>=':
        return left >= right;
      case '<=':
        return left <= right;
      case '&&':
        return !!left && !!right;
      case '||':
        return !!left || !!right;
      default:
        throw new Error(`Unknown binary operator: ${operator}`);
    }
  }
  
  private evaluateUnaryOperation(operator: string, operand: any): any {
    switch (operator) {
      case '!':
        return !operand;
      default:
        throw new Error(`Unknown unary operator: ${operator}`);
    }
  }
}

export class SafeExpressionParser {
  private lexer: ExpressionLexer;
  private parser: ExpressionParser;
  private evaluator: SafeExpressionEvaluator;
  
  constructor() {
    this.evaluator = new SafeExpressionEvaluator();
  }
  
  /**
   * Evaluate a boolean expression safely
   * @param expression - The expression string to evaluate
   * @param context - Variables available in the expression
   * @returns ParseResult with success status and value or error
   */
  evaluate(expression: string, context: Record<string, any> = {}): ParseResult {
    try {
      // Lexical analysis
      this.lexer = new ExpressionLexer(expression);
      const tokens = this.lexer.tokenize();
      
      // Parsing
      this.parser = new ExpressionParser(tokens);
      const ast = this.parser.parse();
      
      // Evaluation
      const value = this.evaluator.evaluate(ast, context);
      
      // Ensure result is boolean
      return {
        success: true,
        value: !!value
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Validate expression syntax without evaluating
   * @param expression - The expression string to validate
   * @returns ParseResult with success status and any syntax errors
   */
  validate(expression: string): ParseResult {
    try {
      this.lexer = new ExpressionLexer(expression);
      const tokens = this.lexer.tokenize();
      
      this.parser = new ExpressionParser(tokens);
      this.parser.parse();
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}