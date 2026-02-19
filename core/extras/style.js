if (!window.__mod__styleImportantForcerInitialized) {
    window.__mod__styleImportantForcerInitialized = true;

    const styleObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // We only care about style attribute changes
            if (mutation.attributeName !== "style") return;

            const el = mutation.target;

            // Iterate through all CSS properties currently applied to the element inline
            for (let i = 0; i < el.style.length; i++) {
                const propName = el.style[i];
                const priority = el.style.getPropertyPriority(propName);

                // If the property doesn't have the '!important' flag, force it
                if (priority !== "important") {
                    const value = el.style.getPropertyValue(propName);
                    el.style.setProperty(propName, value, "important");
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
