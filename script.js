const amountInput = document.getElementById('amount');
const fromInput = document.getElementById('from');
const toInput = document.getElementById('to');
const display = document.getElementById('result');
const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
let activeConversion = null;

function discardResponse(response) {
    if (!response.body || response.bodyUsed) return;
    try {
        response.body.cancel().catch(() => {});
    } catch (_) {
        // The transport may already own or close the body.
    }
}

function abortable(promise, signal) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (callback, value) => {
            if (settled) return;
            settled = true;
            signal.removeEventListener('abort', onAbort);
            callback(value);
        };
        const onAbort = () => finish(reject, new DOMException('Conversion cancelled', 'AbortError'));
        signal.addEventListener('abort', onAbort, { once: true });
        Promise.resolve(promise).then(
            value => finish(resolve, value),
            error => finish(reject, error)
        );
        if (signal.aborted) onAbort();
    });
}

function clearConversion() {
    const previous = activeConversion;
    activeConversion = null;
    if (previous) previous.abort();
    display.setAttribute('aria-busy', 'false');
    display.innerText = '';
}

function selectedCurrency(input, value) {
    return Array.from(input.options).some(option => option.value === value);
}

function readUnitRate(data, from, to) {
    if (!data || data.base !== from || data.amount !== 1 ||
        typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) ||
        !data.rates || typeof data.rates !== 'object' || Array.isArray(data.rates) ||
        !Object.prototype.hasOwnProperty.call(data.rates, to)) {
        throw new Error('Unexpected rate response');
    }
    const date = new Date(data.date + 'T00:00:00Z');
    const rate = data.rates[to];
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date ||
        typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
        throw new Error('Invalid reference rate');
    }
    return rate;
}

async function convert() {
    clearConversion();
    const rawAmount = amountInput.value.trim();
    const amount = Number(rawAmount);
    const from = fromInput.value;
    const to = toInput.value;
    if (!rawAmount || !Number.isFinite(amount)) {
        display.innerText = 'יש להזין סכום מספרי סופי';
        return;
    }
    if (!selectedCurrency(fromInput, from) || !selectedCurrency(toInput, to)) {
        display.innerText = 'יש לבחור מטבע מהרשימה';
        return;
    }
    if (from === to) {
        display.innerText = formatter.format(amount) + ' ' + to;
        return;
    }

    const controller = new AbortController();
    activeConversion = controller;
    display.setAttribute('aria-busy', 'true');
    display.innerText = 'טוען...';
    const url = new URL('https://api.frankfurter.dev/v1/latest');
    url.searchParams.set('base', from);
    url.searchParams.set('symbols', to);
    try {
        const pending = fetch(url.href, { signal: controller.signal }).then(response => {
            if (controller.signal.aborted || activeConversion !== controller) {
                discardResponse(response);
                throw new DOMException('Conversion cancelled', 'AbortError');
            }
            return response;
        });
        const response = await abortable(pending, controller.signal);
        if (!response.ok) {
            discardResponse(response);
            throw new Error('Rate service unavailable');
        }
        const data = await abortable(response.json(), controller.signal);
        if (activeConversion !== controller || controller.signal.aborted) return;
        const result = amount * readUnitRate(data, from, to);
        if (!Number.isFinite(result)) throw new Error('Conversion is outside the supported numeric range');
        display.innerText = formatter.format(result) + ' ' + to + ' — תאריך שער: ' + data.date;
    } catch (error) {
        if (activeConversion === controller && !controller.signal.aborted) {
            display.innerText = 'לא ניתן לקבל שער תקין כרגע';
        }
    } finally {
        if (activeConversion === controller) {
            activeConversion = null;
            display.setAttribute('aria-busy', 'false');
            controller.abort();
        }
    }
}

amountInput.addEventListener('input', clearConversion);
fromInput.addEventListener('change', clearConversion);
toInput.addEventListener('change', clearConversion);
amountInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        convert();
    }
});
window.addEventListener('pagehide', clearConversion);
