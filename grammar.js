/**
 * @file YARA-L 2.0 grammar for tree-sitter
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  primary: 7,
  unary: 6,
  multiplicative: 5,
  additive: 4,
  comparative: 3,
  and: 2,
  or: 1,
}

module.exports = grammar({
  name: 'yaral',

  extras: $ => [
    $.comment,
    $._whitespace,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$._expression, $.match_expression],
    [$.assignment_statement, $._expression]
  ],

  rules: {
    source_file: $ => repeat($.rule_definition),

    rule_definition: $ => seq(
      'rule',
      field('name', $.identifier),
      '{',
      optional(
        repeat1(seq(
          $.section,
        ))),
      '}'
    ),

    section_key: _ => choice(
      'condition',
      'events',
      'match',
      'meta',
      'options',
      'outcome'
    ),

    section: $ => seq(
      $.section_key,
      ':',
      optional(
        $._statements,
      )
    ),

    /**
     * Statements
     **/

    _statements: $ => repeat1(choice(
      $.assignment_statement,
      $.declaration_statement,
      $.expression_statement,
      $.match_statement,
    )),

    assignment_statement: $ => choice(
      seq(
        field('left', $.variable_identifier),
        '=',
        field('right', $._expression),
      ), seq(
        field('left', $._expression),
        '=',
        field('right', $.variable_identifier),
      )),

    declaration_statement: $ => prec(PREC.primary, seq(
      field('left', $.identifier),
      '=',
      field('right', choice(
        $._string_literal,
        $.boolean_literal
      )),
    )),

    expression_statement: $ => $._expression,

    match_statement: $ => $.match_expression,

    /**
     * Expressions
     **/

    _expression: $ => choice(
      $.unary_expression,
      $.binary_expression,
      $.call_expression,
      $.reference_list_expression,
      $.index_expression,
      $.parenthesized_expression,
      $.variable_identifier,
      $._string_literal,
      $.integer_literal,
      $.float_literal,
      $.regex_literal,
      $.null,
    ),

    unary_expression: $ => prec(PREC.unary, seq(
      field('operator', choice('all', 'any', 'not')),
      field('operand', $._expression),
    )),

    binary_expression: $ => {
      const table = [
        [PREC.multiplicative, choice('*', '/')],
        [PREC.additive, choice('+', '-')],
        [PREC.comparative, choice('=', '!=', '<', '<=', '>', '>=')],
        [PREC.and, 'and'],
        [PREC.or, 'or'],
      ];

      return choice(...table.map(([precedence, operator]) =>
        // @ts-ignore
        prec.left(precedence, seq(
          field('left', $._expression),
          // @ts-ignore
          field('operator', operator),
          field('right', $._expression),
        )),
      ));
    },

    call_expression: $ => prec(PREC.primary, choice(
      seq(
        field('function', $.function_expression),
        field('arguments', $.argument_list),
      ),
    )),

    reference_list_expression: $ => prec(1, seq(
      $.variable_identifier,
      optional('not'),
      'in',
      optional(choice('regex', 'cidr')),
      seq('%', $.identifier)
    )),

    match_expression: $ => prec.left(seq(
      $.variable_identifier,
      optional(repeat(seq(',', $.variable_identifier))),
      optional(
        seq(
          optional('not'),
          'over',
          $.duration_literal,
          optional(seq(
            choice('before', 'after'),
            $.variable_identifier,
          ))
        ),
      ),
    )),

    index_expression: $ => prec(PREC.primary, seq(
      field('operand', $.variable_identifier),
      '[',
      field('index', choice($._string_literal, $.integer_literal)),
      ']',
    )),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')',
    ),

    variable_identifier: $ => seq(
      '$',
      $.identifier,
      optional(
        field('attribute', $.attribute_identifier)
      )
    ),

    /**
     * Literal expressions
     **/

    _string_literal: $ => choice(
      $.raw_string_literal,
      $.interpreted_string_literal,
    ),

    raw_string_literal: _ => token(seq(
      '`',
      repeat(/[^`]/),
      '`',
    )),

    interpreted_string_literal: $ => seq(
      '"',
      repeat(choice(
        $._interpreted_string_literal_basic_content,
        $.escape_sequence,
      )),
      token.immediate('"'),
    ),

    _interpreted_string_literal_basic_content: _ => token.immediate(prec(1, /[^"\n\\]+/)),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xuU]/,
        /\d{2,3}/,
        /x[0-9a-fA-F]{2,}/,
        /u[0-9a-fA-F]{4}/,
        /U[0-9a-fA-F]{8}/,
      ),
    )),

    integer_literal: _ => /\d+/,

    float_literal: _ => token(choice(
      seq(/[0-9]+/, '.', optional(/[0-9]+/)),
      /[0-9]+/,
      seq('.', /[0-9]+/),
    )),

    duration_literal: $ => seq(
      $.integer_literal,
      choice('m', 'h', 'd')
    ),

    regex_literal: _ => token(seq(
      '/',
      /[^/\\\*]/,
      repeat(choice(
        /[^/\\]/,
        seq('\\', /./)
      )),
      '/'
    )),

    boolean_literal: _ => choice('true', 'false'),

    null: _ => 'null',


    /**
     * Others
     **/

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    attribute_identifier: _ => /\.[a-zA-Z][a-zA-Z0-9_\.]*/,

    nocase: _ => 'nocase',

    function_expression: $ => seq(
      field('operand', $.identifier),
      optional(
        field(
          'field',
          seq('.', $.identifier)
        )
      )
    ),

    argument_list: $ => seq(
      '(',
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression)),
      )),
      ')',
    ),


    /**
     * Extras
     **/

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: _ => token(choice(
      seq('//', /(\\+(.|\r?\n)|[^\\\n])*/),
      seq(
        '/*',
        /[^*]*\*+([^/*][^*]*\*+)*/,
        '/',
      ),
    )),

    _whitespace: _ => token(/\s/),

    not_operator: _ => '!',
  },
});
