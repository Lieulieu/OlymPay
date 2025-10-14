import { NextResponse } from 'next/server'

export interface MarketplaceProduct {
  id: string
  partner: string
  name: string
  price: number
  currency: string
  category: string
  image: string
  description?: string
}

// Sample products data organized by sections
const products: MarketplaceProduct[] = [
  // Dịch vụ section - existing products
  {
    id: "vietjet_ticket_01",
    partner: "Vietjet Air",
    name: "Vé máy bay Hà Nội - Sài Gòn",
    price: 1200000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/vietjet_flight.jpg",
    description: "Vé máy bay khứ hồi Hà Nội - Sài Gòn, giá ưu đãi đặc biệt"
  },
  {
    id: "vietjet_ticket_02",
    partner: "Vietjet Air",
    name: "Vé máy bay Đà Nẵng - Phú Quốc",
    price: 1500000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/vietjet_flight.jpg",
    description: "Vé máy bay khứ hồi Đà Nẵng - Phú Quốc, bao gồm hành lý ký gửi"
  },
  {
    id: "vietjet_baggage_01",
    partner: "Vietjet Air",
    name: "Hành lý ký gửi 20kg",
    price: 300000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/vietjet_baggage.jpg",
    description: "Thêm hành lý ký gửi 20kg cho chuyến bay"
  },
  {
    id: "savico_oil_01",
    partner: "SAVICO",
    name: "Bảo dưỡng định kỳ xe Toyota",
    price: 2500000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/savico_service.jpg",
    description: "Gói bảo dưỡng định kỳ toàn diện cho xe Toyota"
  },
  {
    id: "savico_tire_01",
    partner: "SAVICO",
    name: "Lốp xe Bridgestone 205/55R16",
    price: 1800000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/savico_tire.jpg",
    description: "Lốp xe Bridgestone cao cấp, bảo hành 2 năm"
  },
  {
    id: "savico_battery_01",
    partner: "SAVICO",
    name: "Ắc quy GS 12V 60Ah",
    price: 1200000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/savico_battery.jpg",
    description: "Ắc quy GS chính hãng, bảo hành 18 tháng"
  },
  {
    id: "hdbank_bill_01",
    partner: "HDBank",
    name: "Thanh toán hóa đơn điện",
    price: 500000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/hdbank_bill.jpg",
    description: "Thanh toán hóa đơn điện tháng hiện tại"
  },
  {
    id: "hdbank_bill_02",
    partner: "HDBank",
    name: "Thanh toán hóa đơn nước",
    price: 200000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/hdbank_bill.jpg",
    description: "Thanh toán hóa đơn nước tháng hiện tại"
  },
  {
    id: "hdbank_voucher_01",
    partner: "HDBank",
    name: "Voucher Vincom 500k",
    price: 500000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/hdbank_voucher.jpg",
    description: "Voucher mua sắm tại Vincom trị giá 500,000 VND"
  },
  {
    id: "hdbank_topup_01",
    partner: "HDBank",
    name: "Nạp tiền điện thoại Viettel",
    price: 100000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/hdbank_topup.jpg",
    description: "Nạp tiền điện thoại Viettel 100,000 VND"
  },
  {
    id: "vietjet_meal_01",
    partner: "Vietjet Air",
    name: "Suất ăn trên máy bay",
    price: 150000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/vietjet_meal.jpg",
    description: "Suất ăn đặc biệt trên chuyến bay"
  },
  {
    id: "savico_inspection_01",
    partner: "SAVICO",
    name: "Kiểm định xe định kỳ",
    price: 800000,
    currency: "oVND",
    category: "Dịch vụ",
    image: "/images/savico_inspection.jpg",
    description: "Dịch vụ kiểm định xe định kỳ theo quy định"
  },
  
  // Khóa học AI và Blockchain section
  {
    id: "ai_course_01",
    partner: "Olym3 AI Hub",
    name: "Khoá học AI ứng dụng",
    price: 70,
    currency: "USDC",
    category: "Khóa học AI và Blockchain",
    image: "/images/ai_course.jpg",
    description: "Khóa học toàn diện về trí tuệ nhân tạo và ứng dụng thực tế trong trường học và doanh nghiệp"
  },
  {
    id: "blockchain_course_01",
    partner: "Olym3 AI Hub",
    name: "Khoá học lập trình Blockchain",
    price: 50,
    currency: "USDC",
    category: "Khóa học AI và Blockchain",
    image: "/images/blockchain_course.jpg",
    description: "Học lập trình blockchain từ cơ bản đến nâng cao, phát triển smart contracts"
  },
  
  // Tài sản thế giới thực section
  {
    id: "vnx_gold_01",
    partner: "VNX Gold",
    name: "VNX Gold",
    price: 120,
    currency: "USDC",
    category: "Tài sản thế giới thực",
    image: "/images/vnx_gold.jpg",
    description: "Đầu tư vàng kỹ thuật số VNX Gold - tài sản thế giới thực được token hóa"
  }
]

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching marketplace products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
