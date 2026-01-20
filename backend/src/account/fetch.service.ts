import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { load } from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { ArticleService } from '../article/article.service';
import { SettingsService } from '../settings/settings.service';
import { WechatAccount } from './entities/account.entity';

interface ArticleData {
  title: string;
  content?: string;
  summary?: string;
  coverImage?: string;
  originalUrl: string;
  publishTime?: Date;
  author?: string;
}

@Injectable()
export class FetchService {
  private readonly logger = new Logger(FetchService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'images');

  constructor(
    private articleService: ArticleService,
    private settingsService: SettingsService,
    @InjectRepository(WechatAccount)
    private accountRepository: Repository<WechatAccount>,
  ) {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * 下载图片到本地
   */
  private async downloadImage(imageUrl: string): Promise<string | null> {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return null;
      }

      // 获取图片扩展名
      const urlObj = new URL(imageUrl);
      const pathname = urlObj.pathname;
      let ext = path.extname(pathname).toLowerCase();
      if (!ext || ext === '') {
        // 尝试从Content-Type获取
        ext = '.jpg'; // 默认jpg
      }
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        ext = '.jpg';
      }

      // 生成文件名
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}${ext}`;
      const filepath = path.join(this.uploadsDir, filename);

      // 下载图片
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://mp.weixin.qq.com/',
        },
        timeout: 10000,
      });

      // 检查图片大小，过滤小图标（小于20KB的可能是图标）
      const imageSize = Buffer.byteLength(response.data);
      if (imageSize < 20480) {
        this.logger.warn(`图片太小，可能是图标，跳过: ${imageUrl} (${(imageSize / 1024).toFixed(2)} KB)`);
        return null;
      }

      // 保存文件
      fs.writeFileSync(filepath, response.data);

      // 返回相对路径（用于前端访问）
      const relativePath = `/uploads/images/${filename}`;
      this.logger.log(`图片下载成功: ${relativePath}`);
      return relativePath;
    } catch (error) {
      this.logger.error(`下载图片失败: ${imageUrl}, ${error.message}`);
      return null;
    }
  }

  /**
   * 从内容中提取第一张大图（过滤小图标）
   */
  private findFirstLargeImage($: any, contentElement: any): string | null {
    if (!contentElement) {
      return null;
    }

    const images = contentElement.find('img');
    for (let i = 0; i < images.length; i++) {
      const img = $(images[i]);
      const imgSrc = img.attr('src') || 
                     img.attr('data-src') || 
                     img.attr('data-original') ||
                     img.attr('data-lazy-src') ||
                     '';

      if (!imgSrc || !imgSrc.startsWith('http')) {
        continue;
      }

      // 获取图片尺寸（如果可用）
      const width = parseInt(img.attr('width') || '0');
      const height = parseInt(img.attr('height') || '0');
      
      // 过滤小图标：宽度或高度小于100px的可能是图标
      if (width > 0 && height > 0 && (width < 100 || height < 100)) {
        continue;
      }

      // 过滤占位图和默认图
      if (imgSrc.includes('placeholder') || 
          imgSrc.includes('default') ||
          imgSrc.includes('blank') ||
          imgSrc.includes('loading') ||
          imgSrc.includes('icon') ||
          imgSrc.includes('logo')) {
        continue;
      }

      // 处理相对路径
      let fullUrl = imgSrc;
      if (imgSrc.startsWith('//')) {
        fullUrl = `https:${imgSrc}`;
      } else if (imgSrc.startsWith('/')) {
        fullUrl = `https://mp.weixin.qq.com${imgSrc}`;
      }

      return fullUrl;
    }

    return null;
  }

  /**
   * 根据公众号名称和抓取方式获取文章列表
   */
  /**
   * 预览可导入的文章（不保存到数据库）
   */
  async previewArticles(
    account: WechatAccount,
    accountName: string,
    userId?: number,
    fakeid?: string,
    query?: string,
    limit?: number,
  ): Promise<{ total: number; newArticles: number; existingArticles: number; articles: Array<{ title: string; publishTime: Date; originalUrl: string }> }> {
    // 统一使用 appmsgpublish 接口
    const finalFakeid = fakeid || account.fakeid;
    if (!finalFakeid) {
      throw new Error('缺少 fakeid 参数，无法查询文章。请先通过搜索公众号获取 fakeid 或确保公众号已保存 fakeid。');
    }

    // 获取 cookie 的方式：与 search 接口保持一致，直接使用 userId（从 req.user?.id || 1 获取）
    const targetUserId = userId || 1;
    const wechatCookies = await this.settingsService.getWechatCookies(targetUserId);
    if (!wechatCookies) {
      throw new Error('缺少微信公众号 cookies，无法使用 appmsgpublish 接口');
    }

    this.logger.log(`[预览] 使用 fakeid ${finalFakeid} 通过 appmsgpublish 接口查询文章，限制: ${limit || '无限制'}`);
    const articles = await this.fetchByWechatMPPublish(account, accountName, wechatCookies, finalFakeid, query, limit);
    this.logger.log(`[预览] 通过 appmsgpublish 接口获取 ${articles.length} 篇文章`);

    // 批量检查已存在的文章
    const originalUrls = articles.map((a) => a.originalUrl).filter(Boolean);
    const existingArticlesMap = await this.articleService.findExistingByUrls(
      originalUrls,
      account.id,
    );

    // 只返回基本信息（标题、时间、URL），并标记是否已存在
    const previewArticles = articles.map((article) => ({
      title: article.title || '无标题',
      publishTime: article.publishTime || new Date(),
      originalUrl: article.originalUrl,
      isExisting: existingArticlesMap.has(article.originalUrl),
    }));

    const existingCount = existingArticlesMap.size;
    const newCount = articles.length - existingCount;

    return {
      total: articles.length,
      newArticles: newCount,
      existingArticles: existingCount,
      articles: previewArticles,
    };
  }

  async fetchArticles(
    account: WechatAccount,
    accountName: string,
    wechatToken?: string,
    userId?: number,
    fakeid?: string,
    query?: string,
    limit?: number,
  ): Promise<{ success: number; failed: number; skipped: number; articles: any[] }> {
    // 统一使用 appmsgpublish 接口
    const finalFakeid = fakeid || account.fakeid;
    if (!finalFakeid) {
      throw new Error('缺少 fakeid 参数，无法查询文章。请先通过搜索公众号获取 fakeid 或确保公众号已保存 fakeid。');
    }

    // 获取 cookie 的方式：与 search 接口保持一致，直接使用 userId（从 req.user?.id || 1 获取）
    const targetUserId = userId || 1;
    const wechatCookies = await this.settingsService.getWechatCookies(targetUserId);
    if (!wechatCookies) {
      throw new Error('缺少微信公众号 cookies，无法使用 appmsgpublish 接口');
    }

    this.logger.log(`使用 fakeid ${finalFakeid} 通过 appmsgpublish 接口查询文章，限制: ${limit || '无限制'}`);
    const articles = await this.fetchByWechatMPPublish(account, accountName, wechatCookies, finalFakeid, query, limit);
    this.logger.log(`通过 appmsgpublish 接口获取 ${articles.length} 篇文章`);

    // 先批量检查已存在的文章，避免重复查询数据库
    const originalUrls = articles.map((a) => a.originalUrl).filter(Boolean);
    const existingArticlesMap = await this.articleService.findExistingByUrls(
      originalUrls,
      account.id,
    );
    this.logger.log(`已存在 ${existingArticlesMap.size} 篇文章，需要新增 ${articles.length - existingArticlesMap.size} 篇`);

    // 保存文章到数据库
    const savedArticles = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const articleData of articles) {
      try {
        // 检查文章是否已存在（根据 originalUrl）
        const existing = existingArticlesMap.get(articleData.originalUrl);

        if (!existing) {
          // 如果文章只有链接但没有完整内容，自动爬取完整内容
          let finalArticleData = articleData;
          if (articleData.originalUrl && 
              articleData.originalUrl.includes('mp.weixin.qq.com') &&
              (!articleData.content || articleData.content.length === 0)) {
            try {
              this.logger.log(`自动爬取文章完整内容: ${articleData.originalUrl}`);
              finalArticleData = await this.fetchArticleByUrl(
                articleData.originalUrl,
                account.userId,
                account.id,
                account.categoryId,
              );
              // 保留原有的标题（如果新标题为空）
              if (!finalArticleData.title || finalArticleData.title.length === 0) {
                finalArticleData.title = articleData.title;
              }
              // 保留原有的作者（如果新作者为空）
              if (!finalArticleData.author || finalArticleData.author.length === 0) {
                finalArticleData.author = articleData.author || accountName;
              }
              // 添加延迟避免请求过快
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
              this.logger.warn(`自动爬取文章内容失败，使用基本信息: ${error.message}`);
              // 如果爬取失败，继续使用原有的基本信息
            }
          }

          const article = await this.articleService.create({
            userId: account.userId,
            accountId: account.id,
            categoryId: account.categoryId,
            title: finalArticleData.title,
            content: finalArticleData.content,
            summary: finalArticleData.summary,
            coverImage: finalArticleData.coverImage,
            originalUrl: finalArticleData.originalUrl,
            publishTime: finalArticleData.publishTime || new Date(),
            author: finalArticleData.author,
            readStatus: 'unread',
          });
          savedArticles.push(article);
          successCount++;
        } else {
          skippedCount++;
          this.logger.log(`文章已存在，跳过: ${articleData.title}`);
        }
      } catch (error) {
        this.logger.error(`保存文章失败: ${error.message}`, error.stack);
        failedCount++;
      }
    }

    this.logger.log(`文章入库完成: 新增 ${successCount} 篇，跳过 ${skippedCount} 篇，失败 ${failedCount} 篇`);
    return {
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
      articles: savedArticles,
    };
  }

  /**
   * RSS 方式抓取文章
   */
  private async fetchByRSS(
    account: WechatAccount,
    accountName: string,
  ): Promise<ArticleData[]> {
    this.logger.log(`[RSS] 正在抓取公众号 "${accountName}" 的文章...`);

    if (!account.rssUrl) {
      this.logger.warn(`公众号 ${accountName} 未配置 RSS URL，改用爬虫方式`);
      return this.fetchByCrawl(account, accountName);
    }

    try {
      const response = await axios.get(account.rssUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const $ = load(response.data, { xmlMode: true });
      const articles: ArticleData[] = [];

      $('item').each((index, element) => {
        const $item = $(element);
        const title = $item.find('title').text().trim();
        const link = $item.find('link').text().trim();
        const description = $item.find('description').text().trim();
        const pubDate = $item.find('pubDate').text().trim();

        if (title && link) {
          articles.push({
            title,
            summary: description || undefined,
            originalUrl: link,
            publishTime: pubDate ? new Date(pubDate) : new Date(),
            author: accountName,
          });
        }
      });

      return articles;
    } catch (error) {
      this.logger.error(`RSS 抓取失败: ${error.message}`);
      // RSS 失败时回退到爬虫方式
      return this.fetchByCrawl(account, accountName);
    }
  }

  /**
   * 网页爬虫方式抓取文章
   * 优先尝试使用微信公众号平台API（如果配置了cookies），否则使用搜狗微信搜索
   * 参考：https://cloud.tencent.com/developer/article/1406410
   */
  private async fetchByCrawl(
    account: WechatAccount,
    accountName: string,
    wechatToken?: string,
    userId?: number,
    fakeid?: string,
    query?: string,
  ): Promise<ArticleData[]> {
    this.logger.log(`[爬虫] 正在抓取公众号 "${accountName}" 的文章...`);

    try {
      // 优先尝试使用微信公众号平台API（需要配置cookies）
      // 获取 cookie 的方式：与 search 接口保持一致，直接使用 userId（从 req.user?.id || 1 获取）
      const targetUserId = userId || 1;
      const wechatCookies = await this.settingsService.getWechatCookies(targetUserId);
      
      if (wechatCookies) {
        try {
          this.logger.log('尝试使用微信公众号平台API抓取...');
          // 优先使用 appmsgpublish 接口（已发布文章）
          const articles = await this.fetchByWechatMPPublish(account, accountName, wechatCookies, fakeid, query);
          if (articles && articles.length > 0) {
            this.logger.log(`通过微信公众号平台API（已发布）获取 ${articles.length} 篇文章`);
            return articles;
          }
          
          // 如果 appmsgpublish 没有结果，尝试使用 appmsg 接口
          const articles2 = await this.fetchByWechatMP(accountName, wechatCookies);
          if (articles2 && articles2.length > 0) {
            this.logger.log(`通过微信公众号平台API（全部）获取 ${articles2.length} 篇文章`);
            return articles2;
          }
        } catch (error) {
          this.logger.warn(`微信公众号平台API抓取失败，回退到搜狗搜索: ${error.message}`);
        }
      }

      // 回退到搜狗微信搜索方法
      // 第一步：搜索公众号
      const accountInfo = await this.searchWechatAccount(accountName);
      if (!accountInfo) {
        this.logger.warn(`未找到公众号: ${accountName}`);
        return [];
      }

      // 第二步：获取公众号的历史文章列表
      const articles = await this.fetchAccountArticles(
        accountInfo.url,
        accountName,
      );

      this.logger.log(`通过搜狗搜索获取 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      this.logger.error(`抓取失败: ${error.message}`, error.stack);
      throw new Error(`抓取公众号文章失败: ${error.message}`);
    }
  }

  /**
   * 搜索微信公众号
   */
  private async searchWechatAccount(
    accountName: string,
  ): Promise<{ name: string; url: string; avatar?: string } | null> {
    try {
      const searchUrl = `https://weixin.sogou.com/weixin?type=1&query=${encodeURIComponent(accountName)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://weixin.sogou.com/',
        },
        timeout: 10000,
      });

      const $ = load(response.data);

      // 查找第一个匹配的公众号
      const accountItem = $('.news-box .news-text h3 a').first();
      if (accountItem.length === 0) {
        return null;
      }

      const name = accountItem.text().trim();
      const url = accountItem.attr('href');
      const avatar = $('.news-box .news-pic img').first().attr('src');

      if (!url) {
        return null;
      }

      // 构建完整的 URL
      const fullUrl = url.startsWith('http')
        ? url
        : `https://weixin.sogou.com${url}`;

      return {
        name,
        url: fullUrl,
        avatar: avatar ? (avatar.startsWith('http') ? avatar : `https:${avatar}`) : undefined,
      };
    } catch (error) {
      this.logger.error(`搜索公众号失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取公众号的历史文章列表
   */
  private async fetchAccountArticles(
    accountUrl: string,
    accountName: string,
  ): Promise<ArticleData[]> {
    try {
      const response = await axios.get(accountUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://weixin.sogou.com/',
        },
        timeout: 15000,
      });

      const $ = load(response.data);
      const articles: ArticleData[] = [];
      const articleUrls: string[] = [];

      // 尝试多种选择器来解析文章列表
      const selectors = [
        '.news-list li',
        '.news-box',
        '.article-item',
        '.news-text',
        'ul.news-list2 li',
        '.wx-news-info',
        '[class*="news"]',
      ];

      for (const selector of selectors) {
        $(selector).each((index, element) => {
          try {
            const $item = $(element);
            
            // 尝试多种方式获取标题和链接
            let titleElement = $item.find('h3 a, h4 a, .title a, a[href*="mp.weixin"]').first();
            if (titleElement.length === 0) {
              titleElement = $item.find('a').first();
            }
            
            let title = titleElement.text().trim();
            let articleUrl = titleElement.attr('href') || titleElement.attr('data-url');
            
            // 如果还是没有找到，尝试从 data-* 属性获取
            if (!articleUrl) {
              articleUrl = $item.attr('data-url') || $item.find('[data-url]').attr('data-url');
            }
            
            // 如果标题为空，尝试从其他元素获取
            if (!title) {
              title = $item.find('h3, h4, .title, [class*="title"]').first().text().trim();
            }

            if (title && articleUrl && !title.includes('文章标题')) {
              // 构建完整的文章 URL
              let fullArticleUrl = articleUrl;
              if (!articleUrl.startsWith('http')) {
                if (articleUrl.startsWith('//')) {
                  fullArticleUrl = `https:${articleUrl}`;
                } else if (articleUrl.startsWith('/')) {
                  fullArticleUrl = `https://weixin.sogou.com${articleUrl}`;
                } else {
                  fullArticleUrl = `https://weixin.sogou.com/${articleUrl}`;
                }
              }

              // 避免重复
              if (!articleUrls.includes(fullArticleUrl)) {
                articleUrls.push(fullArticleUrl);

                const summary = $item
                  .find('.news-text-content, .txt-box .news-text-content, .summary, .desc, .text')
                  .first()
                  .text()
                  .trim();

                const coverImage = $item
                  .find('.news-pic img, .img-box img, img')
                  .first()
                  .attr('src');

                const timeText = $item
                  .find('.news-from, .time, [class*="time"]')
                  .first()
                  .text()
                  .trim();

                let publishTime: Date | undefined;
                if (timeText) {
                  publishTime = this.parsePublishTime(timeText);
                }

                articles.push({
                  title: title.replace(/\s+/g, ' ').trim(), // 清理多余空格
                  summary: summary || undefined,
                  coverImage: coverImage
                    ? coverImage.startsWith('http')
                      ? coverImage
                      : coverImage.startsWith('//')
                        ? `https:${coverImage}`
                        : `https:${coverImage}`
                    : undefined,
                  originalUrl: fullArticleUrl,
                  publishTime: publishTime || new Date(),
                  author: accountName,
                });
              }
            }
          } catch (error) {
            this.logger.warn(`解析文章项失败: ${error.message}`);
          }
        });

        // 如果找到了文章，就停止尝试其他选择器
        if (articles.length > 0) {
          break;
        }
      }

      // 如果还是没找到，尝试从所有链接中提取微信文章链接
      if (articles.length === 0) {
        this.logger.warn('使用备用方法：从所有链接中提取微信文章');
        $('a[href*="mp.weixin"]').each((index, element) => {
          try {
            const $link = $(element);
            const title = $link.text().trim() || $link.attr('title') || '';
            const articleUrl = $link.attr('href');

            if (title && articleUrl && !title.includes('文章标题') && title.length > 5) {
              let fullArticleUrl = articleUrl;
              if (!articleUrl.startsWith('http')) {
                fullArticleUrl = `https:${articleUrl}`;
              }

              if (!articleUrls.includes(fullArticleUrl)) {
                articleUrls.push(fullArticleUrl);
                articles.push({
                  title: title.replace(/\s+/g, ' ').trim(),
                  originalUrl: fullArticleUrl,
                  publishTime: new Date(),
                  author: accountName,
                });
              }
            }
          } catch (error) {
            this.logger.warn(`提取链接失败: ${error.message}`);
          }
        });
      }

      // 尝试从文章链接获取真实标题
      if (articles.length > 0) {
        this.logger.log(`找到 ${articles.length} 篇文章，开始获取真实标题...`);
        for (let i = 0; i < Math.min(articles.length, 10); i++) {
          try {
            const realTitle = await this.fetchArticleTitle(articles[i].originalUrl);
            if (realTitle && realTitle.length > 0) {
              articles[i].title = realTitle;
            }
            // 添加延迟避免请求过快
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            this.logger.warn(`获取文章标题失败: ${error.message}`);
          }
        }
      }

      this.logger.log(`最终获取 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      this.logger.error(`获取文章列表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据文章链接直接抓取文章内容
   * 支持微信公众号文章链接（mp.weixin.qq.com）
   */
  async fetchArticleByUrl(
    articleUrl: string,
    userId: number,
    accountId?: number,
    categoryId?: number,
  ): Promise<ArticleData> {
    this.logger.log(`[链接抓取] 正在抓取文章: ${articleUrl}`);

    try {
      // 验证链接格式
      if (!articleUrl || !articleUrl.includes('mp.weixin.qq.com')) {
        throw new Error('无效的微信公众号文章链接');
      }

      // 获取文章内容
      const response = await axios.get(articleUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://mp.weixin.qq.com/',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const $ = load(response.data);

      // 提取文章信息
      const articleData: ArticleData = {
        title: '',
        originalUrl: articleUrl,
        publishTime: new Date(),
      };

      // 1. 提取标题
      const titleSelectors = [
        '#activity-name',
        '#js_article_name',
        '.rich_media_title',
        'h1',
        'title',
        'meta[property="og:title"]',
      ];

      for (const selector of titleSelectors) {
        let title = '';
        if (selector.startsWith('meta')) {
          title = $(selector).attr('content') || '';
        } else {
          title = $(selector).first().text().trim();
        }
        if (title && title.length > 0 && !title.includes('微信') && !title.includes('公众号')) {
          articleData.title = title.replace(/\s+/g, ' ').trim();
          break;
        }
      }

      // 2. 提取作者
      const authorSelectors = [
        '#meta_content .rich_media_meta_text',
        '#meta_content',
        '.rich_media_meta_text',
        '#js_name',
        'meta[name="author"]',
      ];

      for (const selector of authorSelectors) {
        let author = '';
        if (selector.startsWith('meta')) {
          author = $(selector).attr('content') || '';
        } else {
          author = $(selector).first().text().trim();
        }
        if (author && author.length > 0) {
          articleData.author = author.replace(/\s+/g, ' ').trim();
          break;
        }
      }

      // 3. 提取摘要
      const summarySelectors = [
        '#js_content .rich_media_meta_text',
        '#js_article_desc',
        'meta[name="description"]',
        'meta[property="og:description"]',
      ];

      for (const selector of summarySelectors) {
        let summary = '';
        if (selector.startsWith('meta')) {
          summary = $(selector).attr('content') || '';
        } else {
          summary = $(selector).first().text().trim();
        }
        if (summary && summary.length > 0) {
          articleData.summary = summary.replace(/\s+/g, ' ').trim();
          break;
        }
      }

      // 4. 提取封面图（优先从meta标签，如果没有则从内容中找大图）
      const coverSelectors = [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        '#js_article_cover',
      ];

      for (const selector of coverSelectors) {
        let cover = '';
        if (selector.startsWith('meta')) {
          cover = $(selector).attr('content') || '';
        } else {
          cover = $(selector).first().attr('src') || $(selector).first().attr('data-src') || '';
        }
        if (cover && cover.length > 0) {
          // 处理相对路径
          if (cover.startsWith('//')) {
            cover = `https:${cover}`;
          } else if (cover.startsWith('/')) {
            cover = `https://mp.weixin.qq.com${cover}`;
          }
          // 过滤小图标和占位图
          if (cover && 
              !cover.includes('placeholder') && 
              !cover.includes('default') &&
              !cover.includes('blank') &&
              !cover.includes('loading') &&
              !cover.includes('icon') &&
              !cover.includes('logo')) {
            articleData.coverImage = cover;
            break;
          }
        }
      }

      // 5. 提取正文内容
      const contentSelectors = [
        '#js_content',
        '#js_article_content',
        '.rich_media_content',
        '.article-content',
      ];

      let contentElement: any = null;
      for (const selector of contentSelectors) {
        const content = $(selector).first();
        if (content.length > 0) {
          contentElement = content;
          // 清理内容，移除脚本和样式
          content.find('script, style, .qr_code_pc_outer, .qr_code_pc_inner').remove();
          const htmlContent = content.html() || '';
          if (htmlContent && htmlContent.length > 0) {
            articleData.content = htmlContent.trim();
            break;
          }
        }
      }

      // 6. 如果没有封面图，从文章内容中提取第一张大图并下载
      if (!articleData.coverImage && contentElement) {
        const largeImageUrl = this.findFirstLargeImage($, contentElement);
        if (largeImageUrl) {
          // 下载图片到本地
          const localPath = await this.downloadImage(largeImageUrl);
          if (localPath) {
            articleData.coverImage = localPath;
            this.logger.log(`从文章内容中提取并下载封面图: ${localPath}`);
          }
        }
      } else if (articleData.coverImage && articleData.coverImage.startsWith('http')) {
        // 如果封面图是外部链接，下载到本地
        const localPath = await this.downloadImage(articleData.coverImage);
        if (localPath) {
          articleData.coverImage = localPath;
        }
      }

      // 7. 下载并替换文章内容中的所有图片
      if (articleData.content && contentElement) {
        const images = contentElement.find('img');
        for (let i = 0; i < images.length; i++) {
          const img = $(images[i]);
          let imgSrc = img.attr('src') || 
                       img.attr('data-src') || 
                       img.attr('data-original') ||
                       img.attr('data-lazy-src') ||
                       '';

          if (imgSrc && imgSrc.startsWith('http')) {
            // 下载图片
            const localPath = await this.downloadImage(imgSrc);
            if (localPath) {
              // 替换图片链接
              img.attr('src', localPath);
              img.removeAttr('data-src');
              img.removeAttr('data-original');
              img.removeAttr('data-lazy-src');
              // 更新content
              articleData.content = contentElement.html() || articleData.content;
            }
            // 添加延迟避免请求过快
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
      }

      // 7. 提取发布时间
      const timeSelectors = [
        '#meta_content .rich_media_meta_text',
        '#publish_time',
        'meta[property="article:published_time"]',
        'time',
      ];

      for (const selector of timeSelectors) {
        let timeText = '';
        if (selector.startsWith('meta')) {
          timeText = $(selector).attr('content') || '';
        } else {
          timeText = $(selector).first().text().trim() || $(selector).first().attr('datetime') || '';
        }
        if (timeText) {
          const publishTime = this.parsePublishTime(timeText);
          if (publishTime) {
            articleData.publishTime = publishTime;
            break;
          }
        }
      }

      // 验证必要字段
      if (!articleData.title || articleData.title.length === 0) {
        throw new Error('无法提取文章标题');
      }

      this.logger.log(`成功抓取文章: ${articleData.title}`);
      return articleData;
    } catch (error) {
      this.logger.error(`抓取文章失败: ${error.message}`, error.stack);
      throw new Error(`抓取文章失败: ${error.message}`);
    }
  }

  /**
   * 从文章链接获取真实标题
   */
  private async fetchArticleTitle(articleUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(articleUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        timeout: 10000,
        maxRedirects: 5,
      });

      const $ = load(response.data);

      // 尝试多种方式获取标题
      const titleSelectors = [
        '#activity-name',
        '.rich_media_title',
        'h1',
        'title',
        '[id*="title"]',
        '[class*="title"]',
      ];

      for (const selector of titleSelectors) {
        const title = $(selector).first().text().trim();
        if (title && title.length > 0 && !title.includes('微信') && !title.includes('公众号')) {
          return title.replace(/\s+/g, ' ').trim();
        }
      }

      // 从 meta 标签获取
      const metaTitle = $('meta[property="og:title"]').attr('content') ||
                       $('meta[name="title"]').attr('content');
      if (metaTitle) {
        return metaTitle.trim();
      }

      return null;
    } catch (error) {
      this.logger.warn(`获取文章标题失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 解析发布时间
   */
  private parsePublishTime(timeText: string): Date | undefined {
    try {
      const now = new Date();
      const text = timeText.trim();

      // 处理 "今天"、"昨天" 等
      if (text.includes('今天')) {
        return now;
      }
      if (text.includes('昨天')) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      }

      // 处理 "X小时前"、"X分钟前"
      const hoursMatch = text.match(/(\d+)小时前/);
      if (hoursMatch) {
        const hours = parseInt(hoursMatch[1], 10);
        const time = new Date(now);
        time.setHours(time.getHours() - hours);
        return time;
      }

      const minutesMatch = text.match(/(\d+)分钟前/);
      if (minutesMatch) {
        const minutes = parseInt(minutesMatch[1], 10);
        const time = new Date(now);
        time.setMinutes(time.getMinutes() - minutes);
        return time;
      }

      // 处理日期格式 "2024-01-15" 或 "01-15"
      const dateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        return new Date(
          parseInt(dateMatch[1], 10),
          parseInt(dateMatch[2], 10) - 1,
          parseInt(dateMatch[3], 10),
        );
      }

      const shortDateMatch = text.match(/(\d{2})-(\d{2})/);
      if (shortDateMatch) {
        const month = parseInt(shortDateMatch[1], 10) - 1;
        const day = parseInt(shortDateMatch[2], 10);
        const year = now.getFullYear();
        return new Date(year, month, day);
      }

      return undefined;
    } catch (error) {
      this.logger.warn(`解析发布时间失败: ${timeText}`);
      return undefined;
    }
  }

  /**
   * API 方式获取文章
   * 使用微信开放平台 API 获取文章（需要用户授权）
   */
  /**
   * 使用微信公众号平台内部API抓取文章
   * 参考：https://cloud.tencent.com/developer/article/1406410
   * 需要配置 WECHAT_MP_COOKIES 环境变量（从浏览器登录后获取的cookies）
   */
  private async fetchByWechatMP(
    accountName: string,
    cookies: string,
  ): Promise<ArticleData[]> {
    this.logger.log(`[微信公众号平台API] 正在获取公众号 "${accountName}" 的文章...`);

    try {
      // 第一步：搜索公众号，获取fakeid
      // 使用用户提供的接口格式
      const searchUrl = 'https://mp.weixin.qq.com/cgi-bin/searchbiz';
      const token = this.extractTokenFromCookies(cookies);
      
      // 生成fingerprint（32位十六进制字符串）
      const fingerprint = this.extractFingerprintFromCookies(cookies);
      
      const searchParams = {
        action: 'search_biz',
        begin: '0',
        count: '5',
        query: accountName,
        fingerprint: fingerprint,
        token: token,
        lang: 'zh_CN',
        f: 'json',
        ajax: '1',
      };

      const searchResponse = await axios.get(searchUrl, {
        params: searchParams,
        headers: {
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'Referer': 'https://mp.weixin.qq.com/cgi-bin/appmsg',
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 15000,
      });

      const searchData = searchResponse.data;
      this.logger.log(`搜索公众号响应: ${JSON.stringify(searchData).substring(0, 200)}`);
      
      if (!searchData || searchData.base_resp?.ret !== 0) {
        const errorMsg = searchData?.base_resp?.err_msg || '未知错误';
        this.logger.warn(`搜索公众号失败: ${errorMsg}`);
        return [];
      }

      if (!searchData.list || searchData.list.length === 0) {
        this.logger.warn(`未找到公众号: ${accountName}`);
        return [];
      }

      // 获取第一个匹配的公众号的fakeid
      const fakeid = searchData.list[0].fakeid;
      if (!fakeid) {
        this.logger.warn(`无法获取公众号fakeid`);
        return [];
      }

      this.logger.log(`找到公众号: ${searchData.list[0].nickname}, fakeid: ${fakeid}`);

      // 第二步：获取文章列表
      const articlesUrl = 'https://mp.weixin.qq.com/cgi-bin/appmsg';
      const articles: ArticleData[] = [];
      let begin = 0;
      const count = 1; // 每次获取10篇
      let hasMore = true;

      while (hasMore && begin < 100) {
        // 限制最多获取100篇文章
        const articlesParams = {
          action: 'list_ex',
          begin: begin.toString(),
          count: count.toString(),
          fakeid: fakeid,
          type: '9',
          query: '',
          token: this.extractTokenFromCookies(cookies),
          lang: 'zh_CN',
          f: 'json',
          ajax: '1',
        };

        const articlesResponse = await axios.get(articlesUrl, {
          params: articlesParams,
          headers: {
            'Cookie': cookies,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://mp.weixin.qq.com/',
          },
          timeout: 15000,
        });

        const articlesData = articlesResponse.data;
        if (!articlesData || !articlesData.app_msg_list) {
          hasMore = false;
          break;
        }

        for (const item of articlesData.app_msg_list) {
          articles.push({
            title: item.title || '无标题',
            summary: item.digest || undefined,
            coverImage: item.cover || undefined,
            originalUrl: item.link || undefined,
            publishTime: item.update_time ? new Date(item.update_time * 1000) : new Date(),
            author: accountName,
          });
        }

        // 检查是否还有更多文章
        hasMore = articlesData.app_msg_list.length === count;
        begin += count;

        // 添加延迟避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      this.logger.log(`通过微信公众号平台API获取 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      this.logger.error(`微信公众号平台API抓取失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 从cookies中提取token
   */
  private extractTokenFromCookies(cookies: string): string {
    const match = cookies.match(/token=(\d+)/);
    return match ? match[1] : '';
  }

  /**
   * 从cookies中提取fingerprint（如果存在）
   * 如果不存在，生成一个随机fingerprint
   */
  private extractFingerprintFromCookies(cookies: string): string {
    // fingerprint可能不在cookies中，生成一个32位的随机字符串
    // 格式类似：2e24e9ae2d81e529ffff9a2dd559db77
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * 使用 appmsgpublish 接口获取已发布文章
   * 接口：https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list
   * 响应结构：
   * {
   *   "ret": 0,
   *   "is_admin": true,
   *   "publish_page": "{\"total_count\":1822,\"publish_count\":6,\"publish_list\":[...]}"
   * }
   */
  private async fetchByWechatMPPublish(
    account: WechatAccount,
    accountName: string,
    cookies: string,
    fakeid?: string,
    query?: string,
    limit?: number,
  ): Promise<ArticleData[]> {
    this.logger.log(`[微信公众号平台API-已发布] 正在获取公众号 "${accountName}" 的已发布文章...`);

    try {
      // 第一步：检查 fakeid，如果没有则直接报错
      const finalFakeid = fakeid || account.fakeid;
      
      if (!finalFakeid) {
        const errorMsg = '缺少 fakeid 参数，无法查询文章。请先通过搜索公众号获取 fakeid 或确保公众号已保存 fakeid。';
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      this.logger.log(`使用 fakeid: ${finalFakeid} 查询文章`);

      // 第二步：使用 appmsgpublish 接口获取已发布文章
      const token = 1516911756;
      const fingerprint = this.extractFingerprintFromCookies(cookies);
      const articles: ArticleData[] = [];
      let begin = 0;
      const count = 10; // 每次请求获取的数量
      const maxLimit = limit || 10; // 前端传入的限制，默认100篇
      const searchQuery = query || ''; // 使用传入的 query 或空字符串
      let hasMore = true;

      // 根据前端传入的 limit 来决定获取多少篇文章
      while (hasMore && articles.length < maxLimit) {
        const publishUrl = 'https://mp.weixin.qq.com/cgi-bin/appmsgpublish';
        const publishParams = {
          sub: 'list',
          search_field: 'null',
          begin: begin.toString(),
          count: count.toString(),
          query: searchQuery,
          fakeid: finalFakeid,
          type: '101_1',
          free_publish_type: '1',
          sub_action: 'list_ex',
          fingerprint: fingerprint,
          token: token,
          lang: 'zh_CN',
          f: 'json',
          ajax: '1',
        };

        this.logger.log(`[appmsgpublish] 请求参数: begin=${begin}, count=${count}, fakeid=${finalFakeid}`);

        const publishResponse = await axios.get(publishUrl, {
          params: publishParams,
          headers: {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
            'priority': 'u=1, i',
            'referer': `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN&timestamp=${Date.now()}`,
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
            'x-requested-with': 'XMLHttpRequest',
            'Cookie': cookies,
          },
          maxBodyLength: Infinity,
          timeout: 60000, // 超时时间60秒
        });

        const publishData = publishResponse.data;
        this.logger.log(`[appmsgpublish] 响应状态: ${publishResponse.status}`);
        
        // 检查响应状态 - 响应结构是 base_resp.ret，不是 ret
        if (!publishData || publishData.base_resp?.ret !== 0) {
          const errorMsg = publishData?.base_resp?.err_msg || publishData?.err_msg || '未知错误';
          this.logger.warn(`获取已发布文章失败: ${errorMsg}`);
          hasMore = false;
          break;
        }

        // 解析 publish_page（它是一个转义的 JSON 字符串）
        let publishPage: any = null;
        if (publishData.publish_page) {
          try {
            // 如果 publish_page 是字符串，需要解析
            if (typeof publishData.publish_page === 'string') {
              publishPage = JSON.parse(publishData.publish_page);
            } else {
              publishPage = publishData.publish_page;
            }
            this.logger.log(`[appmsgpublish] 解析成功，total_count: ${publishPage?.total_count || 0}, publish_list: ${publishPage?.publish_list?.length || 0}`);
          } catch (error) {
            const errorMsg = `解析 publish_page 失败: ${error.message}`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
          }
        } else {
          const errorMsg = '响应中未包含 publish_page 字段';
          this.logger.error(errorMsg);
          throw new Error(errorMsg);
        }

        if (!publishPage || !publishPage.publish_list || publishPage.publish_list.length === 0) {
          this.logger.warn(`[appmsgpublish] publish_list 为空，结束循环`);
          hasMore = false;
          break;
        }

        // 从 publish_list 中提取文章
        this.logger.log(`[appmsgpublish] 开始处理 ${publishPage.publish_list.length} 个 publishItem`);
        for (let i = 0; i < publishPage.publish_list.length; i++) {
          const publishItem = publishPage.publish_list[i];
          try {
            // publish_info 也是一个 JSON 字符串，需要解析
            let publishInfo: any = null;
            if (publishItem.publish_info && typeof publishItem.publish_info === 'string') {
              try {
                publishInfo = JSON.parse(publishItem.publish_info);
              } catch (error) {
                this.logger.warn(`解析 publish_info 失败: ${error.message}，跳过该项`);
                continue;
              }
            } else if (publishItem.publish_info) {
              publishInfo = publishItem.publish_info;
            }

            // 从 publishInfo 中提取文章信息
            // publish_info 包含 appmsgex 数组，里面是实际的文章信息
            if (publishInfo && publishInfo.appmsgex && Array.isArray(publishInfo.appmsgex)) {
              for (const articleItem of publishInfo.appmsgex) {
                if (articleItem.link && articleItem.title) {
                  // 如果已达到限制，停止添加
                  if (articles.length >= maxLimit) {
                    break;
                  }
                  const article = {
                    title: articleItem.title || '无标题',
                    summary: articleItem.digest || undefined,
                    coverImage: articleItem.cover || undefined,
                    originalUrl: articleItem.link,
                    publishTime: articleItem.update_time 
                      ? new Date(articleItem.update_time * 1000) 
                      : publishInfo?.sent_info?.time
                      ? new Date(publishInfo.sent_info.time * 1000)
                      : new Date(),
                    author: articleItem.author_name || accountName,
                  };
                  articles.push(article);
                }
              }
            } else {
              // 兼容：如果 publishItem 直接包含 appmsgex 数组（旧格式）
              if (publishItem.appmsgex && Array.isArray(publishItem.appmsgex)) {
                for (const articleItem of publishItem.appmsgex) {
                  if (articles.length >= maxLimit) {
                    break;
                  }
                  if (articleItem.link && articleItem.title) {
                    articles.push({
                      title: articleItem.title || '无标题',
                      summary: articleItem.digest || undefined,
                      coverImage: articleItem.cover || undefined,
                      originalUrl: articleItem.link,
                      publishTime: articleItem.update_time 
                        ? new Date(articleItem.update_time * 1000) 
                        : new Date(),
                      author: accountName,
                    });
                  }
                }
              }
            }
            
            // 如果已达到限制，跳出外层循环
            if (articles.length >= maxLimit) {
              break;
            }
          } catch (error) {
            this.logger.warn(`处理 publishItem 失败: ${error.message}，跳过该项`);
            continue;
          }
        }

        // 检查是否还有更多文章
        // 如果返回的文章数量少于请求的数量，或者已经达到限制，说明没有更多了
        const totalCount = publishPage.total_count || 0;
        const hasMoreData = totalCount > 0 && begin + count < totalCount;
        const reachedLimit = articles.length >= maxLimit;
        hasMore = publishPage.publish_list.length > 0 && hasMoreData && !reachedLimit;
        
        this.logger.log(`[appmsgpublish] 已获取 ${articles.length} 篇文章，限制: ${maxLimit}，总数: ${totalCount}，是否继续: ${hasMore}`);
        
        // 如果已达到限制，停止循环
        if (articles.length >= maxLimit) {
          hasMore = false;
          break;
        }
        
        begin += count;

        // 添加延迟避免请求过快
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      this.logger.log(`通过微信公众号平台API（已发布）获取 ${articles.length} 篇文章`);
      return articles;
    } catch (error) {
      this.logger.error(`微信公众号平台API（已发布）抓取失败: ${error.message}`);
      throw error;
    }
  }

  private async fetchByAPI(
    account: WechatAccount,
    accountName: string,
    wechatToken?: string,
    userId?: number,
    fakeid?: string,
    query?: string,
  ): Promise<ArticleData[]> {
    this.logger.log(`[API] 正在获取公众号 "${accountName}" 的文章...`);

    // 如果配置了微信公众号平台cookies，使用微信公众号平台API
    // 获取 cookie 的方式：与 search 接口保持一致，直接使用 userId（从 req.user?.id || 1 获取）
    const targetUserId = userId || 1;
    const wechatCookies = await this.settingsService.getWechatCookies(targetUserId);
    
    if (wechatCookies) {
      // 优先使用 appmsgpublish 接口
      try {
        const articles = await this.fetchByWechatMPPublish(account, accountName, wechatCookies, fakeid, query);
        if (articles && articles.length > 0) {
          return articles;
        }
      } catch (error) {
        this.logger.warn(`appmsgpublish接口失败，尝试appmsg接口: ${error.message}`);
      }
      
      // 回退到 appmsg 接口
      return this.fetchByWechatMP(accountName, wechatCookies);
    }

    if (!wechatToken) {
      this.logger.warn(`未提供微信token，改用爬虫方式`);
      return this.fetchByCrawl(account, accountName, wechatToken, userId);
    }

    try {
      // TODO: 使用微信开放平台 API 获取文章
      // 注意：微信API通常只能获取用户自己创建的公众号的文章
      // 对于其他公众号，仍然需要使用爬虫方式
      this.logger.warn(`微信API方式暂未完全实现，改用爬虫方式`);
      return this.fetchByCrawl(account, accountName, wechatToken, userId);
    } catch (error) {
      this.logger.error(`API获取失败，改用爬虫方式: ${error.message}`);
      return this.fetchByCrawl(account, accountName, wechatToken, userId);
    }
  }
}

