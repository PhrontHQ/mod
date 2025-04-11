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
            this.message = `Third Promise rejected! Wait 2.5s before the fourth Promise begins...`;
        }

        await Promise.delay(2_500);

        this.promise = Promise.delay(5_000);
        this.message = "Fourth Promise is pending resolution. Wait 2.5 seconds to be cleared before resolving it...";

        setTimeout(async () => {
            this.promise = null;
            this.message = `Fourth promise cleared before resolving it! Wait 4 seconds for the fifth Promise to be replaced...`;

            this.promise = Promise.delay(10_000).then(() => {
                this.message = "Fifth Promise resolved! but had no effect on the button";
                throw new Error("Promise rejected");
            });

            await Promise.delay(4_000);

            this.promise = Promise.delay(2_000);
            this.message = "Fifth Promise has been replaced! Wait 2 seconds for the sixth Promise to resolve...";
            await this.promise;
            this.message = "Sixth Promise resolved! Wait 4 seconds for the Fifth Promise to resolve...";
        }, 2_500);
    }
};
