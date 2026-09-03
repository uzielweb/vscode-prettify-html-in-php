/**
 * Prettify HTML in PHP - Specialized Formatter Engine
 *
 * Universal HTML/PHP Beautifier with first-class Joomla & template framework rules:
 * - Treats <jdoc:include ... /> as self-closing void elements (prevents cascading indent bugs)
 * - Aligns PHP template control structures (if/endif, foreach/endforeach, while/endwhile, switch/endswitch)
 * - Preserves PHP preambles, inline tags (<?= ... ?>) and PHP inside attributes
 * - Formats inline text and formatting tags (a, strong, em, span) with textbook typography spacing
 * - Always keeps container elements (div, header, main, footer, aside, section) and jdoc:include on dedicated indented lines
 * - Formats HTML5 tags, comments, scripts and styles with precision
 *
 * @author Uziel & Team
 * @license MIT
 */

'use strict';

// HTML5 Standard Void Elements
const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', 'command',
    'keygen', 'menuitem', '!doctype'
]);

// Elements that can be compacted onto a single line if short
const INLINE_OR_COMPACT_ELEMENTS = new Set([
    'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button',
    'cite', 'code', 'dfn', 'em', 'i', 'img', 'input', 'kbd',
    'label', 'map', 'object', 'output', 'q', 'samp', 'small',
    'span', 'strong', 'sub', 'sup', 'time', 'tt', 'var',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'title', 'p', 'li', 'td', 'th', 'option'
]);

// Pure inline formatting tags allowed inside compact parent tags
const INLINE_FORMATTING_TAGS = new Set([
    'a', 'abbr', 'b', 'bdo', 'big', 'button', 'cite', 'code',
    'dfn', 'em', 'i', 'img', 'kbd', 'label', 'mark', 'q',
    'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'var'
]);

// Structural container tags that should never be collapsed into a single line
const STRUCTURAL_BLOCK_TAGS = new Set([
    'html', 'head', 'body', 'div', 'header', 'footer', 'main', 'section',
    'article', 'aside', 'nav', 'form', 'fieldset', 'table', 'thead', 'tbody',
    'tfoot', 'ul', 'ol', 'dl', 'select', 'blockquote', 'details', 'dialog',
    'picture', 'video', 'audio', 'svg', 'template'
]);

/**
 * Default formatting options
 */
const DEFAULT_OPTIONS = {
    indentSize: 4,
    indentWithTabs: false,
    preserveNewlines: true,
    maxPreserveNewlines: 2,
    wrapLineLength: 0,
    indentPhpControlStructures: true,
    joomlaRules: true,
    jdocSelfClosing: true,
    formatPhpHeader: true
};

