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
                            if (prop.startsWith("on:")) lastElement[prop.replace(/:/, "")] = value;
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
