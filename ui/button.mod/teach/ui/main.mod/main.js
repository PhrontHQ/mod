const { Component } = require("mod/ui/component");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.Main = class Main extends Component {
    message = null;

    handleAction(event) {
        this.message = `${event.target.identifier} button has been clicked`;
    }

    handleLongAction(event) {
        this.message = `${event.target.identifier} button has been clicked (long action)`;
    }

    async handlePromiseButtonAction(event) {
        this.message = "First Promise is pending resolution";

        this.promise = delay(2_500);
        await this.promise;
        this.message = "First Promise resolved! Wait for the second one...";

        this.promise = delay(2_500);
        await this.promise;
        this.message = "Second Promise resolved!";

        this.promise = delay(2_500).then(() => {
            throw new Error("Promise rejected");
        });

        try {
            await this.promise;
            this.message = "Third Promise resolved!";
        } catch (error) {
            this.message = `Third Promise rejected! Wait 2 seconds...`;
        }

        this.promiseButtonDisabled = true;
        await delay(2_500);
        this.message = `Will clear fourth Promise before resolving it...`;

        this.promise = delay(5_000);

        setTimeout(() => {
            this.promise = null;
            this.promiseButtonDisabled = false;
            this.message = `Fourth promise cleared before resolving it!`;
        }, 2_500);
    }
};
