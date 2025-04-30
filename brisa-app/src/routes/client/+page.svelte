<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  
  // Store for offers and hotspots
  let offers = [];
  let hotspots = [];
  let currentOffers = [];
  let cartPosition = { x: 50, y: 50 }; // Default position
  let updateInterval;
  let userName = "Cliente";
  
  onMount(() => {
    // Verify if user is logged on
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      goto('/');
      return;
    }
    
    const userData = JSON.parse(currentUser);
    
    // Format CPF (mask)
    const cpf = userData.cpf;
    if (cpf) {
      userName = `Cliente (${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)})`;
    }
    
    // Load data from localStorage
    const storedOffers = localStorage.getItem('offers');
    if (storedOffers) {
      offers = JSON.parse(storedOffers);
    }
    
    const storedHotspots = localStorage.getItem('hotspots');
    if (storedHotspots) {
      hotspots = JSON.parse(storedHotspots);
    }
    
    // Start position updates (simulating cart movement)
    startPositionUpdates();
    
    // Update offers based on initial position
    updateCurrentOffers();
  });
  
  onDestroy(() => {
    // Clean up interval when component is destroyed
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
  
  function logout() {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    localStorage.removeItem('currentUser');
    goto('/');
  }
  
  function startPositionUpdates() {
    // For demo purposes, we'll simulate cart movement
    // In a real application, this would come from a location tracking system (VCL Info etc..)
    updateInterval = setInterval(() => {
      // Simulate random movement
      cartPosition = {
        x: Math.max(0, Math.min(100, cartPosition.x + (Math.random() - 0.5) * 10)),
        y: Math.max(0, Math.min(100, cartPosition.y + (Math.random() - 0.5) * 10))
      };
      
      updateCurrentOffers();
    }, 5000); // Update every 5 seconds
  }
  
  function updateCurrentOffers() {
    // Find the nearest hotspot
    let nearestHotspot = null;
    let minDistance = Infinity;
    
    hotspots.forEach(hotspot => {
      const distance = Math.sqrt(
        Math.pow(hotspot.x - cartPosition.x, 2) + 
        Math.pow(hotspot.y - cartPosition.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestHotspot = hotspot;
      }
    });
    
    // If we're close enough to a hotspot (within x units), show its offers
    if (nearestHotspot && minDistance < 5) {
      currentOffers = offers.filter(offer => offer.hotspotId === nearestHotspot.id);
    } else {
      currentOffers = [];
    }
  }
</script>

<div class="min-h-screen bg-gray-100 p-4">
  <header class="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
    <h1 class="text-2xl font-bold text-primary">Ofertas Especiais</h1>
    <div class="flex items-center gap-4">
      <div class="text-sm text-gray-500">
        Posição do carrinho: X: {cartPosition.x.toFixed(1)}, Y: {cartPosition.y.toFixed(1)}
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">{userName}</span>
        <button 
          on:click={logout}
          class="text-sm text-red-600 hover:text-red-800"
        >
          Sair
        </button>
      </div>
    </div>
  </header>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#if currentOffers.length === 0}
      <div class="col-span-full bg-white p-8 rounded-lg shadow-md text-center">
        <p class="text-xl text-gray-500">Mova seu carrinho para descobrir ofertas especiais!</p>
      </div>
    {:else}
      {#each currentOffers as offer}
        <div class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          {#if offer.imageUrl}
            <div class="h-48 overflow-hidden">
              <img 
                src={offer.imageUrl || "/placeholder.svg"} 
                alt={offer.title} 
                class="w-full h-full object-cover"
                on:error={() => { event.target.src = 'https://via.placeholder.com/400x200?text=Imagem+Não+Encontrada'; event.target.onerror = null; }}
              />
            </div>
          {/if}
          <div class="p-6 flex-1 flex flex-col">
            <h2 class="text-xl font-bold mb-2">{offer.title}</h2>
            <p class="text-gray-600 flex-1">{offer.description}</p>
            <button class="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-primary/90">
              Ver Detalhes
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
  
  <div class="fixed bottom-4 right-4">
    <div class="bg-white p-4 rounded-full shadow-lg">
      <button 
        on:click={updateCurrentOffers}
        class="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center"
        aria-label="Atualizar ofertas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  </div>
</div>