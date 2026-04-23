// ============================================
// DATA MANAGER - GENERATE REALISTIC & UNIQUE DATASETS
// ============================================

const DatasetManager = {
  datasets: {
    'ecommerce': {
      name: 'Thương mại điện tử (Sản phẩm)',
      icon: 'fa-shopping-cart',
      fields: [
        { id: 'name', label: 'Sản phẩm', type: 'string', icon: 'fa-tag' },
        { id: 'price', label: 'Giá (₫)', type: 'number', icon: 'fa-coins', unit: '₫' },
        { id: 'stock', label: 'Tồn kho', type: 'number', icon: 'fa-box', unit: 'mục' },
        { id: 'rating', label: 'Đánh giá', type: 'number', icon: 'fa-star', unit: '★' }
      ],
      generate: (count) => {
        const products = [
          { brand: 'iPhone', models: ['15 Pro Max', '15 Pro', '14 Plus', '13 Mini', '15'], variants: ['Titan Tự Nhiên', 'Titan Xanh', 'Chính hãng VNA', '256GB', '512GB', 'Likenew 99%'], priceRange: [18, 35] },
          { brand: 'Samsung', models: ['S24 Ultra', 'Z Fold 5', 'Z Flip 5', 'Galaxy Tab S9'], variants: ['Bản Mỹ', 'Công ty', 'Titanium Grey', 'Bản 2 SIM', 'Độc quyền Online'], priceRange: [10, 32] },
          { brand: 'Sony', models: ['WH-1000XM5', 'WF-1000XM4', 'PlayStation 5', 'Alpha A7 IV'], variants: ['Chính hãng SonyVN', 'Bản Limited', 'Silver Edition', 'Hàng nhập khẩu'], priceRange: [5, 55] },
          { brand: 'Xiaomi', models: ['14 Ultra', 'Redmi Note 13', 'Poco F5 Pro', 'Pad 6 Pro'], variants: ['Bản nội địa', 'Quốc tế Global', 'Black Gold', '12GB/256GB'], priceRange: [1, 25] }
        ];
        
        return Array.from({ length: count }, (_, i) => {
          const cat = products[i % products.length];
          const model = cat.models[Math.floor(Math.random() * cat.models.length)];
          const variant = cat.variants[Math.floor(Math.random() * cat.variants.length)];
          const basePrice = (Math.random() * (cat.priceRange[1] - cat.priceRange[0]) + cat.priceRange[0]) * 1000000;
          
          return {
            id: i + 1,
            name: `${cat.brand} ${model} ${variant}`,
            price: Math.floor(basePrice / 10000) * 10000,
            stock: Math.floor(Math.random() * 500),
            rating: Number((Math.random() * 1.2 + 3.8).toFixed(1))
          };
        });
      }
    },
    'education': {
      name: 'Quản lý Giáo dục (Sinh viên)',
      icon: 'fa-user-graduate',
      fields: [
        { id: 'name', label: 'Tên sinh viên', type: 'string', icon: 'fa-user' },
        { id: 'major', label: 'Ngành học', type: 'string', icon: 'fa-book' },
        { id: 'gpa', label: 'Điểm GPA', type: 'number', icon: 'fa-graduation-cap', unit: '' },
        { id: 'score', label: 'Điểm RL', type: 'number', icon: 'fa-award', unit: 'Điểm' }
      ],
      generate: (count) => {
        const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
        const middleNames = ['Văn', 'Thị', 'Minh', 'Hoàng', 'Thanh', 'Ngọc', 'Đức', 'Anh', 'Kim', 'Bảo', 'Gia'];
        const firstNames = ['An', 'Bình', 'Cường', 'Dũng', 'Duy', 'Hùng', 'Huy', 'Linh', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Tuấn', 'Việt', 'Yến'];
        const majors = ['Khoa học Máy tính', 'Kinh tế đối ngoại', 'Logistics', 'Marketing Digital', 'Quản trị Khách sạn', 'Luật Quốc tế', 'Ngôn ngữ Anh', 'Công nghệ Sinh học'];
        
        const gaussianRandom = () => {
          let u = 0, v = 0;
          while (u === 0) u = Math.random();
          while (v === 0) v = Math.random();
          return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        };

        return Array.from({ length: count }, (_, i) => {
          let gpa = 2.8 + (gaussianRandom() * 0.5);
          gpa = Math.max(1.0, Math.min(4.0, gpa));
          
          return {
            id: i + 1,
            name: `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`,
            major: majors[Math.floor(Math.random() * majors.length)],
            gpa: Number(gpa.toFixed(2)),
            score: Math.floor(65 + (Math.random() * 35))
          };
        });
      }
    },
    'finance': {
      name: 'Thị trường Chứng khoán',
      icon: 'fa-chart-line',
      fields: [
        { id: 'symbol', label: 'Mã CK', type: 'string', icon: 'fa-hashtag' },
        { id: 'price', label: 'Giá khớp', type: 'number', icon: 'fa-money-bill-trend-up', unit: 'k' },
        { id: 'change', label: 'Thay đổi', type: 'number', icon: 'fa-arrow-trend-up', unit: '%' },
        { id: 'volume', label: 'Khối lượng', type: 'number', icon: 'fa-database', unit: 'CP' }
      ],
      generate: (count) => {
        const baseStocks = ['VNM', 'VIC', 'FPT', 'HPG', 'VCB', 'MWG', 'TCB', 'GAS', 'MSN', 'VHM', 'SSI', 'HDB', 'VRE', 'STB', 'MBB', 'VPB', 'POW', 'PLX'];
        const suffixes = ['.VN', '.HN', '.OTC', '.ETF', '-P', '-S'];
        
        return Array.from({ length: count }, (_, i) => {
          const base = baseStocks[Math.floor(Math.random() * baseStocks.length)];
          const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          const baseP = Math.floor(Math.random() * 100) + 15;
          const priceVar = (Math.random() * 0.2 - 0.1); 
          
          return {
            id: i + 1,
            symbol: base + suffix,
            price: Number((baseP * (1 + priceVar)).toFixed(2)),
            change: Number((Math.random() * 14 - 7).toFixed(2)),
            volume: Math.floor(Math.random() * 15000000) + 50000
          };
        });
      }
    },
    'geography': {
      name: 'Địa lý (Việt Nam)',
      icon: 'fa-city',
      fields: [
        { id: 'name', label: 'Địa danh', type: 'string', icon: 'fa-city' },
        { id: 'population', label: 'Dân số', type: 'number', icon: 'fa-users', unit: 'người' },
        { id: 'area', label: 'Diện tích', type: 'number', icon: 'fa-map-location-dot', unit: 'km²' },
        { id: 'density', label: 'Mật độ', type: 'number', icon: 'fa-people-group', unit: 'ng/km²' }
      ],
      generate: (count) => {
        const provinces = [
          { n: 'Hà Nội', d: ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy', 'Long Biên', 'Tây Hồ'], p: 8500000, a: 3358 },
          { n: 'TP.HCM', d: ['Thủ Đức', 'Quận 1', 'Quận 3', 'Bình Thạnh', 'Tân Bình', 'Gò Vấp', 'Phú Nhuận'], p: 9400000, a: 2061 },
          { n: 'Đà Nẵng', d: ['Hải Châu', 'Thanh Khê', 'Liên Chiểu', 'Sơn Trà', 'Ngũ Hành Sơn', 'Cẩm Lệ'], p: 1200000, a: 1285 },
          { n: 'Hải Phòng', d: ['Hồng Bàng', 'Lê Chân', 'Ngô Quyền', 'Kiến An', 'Hải An', 'Đồ Sơn'], p: 2100000, a: 1527 },
          { n: 'Cần Thơ', d: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'], p: 1300000, a: 1439 }
        ];
        
        return Array.from({ length: count }, (_, i) => {
          const prov = provinces[i % provinces.length];
          const dist = prov.d[Math.floor(Math.random() * prov.d.length)];
          const p = Math.floor(prov.p * (Math.random() * 0.4 + 0.8) / 10); // District level pop
          const a = Math.floor(prov.a * (Math.random() * 0.3 + 0.1));     // District level area
          
          return {
            id: i + 1,
            name: `${prov.n} - ${dist}`,
            population: p,
            area: a,
            density: Math.floor(p / a)
          };
        });
      }
    }
  },

  getDataset(id) {
    return this.datasets[id];
  },

  getAllDatasets() {
    return Object.entries(this.datasets).map(([id, config]) => ({
      id,
      name: config.name,
      icon: config.icon
    }));
  }
};

window.DatasetManager = DatasetManager;
