function htmlEscape(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function iif(condition, ...list) {
    return condition ? list : [];
}

function buildTree(tree, data, root, options) {
    const walk = (parent, tree) => {
        let lastElement;
        for (let item of tree) {
            if (typeof item === "function") item = value(lastElement, data, parent);
            if (!item) continue;
            switch (typeof item) {
                case "object":
                    if (Array.isArray(item)) {
                        if (!lastElement) throw new Error("List didn't start with tag definition");
                        walk(lastElement, item);
                        lastElement[":after-children"]?.(lastElement, data, parent);
                    }
                    else {
                        const tag = item[":tag"];
                        const children = item[":children"];
                        if (tag) parent.appendChild(lastElement = document.createElement(tag));
                        if (!lastElement) throw new Error("List didn't start with tag definition");
                        let after;
                        for (let prop in item) {
                            let value = item[prop];
                            if (prop.startsWith(":on")) lastElement[prop.replace(/:/, "")] = value;
                            else if (prop === ":before") value(lastElement, data, parent);
                            else if (prop === ":after") after = value;
                            else if (prop === ":after-children") lastElement[prop] = value;
                            else {
                                if (typeof value === "function") value = value(lastElement, data, parent);
                                if (prop.startsWith("attr:")) {
                                    const attr = prop.replace(/^attr:/, "");
                                    if (value === null) lastElement.removeAttribute(attr);
                                    else lastElement.setAttribute(attr, "" + value);
                                }
                                else {
                                    switch (prop) {
                                        case ":tag":
                                        case ":children":
                                            break;
                                        case "style":
                                            if (value && typeof value === "object") {
                                                for (let [k, v] of Object.entries(value)) {
                                                    lastElement[prop][k] = v;
                                                }
                                            }
                                            break;
                                        default:
                                            lastElement[prop] = value;
                                            break;
                                    }
                                }
                            }
                        }
                        after?.(lastElement, data, parent);
                        if (children && Array.isArray(children)) {
                            walk(lastElement, children);
                            lastElement[":after-children"]?.(lastElement, data, parent);
                        }
                    }
                    break;
                case "string":
                    const match = item.match(/(.+?)[\s>]/);
                    if (match) {
                        const tag = match[1];
                        parent.appendChild(lastElement = document.createElement(tag));
                        lastElement.outerHTML = "<" + item + (item.includes(">") ? "" : ">") + (item.match(/>$/) ? "" : `</${tag}>`);
                        lastElement = parent.lastElementChild;
                    }
                    else parent.appendChild(lastElement = document.createElement(item));
                    break;
                default:
                    throw new Error(`Invalid token "${item}"`);
            }
        }
    }

    const elem = root ? (typeof root === "string" ? document.createElement(root) : root) : document.createElement("div");
    if (data) elem[":data"] = data;
    options?.[":before"]?.(elem, data);
    walk(elem, Array.isArray(tree) ? tree : [tree]);
    options?.[":after"]?.(elem, data);

    return elem;
}

function dateTexts(type, locale) {
    const r = [];
     
    switch (type) {
        case "weekday:narrow":
        case "weekday:short":
        case "weekday:long":
            {
                const start = new Date("2025-05-19");
                const f = Intl.DateTimeFormat(locale, { weekday: type.split(":")[1] });
                for (let i = 0; i < 7; i++) {
                    r.push(f.format(start));
                    start.setDate(start.getDate() + 1);
                }
                break;
            }
        case "month:narrow":
        case "month:short":
        case "month:long":
            {
                const start = new Date("2025-01-01");
                const f = Intl.DateTimeFormat(locale, { month: type.split(":")[1] });
                for (let i = 0; i < 12; i++) {
                    start.setMonth(i);
                    r.push(f.format(start));
                }
            }
    }

    return r;
}

function openPopup(options) {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const data = {
        container: null,
        target: options.target,
        align: options.align,
        position: options.position || "bottom",
        usedPosition: "",
        initialPosition: { top: (options.pageY || 0) + "px", left: (options.pageX || 0) + "px" },
    };

    if (options.target) {
        const rect = options.target.getBoundingClientRect();
        data.initialPosition = { top: (rect.top + options.target.offsetHeight) + "px", left: rect.left + "px" };
    }

    const calcPosition = (self) => {
        const parent = self.parentElement;
        let tryCount = 3;
        let tryPosition = data.usedPosition || data.position;
        const rect = data.target?.getBoundingClientRect?.();
        while (tryCount) {
            if (options.target) {
                switch (data.align || "") {
                    case "right":
                        self.style.left = (rect.right - self.clientWidth) + "px";
                        break;
                    case "center":
                        self.style.left = (rect.left + (rect.width - self.clientWidth) / 2) + "px";
                        break;
                    default:
                        self.style.left = rect.left + "px";
                        break;
                }
                if (tryPosition === "top") {
                    self.style.top = (rect.top - self.offsetHeight) + "px";
                }
                else {
                    self.style.top = (rect.top + data.target.offsetHeight) + "px";
                }
            }

            let left = parseFloat(self.style.left);
            if (left < 0) {
                left = 0;
                self.style.left = "0px";
            }
            if (parent.scrollWidth > parent.clientWidth) {
                left = Math.max(0, left - (parent.scrollWidth - parent.clientWidth) - 1);
                self.style.left = left + "px";
            }

            let top = parseFloat(self.style.top);
            if (top < 0) {
                top = 0;
                self.style.top = "0px";
            }
            if (parent.scrollHeight > parent.clientHeight) {
                top = Math.max(0, top - (parent.scrollHeight - parent.clientHeight) - 1);
                self.style.top = top + "px";
            }

            if (!options.target) break;

            if (tryPosition === "top") {
                if (rect.top > (top + self.offsetHeight - 1)) break;
                tryPosition = "bottom";
            }
            else {
                if (rect.bottom < (top + 1)) break;
                tryPosition = "top";
            }

            tryCount--;
        }

        data.usedPosition = tryPosition;
    };

    const handleWindowResize = () => {
        calcPosition(data.container);
    };
    window.addEventListener("resize", handleWindowResize);

    const handleClose = (evt) => {
        element.parentElement?.removeChild(element);
        window.removeEventListener("resize", handleWindowResize);
    };

    buildTree(
        [
            "div", {
                style: { background: "none", position: "fixed", left: 0, top: 0, right: 0, bottom: 0, overflow: "auto" },
                ":onclick": handleClose,
            }, [
                "div", {
                    style: { position: "absolute", ...data.initialPosition },
                    ":onclick": (evt) => evt.stopPropagation(),
                    ":after": (self) => {
                        data.container = self;
                        self.innerHTML = options.renderHTML || "";
                        if (options.renderElement) self.appendChild(options.renderElement);
                        calcPosition(self);
                    },
                },
            ]
        ], null, element
    );

    return {
        close: () => handleClose(),
        calcPosition: !data.target ? () => null : () => calcPosition(data.container),
    };
}