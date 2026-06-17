import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (multi-site)...');

  // ------- Default Site -------
  const defaultSite = await prisma.site.upsert({
    where: { domain: 'localhost' },
    update: {
      name: 'ZQCMS 默认站点',
      isDefault: true,
      description: '快速构建产品内容站点，包括使用文档、API文档、使用场景、FAQ和行业新闻',
    },
    create: {
      name: 'ZQCMS 默认站点',
      slug: 'default',
      domain: 'localhost',
      isDefault: true,
      description: '快速构建产品内容站点，包括使用文档、API文档、使用场景、FAQ和行业新闻',
      primaryColor: '#3B82F6',
      contactEmail: 'hello@zqcms.com',
      footerText: '用技术让内容管理更简单',
      copyright: '© 2026 ZQCMS. All rights reserved.',
      socialLinks: { github: 'https://github.com/zqcms', twitter: 'https://twitter.com/zqcms' },
    },
  });

  console.log(`   Site: ${defaultSite.name} (id=${defaultSite.id})`);

  // ------- Admin User -------
  await prisma.user.upsert({
    where: { email: 'admin@zqcms.com' },
    update: { name: '管理员', role: 'ADMIN' },
    create: {
      email: 'admin@zqcms.com',
      password: await bcrypt.hash('admin123', 10),
      name: '管理员',
      role: 'ADMIN',
    },
  });

  const admin = await prisma.user.findFirst({ where: { email: 'admin@zqcms.com' } });
  if (!admin) throw new Error('Admin user not found');

  // ------- 清空种子数据（保留 Site 和 User） -------
  await prisma.pageBlock.deleteMany({ where: { siteId: defaultSite.id } });
  await prisma.postTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.post.deleteMany({ where: { siteId: defaultSite.id } });
  await prisma.category.deleteMany({ where: { siteId: defaultSite.id } });

  // ------- Categories -------
  const docsCategory = await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: '产品文档', slug: 'docs',
      description: '产品使用文档，快速上手和深入使用指南',
      icon: 'BookOpen', sortOrder: 1, isVisible: true,
    },
  });

  const apiCategory = await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: 'API 文档', slug: 'api',
      description: '完整的 REST API 接口文档',
      icon: 'Code2', sortOrder: 2, isVisible: true,
    },
  });

  const scenarioCategory = await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: '使用场景', slug: 'scenarios',
      description: '产品在不同场景下的应用案例',
      icon: 'Layers', sortOrder: 3, isVisible: true,
    },
  });

  const guideCategory = await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: '使用说明', slug: 'guides',
      description: '详细的使用说明和最佳实践',
      icon: 'FileText', sortOrder: 4, isVisible: true,
    },
  });

  const faqCategory = await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: '问题解答', slug: 'faq',
      description: '常见问题和解答',
      icon: 'MessageCircleQuestion', sortOrder: 5, isVisible: true,
    },
  });

  const newsCategory = await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: '行业新闻', slug: 'news',
      description: '行业动态和最新资讯',
      icon: 'Newspaper', sortOrder: 6, isVisible: true,
    },
  });

  // ------- Sub categories -------
  await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: '快速开始', slug: 'docs/getting-started',
      description: '从零开始快速上手',
      sortOrder: 1, parentId: docsCategory.id, isVisible: true,
    },
  });

  await prisma.category.create({
    data: {
      siteId: defaultSite.id,
      name: '配置指南', slug: 'docs/configuration',
      description: '系统配置说明',
      sortOrder: 2, parentId: docsCategory.id, isVisible: true,
    },
  });

  // ------- Sample Posts -------
  await prisma.post.create({
    data: {
      siteId: defaultSite.id,
      title: '快速开始指南', slug: 'quickstart',
      content: `# 快速开始指南\n\n欢迎使用我们的产品！本指南将帮助您在 5 分钟内快速上手。\n\n## 安装\n\n\`\`\`bash\nnpm install @zqcms/core\n\`\`\``,
      excerpt: '5分钟快速上手，从安装到发布第一篇内容',
      status: 'PUBLISHED', sortOrder: 1,
      categoryId: docsCategory.id, authorId: admin.id,
      isFeatured: true, publishedAt: new Date(),
    },
  });

  await prisma.post.create({
    data: {
      siteId: defaultSite.id,
      title: 'REST API 概述', slug: 'overview',
      content: `# REST API 概述\n\n## 基础信息\n\n- **Base URL**: \`https://api.example.com/v1\`\n- **认证方式**: Bearer Token (JWT)\n- **数据格式**: JSON`,
      excerpt: '完整的 REST API 接口文档，包括认证和文章管理',
      status: 'PUBLISHED', sortOrder: 1,
      categoryId: apiCategory.id, authorId: admin.id,
      isFeatured: true, publishedAt: new Date(),
    },
  });

  await prisma.post.create({
    data: {
      siteId: defaultSite.id,
      title: '电商产品展示场景', slug: 'ecommerce',
      content: '# 电商产品展示场景\n\n在电商场景中，使用 ZQCMS 可以快速搭建产品介绍站点。',
      excerpt: '电商场景下的产品介绍和文档管理解决方案',
      status: 'PUBLISHED', sortOrder: 1,
      categoryId: scenarioCategory.id, authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  // ------- Page Blocks -------
  await prisma.pageBlock.create({
    data: {
      siteId: defaultSite.id,
      pageType: 'home', blockType: 'HERO', title: '首页横幅',
      config: {
        title: '快速构建内容站点',
        subtitle: '数据驱动的 CMS，所有内容在数据库维护，一套代码复制无数站点',
        ctaText: '查看文档', ctaLink: '/docs',
        secondaryCtaText: '快速开始', secondaryCtaLink: '/docs/getting-started',
        alignment: 'center',
      },
      sortOrder: 1,
    },
  });

  await prisma.pageBlock.create({
    data: {
      siteId: defaultSite.id,
      pageType: 'home', blockType: 'FEATURES', title: '核心特性',
      config: {
        columns: 3,
        items: [
          { icon: 'Zap', title: '快速部署', desc: 'Docker 一键部署，5 分钟上线' },
          { icon: 'Database', title: '数据驱动', desc: '所有内容存储在数据库，高度可复用' },
          { icon: 'FileText', title: 'Markdown 编辑', desc: '沉浸式 Markdown 编辑器' },
          { icon: 'Search', title: 'SEO 优化', desc: 'Next.js SSR，服务端渲染保证 SEO' },
          { icon: 'GripVertical', title: '拖拽排序', desc: '文章和目录支持拖拽排序' },
          { icon: 'Blocks', title: '可视化搭建', desc: '首页区块可视化搭建' },
        ],
      },
      sortOrder: 2,
    },
  });

  await prisma.pageBlock.create({
    data: {
      siteId: defaultSite.id,
      pageType: 'home', blockType: 'POST_LIST', title: '最新文章',
      config: { limit: 6, sortBy: 'publishedAt', layout: 'grid', columns: 3 },
      sortOrder: 3,
    },
  });

  await prisma.pageBlock.create({
    data: {
      siteId: defaultSite.id,
      pageType: 'home', blockType: 'CATEGORY_LIST', title: '内容分类',
      config: { layout: 'grid', columns: 3, showCount: true },
      sortOrder: 4,
    },
  });

  console.log('✅ Seed data created successfully!');
  console.log('   Admin login: admin@zqcms.com / admin123');
  console.log('   Default site: localhost (id=' + defaultSite.id + ')');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
