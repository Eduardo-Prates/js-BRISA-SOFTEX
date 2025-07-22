<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    getHotspots, 
    getOffers, 
    getCarrinhoById, 
    listenToCarrinhoById,
    listenToOffers,
    listenToHotspots
  } from '$lib/firebaseFetch';
  
  let offers = [];
  let hotspots = [];
  let currentOffers = [];
  let currentHotspot = null;
  let carrinho = null;
  let userName = "Cliente";
  let loading = true;
  let error = '';
  let carrinhoId = 'carrinho001';
  
  // Variáveis para controlar os listeners
  let unsubscribeCarrinho;
  let unsubscribeOffers;
  let unsubscribeHotspots;
  
  // Opção para usar polling em vez de listeners (defina como true se preferir polling)
  let usePolling = false;
  let pollingInterval;
  
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
      if (usePolling) {
        // Opção 1: Usar polling a cada 3 segundos
        await loadInitialData();
        startPolling();
      } else {
        // Opção 2: Usar listeners em tempo real (RECOMENDADO)
        await loadInitialData();
        startRealtimeListeners();
      }
      
      loading = false;
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      error = 'Erro ao carregar dados. Tente recarregar a página.';
      loading = false;
    }
  });
  
  onDestroy(() => {
    // Limpa todos os listeners e intervalos
    if (unsubscribeCarrinho) unsubscribeCarrinho();
    if (unsubscribeOffers) unsubscribeOffers();
    if (unsubscribeHotspots) unsubscribeHotspots();
    if (pollingInterval) clearInterval(pollingInterval);
  });
  
  async function loadInitialData() {
    // Carrega dados iniciais
    const [hotspotsData, offersData, carrinhoData] = await Promise.all([
      getHotspots(),
      getOffers(),
      getCarrinhoById(carrinhoId)
    ]);
    
    hotspots = hotspotsData;
    offers = offersData;
    carrinho = carrinhoData;
    
    if (!carrinho) {
      error = `Carrinho ${carrinhoId} não encontrado.`;
      return;
    }
    
    updateCurrentOffers();
  }
  
  function startRealtimeListeners() {
    // Listener para o carrinho (PRINCIPAL - detecta mudanças na localização)
    unsubscribeCarrinho = listenToCarrinhoById(carrinhoId, (carrinhoData, err) => {
      if (err) {
        console.error('Erro no listener do carrinho:', err);
        error = 'Erro ao monitorar carrinho. Tentando reconectar...';
        return;
      }
      
      if (carrinhoData) {
        const oldLocation = carrinho?.localizacaoAtual;
        carrinho = carrinhoData;
        
        // Só atualiza se a localização mudou
        if (oldLocation !== carrinho.localizacaoAtual) {
          console.log('Localização do carrinho atualizada:', carrinho.localizacaoAtual);
          updateCurrentOffers();
        }
      } else {
        error = `Carrinho ${carrinhoId} não encontrado.`;
      }
    });
    
    // Listener para ofertas (detecta quando ofertas são adicionadas/removidas/editadas)
    unsubscribeOffers = listenToOffers((offersData, err) => {
      if (err) {
        console.error('Erro no listener de ofertas:', err);
        return;
      }
      
      offers = offersData;
      updateCurrentOffers();
      console.log('Ofertas atualizadas em tempo real');
    });
    
    // Listener para hotspots (detecta quando hotspots são editados)
    unsubscribeHotspots = listenToHotspots((hotspotsData, err) => {
      if (err) {
        console.error('Erro no listener de hotspots:', err);
        return;
      }
      
      hotspots = hotspotsData;
      updateCurrentOffers();
      console.log('Hotspots atualizados em tempo real');
    });
  }
  
  function startPolling() {
    // Alternativa: Polling a cada 3 segundos
    pollingInterval = setInterval(async () => {
      try {
        const carrinhoData = await getCarrinhoById(carrinhoId);
        
        if (carrinhoData && carrinhoData.localizacaoAtual !== carrinho?.localizacaoAtual) {
          console.log('Localização atualizada via polling:', carrinhoData.localizacaoAtual);
          carrinho = carrinhoData;
          updateCurrentOffers();
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, 3000); // 3 segundos
  }
  
  function logout() {
    // Limpa listeners antes de sair
    if (unsubscribeCarrinho) unsubscribeCarrinho();
    if (unsubscribeOffers) unsubscribeOffers();
    if (unsubscribeHotspots) unsubscribeHotspots();
    if (pollingInterval) clearInterval(pollingInterval);
    
    sessionStorage.removeItem('currentUser');
    goto('/');
  }
  
  function updateCurrentOffers() {
    if (!carrinho || !carrinho.localizacaoAtual) {
      currentOffers = [];
      currentHotspot = null;
      return;
    }
    
    // Encontra o hotspot onde o carrinho está localizado
    const hotspot = hotspots.find(h => h.id === carrinho.localizacaoAtual);
    
    if (hotspot) {
      currentHotspot = hotspot;
      // Filtra as ofertas pelo ID do hotspot atual
      currentOffers = offers.filter(offer => offer.hotspotId === hotspot.id);
    } else {
      currentHotspot = null;
      currentOffers = [];
    }
  }
  
  // Função para alternar entre polling e listeners em tempo real
  function toggleUpdateMode() {
    // Limpa listeners/polling atuais
    if (unsubscribeCarrinho) unsubscribeCarrinho();
    if (unsubscribeOffers) unsubscribeOffers();
    if (unsubscribeHotspots) unsubscribeHotspots();
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Alterna o modo
    usePolling = !usePolling;
    
    // Reinicia com o novo modo
    if (usePolling) {
      startPolling();
    } else {
      startRealtimeListeners();
    }
  }
  
  // Função para recarregar manualmente
  async function manualReload() {
    loading = true;
    error = '';
    
    try {
      await loadInitialData();
      loading = false;
    } catch (err) {
      console.error('Erro ao recarregar:', err);
      error = 'Erro ao recarregar dados. Tente novamente.';
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-100 p-4">
  <header class="bg-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
    <h1 class="text-2xl font-bold text-primary">Ofertas Especiais</h1>
    <div class="flex items-center gap-4">
      <div class="text-sm text-gray-500">
        {#if carrinho && currentHotspot}
          📍 {currentHotspot.name}
        {:else if carrinho}
          📍 {carrinho.localizacaoAtual || 'Não definida'}
        {:else}
          📍 Carregando...
        {/if}
        
        <!-- Indicador do modo de atualização -->
        <span class="ml-2 px-2 py-1 text-xs rounded {usePolling ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
          {usePolling ? '🔄 Polling 3s' : '⚡ Tempo Real'}
        </span>
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
          {#if currentHotspot}
            <p class="text-xl text-gray-500">Nenhuma oferta disponível para {currentHotspot.name} no momento.</p>
          {:else if carrinho && carrinho.localizacaoAtual}
            <p class="text-xl text-gray-500">Hotspot não encontrado para a localização atual: {carrinho.localizacaoAtual}</p>
          {:else}
            <p class="text-xl text-gray-500">Localização do carrinho não definida.</p>
          {/if}
        </div>
      {:else}
        <div class="col-span-full mb-4">
          <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <p class="font-semibold">📍 Ofertas disponíveis em: {currentHotspot.name}</p>
            <p class="text-sm">Total de ofertas: {currentOffers.length} | Frequência: {currentHotspot.frequency || 'Não informada'}</p>
          </div>
        </div>
        
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
  
  <!-- Botões de controle -->
  <div class="fixed bottom-4 right-4 flex flex-col gap-2">
    <!-- Botão para alternar modo de atualização -->
    <div class="bg-white p-2 rounded-full shadow-lg">
      <button 
        on:click={toggleUpdateMode}
        class="bg-gray-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xs"
        aria-label="Alternar modo de atualização"
        title={usePolling ? 'Mudar para tempo real' : 'Mudar para polling'}
      >
        {usePolling ? '⚡' : '🔄'}
      </button>
    </div>
    
    <!-- Botão de atualização manual -->
    <div class="bg-white p-2 rounded-full shadow-lg">
      <button 
        on:click={manualReload}
        class="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center"
        aria-label="Atualizar manualmente"
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
  </div>
</div>