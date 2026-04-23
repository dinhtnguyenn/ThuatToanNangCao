const fs = require('fs');

const brands = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'vivo', 'realme', 'Nokia', 'Asus', 'Sony', 'Huawei'];
const prefixes = ['Điện thoại', 'Tablet', 'Đồng hồ thông minh'];
const models = ['Pro', 'Max', 'Ultra', 'Plus', 'Lite', 'Mini', 'FE', '5G', '4G', 'Gaming'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}

function generateName() {
  const prefix = prefixes[getRandomInt(0, prefixes.length - 1)];
  const brand = brands[getRandomInt(0, brands.length - 1)];
  let name = `${prefix} ${brand} `;
  
  if (prefix === 'Điện thoại') {
    name += getRandomInt(10, 99);
  } else if (prefix === 'Tablet') {
    name += 'Pad ' + getRandomInt(1, 9);
  } else {
    name += 'Watch ' + getRandomInt(1, 9);
  }

  // Add random model suffix 50% of the time
  if (Math.random() > 0.5) {
    name += ' ' + models[getRandomInt(0, models.length - 1)];
  }
  
  return name;
}

const numProducts = 100000;
const data = [];

for (let i = 1; i <= numProducts; i++) {
  // Price between 1,000,000 and 40,000,000 VND (in steps of 10,000)
  const basePrice = getRandomInt(100, 4000) * 10000;
  
  data.push({
    id: i,
    name: generateName(),
    price: basePrice,
    rating: getRandomFloat(1, 5, 1),
    stock: getRandomInt(0, 500),
    isComparing: false,
    isSwapping: false,
    isSorted: false
  });
}

fs.writeFileSync('data.json', JSON.stringify(data, null, 0));
console.log(`Generated ${numProducts} products and saved to data.json`);
