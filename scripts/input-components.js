customElements.define("number-input", class extends HTMLElement {
    _precision = 2;
    _allowNull = false;
    _locale = "en-US";
    _emptyValue = null;
    _showButtons = true;

    constructor() {
        super();
        this._locale = window.config?.numericLocale || navigator.languages?.[0] || "en-US";
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    border: 1px solid #ccc;
                    overflow: hidden;
                    width: 12em;
                    min-height: 1.5em;
                    font-size: 1em;
                    background: white;
                }
                :host(:focus-within) {
                    border-color: black;
                }

                button {
                    border: none;
                    background-color: #eee;
                    color: #333;
                    cursor: pointer;
                    outline: none;
                    min-width: 1.5em;
                    text-align: center;
                    user-select: none;
                    font-size: 1em;
                    font-family: inherit;
                }

                button:hover {
                    background-color: #ddd;
                }

                button.m-cannot-click {
                    opacity: 0.5;
                    pointer-events: none;
                }

                input[type="number"] {
                    -moz-appearance:textfield;
                }

                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                }

                input {
                    width: 100%;
                    padding: 0 0.5em;
                    border: none;
                    outline: none;
                    font-size: 1em;
                    background: none;
                    font-family: inherit;
                    text-align: inherit;
                }
            </style>
            <button id="decrement" tabindex="-1" part="dec-button">-</button>
            <input type="text" id="numberInput" value="" part="input" autocomplete="off">
            <button id="increment" tabindex="-1" part="inc-button">+</button>
        `;

        this.decrementButton = this.shadowRoot.getElementById("decrement");
        this.incrementButton = this.shadowRoot.getElementById("increment");
        this.numberInput = this.shadowRoot.getElementById("numberInput");

        this.decrementButton.addEventListener("click", this._decrement.bind(this));
        this.incrementButton.addEventListener("click", this._increment.bind(this));
        this.numberInput.addEventListener("change", this._handleChangeEvent.bind(this));
        this.numberInput.addEventListener("input", this._handleInputEvent.bind(this));

        this.onclick = () => this.numberInput.focus();
    }

    static get observedAttributes() {
        return ["value", "min", "max", "step", "precision", "allownull", "locale", "showbuttons", "emptyvalue" , "inc", "dec", "readonly", "disabled"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case "value":
            case "min":
            case "max":
            case "step":
                this[name] = parseFloat(newValue);
                break;
            case "precision":
                this[name] = parseInt(newValue);
                break;
            case "locale":
            case "inc":
            case "dec":
                this[name] = newValue;
                break;
            case "allownull":
                this.allowNull = newValue !== "false" && newValue !== null;
                break;
            case "showbuttons":
                this.showButtons = newValue !== "false" && newValue !== null;
                break;
            case "emptyvalue":
                this.emptyValue = newValue === "null" ? null : newValue === "undefined" ? undefined : parseFloat(newValue);
                break;
            case "readonly":
                this.readOnly = newValue !== "false" && newValue !== null;
                break;
            case "disabled":
                this.disabled = newValue !== "false" && newValue !== null;
                break;
        }
    }

    focus() {
        this.numberInput.focus();
    }

    set inc(newValue) {
        this.incrementButton.innerHTML = newValue;
    }

    set dec(newValue) {
        this.decrementButton.innerHTML = newValue;
    }

    _parseNumberIntl(str) {
        const decimalPoint = this._formatNumber(1.1, 1).replace(/\d*/g, "");
        const temp = str.replace(new RegExp(`[^\\d-+e\\${decimalPoint}]*`, "g"), "");
        return parseFloat(decimalPoint === "." ? temp : temp.replace(decimalPoint, "."));
    }

    _parseNumber(str) {
        if (str === null || str === undefined) return this._allowNull ? this.emptyValue : 0;
        switch (typeof str) {
            case "number":
                return str;
            case "string":
                if (str.match(/:/)) {
                    const parts = str.split(/:/g);
                    const multiplier = [1, 1.0 / 60, 1.0 / 3600];
                    let value = 0;
                    for (let index = 0; index < Math.min(parts.length, multiplier.length); index++) {
                        value += (Math.sign(value) || 1) * (parseInt(parts[index]) || 0) * multiplier[index];
                    }
                    return value || 0;
                }
                return str ? (this._parseNumberIntl(str) || 0) : this._allowNull ? this.emptyValue : 0;
            default:
                return 0;
        }
    }

    _roundNumber(number) {
        if (!number) return number;
        const power = 10 ** this.precision;
        return Math.floor(number * power) / power;
    }

    _formatNumber(number, precision) {
        if (number === null || number === undefined) return "";
        const options = {
            style: "decimal",
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        };
        return new Intl.NumberFormat(this.locale, options).format(number);
    }

    _setFormattedValue() {
        this.numberInput.value = this._formatNumber(this._value, this.precision);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = this._parseNumber(newValue);
        this._setFormattedValue();
    }

    get emptyValue() {
        return this._emptyValue;
    }

    set emptyValue(newValue) {
        this._emptyValue = newValue === null ? null : newValue === undefined ? undefined : parseFloat(newValue);
        this._setFormattedValue();
    }

    get precision() {
        return this._precision;
    }

    set precision(newValue) {
        this._precision = Math.max(0, newValue);
        this._setFormattedValue();
    }

    get allowNull() {
        return this._allowNull;
    }

    set allowNull(newValue) {
        this._allowNull = newValue;
        this._setFormattedValue();
    }

    get readOnly() {
        return this.numberInput.readOnly;
    }

    set readOnly(newValue) {
        this.numberInput.readOnly = newValue;
        this._updateButtons();
    }

    get disabled() {
        return this.numberInput.disabled;
    }

    set disabled(newValue) {
        this.numberInput.disabled = newValue;
        this._updateButtons();
    }

    get locale() {
        return this._locale;
    }

    set locale(newValue) {
        this._locale = newValue;
        this._setFormattedValue();
    }

    get showButtons() {
        return this._showButtons;
    }

    set showButtons(newValue) {
        this._showButtons = newValue;
        this.incrementButton.style.display = newValue ? "" : "none";
        this.decrementButton.style.display = newValue ? "" : "none";
    }

    _updateButtons() {
        if (this.readOnly || this.disabled) {
            this.incrementButton.classList.add("m-cannot-click");
            this.decrementButton.classList.add("m-cannot-click");
        }
        else {
            this.incrementButton.classList.remove("m-cannot-click");
            this.decrementButton.classList.remove("m-cannot-click");
        }
    }

    _increment(evt) {
        evt.stopPropagation();
        this._stepAdd(1);
    }

    _decrement(evt) {
        evt.stopPropagation();
        this._stepAdd(-1);
    }

    _stepAdd(sign) {
        if (this.readOnly || this.disabled) return;
        const currentValue = this.value ?? 0;
        const step = sign * (parseFloat(this.step) || 1);
        const newValue = currentValue + step;
        const max = this.max ?? newValue;
        const min = this.min ?? newValue;
        this.value = Math.min(Math.max(newValue, min), max);
        this._handleChangeEvent();
    }

    _handleChangeEvent() {
        this.numberInput.value = this._formatNumber(this.value, this.precision);
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
    }

    _handleInputEvent() {
        const value = this._roundNumber(this._parseNumber(this.numberInput.value));
        this._value = Math.min(this.max ?? value, Math.max(this.min ?? value, value));
    }
});

customElements.define("date-input", class extends HTMLElement {
    _locale = "en-US";
    _emptyValue = null;
    _showButtons = true;
    _type = "date";

    constructor() {
        super();
        this._locale = window.config?.dateLocale || navigator.languages?.[0] || "en-US";
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    border: 1px solid #ccc;
                    overflow: hidden;
                    width: 15em;
                    min-height: 1.5em;
                    font-size: 1em;
                    background: white;
                }
                :host(:focus-within) {
                    border-color: black;
                }

                button {
                    border: none;
                    background: none;
                    color: #333;
                    cursor: pointer;
                    outline: none;
                    min-width: 1.5em;
                    text-align: center;
                    user-select: none;
                    font-size: 1em;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    font-family: inherit;
                }
                button > div {
                    transform: translateY(0.05em) scale(0.9);
                }

                button:hover {
                    background-color: #ddd;
                }

                button.m-cannot-click {
                    opacity: 0.5;
                    pointer-events: none;
                }

                input {
                    width: 100%;
                    padding: 0 0.5em;
                    border: none;
                    outline: none;
                    font-size: 1em;
                    background: none;
                    font-family: inherit;
                    text-align: inherit;
                }
            </style>
            <input type="text" id="dateInput" value="" part="input" autocomplete="off">
            <button id="popup" tabindex="-1" part="button"><div>&#x1F4C5;</div></button>
        `;

        this.popupButton = this.shadowRoot.getElementById("popup");
        this.dateInput = this.shadowRoot.getElementById("dateInput");

        this.popupButton.addEventListener("click", this._popup.bind(this));
        this.dateInput.addEventListener("change", this._handleChangeEvent.bind(this));
        this.dateInput.addEventListener("input", this._handleInputEvent.bind(this));

        this.onclick = () => this.dateInput.focus();
    }

    static get observedAttributes() {
        return ["value", "type", "locale", "showbuttons", "emptyvalue", "readonly", "disabled"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case "value":
            case "type":
                this[name] = newValue;
                break;
            case "locale":
                this[name] = newValue;
                break;
            case "showbuttons":
                this.showButtons = newValue !== "false" && newValue !== null;
                break;
            case "emptyvalue":
                this.emptyValue = newValue === "null" ? null : newValue === "undefined" ? undefined : newValue;
                break;
            case "readonly":
                this.readOnly = newValue !== "false" && newValue !== null;
                break;
            case "disabled":
                this.disabled = newValue !== "false" && newValue !== null;
                break;
        }
    }

    focus() {
        this.dateInput.focus();
    }

    _getFormat() {
        const formatRaw = this._formatDate("2001-03-04T05:06:07.008", "datetime")
            .replace(/[028]/g, "")
            .replace(["date"].includes(this.type) ? /[567AM]/g : /x/g, "")
            .replace(["time", "time-hm"].includes(this.type) ? /[134]/g : /x/g, "")
            .replace(/1/g, "y")
            .replace(/3/g, "m")
            .replace(/4/g, "d")
            .replace(/5/g, "H")
            .replace(/6/g, "M")
            .replace(/7/g, "S")
            .replace(/AM/g, "A")
        const format = formatRaw
            .replace(/[A\W]/g, "");
        return { formatRaw, format };
    }

    _parseDate(str) {
        if (str === null || str === undefined) return this.emptyValue;
        switch (typeof str) {
            case "number":
                return new Date(str).toISOString();
            case "string":
                if (str.trim()) {
                    const now = new Date();
                    const { formatRaw, format } = this._getFormat();
                    const matchApMp = str.toLowerCase().match(/[ap]m?/g);
                    const valueAmPm = matchApMp?.[0]?.slice?.(0, 1);
                    const tempStr = str.trim()
                        .replace(/[ap]m?/gi, "")
                        .replace(/\W\s+/g, ",")
                        .replace(/\W/g, ",");
                    const parts = tempStr.split(",");
                    const g = Object.fromEntries(format.split("").map((x, index) => [x, parts[index] || ""]));

                    const num = (t, len) => ("" + t).padStart(len || 2, "0");
                    const p = (t) => parseInt(t ?? 0) || 0;
                    const y = (t) => {
                        if (!t) return now.getUTCFullYear();
                        const v = p(t);
                        if (v < 100) return t.startsWith("0") ? v : 2000 + v;
                        return v;
                    };
                    const m = (t) => {
                        if (!t) return now.getUTCMonth();
                        return p(t) - 1;
                    };
                    const d = (t) => {
                        if (!t) return now.getUTCDate();
                        return p(t);
                    };
                    const h = (t) => {
                        const v = p(t);
                        if (!valueAmPm) return v;
                        const va = v === 12 ? 0 : Math.min(v, 11);
                        return valueAmPm === "p" ? va + 12 : va;
                    };
                    switch (this.type) {
                        case "datetime":
                        case "datetime-tz":
                            {
                                const _y = y(g.y);
                                const t = new Date(_y, m(g.m), d(g.d), h(g.H), p(g.M), p(g.S), 0);
                                if (_y < 100) t.setFullYear(_y);
                                const temp = t.toISOString();
                                return this.type === "datetime" ? temp : this._returnTimeZone(temp, this.type);
                            }
                        case "time":
                        case "time-hm":
                            now.setUTCMilliseconds(0);
                            now.setUTCSeconds(0);
                            now.setUTCMinutes(0);
                            now.setUTCHours(h(g.H));
                            now.setUTCMinutes(p(g.M));
                            now.setUTCSeconds(p(g.S));
                            return this.type === "time-hm"
                                ? `${num(now.getUTCHours())}:${num(now.getUTCMinutes())}`
                                : `${num(now.getUTCHours())}:${num(now.getUTCMinutes())}:${num(now.getUTCSeconds())}`;
                        default:
                            {
                                const _y = y(g.y);
                                const t = new Date(_y, m(g.m), d(g.d), 0, 0, 0, 0);
                                if (_y < 100) t.setFullYear(_y);
                                return `${num(t.getFullYear(), 4)}-${num(t.getMonth() + 1)}-${num(t.getDate())}`;
                            }
                    }
                    return str;
                }
                return this.emptyValue;
            case "object":
                if (str instanceof Date) return str.toISOString();
                return this.emptyValue;
            default:
                return this.emptyValue;
        }
    }

    _timeZoneString(number) {
        const h = Math.floor(Math.abs(number) / 60);
        const m = Math.abs(number) % 60;
        const hm = h.toString().padStart(2, "0") + m.toString().padStart(2, "0");
        return (Math.sign(number) < 0 ? "-" : "+") + hm;
    }

    _formatDate(str, type) {
        if (!str) return "";
        const now = new Date();
        const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        };
        switch (type) {
            case "datetime":
            case "datetime-tz":
                break;
            case "time":
            case "time-hm":
                delete options.year;
                delete options.month;
                delete options.day;
                if (type === "time-hm") delete options.second;
                options.timeZone = "UTC";
                str = new Date(`${now.toISOString().slice(0, 10)}T${str}Z`).toISOString();
                break;
            default:
                delete options.hour;
                delete options.minute;
                delete options.second;
                options.timeZone = "UTC";
                str += "T00:00:00Z";
                break;
        }
        const date = new Date("" + str);
        if (!options.timeZone) options.timeZone = this._timeZoneString(-date.getTimezoneOffset());
        return new Intl.DateTimeFormat(this.locale, options).format(date);
    }

    _setFormattedValue() {
        this.dateInput.value = this._formatDate(this._value, this._type);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        if (newValue && newValue instanceof Date) this._value = newValue.toISOString();
        else this._value = newValue;
        this._setFormattedValue();
    }

    get type() {
        return this._type;
    }

    set type(newValue) {
        this._type = ["date", "datetime", "datetime-tz", "time", "time-hm"].includes(newValue) ? newValue : "date";
        this.popupButton.innerHTML = ["time", "time-hm"].includes(this._type) ? "<div>&#x23F0;</div>" : "<div>&#x1F4C5;</div>";
        this._setFormattedValue();
    }

    get emptyValue() {
        return this._emptyValue;
    }

    set emptyValue(newValue) {
        this._emptyValue = newValue === null ? null : newValue === undefined ? undefined : parseFloat(newValue);
        this._setFormattedValue();
    }

    get locale() {
        return this._locale;
    }

    set locale(newValue) {
        this._locale = newValue;
        this._setFormattedValue();
    }

    get readOnly() {
        return this.dateInput.readOnly;
    }

    set readOnly(newValue) {
        this.dateInput.readOnly = newValue;
        this._updateButtons();
    }

    get disabled() {
        return this.dateInput.disabled;
    }

    set disabled(newValue) {
        this.dateInput.disabled = newValue;
        this._updateButtons();
    }

    get showButtons() {
        return this._showButtons;
    }

    set showButtons(newValue) {
        this._showButtons = newValue;
        this.popupButton.style.display = newValue ? "" : "none";
    }

    _updateButtons() {
        if (this.readOnly || this.disabled) {
            this.popupButton.classList.add("m-cannot-click");
        }
        else {
            this.popupButton.classList.remove("m-cannot-click");
        }
    }

    _popup(evt) {
        evt.stopPropagation();
        if (this.readOnly || this.disabled) return;
        this.dispatchEvent(new CustomEvent("popup", { detail: { value: this.value } }));
        this._showPopup(evt);
    }

    _editType(edit) {
        switch (edit) {
            case "date": return ["date", "datetime", "datetime-tz"].includes(this.type);
            case "time": return ["time", "time-hm", "datetime", "datetime-tz"].includes(this.type);
            default: return false;
        }
    }

    _returnTimeZone(strDate) {
        const now = new Date(strDate.slice(0, 10));
        const tz = -now.getTimezoneOffset();
        const tzs = this._timeZoneString(tz);
        const date = new Date(strDate);
        date.setMinutes(date.getMinutes() + tz);
        const r = date.toISOString().replace(/z/i, tzs);
        return r;
    }

    _adjustTimeZone(strDate, type) {
        if (!["datetime", "datetime-tz"].includes(type)) return strDate;
        const now = new Date(strDate.slice(0, 10));
        const tz = now.getTimezoneOffset();
        const tzs = this._timeZoneString(tz);
        const temp = strDate.replace(/z/i, "+0000");
        if (temp.slice(-5) === tzs) return strDate;
        const date = new Date(temp);
        date.setMinutes(date.getMinutes() - tz);
        return date.toISOString().replace(/z/i, tzs);
    }

    _handleChangeEvent() {
        this.dateInput.value = this._formatDate(this.value, this.type);
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
    }

    _handleInputEvent() {
        this._value = this._parseDate(this.dateInput.value);
    }

    _showPopup(evt) {
        const value = this._adjustTimeZone(this.value ? this.value : new Date().toISOString(), this.type);
        const weekInfo = new Intl.Locale(this.locale).getWeekInfo?.();
        const remapDay = (d) => d ? d - 1 : 6;
        const data = {
            sender: this,
            button: this.popupButton,
            formatRaw: this._getFormat(),
            valueDate: value.slice(0, 8) + "01",
            valueTime: value.match(/t/i) ? value.slice(11, 19) : value,
            selectedDate: value.slice(0, 10),
            selectedTime: value.match(/t/i) ? value.slice(11, 19) : value,
            startDate: value.slice(0, 10),
            startTime: value.match(/t/i) ? value.slice(11, 19) : value,
            dowText: dateTexts("weekday:short", this.locale),
            months: dateTexts("month:long", this.locale),
            weekTable: new Array(7).fill(weekInfo?.firstDay ?? 1).map((x, ndx) => ((x + ndx - 1) % 7)),
            weekendTable: weekInfo?.weekend?.map(x => x - 1) ?? [5, 6],
            dateTableContainer: null,
            timeTableContainer: null,
            selectButton: null,
        };
        data.dow = data.weekTable.map(x => data.dowText[x]);

        const renderDateTable = (elem) => {
            data.dateTableContainer = elem;
            elem.innerHTML = "";
            const today = new Date().toISOString().slice(0, 10);
            const dateStart = new Date(data.valueDate);
            dateStart.setDate(1);
            dateStart.setHours(12);
            const dow = data.weekTable.indexOf(remapDay(dateStart.getDay()));
            dateStart.setDate(dateStart.getDate() - (dow ? dow : 7));
            const selectedMonth = data.valueDate.slice(5, 7);
            return buildTree([
                "div class='l-value-display'", { textContent: this._formatDate(data.selectedDate, "date") },
                "div class='l-buttons'", [
                    "div class='l-navig-wrapper'", [
                        "button class='l-navig'", { textContent: "\u25c0", ":onclick": () => handleDateNavigation("m", -1) },
                        "select", {
                            ":onchange": (evt) => handleDateNavigation("ms", parseInt(evt.target.selectedOptions[0].value)),
                            ":children": data.months.map((x, index) => {
                                const value = (index + 1).toString().padStart(2, "0");
                                return `option value='${value}'${selectedMonth === value ? " selected" : ""}>${x}`;
                            })
                        },
                        "button class='l-navig'", { textContent: "\u25b6", ":onclick": () => handleDateNavigation("m", 1) },
                    ],
                    "div class='l-navig-wrapper'", [
                        "button class='l-navig'", { textContent: "\u25c0", ":onclick": () => handleDateNavigation("y", -1) },
                        "input", {
                            type: "number",
                            value: data.valueDate.slice(0, 4),
                            ":onchange": (evt) => handleDateNavigation("ys", Math.min(9999, Math.max(1, parseInt(evt.target.value)))),
                        },
                        "button class='l-navig'", { textContent: "\u25b6", ":onclick": () => handleDateNavigation("y", 1) },
                    ],
                    "button", { className: "l-today", textContent: "⦾", title: "Today", ":onclick": () => handleDateNavigation("t") },
                ],
                "table", [
                    "thead", [
                        "tr",
                            data.dow.map(x => `th>${x}`),
                    ],
                    "tbody", new Array(6).fill(0).map(x => ({
                        ":tag": "tr",
                        ":children": new Array(7).fill(0).map(x => {
                            const day = dateStart.getDate();
                            const ymd = dateStart.toISOString().slice(0, 10);
                            const ym = ymd.slice(0, 7);
                            const dow = remapDay(dateStart.getDay());
                            dateStart.setDate(day + 1);
                            return {
                                ":tag": "td",
                                className: `${ymd === data.selectedDate ? " l-selected" : ""}${ymd === today ? " l-today" : ""}${ymd.slice(0, 8) === data.valueDate.slice(0, 8) ? " l-month" : ""}${data.weekendTable.includes(dow) ? " l-weekend" : ""}`,
                                textContent: day,
                                ":onclick": () => {
                                    data.selectedDate = ymd;
                                    if (this.type === "date" && data.selectButton.style.visibility === "hidden") data.selectButton.click();
                                    else renderDateTable(elem);
                                },
                            };
                        })
                    }))
                ],
            ], data, elem);
        };

        const handleTimeClick = (index, value) => {
            const check = [2, 9, 5, 9, 5, 9];
            if (value > check[index]) return;
            const mapping = [0, 1, 3, 4, 6, 7];
            const max = [23, 59, 59];
            const temp = data.selectedTime.slice(0, mapping[index]) + value + data.selectedTime.slice(mapping[index] + 1);
            const parts = temp.split(":").map((x, index) => Math.min(max[index], parseInt(x)));
            data.selectedTime = parts.map(x => x.toString().padStart(2, "0")).join(":");
            renderTimeTable(data.timeTableContainer);
        };

        const renderTimeTable = (elem) => {
            data.timeTableContainer = elem;
            elem.innerHTML = "";
            const selectedTime = data.selectedTime;
            const mapping = [0, 1, 3, 4, 6, 7];
            return buildTree([
                "div class='l-value-display'", { textContent: this._formatDate(data.selectedTime, this.type === "time-hm" ? "time-hm" : "time") },
                "table", [
                    "thead", [
                        "tr", [
                            "th colspan='2'>H",
                            "th",
                            "th colspan='2'>M",
                            ...iif(["time", "datetime", "datetime-tz"].includes(this.type),
                                "th",
                                "th colspan='2'>S",
                            ),
                        ],
                    ],
                    "tbody", new Array(10).fill(0).map((_, index) => ({
                        ":tag": "tr",
                        ":children": [
                            { ":tag": "td", textContent: index <= 2 ? index : "", className: selectedTime[mapping[0]] == index ? "l-selected" : "", ":onclick": () => handleTimeClick(0, index) },
                            { ":tag": "td", textContent: index, className: selectedTime[mapping[1]] == index ? "l-selected" : "", ":onclick": () => handleTimeClick(1, index) },
                            "td class='l-div'",
                            { ":tag": "td", textContent: index <= 5 ? index : "", className: selectedTime[mapping[2]] == index ? "l-selected" : "", ":onclick": () => handleTimeClick(2, index) },
                            { ":tag": "td", textContent: index, className: selectedTime[mapping[3]] == index ? "l-selected" : "", ":onclick": () => handleTimeClick(3, index) },
                            ...iif(["time", "datetime", "datetime-tz"].includes(this.type),
                                "td class='l-div'",
                                { ":tag": "td", textContent: index <= 5 ? index : "", className: selectedTime[mapping[4]] == index ? "l-selected" : "", ":onclick": () => handleTimeClick(4, index) },
                                { ":tag": "td", textContent: index, className: selectedTime[mapping[5]] == index ? "l-selected" : "", ":onclick": () => handleTimeClick(5, index) },
                            )
                        ]
                    })),
                ],
            ], data, elem);
        };

        const handleDateNavigation = (ymt, direction) => {
            if (ymt === "t") data.valueDate = new Date().toISOString().slice(0, 8) + "01";
            else {
                const temp = new Date(data.valueDate);
                switch (ymt) {
                    case "y": temp.setUTCFullYear(temp.getUTCFullYear() + direction); break;
                    case "m": temp.setUTCMonth(temp.getUTCMonth() + direction); break;
                    case "ys": temp.setUTCFullYear(direction); break;
                    case "ms": temp.setUTCMonth(direction - 1); break;
                }
                data.valueDate = temp.toISOString().slice(0, 10);
            }
            renderDateTable(data.dateTableContainer);
        };

        const root = document.createElement("div");
        document.body.appendChild(root);
        const checkSize = (elem) => {
            const parent = elem.parentElement;
            if (parent.scrollWidth > parent.clientWidth) {
                elem.style.left = Math.max(0, evt.pageX - (parent.scrollWidth - parent.clientWidth) - 1) + "px";
            }
            if (parent.scrollHeight > parent.clientHeight) {
                elem.style.top = Math.max(0, evt.pageY - (parent.scrollHeight - parent.clientHeight) - 1) + "px";
            }
        };
        const handleKeyPress = (evt) => {
            if (evt.code === "Escape") handleClose();
        };
        window.addEventListener("keyup", handleKeyPress);

        const handleClose = () => {
            window.removeEventListener("keyup", handleKeyPress);
            document.body.removeChild(root);
        };

        buildTree(
            [
                "div", {
                    style: { background: "#00000040", position: "fixed", left: 0, top: 0, right: 0, bottom: 0, overflow: "auto" },
                    ":onclick": handleClose,
                }, [
                    "div", {
                        style: { position: "absolute", top: evt.pageY + "px", left: evt.pageX + "px" },
                        ":onclick": (evt) => evt.stopPropagation(),
                        ":after-children": (self) => checkSize(self),
                    }, [
                        "div class='date-time-picker'", [
                            "div class='l-select'", [
                                "button title='Select'>✔", {
                                    ":after": (self) => data.selectButton = self,
                                    style: { visibility: this.type === "date" ? "hidden" : "" },
                                    ":onclick": () => {
                                        handleClose();
                                        switch (this.type) {
                                            case "date":
                                                this.value = data.selectedDate;
                                                break;
                                            case "datetime":
                                                this.value = new Date(data.selectedDate + "T" + data.selectedTime).toISOString();
                                                break;
                                            case "datetime-tz":
                                                this.value = this._returnTimeZone(new Date(data.selectedDate + "T" + data.selectedTime).toISOString(), this.type);
                                                break;
                                            case "time":
                                                this.value = data.selectedTime;
                                                break;
                                            case "time-hm":
                                                this.value = data.selectedTime.slice(0, 5);
                                                break;
                                            default:
                                                return;
                                        }
                                        this._handleChangeEvent();
                                    }
                                },
                                "button>\u2715", { ":onclick": () => handleClose()}
                            ],
                            "div class='l-pickers'", [
                                ...iif(this._editType("date"),
                                    "div class='date-picker'", { ":after": (self) => renderDateTable(self) },
                                ),
                                ...iif(this._editType("time"),
                                    "div class='time-picker'", { ":after": (self) => renderTimeTable(self) },
                                ),
                            ],
                        ]
                    ],
                ],
            ],
            data,
            root
        );
    }
});

