import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["frontend/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        Chart: "readonly",
        SUPABASE_URL: "writable",
        supabaseClient: "writable",
        sair: "writable",
        exibirErro: "writable",
        obterMensagemErro: "writable",
        formatarDataBR: "writable",
        getHojeStr: "writable",
        escapeHtml: "writable",
        salvarPaciente: "writable",
        salvarConsulta: "writable",
        salvarPlano: "writable",
        filtrarPacientes: "writable",
        abrirModalConsulta: "writable",
        cadastrar: "writable",
        entrar: "writable",
        currentUser: "writable",
        todosPacientes: "writable",
        data: "writable",
      },
    },
    rules: {
      "no-redeclare": ["error", { builtinGlobals: false }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
