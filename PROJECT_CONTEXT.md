# Contexto & Histórico do Projeto: Prettify HTML in PHP

Este documento contém o histórico completo de desenvolvimento, decisões arquiteturais e instruções da extensão **Prettify HTML in PHP**, vinculando o histórico da conversa de criação no Antigravity.

---

## 🔗 Referência da Conversa Original
- **Conversation ID**: [`3423bf69-7ac1-434f-ae3c-217a70a52b6c`](conversation://3423bf69-7ac1-434f-ae3c-217a70a52b6c)
- **Data de Criação**: Agosto de 2026

---

## 🎯 Objetivo & Escopo
Criar uma extensão universal para **Antigravity-IDE** e **VS Code** inspirada no "Format HTML in PHP", capaz de formatar HTML dentro de arquivos PHP (`.php`, `.html`, `.blade.php`, `.phtml`), com **regras e exceções de primeira classe para sintaxe Joomla** (como `<jdoc:include ... />`) e estruturas de controle alternativas de templates PHP.

---

## 🏗️ Arquitetura Implementada

1. **Motor de Formatação (`src/formatter.js`)**:
   - **Tratamento de `<jdoc:include>`**: Tags `<jdoc:include ... />` são tratadas nativamente como elementos *void/self-closing*, eliminando o erro clássico de efeito cascata de indentação.
   - **Estruturas de Controle PHP**: Alinhamento hierárquico com o DOM para `if: / elseif: / else: / endif;` e `foreach: / endforeach;`.
   - **Preservação Tipográfica**: Texto inline e tags como `<strong>`, `<a>`, `<span>` mantêm espaçamento tipográfico perfeito sem quebras indesejadas em pontuações.
   - **Preâmbulo PHP Joomla**: Cabeçalhos (`defined('_JEXEC') or die;`, namespaces, `$wa = ...;`) preservados no topo com regras PSR-12.

2. **Integração com o Editor (`src/extension.js`)**:
   - Provedor de `DocumentFormattingEditProvider` e `DocumentRangeFormattingEditProvider`.
   - Suporte a comandos manuais e `editor.formatOnSave`.

3. **Ícone Oficial (`icon.png`)**:
   - Design moderno com chaves de código, indentação e gradiente neon elétrico (índigo/roxo/ciano).

4. **Pacote VSIX (`prettify-html-in-php-1.0.0.vsix`)**:
   - Pacote compilado e pronto para publicação ou instalação manual.

---

## 📁 Estrutura de Arquivos

```
d:/laragon/www/github/vscode-prettify-html-in-php/
├── package.json                   # Manifesto da extensão
├── icon.png                       # Ícone oficial
├── LICENSE                        # Licença MIT
├── README.md                      # Documentação completa
├── PROJECT_CONTEXT.md             # Memória e histórico da conversa
├── prettify-html-in-php-1.0.0.vsix # Pacote VSIX pronto
├── src/
│   ├── extension.js               # Provedor do VS Code / Antigravity
│   └── formatter.js               # Motor de formatação
└── test/
    ├── samples/                   # Casos de teste reais
    └── run-test.js                # Suite de testes automatizada
```

---

## 🧪 Como Rodar os Testes

```powershell
node test/run-test.js
```
*(Todos os 3 testes passam com 100% de sucesso)*.
