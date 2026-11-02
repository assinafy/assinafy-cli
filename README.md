# @assinafy/cli

*Português · [Read in English](README.en.md)*

CLI e SDK TypeScript para as 118 operações publicadas da [API Assinafy](https://api.assinafy.com.br/v1/docs): documentos, signatários, assinaturas, templates, contratos, OAuth e webhooks.

## Instalação

Use Node.js 26 LTS. O pacote mantém compatibilidade com Node `>=22.12.0` e funciona em Linux, macOS e Windows.

```bash
npm install -g @assinafy/cli@<versão>
assinafy --help
```

Para usar o SDK: `npm install @assinafy/cli@<versão>` e importe de `@assinafy/cli/api`. Os endereços `example.com` e identificadores abaixo são sintéticos.

## Autenticação e configuração

Integrações próprias podem usar `X-Api-Key`; aplicativos de marketplace usam OAuth 2.0 com PKCE e `Authorization: Bearer`. Operações do signatário recebem o código privado em `signer-access-code` e nunca reutilizam a credencial do proprietário.

```bash
# Chave de API: prompt protegido e perfil local
assinafy login
assinafy whoami

# OAuth: aplicação pública oficial, PKCE S256 e callback automático
umask 077
assinafy oauth connect --json > tokens.json
export ASSINAFY_TOKEN="$(jq -er '.access_token' tokens.json)"
export ASSINAFY_ACCOUNT_ID=example_workspace
assinafy workspaces list --json
```

`oauth connect` solicita `account:read documents:read documents:write templates:read templates:write webhooks:write offline_access`. Não usa segredo de cliente, não salva tokens no perfil e não renova automaticamente. Serialize cada refresh, salve o novo refresh token atomicamente e nunca repita um refresh depois de uma falha ambígua. Aplicações próprias podem substituir o client ID, callback e escopos. Veja o [guia OAuth](docs/oauth-guide.md).

A precedência da CLI é flag → ambiente → perfil → padrão. As credenciais são escolhidas juntas no primeiro nível preenchido; a chave de API vence o token quando ambos são informados no mesmo nível.

| Valor | Variável |
| --- | --- |
| Chave de API | `ASSINAFY_API_KEY` |
| Bearer token | `ASSINAFY_TOKEN` |
| Workspace | `ASSINAFY_ACCOUNT_ID` |
| URL base | `ASSINAFY_BASE_URL` |
| Perfil | `ASSINAFY_PROFILE` |

Produção usa `https://api.assinafy.com.br/v1`; sandbox usa `https://sandbox.assinafy.com.br/v1` e credenciais próprias. HTTPS/TLS 1.2+ é obrigatório. Consulte [.env.example](.env.example) para as demais variáveis seguras.

## Fluxo completo de um documento

### 1. Criar ou localizar o signatário

```bash
SIGNER_ID=$(assinafy signers create \
  --name 'Ana Lima' --email ana@example.com --json | jq -er '.id')
```

Nome é obrigatório. E-mail e WhatsApp dependem do método escolhido. A criação reutiliza uma correspondência exata de e-mail; atualize `government_id` explicitamente antes de usar certificado ou biometria.

### 2. Enviar e aguardar o PDF

```bash
DOCUMENT_ID=$(assinafy documents upload contrato.pdf \
  --name 'Contrato de serviços' --metadata '{"external_id":"order-example"}' \
  --json | jq -er '.id')
assinafy documents wait "$DOCUMENT_ID" --json
```

O PDF deve ser não vazio e ter no máximo 25 MiB. Persista o ID antes de aguardar. `wait` confirma o processamento inicial, não a conclusão das assinaturas.

### 3. Estimar e solicitar assinaturas

```bash
assinafy assignments estimate-cost "$DOCUMENT_ID" --signer-ids "$SIGNER_ID" --json
assinafy assignments create "$DOCUMENT_ID" \
  --signer-ids "$SIGNER_ID" --message 'Revise e assine' --json
```

Leia custo, saldo e bloqueios antes da escrita. A operação pode consumir créditos e enviar convites. `notification_methods: []` assume Email em produção; informe o canal para escolhê-lo explicitamente.

| Verificação | Notificação válida | Requisitos adicionais |
| --- | --- | --- |
| `Email` | `Email` | E-mail do signatário |
| `Whatsapp` | `Whatsapp` | Telefone e créditos |
| `IdDocumentFaceMatchBasic` | `Email` ou `Whatsapp` | CPF, recurso biométrico, consentimento e créditos |
| `DigitalCertificate` | `Email` ou `Whatsapp` | CPF/CNPJ correspondente, recurso, créditos e passo individual |

Passos explícitos são contíguos a partir de 1. Um signatário com certificado fica sozinho no passo. Assignments `collect` usam as páginas e entradas reais; `virtual` assina com `entries: []`. Os formatos completos estão em [assignments](docs/assignments.md).

O atalho abaixo combina criação/reutilização do signatário, upload, espera e assignment virtual:

```bash
assinafy send contrato.pdf --signer 'Ana Lima <ana@example.com>' --json
```

Se uma etapa posterior falhar, preserve `documentId` e `signerIds`, consulte o estado remoto e retome somente o que falta. IDs de signatários podem ter sido reutilizados; não os exclua automaticamente. Escritas e trocas OAuth não são repetidas pelo SDK.

### 4. Fluxo da pessoa signatária

Defina `ASSINAFY_SIGNER_ACCESS_CODE` de forma privada, apresente documento, dados e termos, e então execute as ações autorizadas:

```bash
assinafy signer self --json
assinafy signer accept-terms --json
assinafy signer verify-code --json
assinafy signer confirm-data "$DOCUMENT_ID" --full-name 'Ana Lima' --email ana@example.com
assinafy signer assignment --json
assinafy signer sign "$DOCUMENT_ID" example_assignment --entries '[]' --json
```

Email e WhatsApp usam `verify-code`; mantenha o OTP em `ASSINAFY_VERIFICATION_CODE`. A confirmação, assinatura e recusa simples verificam se documento e assignment pertencem ao código antes da escrita. Campos coletados devem usar as entradas reais do assignment. Veja [fluxos e payloads do signatário](docs/sdk-reference.md#signer-side-flows-clientsignerdocuments).

Para biometria, a própria pessoa precisa consentir e abrir a URL privada exatamente como recebida:

```bash
assinafy signer identity-status --json
assinafy signer identity-start --consent --json
```

`Approved` e `InReview` permitem assinar; `InReview` segura a certificação. A conta revisora usa `assignments identity-verification`, `identity-image` e `review-identity`. Veja o [fluxo biométrico](docs/sdk-reference.md#biometric-identity-verification).

Certificados A1 e A3 usam `DigitalCertificate`: `signer certificate-start`, assinatura local pelo Web PKI e `signer certificate-complete` com `ASSINAFY_CERTIFICATE_TOKEN`. Chave privada, PFX, senha e PIN nunca são enviados à Assinafy. Veja a [sequência ICP-Brasil](docs/sdk-reference.md#icp-brasil-a1a3-certificates).

### 5. Acompanhar e baixar

```bash
assinafy documents get "$DOCUMENT_ID" --json
assinafy documents progress "$DOCUMENT_ID" --json
assinafy documents activities "$DOCUMENT_ID" --json
assinafy documents download "$DOCUMENT_ID" --artifact certificated -o contrato-assinado.pdf
assinafy documents download "$DOCUMENT_ID" --artifact bundle -o artefatos.zip
```

Confirme a disponibilidade do artefato; `document_ready` significa a última assinatura, não o processamento inicial. Downloads não sobrescrevem sem `--force` e recebem permissão POSIX `0600`.

## SDK

```ts
import { AssinafyClient } from '@assinafy/cli/api';

const client = new AssinafyClient({
  token: process.env.ASSINAFY_TOKEN!,
  accountId: process.env.ASSINAFY_ACCOUNT_ID!,
});

const result = await client.uploadAndRequestSignatures({
  source: { filePath: './contrato.pdf' },
  signers: [{
    name: 'Ana Lima', email: 'ana@example.com',
    verification_method: 'Email', notification_methods: ['Email'],
  }],
  waitForReady: true,
});
console.log(result.document.id, result.assignment.id, result.signer_ids);
```

Respostas envelopadas resolvem para `data`; listas paginadas retornam `{ data, meta? }`; binários retornam `Buffer`. `ValidationError`, `ApiError`, `NetworkError` e `PartialWorkflowError` preservam dados úteis sem carregar a configuração Axios com segredos. A [referência do SDK](docs/sdk-reference.md) descreve todos os recursos, aliases, tipos, payloads e erros.

## Templates, contratos e webhooks

- Templates: `templates list` e `documents create-from-template`; papéis recebem IDs existentes ou descritores inline.
- Contratos: upload primeiro, depois `contracts set|get|list|related|renew|terminate`; envie o `updated_at` mais recente em escritas concorrentes. Veja [CLM](docs/contracts.md).
- Webhooks: `webhooks endpoints create|list|get|update|delete|rotate-secret`. URLs novas ou alteradas exigem HTTPS; consulta e exclusão exatas preservam URLs HTTP legadas. Valide o corpo bruto com `WebhookVerifier.verifyDelivery` e deduplique por `webhook-id`. Veja [webhooks](docs/webhooks.md).

## Referências e desenvolvimento

- [Referência HTTP](docs/api-reference.md): parâmetros e requisições/respostas de todas as 118 operações publicadas.
- [Referência do SDK](docs/sdk-reference.md): métodos, helpers, compatibilidade e fluxos adicionais.
- [Comandos](docs/README.md): documentos, signatários, assignments, signer, OAuth, auth, workspaces, usuários, templates, contratos, tags, fields, webhooks e configuração.
- [Segurança](SECURITY.md), [contribuição](CONTRIBUTING.md) e [releases](docs/releasing.md).

```bash
nvm use
npm ci
npm run typecheck && npm run lint && npm test
npm run build && npm run verify:bundle && npm run verify:api-docs
```

`--json` mantém dados em stdout e status/erros em stderr. Códigos de saída: 0 sucesso, 1 erro e 130 cancelamento. Comandos destrutivos pedem confirmação; use `--yes` somente em automações autorizadas.

## Licença

[MIT](LICENSE). Dependências e licenças: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
