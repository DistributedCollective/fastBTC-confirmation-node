class Util {
    async wasteTime(s) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, s * 1000);
        });
    }

    /**
     * Checks whether the provided timestamp is older than one hour ago. If older, returns false
     */
    verifyTxTimestamp(timestamp) {
        const HOUR = 1000 * 60 * 60;
        const anHourAgo = Date.now() - HOUR;
        if ((timestamp * 1000) <= anHourAgo)
            console.log("Transaction has expired. Older than one hour")
            return false;
    }
}

export default new Util();