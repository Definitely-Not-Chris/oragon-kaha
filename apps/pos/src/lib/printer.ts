import { AppSettings, Sale, SaleItem } from '@vibepos/shared-types';

export const generateReceiptHtml = (sale: Sale, settings: AppSettings) => {
    const date = new Date(sale.timestamp).toLocaleString();
    const items = sale.items;

    // Format helpers
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Logo HTML
    const logoHtml = settings.receipt_logo_url
        ? `<div style="text-align: center; margin-bottom: 10px;"><img src="${settings.receipt_logo_url}" style="max-width: 80%; max-height: 100px;" /></div>`
        : '';

    // Items Body
    const itemsHtml = items.map((item: SaleItem) => `
        <div class="item-row">
            <span class="qty">${item.quantity}</span>
            <span class="name">${item.name}</span>
            <span class="price">${fmt(item.price_at_sale * item.quantity)}</span>
        </div>
    `).join('');

    // Financials
    const subtotal = sale.subtotal_amount;
    const discount = sale.discount_amount || 0;
    const total = sale.total_amount;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Receipt ${sale.invoice_number || sale.order_number}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            width: 58mm; /* Standard Thermal Width */
            margin: 0;
            padding: 5px;
            font-size: 12px;
            color: #000;
        }
        .header { text-align: center; margin-bottom: 15px; }
        .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
        .header p { margin: 2px 0; font-size: 12px; }
        
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        
        .item-row { display: flex; margin-bottom: 5px; }
        .qty { width: 25px; font-weight: bold; }
        .name { flex: 1; white-space: normal; overflow: hidden; }
        .price { width: 50px; text-align: right; }
        
        .summary { margin-top: 10px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .summary-row.total { font-weight: bold; font-size: 14px; margin-top: 5px; border-top: 1px solid #000; padding-top: 5px; }
        
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        
        @media print {
            @page { margin: 0; }
            body { margin: 0; padding: 5px; }
        }
    </style>
</head>
<body>
    ${logoHtml}
    
    <div class="header">
        <h2>${settings.receipt_header}</h2>
        <p>Inv: #${sale.invoice_number}</p>
        <p>${date}</p>
        ${sale.customer_name ? `<p>Cust: ${sale.customer_name}</p>` : ''}
    </div>
    
    <div class="divider"></div>
    
    <div class="items">
        ${itemsHtml}
    </div>
    
    <div class="divider"></div>
    
    <div class="summary">
        <div class="summary-row">
            <span>Subtotal</span>
            <span>${fmt(subtotal)}</span>
        </div>
        ${discount > 0 ? `
        <div class="summary-row">
            <span>Discount (${sale.discount_name || 'Applied'})</span>
            <span>-${fmt(discount)}</span>
        </div>
        ` : ''}
        ${sale.tax_amount > 0 ? `
        <div class="summary-row">
            <span>${sale.tax_name || 'Tax'}</span>
            <span>${fmt(sale.tax_amount)}</span>
        </div>
        ` : ''}
        ${sale.service_charge_amount > 0 ? `
        <div class="summary-row">
            <span>Service Chg</span>
            <span>${fmt(sale.service_charge_amount)}</span>
        </div>
        ` : ''}
        
        <div class="summary-row total">
            <span>TOTAL</span>
            <span>${settings.currency} ${fmt(total)}</span>
        </div>
        
        <div style="margin-top: 10px; text-align: right;">
            <span style="font-weight: bold;">${sale.payment_method}</span>
        </div>
    </div>
    
    <div class="footer">
        <p>${settings.receipt_footer}</p>
        <p>Powered by VibePOS</p>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
        }
    </script>
</body>
</html>
    `;
};

export const printReceipt = (sale: Sale, settings: AppSettings) => {
    const html = generateReceiptHtml(sale, settings);
    const width = 400;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const popup = window.open(
        '',
        'Receipt',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (popup) {
        popup.document.write(html);
        popup.document.close();
    } else {
        console.error("Popup blocked. Please allow popups for printing.");
        alert("Popup blocked. Please allow popups to print receipts.");
    }
};
