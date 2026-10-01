// Shared registry fixture for the /kit:start tests.
const t = (name, tier, extra = {}) => ({ name, tier, status: 'trial', scope: 'project', check: `check ${name}`, install: { win32: `install ${name}` }, ...extra });
export const registry = {
  phases: ['artifacts', 'build'],
  tools: [
    { name: 'openspec', status: 'adopted', scope: 'machine', tier: 'global', phases: ['artifacts', 'build'], skills: { artifacts: '/opsx:propose', build: '/opsx:apply' } },
    t('ctx', 'global', { interactive: true, install_note: 'sign in with OAuth' }),
    t('sp', 'project', { plugin: 'sp@market' }),
    t('notion', 'project', { interactive: true, install_note: 'run /mcp' }),
    t('imp', 'project-type:web-ui'),
    t('old', 'project-type:web-ui', { status: 'dropped' }),
    t('soon', 'project-type:web-ui', { status: 'later' }),
    t('clitool', 'project-type:cli'),
  ],
};
