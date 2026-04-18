export const manifestJsonTemplate = (projectName: string): string =>
  JSON.stringify(
    {
      manifest_version: 3,
      name: projectName,
      description: '',
      version: '1.0.0',
      action: {
        default_popup: 'index.html',
      },
      permissions: [],
    },
    null,
    2
  );
