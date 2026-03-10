/**
 * 企业微信通知服务
 */

const axios = require('axios');
const { WecomConfig, NotificationLog } = require('../models');

class WecomService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * 获取企业微信配置
   */
  async getConfig() {
    const config = await WecomConfig.findOne({ where: { enabled: true } });
    return config;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    // 检查缓存
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const config = await this.getConfig();
    if (!config) {
      throw new Error('企业微信配置未启用');
    }

    try {
      const response = await axios.get(
        'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
        {
          params: {
            corpid: config.corpId,
            corpsecret: config.secret
          }
        }
      );

      if (response.data.errcode === 0) {
        this.accessToken = response.data.access_token;
        // 令牌有效期通常为 7200 秒，提前 5 分钟刷新
        this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
        return this.accessToken;
      } else {
        throw new Error(response.data.errmsg);
      }
    } catch (error) {
      console.error('获取企业微信访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 发送文本消息给单个用户
   */
  async sendTextMessage(toUser, content) {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('企业微信配置未启用');
    }

    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        {
          touser: toUser,
          msgtype: 'text',
          agentid: config.agentId,
          text: {
            content: content
          },
          safe: 0
        }
      );

      if (response.data.errcode === 0) {
        return { success: true, messageId: response.data.message_id };
      } else {
        throw new Error(response.data.errmsg);
      }
    } catch (error) {
      console.error('发送企业微信消息失败:', error);
      throw error;
    }
  }

  /**
   * 发送模板卡片消息
   */
  async sendTemplateCardMessage(toUser, title, description, btnText, btnUrl) {
    const config = await this.getConfig();
    if (!config) {
      throw new Error('企业微信配置未启用');
    }

    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
        {
          touser: toUser,
          msgtype: 'template_card',
          agentid: config.agentId,
          template_card: {
            card_type: 'text_notice',
            source: {
              icon_url: 'https://tzwf.xyz/shangyin/logo.png',
              desc: '上茚工厂管理系统'
            },
            main_title: {
              title: title,
              desc: description
            },
            action_menu: {
              action_list: [
                {
                  text: btnText,
                  key: 'view_detail',
                  url: btnUrl
                }
              ]
            }
          }
        }
      );

      if (response.data.errcode === 0) {
        return { success: true, messageId: response.data.message_id };
      } else {
        throw new Error(response.data.errmsg);
      }
    } catch (error) {
      console.error('发送企业微信模板卡片消息失败:', error);
      throw error;
    }
  }

  /**
   * 通知业务员产品工序完成
   */
  async notifySalesmanProcessComplete(contractId, contractNo, productId, productCode, processName, salesmanOpenId) {
    try {
      const title = '工序完成通知';
      const description = `合同号：${contractNo}\n产品编号：${productCode}\n工序：${processName}\n产品即将生产完成，请及时跟进。`;
      const btnText = '查看详情';
      const btnUrl = `https://tzwf.xyz/shangyin/admin/contracts/${contractId}`;

      const result = await this.sendTemplateCardMessage(
        salesmanOpenId,
        title,
        description,
        btnText,
        btnUrl
      );

      // 记录通知日志
      await NotificationLog.create({
        contractId,
        contractProductId: productId,
        processName,
        salesmanId: salesmanOpenId,
        notificationType: 'process_complete',
        content: description,
        status: 'sent',
        sentAt: new Date()
      });

      return result;
    } catch (error) {
      console.error('通知业务员失败:', error);

      // 记录失败日志
      await NotificationLog.create({
        contractId,
        contractProductId: productId,
        processName,
        salesmanId: salesmanOpenId,
        notificationType: 'process_complete',
        content: `通知失败：${error.message}`,
        status: 'failed',
        errorMessage: error.message
      });

      throw error;
    }
  }

  /**
   * 检查是否需要发送通知
   */
  async checkAndNotify(contractId, contractProductId, processId) {
    const { ContractProduct, Process, ProductType, Employee } = require('../models');

    try {
      // 获取合同产品信息
      const product = await ContractProduct.findOne({
        where: { id: contractProductId },
        include: [
          {
            model: (await import('../models')).Contract,
            as: 'contract',
            attributes: ['id', 'contractNo', 'salesmanId']
          }
        ]
      });

      if (!product) return false;

      // 获取产品类型
      const productType = await ProductType.findOne({
        where: { id: product.productTypeId },
        include: [{
          model: Process,
          as: 'notifyProcess'
        }]
      });

      if (!productType || !productType.needNotification) return false;

      // 检查当前工序是否是通知工序
      const process = await Process.findByPk(processId);
      if (!process || process.id !== productType.notifyProcessId) return false;

      // 获取业务员信息
      const contract = product.contract;
      if (!contract || !contract.salesmanId) return false;

      const salesman = await Employee.findOne({
        where: { id: contract.salesmanId, employeeType: 'salesman' }
      });

      if (!salesman || !salesman.wxOpenId) return false;

      // 发送通知
      await this.notifySalesmanProcessComplete(
        contractId,
        contract.contractNo,
        product.id,
        product.productCode + (product.productSuffix || ''),
        process.name,
        salesman.wxOpenId
      );

      return true;
    } catch (error) {
      console.error('检查并发送通知失败:', error);
      return false;
    }
  }
}

module.exports = new WecomService();
