/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'vps-black': '#1A1A1A', // Đen nhám (Matte Black) - Nền chính
                'vps-gold': '#D4AF37',  // Vàng kim (Gold) - Nút bấm, điểm nhấn
                'vps-gold-hover': '#B5952F',
                'vps-ivory': '#FFFFF0', // Trắng ngà (Ivory) - Chữ chính, nền card
                'vps-gray': '#333333',  // Xám đậm - Viền, placeholder
            },
            fontFamily: {
                'sans': ['Inter', 'sans-serif'], // Ưu tiên font chữ hiện đại, tối giản
                'serif': ['Playfair Display', 'serif'], // Dùng cho các Tiêu đề cần sự sang trọng
            }
        },
    },
    plugins: [],
}