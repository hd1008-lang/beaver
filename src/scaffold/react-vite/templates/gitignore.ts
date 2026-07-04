export const gitignoreTemplate = (): string =>
  `# Logs
logs
*.log
npm-debug.log*

# Dependencies
node_modules/
dist/
dist-ssr/
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment variables
.env
.env.local
.env.*.local
!.env.example

# Guard-script audit log (local-only noise, not team-shared)
.agents/audit.log
`;
