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
  let currentOffers = $state([]);
  let currentHotspot = $state(null);
  let carrinho = $state(null);
  let userName = "Cliente";
  let loading = $state(true);
  let error = $state('');
  let carrinhoId = 'carrinho001';
  let showingAllOffers = $state(false); // Flag para indicar se está mostrando todas as ofertas

  // Estado do usuário logado
  let isLoggedIn = $state(false);
  let showLoginDialog = false;
  let loginForm = { email: "", password: "" };
  let user = $state({
    name: "Maria Silva",
    email: "maria.silva@email.com",
    memberSince: "2023",
    totalOrders: 47,
  });

  // Variáveis para controlar os listeners
  let unsubscribeCarrinho;
  let unsubscribeOffers;
  let unsubscribeHotspots;

  // Opção para usar polling em vez de listeners
  let usePolling = $state(false);
  let pollingInterval;

  onMount(async () => {
    // Verificar se o usuário está logado
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
      goto('/');
      return;
    }

    const userData = JSON.parse(currentUser);
    isLoggedIn = true;

    // Formatar o CPF para exibição
    const cpf = userData.cpf;
    if (cpf) {
      userName = `Cliente (${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)})`;
      user.name = userName;
    }

    try {
      if (usePolling) {
        await loadInitialData();
        startPolling();
      } else {
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
    if (unsubscribeCarrinho) unsubscribeCarrinho();
    if (unsubscribeOffers) unsubscribeOffers();
    if (unsubscribeHotspots) unsubscribeHotspots();
    if (pollingInterval) clearInterval(pollingInterval);
  });

  async function loadInitialData() {
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
    unsubscribeCarrinho = listenToCarrinhoById(carrinhoId, (carrinhoData, err) => {
      if (err) {
        console.error('Erro no listener do carrinho:', err);
        error = 'Erro ao monitorar carrinho. Tentando reconectar...';
        return;
      }

      if (carrinhoData) {
        const oldLocation = carrinho?.localizacaoAtual;
        carrinho = carrinhoData;

        if (oldLocation !== carrinho.localizacaoAtual) {
          console.log('Localização do carrinho atualizada:', carrinho.localizacaoAtual);
          updateCurrentOffers();
        }
      } else {
        error = `Carrinho ${carrinhoId} não encontrado.`;
      }
    });

    unsubscribeOffers = listenToOffers((offersData, err) => {
      if (err) {
        console.error('Erro no listener de ofertas:', err);
        return;
      }

      offers = offersData;
      updateCurrentOffers();
      console.log('Ofertas atualizadas em tempo real');
    });

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
    }, 3000);
  }

  function logout() {
    if (unsubscribeCarrinho) unsubscribeCarrinho();
    if (unsubscribeOffers) unsubscribeOffers();
    if (unsubscribeHotspots) unsubscribeHotspots();
    if (pollingInterval) clearInterval(pollingInterval);

    sessionStorage.removeItem('currentUser');
    isLoggedIn = false;
    goto('/');
  }

  function updateCurrentOffers() {
    if (!carrinho || !carrinho.localizacaoAtual) {
      currentOffers = offers; // Mostrar todas as ofertas se não há localização
      currentHotspot = null;
      showingAllOffers = true;
      return;
    }

    const hotspot = hotspots.find(h => h.id === carrinho.localizacaoAtual);

    if (hotspot) {
      currentHotspot = hotspot;
      const hotspotOffers = offers.filter(offer => offer.hotspotId === hotspot.id);
      
      if (hotspotOffers.length > 0) {
        currentOffers = hotspotOffers;
        showingAllOffers = false;
      } else {
        // Se não há ofertas específicas do hotspot, mostrar todas
        currentOffers = offers;
        showingAllOffers = true;
      }
    } else {
      currentHotspot = null;
      currentOffers = offers; // Mostrar todas as ofertas se hotspot não encontrado
      showingAllOffers = true;
    }
  }

  function toggleUpdateMode() {
    if (unsubscribeCarrinho) unsubscribeCarrinho();
    if (unsubscribeOffers) unsubscribeOffers();
    if (unsubscribeHotspots) unsubscribeHotspots();
    if (pollingInterval) clearInterval(pollingInterval);

    usePolling = !usePolling;

    if (usePolling) {
      startPolling();
    } else {
      startRealtimeListeners();
    }
  }

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

  function handleLogin(e) {
    e.preventDefault();
    // Simular login adicional (mantém a lógica existente)
    showLoginDialog = false;
    loginForm = { email: "", password: "" };
  }

  function handleLogout() {
    logout();
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- User Section - Left -->
        <div class="flex items-center space-x-4">
          {#if isLoggedIn}
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="text-left">
                <div class="font-medium text-gray-900">{user.name}</div>
                <div class="text-sm text-gray-500">Membro desde {user.memberSince}</div>
              </div>
              <button 
                onclick={handleLogout}
                class="text-sm text-red-600 hover:text-red-800 ml-4"
                aria-label="Sair"
              >
                Sair
              </button>
            </div>
          {:else}
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="text-left">
                <div class="font-medium text-gray-600">Visitante</div>
                <div class="text-sm text-teal-600">Fazer login</div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Logo - Center -->
        <div class="flex items-center space-x-2">
          <div class="text-2xl">
            <span class="font-bold text-teal-600">VLC</span><span class="font-light text-gray-700">ART</span>
          </div>
          <img src="https://img.icons8.com/?size=100&id=13014&format=png&color=000000" alt="Carrinho de compras" class="w-6 h-6">
        </div>

        <!-- Current Section & Status - Right -->
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <div class="text-sm text-gray-500">SETOR ATUAL:</div>
            <div class="text-lg font-semibold text-teal-600">
              {#if carrinho && currentHotspot}
                {currentHotspot.name}
              {:else if carrinho}
                {carrinho.localizacaoAtual || 'Não definida'}
              {:else}
                Carregando...
              {/if}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-6 py-6">
    <!-- Error Message -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    <!-- Loading State -->
    {#if loading}
      <div class="bg-white p-8 rounded-lg shadow-md text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <p class="mt-2 text-gray-500">Carregando dados...</p>
      </div>
    {:else}

      <!-- Products Grid -->
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12">
          {#if currentOffers.length === 0}
            <div class="bg-white p-8 rounded-lg shadow-md text-center">
              <p class="text-xl text-gray-500">Nenhuma oferta disponível no momento.</p>
            </div>
          {:else}
            <!-- Current Location Info -->
            <div class="mb-6">
              {#if showingAllOffers}
                <div class="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded">
                  {#if currentHotspot}
                    <p class="font-semibold">Nenhuma oferta específica para {currentHotspot.name}</p>
                    <p class="text-sm">Exibindo todas as ofertas disponíveis ({currentOffers.length} ofertas)</p>
                  {:else if carrinho && carrinho.localizacaoAtual}
                    <p class="font-semibold">Hotspot não encontrado para: {carrinho.localizacaoAtual}</p>
                    <p class="text-sm">Exibindo todas as ofertas disponíveis ({currentOffers.length} ofertas)</p>
                  {:else}
                    <p class="font-semibold">Localização não definida</p>
                    <p class="text-sm">Exibindo todas as ofertas disponíveis ({currentOffers.length} ofertas)</p>
                  {/if}
                </div>
              {:else if currentHotspot}
                <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                  <p class="font-semibold">Ofertas específicas para: {currentHotspot.name}</p>
                  <p class="text-sm">Total de ofertas: {currentOffers.length} | Frequência: {currentHotspot.frequency || 'Não informada'}</p>
                </div>
              {/if}
            </div>

            <!-- Products Grid -->
            <div class="grid grid-cols-2 gap-6">
              {#each currentOffers as offer}
                <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div class="space-y-4 p-6">
                    {#if offer.imageUrl}
                      <div class="flex justify-center">
                        <img
                          src={offer.imageUrl || "/placeholder.svg"}
                          alt={offer.title}
                          class="w-40 h-40 object-cover rounded-lg"
                          onerror={(e) => { 
                            e.target.src = 'https://via.placeholder.com/160x160?text=Sem+Imagem'; 
                            e.target.onerror = null; 
                          }}
                        />
                      </div>
                    {/if}

                    <div class="text-center">
                      <h3 class="font-medium text-base text-gray-900 mb-2">{offer.title}</h3>
                      
                      {#if offer.description}
                        <p class="text-sm text-gray-600 mb-3">{offer.description}</p>
                      {/if}

                      <!-- Badge para indicar se é oferta específica ou geral -->
                      {#if !showingAllOffers}
                        <div class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          📍 Oferta local
                        </div>
                      {:else}
                        <div class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          🌐 Oferta geral
                        </div>
                      {/if}

                      <!-- Preços -->
                      <div class="space-y-1 mt-2">
                        {#if offer.price !== undefined && offer.price !== null}
                          <div class="flex items-center justify-center space-x-2">
                            {#if offer.oldPrice !== undefined && offer.oldPrice !== null && offer.oldPrice > offer.price}
                              <span class="text-sm text-gray-500 line-through">R$ {offer.oldPrice.toFixed(2)}</span>
                              <span class="text-xl font-bold text-teal-600">R$ {offer.price.toFixed(2)}</span>
                            {:else}
                              <span class="text-xl font-bold text-teal-600">R$ {offer.price.toFixed(2)}</span>
                            {/if}
                          </div>
                          
                          {#if offer.oldPrice !== undefined && offer.oldPrice !== null && offer.oldPrice > offer.price}
                            <div class="text-xs text-green-600 font-medium">
                              Economia de R$ {(offer.oldPrice - offer.price).toFixed(2)}
                              ({(((offer.oldPrice - offer.price) / offer.oldPrice) * 100).toFixed(0)}% OFF)
                            </div>
                          {/if}
                        {:else}
                          <div class="text-lg text-gray-500">Preço não disponível</div>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

</div>