customElements.define("checkbox-input", class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    border: 1px solid #ccc;
                    overflow: hidden;
                    width: 1.5em;
                    height: 1.5em;
                    position: relative;
                    font-size: 0.9em;
                    top: 0;
                    background: white;
                }
                :host(:focus-within) {
                    border-color: black;
                }

                input {
                    width: 100%;
                    border: none;
                    outline: none;
                    appearance: none;
                    opacity: 0;
                    margin: 0;
                    font-family: inherit;
                }

                .l-checked-render {
                    position: absolute;
                    user-select: none;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    transform: scale(0.9);
                    display: none;
                    pointer-events: none;
                    opacity: 1;
                    font-size: 1em;
                }

                .l-checked-render svg {
                    display: none;
                }
                input:checked + .l-checked-render,
                input:indeterminate + .l-checked-render {
                    display: flex;
                }
                input:checked + .l-checked-render > svg:nth-child(1) {
                    display: block;
                }
                input:indeterminate + .l-checked-render > svg:nth-child(2) {
                    display: block;
                }
                input:disabled + .l-checked-render {
                    opacity: 0.5;
                }
                input:disabled {
                    cursor: not-allowed;
                }
            </style>
            <input type="checkbox" id="checkboxInput" part="input" autocomplete="off">
            <div class="l-checked-render">
                <svg fill="#000000" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800px" height="800px" viewBox="0 0 45.701 45.7" xml:space="preserve">
                    <g>
                        <g>
                            <path d="M20.687,38.332c-2.072,2.072-5.434,2.072-7.505,0L1.554,26.704c-2.072-2.071-2.072-5.433,0-7.504
                                c2.071-2.072,5.433-2.072,7.505,0l6.928,6.927c0.523,0.522,1.372,0.522,1.896,0L36.642,7.368c2.071-2.072,5.433-2.072,7.505,0
                                c0.995,0.995,1.554,2.345,1.554,3.752c0,1.407-0.559,2.757-1.554,3.752L20.687,38.332z"/>
                        </g>
                    </g>
                </svg>
                <svg fill="#000000" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3,18V6A2,2,0,0,1,5,4H19a2,2,0,0,1,2,2V18a2,2,0,0,1-2,2H5A2,2,0,0,1,3,18Z"/>
                </svg>
            </div>
        `;

        this.checkboxInput = this.shadowRoot.getElementById("checkboxInput");

        this.checkboxInput.addEventListener("change", this._handleChangeEvent.bind(this));
    }

    static get observedAttributes() {
        return ["checked", "readonly", "disabled", "indeterminate"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case "readonly":
                this.readOnly = newValue !== "false" && newValue !== null;
                break;
            case "disabled":
                this.disabled = newValue !== "false" && newValue !== null;
                break;
            case "checked":
                this.checked = newValue !== "false" && newValue !== null;
                break;
            case "indeterminate":
                this.indeterminate = newValue !== "false" && newValue !== null;
                break;
        }
    }

    focus() {
        this.checkboxInput.focus();
    }

    toggle(raiseEvent) {
        this.value = !this.value;
        if (raiseEvent) this._handleChangeEvent();
    }

    get indeterminate() {
        return this.checkboxInput.indeterminate;
    }

    set indeterminate(newValue) {
        this.checkboxInput.indeterminate = !!newValue;
    }

    get value() {
        return this.checkboxInput.checked;
    }

    set value(newValue) {
        this.checkboxInput.checked = !!newValue;
    }

    get checked() {
        return this.value;
    }

    set checked(newValue) {
        this.value = newValue;
    }

    get readOnly() {
        return this.disabled;
    }

    set readOnly(newValue) {
        this.disabled = newValue;
    }

    get disabled() {
        return this.checkboxInput.disabled;
    }

    set disabled(newValue) {
        this.checkboxInput.disabled = newValue;
    }

    _handleChangeEvent() {
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
    }
});

customElements.define("select-native", class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    border: 1px solid #ccc;
                    min-width: 2em;
                    max-width: 100%;
                    min-height: 1.5em;
                    position: relative;
                    font-size: 1em;
                    background: white;
                    overflow: hidden;
                    line-height: 1.3;
                }
                :host(:focus-within) {
                    border-color: black;
                }

                select {
                    width: 100%;
                    border: none;
                    outline: none;
                    appearance: none;
                    padding: 0 0.5em 0 0.5em;
                    background: none;
                    font-size: 1em;
                    opacity: 0;
                    top: 0;
                    left: 0;
                    height: calc(100% + 2px);
                    position: absolute;
                    transform: translateY(-1px);
                }

                .l-label {
                    padding: 0 1.75em 0.1em 0.5em;
                    overflow: hidden;
                    font-size: 1em;
                    height: 1.2em;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    pointer-events: none;
                    text-align: inherit;
                }

                .l-wrapper {
                    position: relative;
                    width: 100%;
                    pointer-events: none;
                }

                .l-icon {
                    position: absolute;
                    user-select: none;
                    top: 0;
                    right: 0.33em;
                    bottom: 0;
                    width: 1.25em;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    pointer-events: none;
                    opacity: 0.75;
                    background: none;
                    transform: rotate(0) scale(0.8);
                    transition: 0.3s transform;
                }

                select:open + .l-icon {
                    transform: rotate(180deg) scale(0.8);
                    transition: 0.3s transform;
                }

                select:disabled {
                    cursor: not-allowed;
                }
                select:disabled + .l-icon {
                    opacity: 0.5;
                }
            </style>
            <select id="selectInput" part="select"><slot></slot></select>
            <div class="l-icon" part="icon">
                <svg width="800px" height="800px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#000000" d="M104.704 338.752a64 64 0 0 1 90.496 0l316.8 316.8 316.8-316.8a64 64 0 0 1 90.496 90.496L557.248 791.296a64 64 0 0 1-90.496 0L104.704 429.248a64 64 0 0 1 0-90.496z"/>
                </svg>
            </div>
            <div class="l-wrapper" part="wrapper">
                <div id="label" class="l-label" part="label"></div>
            </div>
        `;

        this.selectInput = this.shadowRoot.getElementById("selectInput");
        this.selectLabel = this.shadowRoot.getElementById("label");

        this.selectInput.addEventListener("change", this._handleChangeEvent.bind(this));
    }

    static get observedAttributes() {
        return ["readonly", "disabled", "options", "value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case "readonly":
                this.readOnly = newValue !== "false" && newValue !== null;
                break;
            case "disabled":
                this.disabled = newValue !== "false" && newValue !== null;
                break;
            case "options":
                this.options = JSON.parse(newValue);
                break;
            case "value":
                this.value = newValue;
                break;
        }
    }

    focus() {
        this.selectInput.focus();
    }


    get value() {
        return this.selectInput.value;
    }

    set value(newValue) {
        let selected;
        let newValueStr = newValue?.toString() || "";
        const allOptions = Array.from(this.selectInput.childNodes);
        for (let option of allOptions) {
            if (newValueStr === option.value) {
                option.setAttribute("selected", "");
                selected = option;
            }
            else option.removeAttribute("selected");
        }
        if (!selected && allOptions.length > 0) {
            selected = allOptions[0];
            selected.setAttribute("selected", "");
            newValueStr = selected.value; 
        }
        this.selectLabel.innerText = selected?.innerText || "";
        this.title = this.selectLabel.innerText;
        this.selectInput.value = newValueStr;
    }

    get readOnly() {
        return this.disabled;
    }

    set readOnly(newValue) {
        this.disabled = newValue;
    }

    get disabled() {
        return this.selectInput.disabled;
    }

    set disabled(newValue) {
        this.selectInput.disabled = newValue;
    }

    get options() {
        return this._options;
    }

    set options(newValue) {
        this._options = newValue;
        const storedValue = this.value;
        this.selectInput.innerHTML = "";
        for (let item of newValue) {
            if (!item) continue;
            const option = document.createElement("option");
            if (Array.isArray(item)) {
                option.value = item[0]?.toString() ?? "";
                option.textContent = item[1]?.toString() ?? item[0]?.toString() ?? "";
            }
            else if (typeof item === "object") {
                option.value = item.value?.toString() ?? "";
                option.textContent = item.label ?? "";
            }
            else {
                option.value = item?.toString() ?? "";
                option.textContent = option.value;
            }
            this.selectInput.appendChild(option);
        }
        this.value = storedValue;
    }

    _handleChangeEvent(evt) {
        this.selectLabel.innerText = evt.target.selectedOptions?.[0]?.innerText || "\u00a0";
        this.title = this.selectLabel.innerText;
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
    }
});

