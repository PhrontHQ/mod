if (!window.__mod__styleImportantForcerInitialized) {
    window.__mod__styleImportantForcerInitialized = true;

    const styleObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const element = mutation.target;
            const style = element.style;
            const length = style.length;

            // Iterate through all CSS properties currently applied to the element inline
            for (let i = 0; i < length; i++) {
                const propName = style[i];
                const priority = style.getPropertyPriority(propName);

                // If the property doesn't have the '!important' flag, force it
                if (priority !== "important") {
                    const value = style.getPropertyValue(propName);
                    style.setProperty(propName, value, "important");
                }
            }
        }
    });

    styleObserver.observe(document.documentElement, {
        attributes: true,
        // Only listen for 'style' changes to save performance
        attributeFilter: ["style"],
        subtree: true,
    });
}