class PrettifyFormatter {
    constructor(options = {}) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);
        this.indentString = this.options.indentWithTabs ? '\t' : ' '.repeat(this.options.indentSize);
    }

    /**
     * Main entry point to format a document or selection
     */
    format(sourceCode) {
        if (!sourceCode || typeof sourceCode !== 'string') {
            return '';
        }

        // Normalize Line Endings to \n for uniform processing
        const isCrlf = sourceCode.includes('\r\n');
        let code = sourceCode.replace(/\r\n/g, '\n');

        // Step 1: Extract and protect Raw Blocks (pre, textarea, script, style, comments)
        const placeholders = [];
        const createPlaceholder = (type, content) => {
            const id = `__PRETTIFY_${type}_${placeholders.length}__`;
            placeholders.push({ id, type, content });
            return id;
        };

        // Protect Comments
        code = code.replace(/<!--[\s\S]*?-->/g, match => {
            return createPlaceholder('COMMENT', match);
        });

        // Protect <script> blocks
        code = code.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, content) => {
            return createPlaceholder('SCRIPT', match);
        });

        // Protect <style> blocks
        code = code.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, content) => {
            return createPlaceholder('STYLE', match);
        });

        // Protect <pre> and <textarea> blocks
        code = code.replace(/<(pre|textarea)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, content) => {
            return createPlaceholder('RAW', match);
        });

        // Step 2: Handle Joomla <jdoc:include ... /> tags
        if (this.options.joomlaRules) {
            code = this.normalizeJoomlaTags(code);
        }

        // Step 3: Handle PHP Blocks & Directives
        const { processedCode, phpPreamble } = this.processPhpBlocks(code, createPlaceholder);

        // Step 4: Format HTML Hierarchy & Indentation
        let formatted = this.formatHtmlStream(processedCode);

        // Step 5: Restore Protected Placeholders
        formatted = this.restorePlaceholders(formatted, placeholders);

        // Step 6: Prepend PHP Preamble if extracted
        if (phpPreamble) {
            formatted = phpPreamble.trim() + '\n' + (formatted ? formatted : '');
        }

        // Final cleanup
        formatted = formatted.trimEnd() + '\n';

        return isCrlf ? formatted.replace(/\n/g, '\r\n') : formatted;
    }

    /**
     * Normalizes Joomla <jdoc:include ... /> tags
     */
    normalizeJoomlaTags(code) {
        const jdocRegex = /<jdoc:include\s+([^>]*?)(\/?>|<\/jdoc:include>)/gi;

        return code.replace(jdocRegex, (match, attrs) => {
            const cleanAttrs = attrs
                .replace(/\s+/g, ' ')
                .replace(/\s*\/\s*$/, '')
                .trim();

            if (this.options.jdocSelfClosing) {
                return `<jdoc:include ${cleanAttrs} />`;
            }
            return `<jdoc:include ${cleanAttrs}/>`;
        });
    }

    /**
     * Process PHP blocks, classify control structures and extract top preamble
     */
    processPhpBlocks(code, createPlaceholder) {
        let phpPreamble = null;
        let workingCode = code;

        // Check if file begins with a pure PHP header block
        const headerMatch = workingCode.match(/^\s*(<\?php\b[\s\S]*?\?>)/i);
        if (headerMatch && this.options.formatPhpHeader) {
            const rawHeader = headerMatch[1];
            const afterHeader = workingCode.substring(headerMatch[0].length).trim();
            const isPurePhpHeader = !rawHeader.includes('<!DOCTYPE') && !rawHeader.includes('<html') &&
                                   (afterHeader.startsWith('<') || afterHeader.length === 0 || rawHeader.includes('defined(') || rawHeader.includes('use Joomla\\') || rawHeader.includes('namespace '));

            if (isPurePhpHeader && (afterHeader.startsWith('<') || afterHeader.length > 0)) {
                phpPreamble = this.formatTopPhpPreamble(rawHeader);
                workingCode = workingCode.substring(headerMatch[0].length);
            }
        }

        // Identify PHP Tags inside HTML
        const phpRegex = /<\?(?:php|=)?[\s\S]*?\?>/gi;

        workingCode = workingCode.replace(phpRegex, match => {
            const trimmed = match.trim();

            if (this.options.indentPhpControlStructures) {
                // Control Open: if(...): foreach(...): while(...): for(...): switch(...):
                const openMatch = trimmed.match(/^<\?php\s+(if|foreach|for|while|switch)\s*(\([^\)]*\)|[^\:]+)?\s*:\s*\?>$/i);
                if (openMatch) {
                    return createPlaceholder('PHP_CTRL_OPEN', trimmed);
                }

                // Control Middle: else: elseif(...): case ...: default:
                const midMatch = trimmed.match(/^<\?php\s+(else\s*:|elseif\s*(\([^\)]*\)|[^\:]+)?\s*:|case\s+[^:]+:|default\s*:)\s*\?>$/i);
                if (midMatch) {
                    return createPlaceholder('PHP_CTRL_MID', trimmed);
                }

                // Control Close: endif; endforeach; endfor; endwhile; endswitch;
                const closeMatch = trimmed.match(/^<\?php\s+(endif|endforeach|endfor|endwhile|endswitch)\s*;\s*\?>$/i);
                if (closeMatch) {
                    return createPlaceholder('PHP_CTRL_CLOSE', trimmed);
                }
            }

            // Inline Short Tag or Single Line Echo
            if (trimmed.startsWith('<?=') || trimmed.match(/^<\?php\s+echo\b.*?\?>$/is) || !trimmed.includes('\n')) {
                return createPlaceholder('PHP_INLINE', trimmed);
            }

            // Multi-line PHP Block
            return createPlaceholder('PHP_BLOCK', this.formatPhpBlockContent(trimmed));
        });

        return { processedCode: workingCode, phpPreamble };
    }

    /**
     * Formats top PHP preamble keeping standard PSR-12 indentation
     */
    formatTopPhpPreamble(phpCode) {
        const lines = phpCode.trim().split('\n');
        if (lines.length <= 1) return phpCode.trim();

        return lines.map(line => {
            return line.replace(/\t/g, this.indentString);
        }).join('\n');
    }

    /**
     * Formats internal PHP block indentation
     */
    formatPhpBlockContent(phpCode) {
        const lines = phpCode.split('\n');
        if (lines.length <= 1) return phpCode.trim();

        const firstLine = lines[0].trim();
        const lastLine = lines[lines.length - 1].trim();

        const innerLines = lines.slice(1, lines.length - 1);
        let minIndent = Infinity;
        for (const line of innerLines) {
            if (line.trim().length === 0) continue;
            const leadingSpaces = line.match(/^\s*/)[0].length;
            if (leadingSpaces < minIndent) minIndent = leadingSpaces;
        }
        if (minIndent === Infinity) minIndent = 0;

        const formattedInner = innerLines.map(line => {
            if (line.trim().length === 0) return '';
            const stripped = line.substring(minIndent);
            return this.indentString + stripped;
        });

        return [firstLine, ...formattedInner, lastLine].join('\n');
    }

    /**
     * Formats the tokenized HTML/PHP stream
     */
    formatHtmlStream(content) {
        const tokens = this.tokenizeHtml(content);

        const lines = [];
        let currentIndent = 0;
        let pendingEmptyLines = 0;

        const addLine = (text, indentLevel, preserveBlank = false) => {
            if (preserveBlank && pendingEmptyLines > 0 && lines.length > 0) {
                const count = Math.min(pendingEmptyLines, this.options.maxPreserveNewlines);
                for (let i = 0; i < count; i++) {
                    lines.push('');
                }
                pendingEmptyLines = 0;
            }

            const indent = this.indentString.repeat(Math.max(0, indentLevel));
            lines.push(indent + text);
        };

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'EMPTY_LINE') {
                if (this.options.preserveNewlines) {
                    pendingEmptyLines++;
                }
                continue;
            }

            if (token.type === 'DOCTYPE') {
                addLine(token.text, currentIndent, true);
                continue;
            }

            // PHP Control Structures
            if (token.type === 'PHP_CTRL_OPEN') {
                addLine(token.text, currentIndent, true);
                currentIndent++;
                continue;
            }

            if (token.type === 'PHP_CTRL_MID') {
                addLine(token.text, currentIndent - 1, true);
                continue;
            }

            if (token.type === 'PHP_CTRL_CLOSE') {
                currentIndent = Math.max(0, currentIndent - 1);
                addLine(token.text, currentIndent, true);
                continue;
            }

            // Joomla <jdoc:include ... /> tags or Void Tags
            if (token.type === 'JOOMLA_TAG' || token.type === 'VOID_TAG') {
                addLine(token.text, currentIndent, true);
                continue;
            }

            // Open Tag: <div>, <header>, <h2>, <p>, etc.
            if (token.type === 'TAG_OPEN') {
                const isStructural = STRUCTURAL_BLOCK_TAGS.has(token.tagName);

                if (!isStructural && INLINE_OR_COMPACT_ELEMENTS.has(token.tagName)) {
                    // Check if we can collapse this element and its inner content into a single line
                    let lookAheadIdx = i + 1;
                    let innerContent = '';
                    let canCollapse = true;
                    let endIdx = -1;

                    while (lookAheadIdx < tokens.length && lookAheadIdx <= i + 30) {
                        const nextTok = tokens[lookAheadIdx];
                        if (nextTok.type === 'TAG_CLOSE' && nextTok.tagName === token.tagName) {
                            endIdx = lookAheadIdx;
                            break;
                        }
                        if (nextTok.type === 'TAG_OPEN') {
                            if (!INLINE_FORMATTING_TAGS.has(nextTok.tagName)) {
                                canCollapse = false;
                                break;
                            }
                        }
                        if (nextTok.type === 'TAG_CLOSE') {
                            if (!INLINE_FORMATTING_TAGS.has(nextTok.tagName)) {
                                canCollapse = false;
                                break;
                            }
                        }
                        if (nextTok.type === 'PHP_CTRL_OPEN' || nextTok.type === 'PHP_CTRL_CLOSE' || nextTok.type === 'PHP_CTRL_MID' || nextTok.type === 'EMPTY_LINE' || nextTok.type === 'PHP_BLOCK' || nextTok.type === 'JOOMLA_TAG') {
                            canCollapse = false;
                            break;
                        }

                        // Determine separator between inline items
                        let separator = '';
                        if (innerContent.length > 0) {
                            const isPunctuation = /^[!?,.:;\)]/.test(nextTok.text);
                            const isClosingTag = nextTok.type === 'TAG_CLOSE';
                            const isOpeningTag = nextTok.type === 'TAG_OPEN';
                            const prevEndsWithOpenTag = /<[a-zA-Z0-9\-:]+[^>]*>$/.test(innerContent);
                            const prevEndsWithCloseTag = /<\/[a-zA-Z0-9\-:]+>$/.test(innerContent);

                            if (isClosingTag || isPunctuation) {
                                separator = '';
                            } else if (prevEndsWithOpenTag) {
                                separator = '';
                            } else if (isOpeningTag || prevEndsWithCloseTag || !innerContent.endsWith(' ')) {
                                separator = ' ';
                            }
                        }

                        innerContent += separator + nextTok.text;
                        lookAheadIdx++;
                    }

                    if (canCollapse && endIdx !== -1 && (token.text.length + innerContent.length + tokens[endIdx].text.length < 120)) {
                        addLine(`${token.text}${innerContent}${tokens[endIdx].text}`, currentIndent, true);
                        i = endIdx;
                        continue;
                    }
                }

                addLine(token.text, currentIndent, true);
                if (!token.isSelfClosing && !VOID_ELEMENTS.has(token.tagName)) {
                    currentIndent++;
                }
                continue;
            }

            // Close Tag: </div>, </header>, etc.
            if (token.type === 'TAG_CLOSE') {
                currentIndent = Math.max(0, currentIndent - 1);
                addLine(token.text, currentIndent, true);
                continue;
            }

            // Standalone Text / Inline / Placeholder
            if (token.type === 'TEXT' || token.type === 'PHP_BLOCK' || token.type === 'PLACEHOLDER') {
                const text = token.text.trim();
                if (text.length > 0) {
                    addLine(text, currentIndent, true);
                }
                continue;
            }
        }

        return lines.join('\n');
    }

    /**
     * Splits stream into HTML/PHP tokens
     */
    tokenizeHtml(content) {
        const tokens = [];
        const lines = content.split('\n');

        const tokenRegex = /(<!DOCTYPE[^>]*>)|(<jdoc:include\b[^>]*\/?>)|(__PRETTIFY_PHP_CTRL_OPEN_\d+__)|(__PRETTIFY_PHP_CTRL_MID_\d+__)|(__PRETTIFY_PHP_CTRL_CLOSE_\d+__)|(__PRETTIFY_PHP_BLOCK_\d+__)|(__PRETTIFY_PHP_INLINE_\d+__)|(__PRETTIFY_(?:COMMENT|SCRIPT|STYLE|RAW)_\d+__)|(<\/?([a-zA-Z0-9\-:]+)(?:\s+[^>]*)?\/?>)/gi;

        let emptyLineStreak = 0;

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.length === 0) {
                emptyLineStreak++;
                if (emptyLineStreak <= this.options.maxPreserveNewlines) {
                    tokens.push({ type: 'EMPTY_LINE' });
                }
                continue;
            }
            emptyLineStreak = 0;

            let lastIndex = 0;
            let match;

            while ((match = tokenRegex.exec(trimmedLine)) !== null) {
                const matchIndex = match.index;
                if (matchIndex > lastIndex) {
                    const textBefore = trimmedLine.substring(lastIndex, matchIndex).trim();
                    if (textBefore.length > 0) {
                        tokens.push({ type: 'TEXT', text: textBefore });
                    }
                }

                const fullMatch = match[0];

                if (match[1]) {
                    tokens.push({ type: 'DOCTYPE', text: fullMatch });
                } else if (match[2]) {
                    tokens.push({ type: 'JOOMLA_TAG', text: fullMatch, tagName: 'jdoc:include' });
                } else if (match[3]) {
                    tokens.push({ type: 'PHP_CTRL_OPEN', text: fullMatch });
                } else if (match[4]) {
                    tokens.push({ type: 'PHP_CTRL_MID', text: fullMatch });
                } else if (match[5]) {
                    tokens.push({ type: 'PHP_CTRL_CLOSE', text: fullMatch });
                } else if (match[6]) {
                    tokens.push({ type: 'PHP_BLOCK', text: fullMatch });
                } else if (match[7]) {
                    tokens.push({ type: 'TEXT', text: fullMatch });
                } else if (match[8]) {
                    tokens.push({ type: 'PLACEHOLDER', text: fullMatch });
                } else if (match[9]) {
                    const rawTag = match[9];
                    const tagName = (match[10] || '').toLowerCase();
                    const isClosing = rawTag.startsWith('</');
                    const isSelfClosing = rawTag.endsWith('/>') || VOID_ELEMENTS.has(tagName) || tagName === 'jdoc:include';

                    if (isClosing) {
                        tokens.push({ type: 'TAG_CLOSE', text: rawTag, tagName });
                    } else if (isSelfClosing) {
                        tokens.push({ type: 'VOID_TAG', text: this.formatTagAttributes(rawTag), tagName, isSelfClosing: true });
                    } else {
                        tokens.push({ type: 'TAG_OPEN', text: this.formatTagAttributes(rawTag), tagName, isSelfClosing: false });
                    }
                }

                lastIndex = matchIndex + fullMatch.length;
            }

            if (lastIndex < trimmedLine.length) {
                const remainingText = trimmedLine.substring(lastIndex).trim();
                if (remainingText.length > 0) {
                    tokens.push({ type: 'TEXT', text: remainingText });
                }
            }
        }

        return tokens;
    }

    /**
     * Formats tag attributes with clean spacing
     */
    formatTagAttributes(tag) {
        if (!tag.includes(' ')) return tag;

        const isClosing = tag.startsWith('</');
        if (isClosing) return tag;

        const isSelfClosing = tag.endsWith('/>');
        const match = tag.match(/^<([a-zA-Z0-9\-:]+)([\s\S]*?)(\/?>)$/);
        if (!match) return tag;

        const tagName = match[1];
        const rawAttrs = match[2].trim();
        const closing = isSelfClosing ? ' />' : '>';

        if (rawAttrs.length === 0) {
            return `<${tagName}${closing}`;
        }

        const cleanAttrs = rawAttrs.replace(/\s+/g, ' ');
        return `<${tagName} ${cleanAttrs}${closing}`;
    }

    /**
     * Restores all protected placeholders with indentation awareness
     */
    restorePlaceholders(code, placeholders) {
        let result = code;

        for (let i = placeholders.length - 1; i >= 0; i--) {
            const item = placeholders[i];
            const placeholderRegex = new RegExp(item.id, 'g');

            if (item.type === 'COMMENT' || item.type === 'SCRIPT' || item.type === 'STYLE' || item.type === 'RAW' || item.type === 'PHP_BLOCK') {
                result = result.replace(new RegExp(`^([ \\t]*).*?${item.id}`, 'gm'), (match, indent) => {
                    const indentedContent = this.applyIndentationToBlock(item.content, indent);
                    return match.replace(item.id, indentedContent);
                });
            }

            result = result.replace(placeholderRegex, item.content);
        }

        return result;
    }

    /**
     * Indents multi-line raw content according to its parent position
     */
    applyIndentationToBlock(content, baseIndent) {
        const lines = content.split('\n');
        if (lines.length <= 1) return content;

        return lines.map((line, idx) => {
            if (idx === 0) return line;
            if (line.trim().length === 0) return '';
            return baseIndent + line;
        }).join('\n');
    }
}

module.exports = {
    PrettifyFormatter,
    DEFAULT_OPTIONS
};
