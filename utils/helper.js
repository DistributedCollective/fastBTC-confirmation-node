class Util {
    async wasteTime(s) {
        return this.wasteTimeMs(s * 1000);
    }

    async wasteTimeMs(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    async untilAfter(timestamp) {
        const difference = timestamp - Date.now();
        if (difference > 0) {
            await this.wasteTimeMs(difference);
        }
    }
}

export default new Util();
