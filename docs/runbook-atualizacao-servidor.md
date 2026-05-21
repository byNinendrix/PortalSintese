# Runbook: Atualizacao do Servidor (PortalSintese)

Ultima validacao: 2026-05-21
Diretorio da aplicacao no servidor: `D:\Apps\PortalSintese`

## Objetivo

Padronizar futuras atualizacoes para ganhar velocidade e evitar risco em um servidor com multiplas aplicacoes.

## Regras Criticas (NAO quebrar)

- Nao tocar na porta `3001`: pertence ao sistema de compras.
- Aplicar restart somente no processo da API do PortalSintese.
- Evitar comandos destrutivos e evitar mudancas em IIS/bindings sem necessidade.
- Executar um comando por vez e validar a saida antes do proximo passo.

## Mapa Atual Conhecido do Servidor

- Frontend publico: `https://sgs.sintese.org.br:4443`
- Binding IIS: `https *:4443:sgs.sintese.org.br`
- Backend do PortalSintese (Node): porta `4001`
- API de compras (outro sistema): porta `3001`

## Fluxo Padrao de Atualizacao

### 1) Entrar no diretorio do projeto

```powershell
cd D:\Apps\PortalSintese
```

### 2) Ver estado do git

```powershell
git status -sb
```

### 3) Atualizar codigo

```powershell
git fetch origin
git pull --ff-only origin main
```

### 4) Build da API

```powershell
pnpm --filter @sintese/api build
```

### 5) Confirmar bindings HTTP/HTTPS do site

```powershell
Import-Module WebAdministration
Get-WebBinding | Select-Object protocol,bindingInformation
```

Esperado: binding HTTPS em `*:4443:sgs.sintese.org.br`.

### 6) Confirmar porta da API do PortalSintese (sem tocar na 3001)

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Select-Object ProcessId, ParentProcessId, CommandLine
netstat -ano | findstr 4001
netstat -ano | findstr 3001
```

Observacao:
- `4001` deve ser a API do PortalSintese (`apps/api/dist/main.js`).
- `3001` pode estar ativa por outro sistema (compras). Nao interromper.

### 7) Restart seguro somente da API do PortalSintese

1. Descobrir PID da porta `4001`:

```powershell
netstat -ano | findstr :4001
```

2. Parar somente esse PID:

```powershell
Stop-Process -Id <PID_DA_4001> -Force
```

3. Subir novamente a API na porta `4001`:

```powershell
$env:PORT='4001'
Start-Process -FilePath "node.exe" -ArgumentList "apps/api/dist/main.js" -WorkingDirectory "D:\Apps\PortalSintese" -WindowStyle Hidden -PassThru
```

4. Validar que voltou:

```powershell
netstat -ano | findstr :4001
```

### 8) Teste funcional final via dominio oficial

```powershell
curl.exe -k -i --max-time 15 "https://sgs.sintese.org.br:4443/api/v1/auth/me/session?cpf=12345678901"
```

Esperado: `HTTP/1.1 200 OK` com JSON de sessao.

## Troubleshooting Rapido

- `https://127.0.0.1:4443` retornando `400 Invalid Hostname`:
  - Normal se o binding exigir host header.
  - Use `https://sgs.sintese.org.br:4443`.

- `curl http://127.0.0.1:4443 ...` travando:
  - Porta `4443` e HTTPS. Use `https` com `-k`.

- API aparentemente "antiga":
  - Verifique `StartTime` do processo da API e reinicie somente o PID da `4001`.

## Checklist de Encerramento

- `git pull` aplicado sem conflito.
- build da API concluido.
- API PortalSintese ouvindo em `4001`.
- sistema de compras em `3001` intocado.
- teste final em `https://sgs.sintese.org.br:4443` com `HTTP 200`.

