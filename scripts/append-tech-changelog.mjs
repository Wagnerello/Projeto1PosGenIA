import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const changelogTechPath = path.resolve(process.cwd(), 'docs', 'CHANGELOG_TECH.md');

try {
  const commitMsg = execSync('git log -1 --pretty=%s').toString().trim();
  const commitHash = execSync('git log -1 --pretty=%h').toString().trim();

  let typeMatch = commitMsg.match(/^(\w+)(\(.*?\))?:/);
  let type = typeMatch ? typeMatch[1] : 'chore';
  
  const entry = `- [${type}] ${commitMsg} (commit: ${commitHash}) — Refs: nenhuma\n`;
  
  if (fs.existsSync(changelogTechPath)) {
    let content = fs.readFileSync(changelogTechPath, 'utf8');
    content = content.replace('## [Unreleased]\n', `## [Unreleased]\n${entry}`);
    fs.writeFileSync(changelogTechPath, content, 'utf8');
    console.log('CHANGELOG_TECH atualizado com sucesso.');
  }
} catch (error) {
  console.error('Erro ao atualizar CHANGELOG_TECH:', error);
}
