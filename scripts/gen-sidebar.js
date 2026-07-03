const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ARTICLES_DIR = path.join(__dirname, '..', 'articles');
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
        walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { data } = matter(content);
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
        const category = path.relative(ARTICLES_DIR, path.dirname(fullPath));
        articles.push({
          title: data.title || entry.name.replace(/\.md$/, ''),
          tags: data.tags || [],
          category: data.category || category,
          order: data.order,
          path: relativePath,
          fullPath: fullPath,
          birthtime: stat.birthtimeMs || stat.ctimeMs
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

function assignAndWriteOrders(articles) {
  const catGroups = groupByCategory(articles);

  for (const [, arts] of Object.entries(catGroups)) {
    let maxOrder = 0;
    const unorderedArts = arts.filter(a => {
      if (a.order != null) {
        maxOrder = Math.max(maxOrder, a.order);
        return false;
      }
      return true;
    });

    unorderedArts.sort((a, b) => a.birthtime - b.birthtime);

    unorderedArts.forEach(art => {
      const newOrder = ++maxOrder;
      const content = fs.readFileSync(art.fullPath, 'utf-8');
      const parsed = matter(content);
      parsed.data.order = newOrder;
      const newContent = matter.stringify(parsed.content, parsed.data);
      fs.writeFileSync(art.fullPath, newContent, 'utf-8');
      console.log(`  Assigned order: ${art.fullPath} -> ${newOrder}`);
      art.order = newOrder;
    });
  }
}

function generateSidebar(articles) {
  const lines = [];

  const catGroups = groupByCategory(articles);
  for (const [, arts] of Object.entries(catGroups)) {
    arts.sort((a, b) => {
      const ao = a.order ?? Infinity;
      const bo = b.order ?? Infinity;
      return ao - bo;
    });
  }
  for (const [category, arts] of Object.entries(catGroups)) {
    lines.push(`- **${category}**`);
    for (const art of arts) {
      lines.push(`  - [${art.title}](${art.path})`);
    }
  }

  return lines.join('\n');
}

function main() {
  const articles = scanArticles();
  console.log(`Found ${articles.length} articles`);

  assignAndWriteOrders(articles);

  const sidebar = generateSidebar(articles);
  fs.writeFileSync(SIDEBAR_PATH, sidebar, 'utf-8');
  console.log('Generated _sidebar.md');
}

main();
