var Montage = require("mod/core/core").Montage,
    Component = require("mod/ui/component").Component,
    SwipeComposer = require("mod/composer/swipe-composer").SwipeComposer;

exports.Swipe = Montage.specialize( {

    deserializedFromTemplate: {
        value: function () {
            var dummyComponent = this.dummyComponent = new Component();
            dummyComponent.hasTemplate = false;
            dummyComponent.element = document.createElement("div");
            document.body.appendChild(dummyComponent.element);
            dummyComponent.element.style.height = "400px";
            dummyComponent.element.style.width = "400px";
            dummyComponent.attachToParentComponent();
            dummyComponent.needsDraw = true;
            this.swipeComposer = new SwipeComposer();
            this.swipeComposer.lazyLoad = false;
            dummyComponent.addComposer(this.swipeComposer);
            this.swipeComposer.addEventListener("swipe", this, false);
        }
    },

    handleSwipe: {
        value: function (event) {
            console.log(event.direction)
        }
    }

});
