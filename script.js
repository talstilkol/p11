async function convert() {
            const rawAmount = document.getElementById('amount').value.trim();
            const amount = Number(rawAmount);
            const from = document.getElementById('from').value;
            const to = document.getElementById('to').value;
            const display = document.getElementById('result');

            // עיצוב המספר עם פסיקים (למשל 1,000.00)
            const formatter = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            if (!rawAmount || !Number.isFinite(amount)) {
                display.innerText = "יש להזין סכום מספרי";
                return;
            }

            display.innerText = "טוען...";

            if (from === to) {
                display.innerText = formatter.format(amount) + " " + to;
                return;
            }

            try {
                // Frankfurter מחזיר שערי ייחוס יומיים של ה-ECB (לא "בזמן אמת")
                const res = await fetch(`https://api.frankfurter.dev/v1/latest?amount=${amount}&from=${from}&to=${to}`);
                if (!res.ok) throw new Error("HTTP " + res.status);
                const data = await res.json();

                const rate = data && data.rates ? data.rates[to] : undefined;
                if (typeof rate !== 'number' || !Number.isFinite(rate)) {
                    throw new Error("Unexpected rate response");
                }

                display.innerText = formatter.format(rate) + " " + to + " — תאריך שער: " + data.date;
            } catch (e) {
                display.innerText = "שגיאה בחיבור לשרת";
            }
        }
