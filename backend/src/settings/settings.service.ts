import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SettingsService {
  // 使用内存存储 cookies（实际应该使用数据库）
  private cookiesStore: Map<number, string> = new Map();

  // 默认的微信 cookies（写死在代码中）
  private readonly defaultCookies = 'appmsglist_action_3277923148=card; ptcz=d9a14fa881b4e8f292c946b1dfa882d9f6a29151e71e32b121ea30dbe0db6cb9; _qimei_h38=1f4eaf42075c9577838f9e5103000004118a06; wxuin=41271556764582; mm_lang=zh_CN; pgv_pvid=1793925004; __root_domain_v=.weixin.qq.com; _qddaz=QD.344941308944398; qq_domain_video_guid_verify=f43418be9fe9624a; _qimei_q36=; _qimei_fingerprint=8d3029a85bf596b58ffd672d6730668b; ua_id=4WRasfbgywK9QSE4AAAAAIL8Z6AuoeV9s7saZAot8b0=; cert=VQblztDN6rX65Eq29SXlZkKhn8q7eG_M; rewardsn=; wxtokenkey=777; sig_login=h01306b69e77901e179c20b1749f8d02dbc3280d09628fdf830baa2b1e56235495f82bf6810435509b8; RK=YFwOPrpAfE; openid=ocb7_60sUn3ko_jm0en1GR6RFR9g; noticeLoginFlag=1; remember_acct=944532395%40qq.com; openid2ticket_ocb7_6-EBBfimgpq5ghpIRTtVY5o=ChpEWZrtOdlXbTw+xSmnpXXA6lrSb95M6dFZwvJp8jQ=; __wx_phantom_mark__=dGbDUCUaFe; _clck=3277923148|1|g2z|0; uuid=82e2074d5c480cf0fa9288c596633776; rand_info=CAESIC4+Ytc9ipGVcCt+dmDgB6awhowG9sYwIOXDYT5YCGmo; slave_bizuin=3277923148; data_bizuin=3277923148; bizuin=3277923148; data_ticket=9tBAEyWUacaNGoc0sIschwV5fYUdxp93FRyDit6KrptRtbozbU+oebBHu7ZsZIPz; slave_sid=bkREbDdmTUVWWldFNVV2M1JlNXJTaHZKVElCQXJOYl91aDdDY3pwWkh4RVFVT1lJbFN0b0x4VXJkbzZMejloZFFOSmZvell6WFJSZlR6MFJ4ZEZHS01xbnAzZ0JTblg2SExmcWIxQkFXcjFMcFRzQllEQU5CS0Z0Q3k0VmlacDdPRnEwVmF4YXpxUGFZaVdl; slave_user=gh_b64433dd3a7a; xid=5571751713fc21c6a2d6243c306644bd; _clsk=929xhr|1769263825289|2|1|mp.weixin.qq.com/weheat-agent/payload/record; bizuin=3277923148; data_bizuin=3277923148; data_ticket=9tBAEyWUacaNGoc0sIschwV5fYUdxp93FRyDit6KrptRtbozbU+oebBHu7ZsZIPz; rand_info=CAESIC4+Ytc9ipGVcCt+dmDgB6awhowG9sYwIOXDYT5YCGmo; slave_bizuin=3277923148; slave_sid=bkREbDdmTUVWWldFNVV2M1JlNXJTaHZKVElCQXJOYl91aDdDY3pwWkh4RVFVT1lJbFN0b0x4VXJkbzZMejloZFFOSmZvell6WFJSZlR6MFJ4ZEZHS01xbnAzZ0JTblg2SExmcWIxQkFXcjFMcFRzQllEQU5CS0Z0Q3k0VmlacDdPRnEwVmF4YXpxUGFZaVdl; slave_user=gh_b64433dd3a7a';
  
  // 默认的微信 token（写死在代码中）
  private readonly defaultToken = '1019702472';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getWechatCookies(userId: number): Promise<string> {
    // 直接返回写死的 cookies
    return this.defaultCookies;
  }

  async getWechatToken(userId: number): Promise<string> {
    // 直接返回写死的 token
    return this.defaultToken;
  }

  async setWechatCookies(userId: number, cookies: string): Promise<void> {
    // 不再允许修改 cookies，直接忽略
    // this.cookiesStore.set(userId, cookies);
  }
}
