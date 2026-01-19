import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import axios from 'axios';
import { AccountService } from './account.service';
import { FetchService } from './fetch.service';
import { ArticleService } from '../article/article.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly fetchService: FetchService,
    private readonly articleService: ArticleService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const account = await this.accountService.create(userId, createAccountDto);
    return {
      code: 200,
      message: '创建成功',
      data: account,
    };
  }

  @Get()
  async findAll(@Request() req, @Query('categoryId') categoryId?: string) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const categoryIdNum = categoryId ? +categoryId : undefined;
    const accounts = await this.accountService.findAll(userId, categoryIdNum);
    return {
      code: 200,
      message: '获取成功',
      data: accounts,
    };
  }

  /**
   * 搜索公众号（使用微信公众号平台API）
   * 注意：必须在 @Get(':id') 之前定义，否则会被当作 id 参数
   */
  @Get('search')
  async searchAccount(@Query('query') query: string) {
    if (!query) {
      return {
        code: 400,
        message: '请输入搜索关键词',
        data: null,
      };
    }

    // 使用环境变量中的 Cookie，如果没有配置则使用默认的 Cookie
    const wechatCookies = process.env.WECHAT_MP_COOKIES || 'appmsglist_action_3277923148=card; ptcz=d9a14fa881b4e8f292c946b1dfa882d9f6a29151e71e32b121ea30dbe0db6cb9; _qimei_h38=1f4eaf42075c9577838f9e5103000004118a06; wxuin=41271556764582; mm_lang=zh_CN; pgv_pvid=1793925004; __root_domain_v=.weixin.qq.com; _qddaz=QD.344941308944398; qq_domain_video_guid_verify=f43418be9fe9624a; _qimei_q36=; _qimei_fingerprint=8d3029a85bf596b58ffd672d6730668b; ua_id=4WRasfbgywK9QSE4AAAAAIL8Z6AuoeV9s7saZAot8b0=; cert=VQblztDN6rX65Eq29SXlZkKhn8q7eG_M; rewardsn=; wxtokenkey=777; sig_login=h01306b69e77901e179c20b1749f8d02dbc3280d09628fdf830baa2b1e56235495f82bf6810435509b8; _clck=3277923148|1|g2u|0; RK=YFwOPrpAfE; openid=ocb7_60sUn3ko_jm0en1GR6RFR9g; noticeLoginFlag=1; remember_acct=944532395%40qq.com; openid2ticket_ocb7_6-EBBfimgpq5ghpIRTtVY5o=ChpEWZrtOdlXbTw+xSmnpXXA6lrSb95M6dFZwvJp8jQ=; __wx_phantom_mark__=dGbDUCUaFe; uuid=b989edd5b4eaeb1fe9e33ffe0d6c640b; rand_info=CAESIIwQxmHeKly5YU7Dj/7Phkh720hLmrpfwM9fwUtj9Zm0; slave_bizuin=3277923148; data_bizuin=3277923148; bizuin=3277923148; data_ticket=qQUlVGZ9IE/VKRIPFzay3ChAzqLcETuWh0cffgWw820+G4uIf5MYPLiQJ0B27Wh/; slave_sid=Z1ZXSERjbFFIb2pQRTZaYU1LZ0lvWnZRelZVS2lOYmFXQTZyRzNzN3ZzNDZES0JfU2RWYWI5MlBkSE5yb0VfcE1SQUtkNVU2ZEN0cHZYdEFUTU1UVHJhd1ZVRE9DTWJiYzg5clN1NXpDMnhrUGhaUXF0Y0pHWDJrU0daYkxFdWVraTJDRGRWdmZHcEFKMkhZ; slave_user=gh_b64433dd3a7a; xid=62214c24646bd6cbac48f55a2b83963a; _clsk=1yuj1pr|1768833315773|3|1|mp.weixin.qq.com/weheat-agent/payload/record; bizuin=3277923148; data_bizuin=3277923148; data_ticket=qQUlVGZ9IE/VKRIPFzay3ChAzqLcETuWh0cffgWw820+G4uIf5MYPLiQJ0B27Wh/; rand_info=CAESIIwQxmHeKly5YU7Dj/7Phkh720hLmrpfwM9fwUtj9Zm0; slave_bizuin=3277923148; slave_sid=Z1ZXSERjbFFIb2pQRTZaYU1LZ0lvWnZRelZVS2lOYmFXQTZyRzNzN3ZzNDZES0JfU2RWYWI5MlBkSE5yb0VfcE1SQUtkNVU2ZEN0cHZYdEFUTU1UVHJhd1ZVRE9DTWJiYzg5clN1NXpDMnhrUGhaUXF0Y0pHWDJrU0daYkxFdWVraTJDRGRWdmZHcEFKMkhZ; slave_user=gh_b64433dd3a7a';

    try {
      const searchUrl = 'https://mp.weixin.qq.com/cgi-bin/searchbiz';
      
      // 使用固定的fingerprint和token（从用户提供的接口配置中提取）
      const fingerprint = '2e24e9ae2d81e529ffff9a2dd559db77';
      const token = '1516911756';

      const searchParams = {
        action: 'search_biz',
        begin: '0',
        count: '5',
        query: query,
        fingerprint: fingerprint,
        token: token,
        lang: 'zh_CN',
        f: 'json',
        ajax: '1',
      };

      const searchResponse = await axios.get(searchUrl, {
        params: searchParams,
        headers: {
          'accept': '*/*',
          'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'priority': 'u=1, i',
          'referer': 'https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=1516911756&lang=zh_CN&timestamp=1768833313771',
          'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
          'Cookie': wechatCookies,
        },
        maxBodyLength: Infinity,
        timeout: 15000,
      });

      const searchData = searchResponse.data;
      if (!searchData || searchData.base_resp?.ret !== 0) {
        const errorMsg = searchData?.base_resp?.err_msg || '未知错误';
        return {
          code: 500,
          message: `搜索失败: ${errorMsg}`,
          data: null,
        };
      }

      if (!searchData.list || searchData.list.length === 0) {
        return {
          code: 200,
          message: '未找到相关公众号',
          data: {
            list: [],
          },
        };
      }

      return {
        code: 200,
        message: '搜索成功',
        data: {
          list: searchData.list.map((item: any) => ({
            nickname: item.nickname,
            name: item.nickname,
            alias: item.alias,
            fakeid: item.fakeid,
            headimg: item.headimg,
            service_type: item.service_type,
          })),
        },
      };
    } catch (error: any) {
      return {
        code: 500,
        message: `搜索失败: ${error.message}`,
        data: null,
      };
    }
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const account = await this.accountService.findOne(+id, userId);
    return {
      code: 200,
      message: '获取成功',
      data: account,
    };
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const account = await this.accountService.update(+id, userId, updateAccountDto);
    return {
      code: 200,
      message: '更新成功',
      data: account,
    };
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    await this.accountService.remove(+id, userId);
    return {
      code: 200,
      message: '删除成功',
    };
  }

  @Post('batch-delete')
  async removeBatch(@Request() req, @Body() body: { ids: number[] }) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    await this.accountService.removeBatch(body.ids, userId);
    return {
      code: 200,
      message: '批量删除成功',
    };
  }

  @Post(':id/fetch')
  async fetch(
    @Request() req,
    @Param('id') id: string,
    @Body() body?: { accountName?: string; wechatToken?: string },
  ) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const account = await this.accountService.findOne(+id, userId);
    
    // 使用传入的 accountName 或使用公众号名称
    const accountName = body?.accountName || account.name;
    const wechatToken = body?.wechatToken;

    try {
      // 根据抓取方式获取文章列表
      const result = await this.fetchService.fetchArticles(
        account,
        accountName,
        wechatToken,
      );

      // 更新公众号的文章统计
      await this.accountService.updateArticleStats(account.id, userId);

      return {
        code: 200,
        message: `成功加载 ${result.success} 篇文章`,
        data: {
          accountId: account.id,
          accountName: account.name,
          fetchMethod: account.fetchMethod,
          success: result.success,
          failed: result.failed,
          total: result.articles.length,
          articles: result.articles.map((article) => ({
            id: article.id,
            title: article.title,
            publishTime: article.publishTime,
          })),
        },
      };
    } catch (error) {
      return {
        code: 500,
        message: `抓取失败: ${error.message}`,
        data: {
          accountId: account.id,
          accountName: account.name,
          fetchMethod: account.fetchMethod,
          error: error.message,
        },
      };
    }
  }


  /**
   * 根据文章链接直接抓取文章
   */
  @Post('fetch-by-url')
  async fetchByUrl(
    @Request() req,
    @Body() body: { url: string; accountId?: number; categoryId?: number },
  ) {
    const userId = req.user?.id || 1; // TODO: 从JWT获取用户ID
    const { url, accountId, categoryId } = body;

    if (!url || !url.includes('mp.weixin.qq.com')) {
      return {
        code: 400,
        message: '无效的微信公众号文章链接',
        data: null,
      };
    }

    try {
      // 获取文章数据
      const articleData = await this.fetchService.fetchArticleByUrl(
        url,
        userId,
        accountId,
        categoryId,
      );

      // 检查文章是否已存在
      let account = null;
      if (accountId) {
        account = await this.accountService.findOne(accountId, userId);
      }

      // 检查文章是否已存在（根据 originalUrl 和 accountId）
      const existing = await this.articleService.findByOriginalUrl(
        articleData.originalUrl,
        accountId,
      );

      if (existing) {
        return {
          code: 200,
          message: '文章已存在',
          data: {
            article: existing,
            isNew: false,
          },
        };
      }

      // 保存文章到数据库
      const articleDataToSave: any = {
        userId,
        title: articleData.title,
        originalUrl: articleData.originalUrl,
        publishTime: articleData.publishTime || new Date(),
        readStatus: 'unread',
      };

      // 只添加存在的字段（不设置 accountId 和 categoryId，让它们保持 undefined，这样 TypeORM 会使用默认值 null）
      // 注意：如果字段在实体中标记为 nullable: true，TypeORM 会自动处理 null 值
      if (accountId !== undefined && accountId !== null) {
        articleDataToSave.accountId = accountId;
      }
      // 如果不设置 accountId，TypeORM 会使用数据库的默认值（null）
      
      if (categoryId !== undefined && categoryId !== null) {
        articleDataToSave.categoryId = categoryId;
      } else if (account?.categoryId !== undefined && account?.categoryId !== null) {
        articleDataToSave.categoryId = account.categoryId;
      }

      if (articleData.content) {
        articleDataToSave.content = articleData.content;
      }
      if (articleData.summary) {
        articleDataToSave.summary = articleData.summary;
      }
      if (articleData.coverImage) {
        articleDataToSave.coverImage = articleData.coverImage;
      }
      if (articleData.author) {
        articleDataToSave.author = articleData.author;
      }

      const article = await this.articleService.create(articleDataToSave);

      // 如果指定了公众号，更新统计
      if (account) {
        await this.accountService.updateArticleStats(account.id, userId);
      }

      return {
        code: 200,
        message: '抓取成功',
        data: {
          article,
          isNew: true,
        },
      };
    } catch (error) {
      return {
        code: 500,
        message: `抓取失败: ${error.message}`,
        data: {
          error: error.message,
        },
      };
    }
  }
}

