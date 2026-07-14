export const formatCurrency = (value) => {
    let num = 0;

    if (typeof value === 'string') {
        num = parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
    } else if (typeof value === 'number') {
        num = Number.isFinite(value) ? value : 0;
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(num);
};