customElements.define("select-simple", class extends HTMLElement {
    _options = [];
    _value = "";
    _popupListPosition = 0;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    border: 1px solid #ccc;
                    min-width: 2em;
                    max-width: 100%;
                    min-height: 1.5em;
                    position: relative;
                    font-size: 1em;
                    background: white;
                    overflow: hidden;
                    line-height: 1.3;
                }
                :host(:focus-within) {
                    border-color: black;
                }

                input {
                    border: none;
                    outline: none;
                    appearance: none;
                    padding: 0 1.75em 0 0.5em;
                    background: none;
                    font-size: 1em;
                    position: absolute;
                    font-family: inherit;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    user-select: none;
                }

                .l-label {
                    padding: 0 1.75em 0.1em 0.5em;
                    overflow: hidden;
                    font-size: 1em;
                    height: 1.2em;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    pointer-events: none;
                    text-align: inherit;
                    opacity: 1;
                }

                .l-wrapper {
                    position: relative;
                    width: 100%;
                    pointer-events: none;
                }

                .l-icon {
                    position: absolute;
                    user-select: none;
                    top: 0;
                    right: 0.33em;
                    bottom: 0;
                    width: 1.25em;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    opacity: 0.75;
                    background: none;
                    transform: rotate(0) scale(0.8);
                    transition: 0.3s transform;
                    cursor: pointer;
                }

                .l-icon.m-open {
                    transform: rotate(180deg) scale(0.8);
                    transition: 0.3s transform;
                }

                input::placeholder {
                    opacity: 0;
                }
                input:not(:placeholder-shown) + .l-label {
                    opacity: 0;
                }
                input:placeholder-shown {
                    opacity: 0;
                }

                input:disabled {
                    cursor: not-allowed;
                }
                input:disabled + .l-icon {
                    opacity: 0.5;
                }
            </style>
            <div id="icon" class="l-icon" part="icon">
                <svg width="800px" height="800px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#000000" d="M104.704 338.752a64 64 0 0 1 90.496 0l316.8 316.8 316.8-316.8a64 64 0 0 1 90.496 90.496L557.248 791.296a64 64 0 0 1-90.496 0L104.704 429.248a64 64 0 0 1 0-90.496z"/>
                </svg>
            </div>
            <div class="l-wrapper" part="wrapper">
                <input id="selectInput" part="select" placeholder="!" autocomplete="off">
                <div id="label" class="l-label" part="label"></div>
            </div>
        `;

        this.selectInput = this.shadowRoot.getElementById("selectInput");
        this.selectLabel = this.shadowRoot.getElementById("label");
        this.iconElement = this.shadowRoot.getElementById("icon");

        this.selectInput.addEventListener("keydown", this._handleKeyEvent.bind(this));
        this.selectInput.addEventListener("input", this._handleInputEvent.bind(this));
        this.selectInput.addEventListener("blur", this._handleBlurEvent.bind(this));
        this.iconElement.addEventListener("click", this._handleIconClickEvent.bind(this));
        this.onclick = () => {
            this.selectInput.focus();
            this._drawPopup("");
        };
    }

    static get observedAttributes() {
        return ["readonly", "disabled", "options", "value", "popupwidth", "popupposition", "popupalign"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case "readonly":
                this.readOnly = newValue !== "false" && newValue !== null;
                break;
            case "disabled":
                this.disabled = newValue !== "false" && newValue !== null;
                break;
            case "options":
                this.options = JSON.parse(newValue);
                break;
            case "value":
                this.value = newValue;
                break;
            case "popupwidth":
                this.popupWidth = newValue;
                break;
            case "popupposition":
                this.popupPosition = newValue;
                break;
            case "popupalign":
                this.popupAlign = newValue;
                break;
        }
    }

    focus() {
        this.selectInput.focus();
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = newValue?.toString() || "";
        this._updateLabel();
    }

    get popupWidth() {
        return this._popupWidth;
    }

    set popupWidth(newValue) {
        this._popupWidth = newValue;
    }

    get popupPosition() {
        return this._popupPosition;
    }

    set popupPosition(newValue) {
        this._popupPosition = newValue;
    }

    get popupAlign() {
        return this._popupAlign;
    }

    set popupAlign(newValue) {
        this._popupAlign = newValue;
    }

    get readOnly() {
        return this.disabled;
    }

    set readOnly(newValue) {
        this.disabled = newValue;
    }

    get disabled() {
        return this.selectInput.disabled;
    }

    set disabled(newValue) {
        this.selectInput.disabled = newValue;
    }

    get options() {
        return this._options;
    }

    set options(newValue) {
        const list = [];
        for (let item of newValue) {
            if (!item) continue;
            const option = {};
            if (Array.isArray(item)) {
                option.value = item[0];
                option.label = item[1]?.toString() ?? item[0]?.toString() ?? "";
                option.html = item[2] ?? null;
            }
            else if (typeof item === "object") {
                option.value = item.value;
                option.label = item.label ?? "";
                option.html = item.html ?? null;
            }
            else {
                option.value = item;
                option.label = option.value?.toString() ?? "";
            }
            list.push(option);
        }
        this._options = list;
        this._updateLabel();
    }

    _updateLabel() {
        const option = this._options.find(x => x.value === this._value);
        this.selectLabel.innerText = option?.label || "\u00a0";
        this.title = this.selectLabel.innerText;
        if (option?.html) this.selectLabel.innerHTML = option.html;
    }

    _handleKeyEvent(evt) {
        switch (evt.key) {
            case "ArrowUp":
                this._drawPopup(this._popup ? -1 : "");
                evt.preventDefault();
                break;
            case "ArrowDown":
                this._drawPopup(this._popup ? 1 : "");
                evt.preventDefault();
                break;
            case "Escape":
                this._closePopup();
                evt.preventDefault();
                break;
            case "Enter":
                if (this._popupItem) this._selectValue(this._popupItem.value);
                else this._drawPopup("");
                break;
            case " ":
                if (!this._popupItem) {
                    evt.preventDefault();
                    this._drawPopup("");
                }
                break;
        }
    }

    _selectValue(value) {
        if (this._value === value) return;
        this._value = value;
        this._updateLabel();
        this._closePopup();
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
    }

    _drawPopup(direction) {
        const search = this.selectInput.value.toLowerCase();
        const list = this._options.filter(x => x.label.toLowerCase().includes(search) || x.label === "");

        if (direction === "") {
            const index = list.findIndex(x => x.value === this._value);
            if (index >= 0) this._popupListPosition = index;
        }
        else if (direction === 0) this._popupListPosition = 0;
        else {
            this._popupListPosition = this._popupListPosition + direction;
            if (this._popupListPosition < 0) this._popupListPosition = list.length - 1;
            if (this._popupListPosition >= list.length) this._popupListPosition = 0;
        }
        this._popupItem = list[this._popupListPosition];

        if (!this._popupContainer) {
            this._popupContainer = document.createElement("div");
            this._popupContainer.className = "select-simple-popup";
            this._popupContainer.innerHTML = `<div class="l-scroller"></div>`;
            this._popupContainer.style.width = this._popupWidth;
        }
        const scroller = this._popupContainer.firstElementChild;

        if (list.length === 0) scroller.innerHTML = "<span>empty</span>";
        else scroller.innerHTML = "";

        list.forEach((item, itemIndex) => {
            buildTree({
                ":tag": "div",
                className: (itemIndex === this._popupListPosition ? "l-focus" : "") + (item.value === this._value ? " l-active" : ""),
                innerHTML: item.html ?? htmlEscape(item.label || "\u00a0"),
                ":onclick": () => this._selectValue(item.value),
            }, null, scroller);
        });

        if (!this._popup) {
            this._popup = openPopup({ target: this, align: this.popupAlign || "left", position: this.popupPosition || "bottom", renderElement: this._popupContainer });
            this._popupCounter = (this._popupCounter || 0) + 1;
            this.iconElement.classList.add("m-open");
        }
        else this._popup.calcPosition();

        scroller.querySelector(".l-focus")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    _handleInputEvent() {
        this._drawPopup(0);
        this.selectLabel.innerText = this.selectInput.value.trim() || "\u00a0";
    }

    _handleIconClickEvent() {
        this._drawPopup(0);
    }

    _closePopup() {
        this.iconElement.classList.remove("m-open");
        this.selectInput.value = "";
        this._popup?.close();
        this._popup = null;
        this._popupContainer = null;
        this._popupListPosition = 0;
        this._popupItem = null;
        this._updateLabel();
    }

    _handleBlurEvent(evt) {
        if (this._popup) {
            const storedPopupCounter = this._popupCounter;
            setTimeout(() => {
                if (storedPopupCounter === this._popupCounter) this._closePopup();
            }, 250);
        }
    }
});

customElements.define("select-multi", class extends HTMLElement {
    _options = [];
    _value = [];

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    border: 1px solid #ccc;
                    min-width: 2em;
                    max-width: 100%;
                    min-height: 1.5em;
                    position: relative;
                    overflow: hidden;
                    font-size: 1em;
                    background: white;
                    line-height: 1.3;
                    flex-direction: column;
                }
                :host(:focus-within) {
                    border-color: black;
                }

                checkbox-input {
                    font-size: 0.75em;
                }

                input {
                    border: none;
                    outline: none;
                    appearance: none;
                    padding: 0 0.5em;
                    background: none;
                    font-size: 1em;
                    font-family: inherit;
                }

                .l-wrapper {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    padding: 0.25em 0.25em 0 0.25em;
                }

                #values {
                    margin-top: 0.5em;
                    border-top: 1px solid #ccc;
                    padding-top: 0.5em;
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                }
                :host(:focus-within) #values {
                    border-color: black;
                }

                #values span {
                    display: flex;
                    align-item: center;
                    gap: 0.5em;
                    padding: 0.25em;
                    cursor: pointer;
                }
                #values span:hover {
                    background: #e0e0e0;
                }
                #values span:focus-within {
                    background: #c0c0c0;
                }

                input::placeholder {
                    opacity: 0;
                }

                input:disabled {
                    cursor: not-allowed;
                }

                #search-icon {
                    width: 1em;
                    height: 1em;
                    user-select: none;
                    opacity: 0.25;
                    pointer-events: none;
                }
                #search-icon svg {
                    width: 100%;
                    height: 100%;
                }
            </style>
            <div class="l-wrapper" part="wrapper">
                <checkbox-input id="toggle-all" part="toggle-all" tabindex="-1"></checkbox-input>
                <input id="selectInput" part="search" autocomplete="off">
                <div id="search-icon" part="search-icon">
                    <svg fill="#000000" height="800px" width="800px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 485.104 485.104" xml:space="preserve">
                        <g>
                            <path d="M110.028,115.171c-4.76-4.767-12.483-4.752-17.227,0c-32.314,32.33-32.314,84.898-0.016,117.197
                                c2.38,2.379,5.487,3.569,8.614,3.569c3.123,0,6.234-1.19,8.613-3.569c4.76-4.76,4.76-12.469,0-17.228
                                c-22.795-22.803-22.795-59.923,0.016-82.742C114.788,127.64,114.788,119.923,110.028,115.171z"/>
                            <path d="M471.481,405.861L324.842,259.23c37.405-66.25,28.109-151.948-28.217-208.317C263.787,18.075,220.133,0,173.718,0
                                C127.287,0,83.633,18.075,50.81,50.913c-67.717,67.74-67.701,177.979,0.02,245.738c32.85,32.823,76.488,50.897,122.919,50.897
                                c30.489,0,59.708-7.939,85.518-22.595L405.824,471.51c18.113,18.121,47.493,18.129,65.641,0
                                c8.706-8.71,13.593-20.512,13.608-32.823C485.073,426.37,480.171,414.567,471.481,405.861z M85.28,262.191
                                c-48.729-48.756-48.729-128.079-0.016-176.828c23.62-23.627,55.029-36.634,88.453-36.634c33.407,0,64.816,13.007,88.451,36.627
                                c48.715,48.756,48.699,128.094-0.015,176.85c-23.62,23.612-55.014,36.612-88.406,36.612
                                C140.341,298.818,108.919,285.811,85.28,262.191z"/>
                        </g>
                    </svg>
                </div>
            </div>
            <div id="values" part="values"></div>
        `;

        this.selectInput = this.shadowRoot.getElementById("selectInput");
        this.valuesElement = this.shadowRoot.getElementById("values");
        this.toggleAll = this.shadowRoot.getElementById("toggle-all");

        this.selectInput.addEventListener("input", this._handleInputEvent.bind(this));
        this.selectInput.addEventListener("focus", this._handleInputFocusEvent.bind(this));
        this.toggleAll.addEventListener("focus", this._handleInputFocusEvent.bind(this));
        this.toggleAll.addEventListener("change", this._handleToggleAllChangeEvent.bind(this));
        this.toggleAll.addEventListener("click", (evt) => evt.stopPropagation());
        this.onkeydown = (evt) => this._handleShadowKeyDown(evt);
        this.onclick = (evt) => this.selectInput.focus();
    }

    static get observedAttributes() {
        return ["readonly", "disabled", "options", "value"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case "readonly":
                this.readOnly = newValue !== "false" && newValue !== null;
                break;
            case "disabled":
                this.disabled = newValue !== "false" && newValue !== null;
                break;
            case "options":
                this.options = JSON.parse(newValue);
                break;
            case "value":
                this.value = JSON.parse(newValue);
                break;
        }
    }

    focus() {
        this.selectInput.focus();
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = Array.isArray(newValue) ? newValue : [];
        this._updateValues();
    }

    get readOnly() {
        return this.disabled;
    }

    set readOnly(newValue) {
        this.disabled = newValue;
    }

    get disabled() {
        return this.selectInput.disabled;
    }

    set disabled(newValue) {
        this.selectInput.disabled = newValue;
    }

    get options() {
        return this._options;
    }

    set options(newValue) {
        const list = [];
        for (let item of newValue) {
            if (!item) continue;
            const option = {};
            if (Array.isArray(item)) {
                option.value = item[0];
                option.label = item[1]?.toString() ?? item[0]?.toString() ?? "";
                option.html = item[2] ?? null;
            }
            else if (typeof item === "object") {
                option.value = item.value;
                option.label = item.label ?? "";
                option.html = item.html ?? null;
            }
            else {
                option.value = item;
                option.label = option.value?.toString() ?? "";
            }
            list.push(option);
        }
        this._options = list;
        this._updateValues();
    }

    _activate(direction) {
        const list = Array.from(this.shadowRoot.querySelectorAll("input, checkbox-input"));
        const current = list.indexOf(this._focusedElement);
        let next = 0;
        if (current >= 0) {
            next = current + direction;
            if (next < 0) next = list.length - 1;
            if (next >= list.length) next = 0;
        }
        list[next]?.focus();
        list[next]?.parentElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    _handleShadowKeyDown(evt) {
        switch (evt.key) {
            case "ArrowUp":
                evt.preventDefault();
                this._activate(-1);
                break;
            case "ArrowDown":
                evt.preventDefault();
                this._activate(1);
                break;
            case "Enter":
                if (this._focusedElement?.tagName === "CHECKBOX-INPUT") {
                    this._focusedElement.toggle(true);
                }
                break;
        }
    }

    _checkChange(newValue, redraw, focusOnItem) {
        if (JSON.stringify(newValue) === JSON.stringify(this._value)) return;
        this._value = newValue;
        this._updateToggleAll();
        this.dispatchEvent(new CustomEvent("change", { detail: { value: this.value } }));
        if (redraw) this._updateValues(focusOnItem);
    }

    _handleChange(evt, checked, item, redraw) {
        evt.stopPropagation();
        const currentCheckedState = this._value.findIndex(x => x === item.value) >= 0;
        const newValue = (checked ?? !currentCheckedState) ? [...this._value, item.value] : this._value.filter(x => x !== item.value);
        this._checkChange(newValue, redraw, item);
    }
    
    _updateValues(focusOnItem) {
        this.valuesElement.innerHTML = "";
        const search = this.selectInput.value.toLowerCase();
        const list = this._options.filter(x => x.label.toLowerCase().includes(search) || x.label === "");
        let focusCheckbox;
        for (let item of list) {
            const checked = this._value.indexOf(item.value) >= 0;
            buildTree({
                ":tag": "span",
                ":onclick": (evt) => this._handleChange(evt, null, item, true),
                ":children": [
                    "checkbox-input", {
                        value: checked,
                        ":after": (self) => {
                            if (focusOnItem === item) focusCheckbox = self;
                        },
                        tabIndex: -1,
                        ":onfocus": (evt) => this._handleInputFocusEvent(evt),
                        ":onclick": (evt) => evt.stopPropagation(),
                        ":onchange": (evt) => this._handleChange(evt, evt.target.value, item, false),
                    },
                    "div", {
                        innerHTML: item.html ?? htmlEscape(item.label || "\u00a0"),
                    }
                ]
            }, null, this.valuesElement);
        }
        if (focusCheckbox) focusCheckbox.focus();
        this._updateToggleAll();
    }

    _updateToggleAll() {
        const countSelected = this._options.filter(x => this._value.includes(x.value));
        if (countSelected.length === 0) {
            this.toggleAll.checked = false;
            this.toggleAll.indeterminate = false;
        }
        else if (countSelected.length === this._options.length) {
            this.toggleAll.checked = true;
            this.toggleAll.indeterminate = false;
        }
        else {
            this.toggleAll.checked = false;
            this.toggleAll.indeterminate = true;
        }
    }

    _handleToggleAllChangeEvent(evt) {
        const value = evt.target.value;
        const newValue = value ? this._options.map(x => x.value) : [];
        this._checkChange(newValue, true);
        this._updateToggleAll();
    }

    _handleInputEvent() {
        this._updateValues();
    }

    _handleInputFocusEvent(evt) {
        this._focusedElement = evt.target;
    }
});
