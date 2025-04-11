const { Component } = require("mod/ui/component");

exports.Main = class Main extends Component {
    message = null;

    handleAction(event) {
        this.message = `${event.target.identifier} button has been clicked`;
    }

    handleLongAction(event) {
        this.message = `${event.target.identifier} button has been clicked (long action)`;
    }

    async handlePromiseButtonAction(_) {
        this.message = "First Promise is pending resolution. Wait 2 seconds...";

        this.promise = Promise.delay(2_000);
        await this.promise;
        this.message = "First Promise resolved! Wait 2 seconds for the second Promise to resolve...";

        this.promise = Promise.delay(2_000);
        await this.promise;
        this.message = "Second Promise resolved! Wait 2 seconds for the third Promise to be rejected...";

        this.promise = Promise.delay(2_000).then(() => {
            throw new Error("Promise rejected");
        });

        try {
            await this.promise;
            this.message = "Third Promise resolved! This should not happen.";
        } catch (error) {
            this.message = `Third Promise rejected! Wait 5 seconds, the fourth Promise will be cleared before resolving it.`;
        }

        this.promiseButtonDisabled = true;
        await Promise.delay(2_500);

        this.promise = Promise.delay(5_000);

        setTimeout(() => {
            this.promise = null;
            this.promiseButtonDisabled = false;
            this.message = `Fourth promise cleared before resolving it!`;
        }, 2_500);
    }
};
