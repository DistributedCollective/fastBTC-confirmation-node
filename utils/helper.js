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
        await this.wasteTimeMs(difference >= 0 ? difference: 0);
    }
}

export default new Util();
