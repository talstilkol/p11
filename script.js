async function convert() {
            const amount = document.getElementById('amount').value;
            const from = document.getElementById('from').value;
            const to = document.getElementById('to').value;
            const display = document.getElementById('result');

            if (!amount) return;
            
            display.innerText = "טוען...";

            if (from === to) {
                display.innerText = amount + " " + to;
                return;
            }

            try {
                const res = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`);
                const data = await res.json();
                
                // עיצוב המספר עם פסיקים (למשל 1,000.00)
                const formattedNumber = new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(data.rates[to]);

                display.innerText = formattedNumber + " " + to;
            } catch (e) {
                display.innerText = "שגיאה בחיבור לשרת";
            }
        }