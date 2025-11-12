# Configuração do Azure Blob Storage

## Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente no seu arquivo `.env`:

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=SEU_ACCOUNT_NAME;AccountKey=SUA_ACCOUNT_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=images
```

## Como obter a Connection String do Azure Storage

1. Acesse o [Portal do Azure](https://portal.azure.com)
2. Navegue até sua conta de Storage
3. No menu lateral, vá em "Configurações" > "Chaves de acesso"
4. Copie a "Cadeia de conexão" da chave primária ou secundária
5. Cole no arquivo `.env` como `AZURE_STORAGE_CONNECTION_STRING`

## Container Name

O nome do container é opcional. Se não especificado, será usado `images` como padrão. O container será criado automaticamente se não existir.

## Instalação de Dependências

Execute o seguinte comando para instalar as dependências necessárias:

```bash
npm install @azure/storage-blob multer @types/multer
```

## Migration do Prisma

Após configurar as variáveis de ambiente, execute a migration para adicionar os campos de imagem:

```bash
npx prisma migrate dev --name add_image_fields
```

## Uso

### Upload de Imagem para Book

```bash
POST /books
Content-Type: multipart/form-data

{
  "title": "Livro Exemplo",
  "author": "Autor Exemplo",
  "isbn": "1234567890",
  "totalCopies": 5,
  "image": <arquivo de imagem>
}
```

### Upload de Imagem para Event

```bash
POST /events
Content-Type: multipart/form-data

{
  "title": "Evento Exemplo",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T12:00:00Z",
  "location": "Local Exemplo",
  "image": <arquivo de imagem>
}
```

### Upload Genérico

```bash
POST /storage/upload
Content-Type: multipart/form-data

{
  "file": <arquivo de imagem>,
  "folder": "books" (opcional)
}
```

## Formatos Suportados

- JPEG/JPG
- PNG
- GIF
- WebP

## Limites

- Tamanho máximo: 5MB por arquivo
- Apenas imagens são permitidas

