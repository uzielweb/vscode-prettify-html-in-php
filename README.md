# Prettify HTML in PHP (with Joomla & Framework Rules) 🚀

[![Visual Studio Marketplace](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-informational.svg)](https://github.com/uzielweb/vscode-prettify-html-in-php/releases)

A high-fidelity extension for **VS Code** and **Antigravity IDE** to format, align, and beautify HTML embedded inside PHP files (`.php`, `.phtml`, `.blade.php`, `.html`). Inspired by the classic *Format HTML in PHP*, modernized and supercharged with **first-class support for Joomla CMS syntax** (such as `<jdoc:include ... />`) and alternative PHP template control structures.

---

## ✨ Key Features

- **🌐 Universal PHP + HTML Formatting**: Seamlessly formats HTML intermingled with PHP in any modern or legacy project (Joomla, WordPress, Laravel Blade, Symfony, or Vanilla PHP).
- **🛡️ First-Class Joomla Protection (`<jdoc:include>` Rules)**:
  - Treats `<jdoc:include ... />` as native *void / self-closing* elements.
  - **Zero Cascading Indentation**: Solves the notorious issue in standard HTML formatters where `<jdoc:include>` caused infinite trailing tabs/spaces across the entire document.
  - Enforces clean self-closing syntax (` />`) without mangling inner attributes.
- **📐 Structural Alignment for PHP Template Control Flow**:
  - `<?php if (...) : ?>` ... `<?php elseif (...) : ?>` ... `<?php else : ?>` ... `<?php endif; ?>`
  - `<?php foreach (...) : ?>` ... `<?php endforeach; ?>`
  - `<?php while (...) : ?>` ... `<?php endwhile; ?>`
  - `<?php switch (...) : ?>` ... `<?php endswitch; ?>`
  - Inner HTML nodes and child blocks are indented hierarchically with pixel-perfect consistency relative to their parent control structure.
- **🏷️ Preservation of Short Tags & Inline Expressions**:
  - Safely keeps `<?= $var ?>` and `<?php echo $var; ?>` inline within text blocks and HTML tag attributes (e.g. `<div class="<?= $class ?>" id="<?php echo $id; ?>">`).
- **📑 Clean PHP Preamble & Headers**:
  - Preserves and aligns header security checks (`defined('_JEXEC') or die;`), namespaces, use statements (`use Joomla\...;`), and asset manager declarations (`$wa = ...;`) adhering to PSR-12 conventions.
- **⚡ Zero Runtime Dependencies**:
  - Extremely lightweight, standalone pure JavaScript/Node.js engine running within the editor.
- **💾 Format on Save & Format Selection**:
  - Full support for VS Code's `editor.formatOnSave` and selective block formatting (`Format Selection`).

---

## 📦 Installation in VS Code & Antigravity IDE

### Option 1: Install via GUI (VSIX)
1. Download `prettify-html-in-php-1.0.0.vsix` from the [Latest Releases](https://github.com/uzielweb/vscode-prettify-html-in-php/releases).
2. In **VS Code** or **Antigravity IDE**, open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Click the three dots menu (**...**) in the top-right corner of the Extensions panel.
4. Select **"Install from VSIX..."** and pick the downloaded `.vsix` file.

### Option 2: Install via Command Line (CLI)
```bash
# For VS Code
code --install-extension prettify-html-in-php-1.0.0.vsix

# For Antigravity IDE (if aliased)
agy --install-extension prettify-html-in-php-1.0.0.vsix
```

---

## ⚙️ Recommended Configuration (`settings.json`)

To set **Prettify HTML in PHP** as your default formatter for PHP files with automatic formatting on save, add the following to your user or workspace `settings.json`:

```json
{
    "[php]": {
        "editor.defaultFormatter": "uziel.prettify-html-in-php",
        "editor.formatOnSave": true
    },
    "prettifyHtmlInPhp.indentSize": 4,
    "prettifyHtmlInPhp.indentWithTabs": false,
    "prettifyHtmlInPhp.preserveNewlines": true,
    "prettifyHtmlInPhp.maxPreserveNewlines": 2,
    "prettifyHtmlInPhp.indentPhpControlStructures": true,
    "prettifyHtmlInPhp.joomlaRules": true,
    "prettifyHtmlInPhp.jdocSelfClosing": true,
    "prettifyHtmlInPhp.formatPhpHeader": true
}
```

---

## 🔧 Configuration Settings

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `prettifyHtmlInPhp.indentSize` | `integer` | `4` | Indentation size in spaces. |
| `prettifyHtmlInPhp.indentWithTabs` | `boolean` | `false` | Use tab characters for indentation instead of spaces. |
| `prettifyHtmlInPhp.preserveNewlines` | `boolean` | `true` | Preserve empty lines in the document. |
| `prettifyHtmlInPhp.maxPreserveNewlines` | `integer` | `2` | Maximum number of consecutive blank lines to preserve. |
| `prettifyHtmlInPhp.wrapLineLength` | `integer` | `0` | Maximum line length before wrapping attributes (`0` disables wrapping). |
| `prettifyHtmlInPhp.indentPhpControlStructures` | `boolean` | `true` | Indent HTML code inside PHP control structures (`if/endif`, `foreach/endforeach`, etc.). |
| `prettifyHtmlInPhp.joomlaRules` | `boolean` | `true` | Enable specialized rules for Joomla templates (preserves `<jdoc:include ... />` without cascading indent). |
| `prettifyHtmlInPhp.jdocSelfClosing` | `boolean` | `true` | Enforce clean self-closing syntax for `<jdoc:include ... />`. |
| `prettifyHtmlInPhp.formatPhpHeader` | `boolean` | `true` | Format and align pure PHP preamble at the beginning of the file. |

---

## 💻 Formatted Output Example (Joomla Cassiopeia Template)

```php
<?php
defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;

$app = Factory::getApplication();
$wa  = $this->document->getWebAssetManager();
$wa->useStyle('template.cassiopeia');
$wa->useScript('template.cassiopeia');
?>
<!DOCTYPE html>

<html lang="<?php echo $this->language; ?>" dir="<?php echo $this->direction; ?>">
    <head>
        <jdoc:include type="metas" />
        <jdoc:include type="styles" />
        <jdoc:include type="scripts" />
    </head>
    <body class="site-body">
        <header class="header">
            <?php if ($this->countModules('topbar')) : ?>
                <div class="container-topbar">
                    <jdoc:include type="modules" name="topbar" style="none" />
                </div>
            <?php endif; ?>
            <div class="container-banner">
                <jdoc:include type="modules" name="banner" style="card" />
            </div>
        </header>
        <div class="site-content container">
            <jdoc:include type="message" />
            <main class="main-body">
                <jdoc:include type="component" />
            </main>
            <?php if ($this->countModules('sidebar-right')) : ?>
                <aside class="sidebar">
                    <jdoc:include type="modules" name="sidebar-right" style="card" />
                </aside>
            <?php endif; ?>
        </div>
        <footer class="footer">
            <jdoc:include type="modules" name="footer" style="none" />
        </footer>
    </body>
</html>
```

---

## 📄 License

[MIT License](LICENSE) © [Uziel Almeida Oliveira](https://github.com/uzielweb) - Free for personal and commercial use.
