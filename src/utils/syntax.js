import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

// Map Prism token types to VS Code Dark+ like colors
const TOKEN_COLORS = {
    'comment': '#6a9955',
    'prolog': '#d4d4d4',
    'doctype': '#d4d4d4',
    'cdata': '#d4d4d4',
    'punctuation': '#d4d4d4',
    'namespace': '#4ec9b0',
    'string': '#ce9178',
    'char': '#ce9178',
    'operator': '#d4d4d4',
    'url': '#ce9178',
    'symbol': '#569cd6',
    'number': '#b5cea8',
    'boolean': '#569cd6',
    'variable': '#9cdcfe',
    'constant': '#4fc1ff',
    'inserted': '#b5cea8',
    'atrule': '#c586c0',
    'keyword': '#569cd6',
    'attr-value': '#ce9178',
    'function': '#dcdcaa',
    'class-name': '#4ec9b0',
    'regex': '#d16969',
    'important': '#569cd6',
    'builtin': '#4ec9b0',
};

export const getSyntaxHighlights = (code, language = 'cpp') => {
    const tokens = Prism.tokenize(code, Prism.languages[language]);

    let charStyles = [];

    const processToken = (token) => {
        if (typeof token === 'string') {
            // Plain text, default color
            for (let i = 0; i < token.length; i++) {
                charStyles.push({ color: '#d4d4d4' }); // Default text color
            }
        } else {
            // Prism Token
            const color = TOKEN_COLORS[token.type] || '#d4d4d4';

            if (Array.isArray(token.content)) {
                token.content.forEach(processToken);
            } else if (typeof token.content === 'string') {
                for (let i = 0; i < token.content.length; i++) {
                    charStyles.push({ color });
                }
            } else {
                processToken(token.content);
            }
        }
    };

    tokens.forEach(processToken);
    return charStyles;
};
