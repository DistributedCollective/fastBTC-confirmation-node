import Telegram from 'telegraf/telegram';
import conf from '../config/config';

class TelegramBot {
    constructor() {
        this.bot = conf.errorBotTelegram ? new Telegram(conf.errorBotTelegram) : null;
    }

    async sendMessage(msg) {
        if (this.bot) {
            try {
                console.log(msg)
                this.bot.sendMessage(conf.sovrynInternalTelegramId, msg);
            } catch(err) {
                console.log(err)
            }
        }
    }
}

export default new TelegramBot()
