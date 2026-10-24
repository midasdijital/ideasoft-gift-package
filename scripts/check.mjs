import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

function visit(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
    const file = join(path, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.m?js$/.test(file))
      execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    else if (file.endsWith('.twig')) {
      const content = readFileSync(file, 'utf8');
      if (/<script|<style|javascript:/i.test(content))
        throw new Error(`Inline executable content: ${file}`);
      for (const expression of content.matchAll(/{{(.*?)}}/gs)) {
        if (
          !expression[1].includes("|e('html_attr')") &&
          !expression[1].includes('|e }}') &&
          !/\|e\s*$/.test(expression[1])
        ) {
          throw new Error(`Unescaped Twig output: ${file}: ${expression[0]}`);
        }
      }
    }
  }
}
visit('.');
console.log('JavaScript syntax and template output checks passed.');
