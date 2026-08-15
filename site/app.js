const rooms = [
  {
    icon: '🛋️',
    name: 'Salon',
    tagline: 'Meble, zegary i porcelana z lat 50. i 60.',
    image: 'assets/room-salon.jpg',
    count: 12,
  },
  {
    icon: '📚',
    name: 'Gabinet',
    tagline: 'Książki, maszyny do pisania i przedmioty biurowe.',
    image: 'assets/room-gabinet.jpg',
    count: 9,
  },
  {
    icon: '🍽️',
    name: 'Kuchnia',
    tagline: 'Naczynia emaliowane, kamionka i sprzęty gospodarskie.',
    image: 'assets/room-kuchnia.jpg',
    count: 10,
  },
  {
    icon: '🕰️',
    name: 'Korytarz',
    tagline: 'Zegary stojące, lustra i drobne meble wejściowe.',
    image: 'assets/room-korytarz.jpg',
    count: 7,
  },
];

const products = [
  { icon: '🕰️', name: 'Zegar mechaniczny Junghans', room: 'Salon', price: '450 zł' },
  { icon: '🪑', name: 'Krzesło z lat 60.', room: 'Salon', price: '620 zł' },
  { icon: '📚', name: 'Zestaw starych książek', room: 'Gabinet', price: '180 zł' },
  { icon: '🏺', name: 'Porcelanowy wazon', room: 'Kuchnia', price: '240 zł' },
  { icon: '🖼️', name: 'Obraz w drewnianej ramie', room: 'Korytarz', price: '330 zł' },
  { icon: '💡', name: 'Lampa stołowa', room: 'Gabinet', price: '410 zł' },
  { icon: '📻', name: 'Stare radio', room: 'Salon', price: '560 zł' },
  { icon: '🪞', name: 'Lustro z lat 50.', room: 'Korytarz', price: '390 zł' },
];

const roomsContainer = document.getElementById('rooms');
const productsContainer = document.getElementById('products');

roomsContainer.innerHTML = rooms
  .map(
    (room) => `
      <article class="room-card">
        <img src="${room.image}" alt="${room.name}" />
        <div class="room-card-body">
          <div>
            <h3>${room.icon} ${room.name}</h3>
            <p>${room.tagline}</p>
          </div>
          <div class="room-count">${room.count} rzeczy</div>
        </div>
      </article>
    `,
  )
  .join('');

productsContainer.innerHTML = products
  .map(
    (item) => `
      <article class="product-card">
        <div class="product-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <div class="product-meta">${item.room}</div>
        <div class="product-price">${item.price}</div>
      </article>
    `,
  )
  .join('');
