import * as monaco from 'monaco-editor';
import type { languages, editor, Position, IRange } from 'monaco-editor';
import { LanguageData } from './language';

export const registerThemes = (monacoInstance: typeof monaco) => {
  // Custom Dark Theme Layout Map
  monacoInstance.editor.defineTheme('ticode-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'identifier', foreground: '4fc1ff' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'keyword', foreground: 'c586c0' },
      { token: 'function', foreground: 'dcdcaa' },
      { token: 'method', foreground: 'dcdcaa' },
      { token: 'comment', foreground: '6a9955' },
    ],
    colors: {
      'editor.background': '#151515',
      'editor.lineHighlightBackground': '#1e1e1e',
    }
  });

  // Custom Light Theme Layout Map
  monacoInstance.editor.defineTheme('ticode-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'identifier', foreground: '001080' },
      { token: 'number', foreground: '098658' },
      { token: 'string', foreground: 'a31515' },
      { token: 'keyword', foreground: 'af00db' },
      { token: 'function', foreground: '795e26' },
      { token: 'method', foreground: '795e26' },
      { token: 'comment', foreground: '008000' },
    ],
    colors: {
      'editor.background': '#f9f9f9',
      'editor.lineHighlightBackground': '#f2f2f2',
    }
  });
};

export const registerThingsDBLanguage = (monacoInstance: typeof monaco) => {
  if (monacoInstance.languages.getLanguages().some(lang => lang.id === 'thingsdb')) {
    return;
  }

  registerThemes(monacoInstance);

  monacoInstance.languages.register({ id: 'thingsdb', extensions: ['.ti'] });

  monacoInstance.languages.setMonarchTokensProvider('thingsdb', {
    defaultToken: 'invalid',
    functions: [
      ...Object.keys(LanguageData.collection),
      ...Object.keys(LanguageData.errors),
      ...Object.keys(LanguageData.node),
      ...Object.keys(LanguageData.thingsdb),
      ...Object.keys(LanguageData.procedures),
    ],
    methods: [
      ...Object.keys(LanguageData.types.bytes),
      ...Object.keys(LanguageData.types.closure),
      ...Object.keys(LanguageData.types.datetime),
      ...Object.keys(LanguageData.types.enum),
      ...Object.keys(LanguageData.types.error),
      ...Object.keys(LanguageData.types.future),
      ...Object.keys(LanguageData.types.int),
      ...Object.keys(LanguageData.types.list),
      ...Object.keys(LanguageData.types.mpdata),
      ...Object.keys(LanguageData.types.room),
      ...Object.keys(LanguageData.types.regex),
      ...Object.keys(LanguageData.types.set),
      ...Object.keys(LanguageData.types.string),
      ...Object.keys(LanguageData.types.task),
      ...Object.keys(LanguageData.types.thing),
      ...Object.keys(LanguageData.types.typed),
      ...Object.keys(LanguageData.types.type),
    ],
    controlKeywords: ['nil', 'true', 'false', 'if', 'else', 'return', 'for', 'in', 'break', 'continue'],
    operators: ['*', '/', '%', '//', '+', '-', '&', '^', '|', '<', '>', '==', '!=', '<=', '>=', '&&', '||'],
    symbols: /[=><!~?:&|+\-*/^%#]+/,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    digits: /\d+(_+\d+)*/,
    tokenizer: {
      root: [
        [/[{}]/, 'delimiter.bracket'],
        { include: 'common' }
      ],
      common: [
        [/[A-Za-z_][0-9A-Za-z_$]*/, {
          cases: {
            '@controlKeywords': 'keyword',
            '@functions': 'function',
            '@default': 'identifier',
          }
        }],

        // Methods
        [/(\.)([A-Za-z_][0-9A-Za-z_]*)(\()/, [
          'delimiter',
          { cases: { '@methods': 'method', '@default': 'identifier' } },
          'delimiter'
        ]],

        // Whitespace
        { include: '@whitespace' },

        // Regular expressions
        [/\/(?=([^\\/]|\\.)+\/([gims]*)(\s*)(\.|;|\/|,|\)|\]|\}|$))/, { token: 'regexp', bracket: '@open', next: '@regexp' }],

        // Delimiters and operators
        [/[()[\]]/, '@brackets'],
        [/[<>](?!@symbols)/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'delimiter',
            '@default': 'delimiter'
          }
        }],

        // Numbers
        [/([0-9]+(_+[0-9]+)*)[eE]([-+]?([0-9]+(_+[0-9]+)*))?/, 'number.float'],
        [/([0-9]+(_+[0-9]+)*)\.([0-9]+(_+[0-9]+)*)([eE][-+]?([0-9]+(_+[0-9]+)*))?/, 'number.float'],
        [/0[xX]([[0-9a-fA-F]+(_+[0-9a-fA-F]+)*)/, 'number.hex'],
        [/0[bB]([0-1]+(_+[0-1]+)*)/, 'number.binary'],
        [/([0-9]+(_+[0-9]+)*)/, 'number'],

        [/[;,.]/, 'delimiter'],

        // Strings
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/`/, 'string', '@string_backtick'],
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],

      comment: [
        [/[^/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'],
        ["\\*/", 'comment', '@pop'],
        [/[/*]/, 'comment']
      ],

      string_double: [
        [/[^\\"]+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/"/, 'string', '@pop']
      ],

      string_single: [
        [/[^\\']+/, 'string'],
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/'/, 'string', '@pop']
      ],

      string_backtick: [
        [/\{\{/, 'string'], // Handles double curly bracing text escapes safely

        // When hitting an expression block context like "{a}",
        // colorize the bracket delimiter and push into bracketCounting mode
        [/\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],

        [/[^\\`{]+/, 'string'], // Keeps typing standard letters green/orange string tokens
        [/@escapes/, 'string.escape'],
        [/\\./, 'string.escape.invalid'],
        [/`/, 'string', '@pop'] // When hitting the closing backtick, pop out
      ],

      // Nested for template strings
      bracketCounting: [
        [/\{/, 'delimiter.bracket', '@push'], // nested brace structures

        // When hitting the closing bracket "}", pop out
        [/\}/, 'delimiter.bracket', '@pop'],

        { include: 'common' } // Re-evaluate standard syntax coloring loops
      ],

      // Regular expressions
      regexp: [
        [/[^\\/]/, 'regexp'],
        [/(\/)([gims]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],
      ]
    }
  });

  monacoInstance.languages.setLanguageConfiguration('thingsdb', {
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '\'', close: '\'' },
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: '\'', close: '\'', notIn: ['string', 'comment'] },
    ],
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
  });

  monacoInstance.languages.registerCompletionItemProvider('thingsdb', {
    triggerCharacters: ['.'],
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const suggestions: languages.CompletionItem[] = [];
      const wordInfo = model.getWordUntilPosition(position);
      const defaultRange: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn
      };

      // The developer typed a dot "." -> Suggest context methods
      if (textUntilPosition.endsWith('.')) {
        const methodGroups = [
          ...Object.entries(LanguageData.types.bytes),
          ...Object.entries(LanguageData.types.closure),
          ...Object.entries(LanguageData.types.datetime),
          ...Object.entries(LanguageData.types.enum),
          ...Object.entries(LanguageData.types.error),
          ...Object.entries(LanguageData.types.future),
          ...Object.entries(LanguageData.types.int),
          ...Object.entries(LanguageData.types.list),
          ...Object.entries(LanguageData.types.mpdata),
          ...Object.entries(LanguageData.types.room),
          ...Object.entries(LanguageData.types.regex),
          ...Object.entries(LanguageData.types.set),
          ...Object.entries(LanguageData.types.string),
          ...Object.entries(LanguageData.types.task),
          ...Object.entries(LanguageData.types.thing),
          ...Object.entries(LanguageData.types.typed),
          ...Object.entries(LanguageData.types.type)
        ];

        suggestions.push(...methodGroups.map(([name, docText]) => ({
          label: name,
          kind: monacoInstance.languages.CompletionItemKind.Method,
          insertText: name,
          documentation: docText, // Attach documentation string
          range: defaultRange
        })));
      } else {
        // General Typing -> Suggest global collection functions etc.
        const globalGroups = [
          { data: LanguageData.collection, kind: monacoInstance.languages.CompletionItemKind.Function },
          { data: LanguageData.errors, kind: monacoInstance.languages.CompletionItemKind.Issue },
          { data: LanguageData.node, kind: monacoInstance.languages.CompletionItemKind.Module },
          { data: LanguageData.thingsdb, kind: monacoInstance.languages.CompletionItemKind.Class },
          { data: LanguageData.procedures, kind: monacoInstance.languages.CompletionItemKind.Interface }
        ];

        globalGroups.forEach(({ data, kind }) => {
          suggestions.push(...Object.entries(data).map(([name, docText]) => ({
            label: name,
            kind: kind,
            insertText: name,
            documentation: docText, // Attach documentation string
            range: defaultRange
          })));
        });
      }

      return { suggestions };
    }
  });
};