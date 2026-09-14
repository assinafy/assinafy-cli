# @assinafy/cli

*Português · [Read in English](README.en.md)*

A interface de linha de comando e o SDK Node.js oficiais da
[API Assinafy](https://api.assinafy.com.br/v1/docs) — plataforma brasileira de assinatura eletrônica.
Envie PDFs, gerencie signatários, solicite assinaturas, acompanhe a trilha de auditoria e baixe
documentos certificados — do terminal, de um script shell ou de uma aplicação.

A CLI é um único executável autocontido. Ela imprime tabelas legíveis por padrão e JSON estruturado
com `--json`, então os mesmos comandos servem tanto ao uso interativo quanto à automação. O mesmo
pacote expõe um SDK totalmente tipado em `@assinafy/cli/api`, cobrindo as 89 operações publicadas da
API.

> **Referência completa em inglês.** Este documento cobre instalação, autenticação e o fluxo
> principal. A referência de comandos e do SDK está em **[README.en.md](README.en.md)**.

## Requisitos

- Node.js `>=22.12.0`. O Node.js 24 LTS é recomendado e é o que a CI usa para publicar; a CI também
  testa 22 e 26.
- Uma conta Assinafy e uma chave de API (veja [Autenticação](#autenticação)).
- Linux, macOS ou Windows. Os arquivos de release são publicados para `linux-x64`, `linux-arm64`,
  `darwin-x64`, `darwin-arm64`, `windows-x64` e `windows-arm64`.

## Instalação

### Pelo npm

```bash
npm install -g @assinafy/cli@<versão>
assinafy --help
```

Fixe `@<versão>` em qualquer coisa que precise ser reprodutível; omita apenas quando você
deliberadamente quiser o release publicado mais recente.

### Por um release do GitHub

Baixe e **leia** o instalador da mesma tag imutável que você está instalando, e então execute:

```bash
ASSINAFY_VERSION=vX.Y.Z # substitua por uma tag de release publicada
curl -fsSLo assinafy-install.sh \
  "https://raw.githubusercontent.com/assinafy/assinafy-cli/${ASSINAFY_VERSION}/install.sh"
less assinafy-install.sh
bash assinafy-install.sh "$ASSINAFY_VERSION"
```

Windows PowerShell:

```powershell
$Version = 'vX.Y.Z' # substitua por uma tag de release publicada
Invoke-WebRequest "https://raw.githubusercontent.com/assinafy/assinafy-cli/$Version/install.ps1" -OutFile .\assinafy-install.ps1
Get-Content .\assinafy-install.ps1
& .\assinafy-install.ps1 -Version $Version
```

Os instaladores buscam o arquivo de release correspondente e o verificam contra o `SHA256SUMS`
daquele release antes de substituir o executável. Instalam em `~/.assinafy/bin`; defina
`ASSINAFY_INSTALL` para escolher outro diretório, ou `ASSINAFY_NO_PATH_UPDATE=1` para não mexer no
`PATH`.

### Sem instalar

```bash
npx @assinafy/cli whoami
```

## Autenticação

A Assinafy aceita duas credenciais. Prefira a chave de API.

| Credencial | Header enviado | Usar para |
| --- | --- | --- |
| Chave de API | `X-Api-Key: <chave>` | Tudo, inclusive automação não assistida. |
| Token de acesso JWT | `Authorization: Bearer <jwt>` | Sessões legadas e os poucos endpoints de sessão de usuário que exigem um. |

Gere uma chave de API no painel da Assinafy, ou pela CLI com uma sessão existente:

```bash
assinafy auth login voce@exemplo.com.br      # devolve um JWT
assinafy auth api-keys create --token <jwt>  # gera (e rotaciona) a chave
```

Guarde a chave uma vez e confirme que funciona:

```bash
assinafy login    # pergunta a chave de API e o ID do workspace padrão
assinafy whoami   # lista os workspaces que a credencial alcança
```

Se o `whoami` imprime seus workspaces, então a credencial, a URL base e o ID da conta estão todos
corretos. A maioria dos comandos tem escopo de workspace — defina um ID de conta padrão durante o
`login` (ou passe `--account-id` por comando) para não repetir.

As credenciais são resolvidas com precedência fixa — **flag da CLI → variável de ambiente → arquivo
de configuração**.

## Início rápido

```bash
assinafy send contrato.pdf \
  --signer "Ana Lima <ana@exemplo.com.br>" \
  --signer "Bruno Souza <+5548999990000>" \
  --message "Por favor, assine este contrato"
```

`send` é todo o caminho feliz em um comando: envia o PDF, aguarda a plataforma terminar o
processamento, cria ou reutiliza cada signatário, e cria o assignment de assinatura que dispara os
convites. Um signatário informado só com telefone assume verificação e notificação por WhatsApp;
fora isso, valem os padrões da plataforma. Passe `--signers '<json>'` para defini-los explicitamente.

O comando imprime o ID do documento, o ID do assignment e os IDs dos signatários — os três
identificadores de que todo comando posterior precisa.

Se um passo falhar depois do upload, o erro nomeia o documento e os signatários que já haviam sido
criados, para que nada fique órfão no seu workspace sem um identificador:

```text
error: Saldo insuficiente. (document doc_abc123 and 2 signer(s) were already created)
  (HTTP 402)
```

Com `--json`, a mesma informação vem legível por máquina em `error.details`.

## Métodos de verificação do signatário

| Método | Como funciona | Custo por signatário |
| --- | --- | --- |
| `Email` *(padrão)* | Código de uso único (OTP) por e-mail, exigido antes de assinar | Gratuito |
| `Whatsapp` | Código de uso único (OTP) por WhatsApp | Verificação gratuita; notificação 0,45 crédito, só em planos pagos |
| `DigitalCertificate` | O signatário assina com o **próprio certificado ICP-Brasil (A1/A3)**, pela extensão de navegador Web PKI, gerando uma assinatura **PAdES qualificada** | 2 créditos |

O método de verificação e o de notificação são **acoplados**: envie um, os dois ou nenhum — o lado
que faltar é inferido. Sem nenhum dos dois, ambos assumem `Email`. Combinações permitidas: `Email` →
`Email`; `Whatsapp` → `Whatsapp`; `DigitalCertificate` → `Email` **ou** `Whatsapp`.

Verifique o preço antes de gastar créditos — o subcomando de estimativa de custo devolve o
detalhamento por item. O certificado digital exige o recurso na conta (planos Standard e Pro), CPF ou
CNPJ em `government_id`, e que o signatário esteja **sozinho no seu passo de assinatura**.

Signatários por certificado não completam pelo endpoint comum de assinatura: a assinatura deles é
produzida por um handshake de dois passos com a extensão Web PKI
(`/v1/signers/certificate/start` + `/complete`), que são rotas **somente de produção** — o sandbox
não as expõe.

## Trilha de auditoria e artefatos

As atividades de um documento devolvem todos os eventos registrados, cada um com um snapshot do
`payload` do evento e a `origin` da requisição (`ip`, `user-agent`).

Artefatos disponíveis para download:

| Artefato | Conteúdo |
| --- | --- |
| `original` | O PDF enviado, como recebido |
| `certificated` | O documento assinado, com a certificação da plataforma |
| `certificate-page` | Apenas a página de certificação |
| `pades` | Assinaturas ICP-Brasil dos signatários + caixa de certificação — só existe em documentos que tiveram signatários por certificado digital |
| `bundle` | Zip com `original`, `certificated` e `certificate-page`, mais o `pades` quando houver |

## Saída e scripting

`--json` transforma qualquer comando em saída estruturada, para uso com `jq` e afins. O fluxo
completo de dono do documento, o lado do signatário, webhooks e a referência de comandos estão
detalhados em [README.en.md](README.en.md).

## Ambientes

| | |
| --- | --- |
| Produção | `https://api.assinafy.com.br/v1` |
| Sandbox | `https://sandbox.assinafy.com.br/v1` |

O sandbox é gratuito e espelha a produção para testar a integração de ponta a ponta — com a exceção
das rotas de certificado digital, que existem apenas em produção.

## Documentação

- **[README.en.md](README.en.md)** — referência de comandos e do SDK, em inglês
- [Documentação da API](https://api.assinafy.com.br/v1/docs)

## Licença

Distribuído sob a licença [MIT](LICENSE).
