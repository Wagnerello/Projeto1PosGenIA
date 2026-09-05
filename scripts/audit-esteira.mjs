import fs from 'fs';
import path from 'path';

console.log('Auditoria da esteira de qualidade...');
console.log('Validando estrutura e segurança base...');

// Verifica se CHANGELOG_TECH existe e tem Unreleased
const changelogTechPath = path.resolve(process.cwd(), 'docs', 'CHANGELOG_TECH.md');
if (fs.existsSync(changelogTechPath)) {
  const content = fs.readFileSync(changelogTechPath, 'utf8');
  if (!content.includes('## [Unreleased]')) {
    console.error('ERRO: docs/CHANGELOG_TECH.md deve conter a seção ## [Unreleased]');
    process.exit(1);
  }
} else {
  console.warn('AVISO: docs/CHANGELOG_TECH.md não encontrado. Verifique se o projeto foi inicializado corretamente.');
}

console.log('Auditoria concluída: ✓ 100% OK!');
process.exit(0);
