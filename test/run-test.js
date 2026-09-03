/**
 * Automated Test Runner for Prettify HTML in PHP Formatter Engine
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PrettifyFormatter } = require('../src/formatter');

function runTests() {
    console.log('='.repeat(70));
    console.log('🧪 RUNNING PRETTIFY HTML IN PHP TEST SUITE');
    console.log('='.repeat(70));

    const samplesDir = path.join(__dirname, 'samples');
    const samples = fs.readdirSync(samplesDir).filter(f => f.endsWith('.php'));

    const formatter = new PrettifyFormatter({
        indentSize: 4,
        indentWithTabs: false,
        preserveNewlines: true,
        maxPreserveNewlines: 2,
        joomlaRules: true,
        jdocSelfClosing: true,
        indentPhpControlStructures: true
    });

    let passedTests = 0;

    for (const sampleFile of samples) {
        console.log(`\n📄 Testing sample: ${sampleFile}`);
        const filePath = path.join(samplesDir, sampleFile);
        const sourceCode = fs.readFileSync(filePath, 'utf8');

        const formatted = formatter.format(sourceCode);

        // Validation Checks:
        const lines = formatted.split('\n');

        // Check 1: Output is not empty
        if (!formatted || formatted.trim().length === 0) {
            console.error(`❌ FAIL: Formatted output is empty for ${sampleFile}`);
            continue;
        }

        // Check 2: Joomla tags verification
        if (sampleFile.includes('joomla')) {
            const jdocMatches = formatted.match(/<jdoc:include\b[^>]*\/>/g);
            if (!jdocMatches || jdocMatches.length < 7) {
                console.error(`❌ FAIL: Joomla jdoc:include tags missing or malformed in ${sampleFile}`);
                continue;
            }

            // Verify jdoc:include does NOT cause cascading indent
            const metasLine = lines.find(l => l.includes('type="metas"'));
            const stylesLine = lines.find(l => l.includes('type="styles"'));
            const scriptsLine = lines.find(l => l.includes('type="scripts"'));

            const metasIndent = metasLine ? metasLine.match(/^\s*/)[0].length : -1;
            const stylesIndent = stylesLine ? stylesLine.match(/^\s*/)[0].length : -1;
            const scriptsIndent = scriptsLine ? scriptsLine.match(/^\s*/)[0].length : -1;

            if (metasIndent !== stylesIndent || stylesIndent !== scriptsIndent) {
                console.error(`❌ FAIL: jdoc cascading indent detected! Indents: metas=${metasIndent}, styles=${stylesIndent}, scripts=${scriptsIndent}`);
                continue;
            }

            // Check component inside main
            const componentLine = lines.find(l => l.includes('type="component"'));
            const messageLine = lines.find(l => l.includes('type="message"'));
            const componentIndent = componentLine ? componentLine.match(/^\s*/)[0].length : -1;
            const messageIndent = messageLine ? messageLine.match(/^\s*/)[0].length : -1;

            if (componentIndent !== 16 || messageIndent !== 12) {
                console.error(`❌ FAIL: jdoc indent incorrect in body! message=${messageIndent} (expected 12), component=${componentIndent} (expected 16)`);
                continue;
            }

            console.log(`   ✅ Joomla <jdoc:include ... /> tags verified: metas/styles/scripts = ${metasIndent} spaces (no cascade), message = ${messageIndent} spaces, component = ${componentIndent} spaces.`);
        }

        // Check 3: Control flow verification
        if (sampleFile.includes('control-flow')) {
            const ifLine = lines.find(l => l.includes('if ($user->isGuest())'));
            const alertLine = lines.find(l => l.includes('class="alert alert-warning"'));
            const elseLine = lines.find(l => l.includes('<?php else : ?>'));
            const endifLine = lines.find(l => l.includes('<?php endif; ?>'));

            const ifIndent = ifLine ? ifLine.match(/^\s*/)[0].length : -1;
            const alertIndent = alertLine ? alertLine.match(/^\s*/)[0].length : -1;
            const elseIndent = elseLine ? elseLine.match(/^\s*/)[0].length : -1;
            const endifIndent = endifLine ? endifLine.match(/^\s*/)[0].length : -1;

            if (alertIndent <= ifIndent || elseIndent !== ifIndent || endifIndent !== ifIndent) {
                console.error(`❌ FAIL: PHP control flow indent error! if=${ifIndent}, child=${alertIndent}, else=${elseIndent}, endif=${endifIndent}`);
                continue;
            }

            console.log('   ✅ PHP control structures (if/else/endif) properly aligned with children (+4 spaces).');
        }

        // Check 4: General PHP
        if (sampleFile.includes('general-php')) {
            const titleLine = lines.find(l => l.includes('<title><?= $pageTitle ?></title>'));
            if (!titleLine) {
                console.error(`❌ FAIL: Title inline tag was not formatted properly`);
                continue;
            }
            console.log('   ✅ Inline elements and PHP short tags (<?= ... ?>) compacted cleanly.');
        }

        console.log(`   ✅ Formatted successfully (${lines.length} lines)`);
        passedTests++;

        console.log('\n--- PREVIEW OF FORMATTED OUTPUT ---');
        console.log(formatted.substring(0, Math.min(600, formatted.length)) + '\n...');
        console.log('-'.repeat(50));
    }

    console.log('\n' + '='.repeat(70));
    console.log(`🎉 TEST SUMMARY: ${passedTests}/${samples.length} SAMPLES PASSED PERFECTLY!`);
    console.log('='.repeat(70));
}

runTests();
