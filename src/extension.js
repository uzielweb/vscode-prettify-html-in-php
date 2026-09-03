/**
 * Prettify HTML in PHP - Extension Entry Point for VS Code & Antigravity IDE
 *
 * Registers formatting providers for PHP, HTML, Blade, and PHTML files.
 * Provides instant document and range formatting with first-class Joomla & framework support.
 *
 * @author Uziel & Team
 * @license MIT
 */

'use strict';

const vscode = require('vscode');
const { PrettifyFormatter } = require('./formatter');

/**
 * Retrieves merged options from VS Code settings and document-specific editor settings
 */
function getFormatterOptions(document, formattingOptions) {
    const config = vscode.workspace.getConfiguration('prettifyHtmlInPhp', document ? document.uri : null);
    const editorConfig = vscode.workspace.getConfiguration('editor', document ? document.uri : null);

    const indentSize = (formattingOptions && typeof formattingOptions.tabSize === 'number')
        ? formattingOptions.tabSize
        : config.get('indentSize', editorConfig.get('tabSize', 4));

    const indentWithTabs = (formattingOptions && typeof formattingOptions.insertSpaces === 'boolean')
        ? !formattingOptions.insertSpaces
        : config.get('indentWithTabs', !editorConfig.get('insertSpaces', true));

    return {
        indentSize,
        indentWithTabs,
        preserveNewlines: config.get('preserveNewlines', true),
        maxPreserveNewlines: config.get('maxPreserveNewlines', 2),
        wrapLineLength: config.get('wrapLineLength', 0),
        indentPhpControlStructures: config.get('indentPhpControlStructures', true),
        joomlaRules: config.get('joomlaRules', true),
        jdocSelfClosing: config.get('jdocSelfClosing', true),
        formatPhpHeader: config.get('formatPhpHeader', true)
    };
}

/**
 * Activates the extension
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const supportedLanguages = ['php', 'html', 'blade', 'phtml'];

    // 1. Document Formatting Provider
    const docProvider = {
        provideDocumentFormattingEdits(document, options) {
            try {
                const text = document.getText();
                const formatterOptions = getFormatterOptions(document, options);
                const formatter = new PrettifyFormatter(formatterOptions);
                const formatted = formatter.format(text);

                if (formatted === text) {
                    return [];
                }

                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(text.length)
                );

                return [vscode.TextEdit.replace(fullRange, formatted)];
            } catch (err) {
                console.error('[Prettify HTML in PHP] Error formatting document:', err);
                vscode.window.showErrorMessage(`Prettify HTML in PHP error: ${err.message}`);
                return [];
            }
        }
    };

    // 2. Document Range Formatting Provider
    const rangeProvider = {
        provideDocumentRangeFormattingEdits(document, range, options) {
            try {
                const text = document.getText(range);
                const formatterOptions = getFormatterOptions(document, options);
                // When formatting a snippet/range, avoid splitting top PHP preamble
                formatterOptions.formatPhpHeader = false;

                const formatter = new PrettifyFormatter(formatterOptions);
                const formatted = formatter.format(text);

                if (formatted === text) {
                    return [];
                }

                return [vscode.TextEdit.replace(range, formatted)];
            } catch (err) {
                console.error('[Prettify HTML in PHP] Error formatting range:', err);
                vscode.window.showErrorMessage(`Prettify HTML in PHP error: ${err.message}`);
                return [];
            }
        }
    };

    // Register Providers for all supported languages
    supportedLanguages.forEach(lang => {
        context.subscriptions.push(
            vscode.languages.registerDocumentFormattingEditProvider(lang, docProvider),
            vscode.languages.registerDocumentRangeFormattingEditProvider(lang, rangeProvider)
        );
    });

    // 3. Manual Command: Prettify Document
    const formatCommand = vscode.commands.registerCommand('prettifyHtmlInPhp.format', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const options = getFormatterOptions(document);
        const formatter = new PrettifyFormatter(options);
        const text = document.getText();
        const formatted = formatter.format(text);

        if (formatted !== text) {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            await editor.edit(editBuilder => {
                editBuilder.replace(fullRange, formatted);
            });
        }
    });

    // 4. Manual Command: Prettify Selection
    const formatSelectionCommand = vscode.commands.registerCommand('prettifyHtmlInPhp.formatSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) return;

        const document = editor.document;
        const selection = editor.selection;
        const options = getFormatterOptions(document);
        options.formatPhpHeader = false;

        const formatter = new PrettifyFormatter(options);
        const text = document.getText(selection);
        const formatted = formatter.format(text);

        if (formatted !== text) {
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, formatted);
            });
        }
    });

    context.subscriptions.push(formatCommand, formatSelectionCommand);
}

/**
 * Deactivates the extension
 */
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
