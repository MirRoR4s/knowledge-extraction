const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');
const TAGS_DIR = path.join(ARTICLES_DIR, 'tags');
const SIDEBAR_PATH = path.join(__dirname, '..', '_sidebar.md');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function scanArticles() {
  const articles = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (path.resolve(fullPath) === path.resolve(TAGS_DIR)) continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { data } = matter(content);
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
        const category = path.relative(ARTICLES_DIR, path.dirname(fullPath));
        articles.push({
          title: data.title || entry.name.replace(/\.md$/, ''),
          tags: data.tags || [],
          category: data.category || category,
          path: relativePath
        });
      }
    }
  }

  walk(ARTICLES_DIR);
  return articles;
}

function groupByCategory(articles) {
  const groups = {};
  for (const article of articles) {
    const cat = article.category || 'uncategorized';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(article);
  }
  return groups;
}

function groupByTag(articles) {
  const groups = {};
  for (const article of articles) {
    for (const tag of article.tags) {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(article);
    }
  }
  return groups;
}

function generateSidebar(articles, tagGroups) {
  const lines = [];

  const catGroups = groupByCategory(articles);
  for (const [category, arts] of Object.entries(catGroups)) {
    lines.push(`- **${category}**`);
    for (const art of arts) {
      lines.push(`  - [${art.title}](${art.path})`);
    }
  }

  if (Object.keys(tagGroups).length > 0) {
    lines.push('- **按标签浏览**');
    for (const tag of Object.keys(tagGroups).sort()) {
      const tagSlug = slugify(tag);
      lines.push(`  - [${tag}](articles/tags/${tagSlug}.md)`);
    }
  }

  return lines.join('\n');
}

function generateTagPages(tagGroups) {
  if (!fs.existsSync(TAGS_DIR)) {
    fs.mkdirSync(TAGS_DIR, { recursive: true });
  }

  const existing = fs.readdirSync(TAGS_DIR);
  for (const file of existing) {
    if (file.endsWith('.md')) {
      fs.unlinkSync(path.join(TAGS_DIR, file));
    }
  }

  for (const [tag, articles] of Object.entries(tagGroups)) {
    const tagSlug = slugify(tag);
    const artRelPaths = articles.map(art => {
      const artAbs = path.join(__dirname, '..', art.path);
      return path.relative(TAGS_DIR, artAbs);
    });

    const lines = [];
    lines.push(`# 标签：${tag}`);
    lines.push('');
    lines.push(`共 ${articles.length} 篇文章：`);
    lines.push('');
    for (let i = 0; i < articles.length; i++) {
      lines.push(`- [${articles[i].title}](${artRelPaths[i]})`);
    }

    fs.writeFileSync(path.join(TAGS_DIR, `${tagSlug}.md`), lines.join('\n'), 'utf-8');
  }
}

function main() {
  const articles = scanArticles();
  console.log(`Found ${articles.length} articles`);

  const tagGroups = groupByTag(articles);
  console.log(`Found ${Object.keys(tagGroups).length} tags: ${Object.keys(tagGroups).join(', ') || '(none)'}`);

  generateTagPages(tagGroups);
  console.log('Generated tag pages');

  const sidebar = generateSidebar(articles, tagGroups);
  fs.writeFileSync(SIDEBAR_PATH, sidebar, 'utf-8');
  console.log('Generated _sidebar.md');
}

main();
