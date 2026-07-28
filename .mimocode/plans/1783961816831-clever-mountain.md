# Plano: Renderização de Markdown do Notion

## Diagnóstico
O conteúdo `Conteudo` e `Resumo` vindos do Notion são exibidos como texto plano (`<p>{text}</p>`), sem parsing de formatação Markdown (negrito, itálico, headings, listas, blockquotes).

## Solução

### 1. Instalar `react-markdown` v8 (compatível com React 17 + Next.js 11)

```
npm install react-markdown@8 remark-gfm
```

### 2. Criar componente `MarkdownRenderer`
Ficheiro: `src/components/markdown.tsx`
- Usa `<ReactMarkdown remarkPlugins={[remarkGfm]}>` para converter Markdown em HTML
- Configura `components` para estilização consistente dos elementos

### 3. Atualizar páginas

**`src/pages/blog/[slug].tsx`** — Conteudo do artigo:
- Substituir `post.Conteudo.split('\n\n').map(...)` por `<MarkdownRenderer content={post.Conteudo} />`

**`src/pages/blog/index.tsx`** — Resumo nos cards/Hero:
- Substituir `post.Resumo` plain text por `<MarkdownRenderer content={post.Resumo} inline />`
- Para previews nos cards, usar versão inline sem parágrafos

### 4. CSS para Markdown (`src/styles/blog.module.css`)
Adicionar estilos para:
- `h1, h2, h3, h4`: tamanhos, margens, font-weight
- `strong/b`: font-weight bold
- `em/i`: font-style italic
- `blockquote`: borda lateral laranja, fundo claro
- `ul, ol`: padding-left, list-style
- `code`: background, padding, border-radius
- `pre`: fundo escuro, padding
- `a`: cor laranja
- `hr`: separador decorativo

## Ficheiros a modificar
| Ficheiro | Ação |
|---|---|
| `package.json` | Adicionar `react-markdown@8` e `remark-gfm` |
| `src/components/markdown.tsx` | **Novo** componente |
| `src/pages/blog/[slug].tsx` | Usar MarkdownRenderer para Conteudo |
| `src/pages/blog/index.tsx` | Usar MarkdownRenderer para Resumo |
| `src/styles/blog.module.css` | Adicionar estilos Markdown |

## Verificação
- `npm run build`: compilar sem erros
- Testar `blog.biz-flow.cloud/blog/[slug]`: verificar que **negrito**, *itálico*, headings, listas, blockquotes renderizam corretamente
