/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "sin-ciclos",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "componentes-sin-acceso-directo-a-datos",
      severity: "error",
      from: { path: "^src/components" },
      to: { path: "^src/db" },
    },
    {
      name: "cliente-sin-modulos-de-servidor",
      severity: "error",
      from: { path: "\\.client\\.(ts|tsx)$" },
      to: { path: "^src/(db|features/.+/server|lib/server)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"] },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
