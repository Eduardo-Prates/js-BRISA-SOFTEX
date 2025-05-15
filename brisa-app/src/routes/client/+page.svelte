<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { getHotspots, getOffers } from '$lib/firebaseFetch';
  
  let offers = [];
  let hotspots = [];
  let currentOffers = [];
  let cartPosition = { x: 50, y: 50 }; // Posição inicial
  let updateInterval;
  let userName = "Cliente";
  let loading = true;
  let error = '';
  
  onMount(async () => {
    // Verificar se o usuário está logado
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
      goto('/');
      return;
    }
    
    const userData = JSON.parse(currentUser);
    
    // Formatar o CPF para exibição
    const cpf = userData.cpf;
    if (cpf) {
      userName = `Cliente (${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)})`;
    }
    
    try {
      // Carrega hotspots e ofertas do Firebase
      const [hotspotsData, offersData] = await Promise.all([
        getHotspots(),
        getOffers()
      ]);
      
      hotspots = hotspotsData;
      offers = offersData;
      
      // Inicia a simulação de movimento
      startPositionUpdates();
      
      // Atualiza ofertas com base na posição inicial
      updateCurrentOffers();
      
      loading = false;
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      error = 'Erro ao carregar dados. Tente recarregar a página.';
      loading = false;
    }
  });
  
  onDestroy(() => {
    // Limpa o intervalo quando o componente é destruído
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
  
  function logout() {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    sessionStorage.removeItem('currentUser');
    goto('/');
  }
  
  function startPositionUpdates() {
    // Simula o movimento do carrinho a cada 5 segundos
    updateInterval = setInterval(() => {
      // Movimento aleatório
      cartPosition = {
        x: Math.max(0, Math.min(100, cartPosition.x + (Math.random() - 0.5) * 10)),
        y: Math.max(0, Math.min(100, cartPosition.y + (Math.random() - 0.5) * 10))
      };
      
      updateCurrentOffers();
    }, 5000);
  }
  
  function updateCurrentOffers() {
    // Encontra o hotspot mais próximo
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
    
    // Se estiver próximo o suficiente de um hotspot (dentro de 20 unidades), mostra suas ofertas
    if (nearestHotspot && minDistance < 20) {
      // Filtra as ofertas pelo ID do hotspot
      currentOffers = offers.filter(offer => offer.hotspotId === nearestHotspot.id);
    } else {
      currentOffers = [];
    }
  }
  
  // Função para atualizar manualmente a posição (botão de atualização)
  function manualUpdate() {
    // Movimento aleatório
    cartPosition = {
      x: Math.max(0, Math.min(100, cartPosition.x + (Math.random() - 0.5) * 10)),
      y: Math.max(0, Math.min(100, cartPosition.y + (Math.random() - 0.5) * 10))
    };
    
    updateCurrentOffers();
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
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  {#if loading}
    <div class="bg-white p-8 rounded-lg shadow-md text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-gray-500">Carregando dados...</p>
    </div>
  {:else}
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
                  on:error={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=Imagem+Não+Encontrada'; e.target.onerror = null; }}
                />
              </div>
            {/if}
            <div class="p-6 flex-1 flex flex-col">
              <h2 class="text-xl font-bold mb-2">{offer.title}</h2>
              <p class="text-gray-600 flex-1">{offer.description || ''}</p>
              <button class="mt-4 bg-primary text-white py-2 px-4 rounded hover:bg-primary/90">
                Ver Detalhes
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
  
  <div class="fixed bottom-4 right-4">
    <div class="bg-white p-4 rounded-full shadow-lg">
      <button 
        on:click={manualUpdate}
        class="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center"
        aria-label="Atualizar posição"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  </div>
</div>