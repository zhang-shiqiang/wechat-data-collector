import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SettingsService {
  // 使用内存存储 cookies（实际应该使用数据库）
  private cookiesStore: Map<number, string> = new Map();

  // 默认的微信 cookies
  private readonly defaultCookies = process.env.WECHAT_MP_COOKIES || 'appmsglist_action_3277923148=card; ptcz=d9a14fa881b4e8f292c946b1dfa882d9f6a29151e71e32b121ea30dbe0db6cb9; _qimei_h38=1f4eaf42075c9577838f9e5103000004118a06; wxuin=41271556764582; mm_lang=zh_CN; pgv_pvid=1793925004; __root_domain_v=.weixin.qq.com; _qddaz=QD.344941308944398; qq_domain_video_guid_verify=f43418be9fe9624a; _qimei_q36=; _qimei_fingerprint=8d3029a85bf596b58ffd672d6730668b; ua_id=4WRasfbgywK9QSE4AAAAAIL8Z6AuoeV9s7saZAot8b0=; cert=VQblztDN6rX65Eq29SXlZkKhn8q7eG_M; rewardsn=; wxtokenkey=777; sig_login=h01306b69e77901e179c20b1749f8d02dbc3280d09628fdf830baa2b1e56235495f82bf6810435509b8; _clck=3277923148|1|g2u|0; RK=YFwOPrpAfE; openid=ocb7_60sUn3ko_jm0en1GR6RFR9g; noticeLoginFlag=1; remember_acct=944532395%40qq.com; openid2ticket_ocb7_6-EBBfimgpq5ghpIRTtVY5o=ChpEWZrtOdlXbTw+xSmnpXXA6lrSb95M6dFZwvJp8jQ=; __wx_phantom_mark__=dGbDUCUaFe; uuid=b989edd5b4eaeb1fe9e33ffe0d6c640b; rand_info=CAESIIwQxmHeKly5YU7Dj/7Phkh720hLmrpfwM9fwUtj9Zm0; slave_bizuin=3277923148; data_bizuin=3277923148; bizuin=3277923148; data_ticket=qQUlVGZ9IE/VKRIPFzay3ChAzqLcETuWh0cffgWw820+G4uIf5MYPLiQJ0B27Wh/; slave_sid=Z1ZXSERjbFFIb2pQRTZaYU1LZ0lvWnZRelZVS2lOYmFXQTZyRzNzN3ZzNDZES0JfU2RWYWI5MlBkSE5yb0VfcE1SQUtkNVU2ZEN0cHZYdEFUTU1UVHJhd1ZVRE9DTWJiYzg5clN1NXpDMnhrUGhaUXF0Y0pHWDJrU0daYkxFdWVraTJDRGRWdmZHcEFKMkhZ; slave_user=gh_b64433dd3a7a; xid=62214c24646bd6cbac48f55a2b83963a; _clsk=1yuj1pr|1768833315773|3|1|mp.weixin.qq.com/weheat-agent/payload/record; bizuin=3277923148; data_bizuin=3277923148; data_ticket=qQUlVGZ9IE/VKRIPFzay3ChAzqLcETuWh0cffgWw820+G4uIf5MYPLiQJ0B27Wh/; rand_info=CAESIIwQxmHeKly5YU7Dj/7Phkh720hLmrpfwM9fwUtj9Zm0; slave_bizuin=3277923148; slave_sid=Z1ZXSERjbFFIb2pQRTZaYU1LZ0lvWnZRelZVS2lOYmFXQTZyRzNzN3ZzNDZES0JfU2RWYWI5MlBkSE5yb0VfcE1SQUtkNVU2ZEN0cHZYdEFUTU1UVHJhd1ZVRE9DTWJiYzg5clN1NXpDMnhrUGhaUXF0Y0pHWDJrU0daYkxFdWVraTJDRGRWdmZHcEFKMkhZ; slave_user=gh_b64433dd3a7a';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getWechatCookies(userId: number): Promise<string> {
    // 从内存存储获取，如果没有则返回默认值
    const cookies = this.cookiesStore.get(userId);
    return cookies || this.defaultCookies;
  }

  async setWechatCookies(userId: number, cookies: string): Promise<void> {
    // 保存到内存存储
    this.cookiesStore.set(userId, cookies);
  }
}
