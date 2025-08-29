<script>
  import { onMount } from 'svelte';
  import { getOffers, addOffer, updateOffer, deleteOffer, getHotspots } from '$lib/firebaseFetch';
  
  let offers = [];
  let hotspots = [];
  let title = '';
  let description = '';
  let imageUrl = '';
  let hotspotId = '';
  let oldPrice = '';
  let price = '';
  let editingId = null;
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      // Carrega hotspots e ofertas em paralelo
      const [hotspotsData, offersData] = await Promise.all([
        getHotspots(),
        getOffers()
      ]);
      
      hotspots = hotspotsData;
      offers = offersData;
      loading = false;
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      error = 'Erro ao carregar dados. Tente recarregar a página.';
      loading = false;
    }
  });
  
  async function handleAddOffer() {
    if (!title.trim() || !hotspotId) return;
    
    try {
      if (editingId !== null) {
        // Update existing offer
        await updateOffer(editingId, { 
          title, 
          description, 
          imageUrl, 
          hotspotId,
          oldPrice: oldPrice ? parseFloat(oldPrice) : null,
          price: price ? parseFloat(price) : null
        });
        
        // Atualiza a lista local
        const index = offers.findIndex(o => o.id === editingId);
        if (index !== -1) {
          offers[index] = { 
            ...offers[index], 
            title, 
            description, 
            imageUrl, 
            hotspotId,
            oldPrice: oldPrice ? parseFloat(oldPrice) : null,
            price: price ? parseFloat(price) : null
          };
          offers = [...offers];
        }
        
        editingId = null;
      } else {
        // Add new offer
        const newOffer = {
          title,
          description,
          imageUrl,
          hotspotId,
          oldPrice: oldPrice ? parseFloat(oldPrice) : null,
          price: price ? parseFloat(price) : null
        };
        
        const docRef = await addOffer(newOffer);
        
        // Adiciona à lista local com o ID gerado pelo Firestore
        offers = [...offers, { id: docRef.id, ...newOffer }];
      }
      
      // Reset form
      title = '';
      description = '';
      imageUrl = '';
      hotspotId = '';
      oldPrice = '';
      price = '';
    } catch (err) {
      console.error('Erro ao salvar oferta:', err);
      error = 'Ocorreu um erro ao salvar a oferta. Tente novamente.';
    }
  }
  
  function editOffer(offer) {
    title = offer.title;
    description = offer.description || '';
    imageUrl = offer.imageUrl || '';
    hotspotId = offer.hotspotId;
    oldPrice = offer.oldPrice ? offer.oldPrice.toString() : '';
    price = offer.price ? offer.price.toString() : '';
    editingId = offer.id;
  }
  
  async function handleDeleteOffer(id) {
    if (confirm('Tem certeza que deseja excluir esta oferta?')) {
      try {
        await deleteOffer(id);
        offers = offers.filter(o => o.id !== id);
      } catch (err) {
        console.error('Erro ao excluir oferta:', err);
        error = 'Ocorreu um erro ao excluir a oferta. Tente novamente.';
      }
    }
  }
  
  function getHotspotName(id) {
    const hotspot = hotspots.find(h => h.id === id);
    return hotspot ? hotspot.name : 'Desconhecido';
  }
  
  function formatPrice(price) {
    if (!price) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }
  
  function resetForm() {
    editingId = null;
    title = '';
    description = '';
    imageUrl = '';
    hotspotId = '';
    oldPrice = '';
    price = '';
  }
</script>

<div>
  <h1 class="text-2xl font-bold mb-6">Gerenciar Ofertas</h1>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  <div class="bg-white p-6 rounded-lg shadow-md mb-8">
    <h2 class="text-xl font-semibold mb-4">{editingId !== null ? 'Editar' : 'Adicionar'} Oferta</h2>
    
    <form on:submit|preventDefault={handleAddOffer} class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input 
          id="title"
          type="text" 
          bind:value={title} 
          class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
          placeholder="Título da oferta"
          required
        />
      </div>
      
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea 
          id="description"
          bind:value={description} 
          class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
          placeholder="Descrição da oferta"
          rows="3"
        ></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="oldPrice" class="block text-sm font-medium text-gray-700 mb-1">Preço Antigo (R$)</label>
          <input 
            id="oldPrice"
            type="number" 
            step="0.01"
            min="0"
            bind:value={oldPrice} 
            class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
            placeholder="0,00"
          />
        </div>
        
        <div>
          <label for="price" class="block text-sm font-medium text-gray-700 mb-1">Preço Atual (R$)</label>
          <input 
            id="price"
            type="number" 
            step="0.01"
            min="0"
            bind:value={price} 
            class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
            placeholder="0,00"
          />
        </div>
      </div>
      
      <div>
        <label for="imageUrl" class="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
        <input 
          id="imageUrl"
          type="url" 
          bind:value={imageUrl} 
          class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
          placeholder="https://exemplo.com/imagem.jpg"
        />
      </div>
      
      <div>
        <label for="hotspot" class="block text-sm font-medium text-gray-700 mb-1">Hotspot</label>
        <select 
          id="hotspot"
          bind:value={hotspotId} 
          class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
          required
        >
          <option value="">Selecione um hotspot</option>
          {#each hotspots as hotspot}
            <option value={hotspot.id}>{hotspot.name}</option>
          {/each}
        </select>
      </div>
      
      <div class="flex justify-end">
        {#if editingId !== null}
          <button 
            type="button" 
            on:click={resetForm}
            class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        {/if}
        <button 
          type="submit" 
          class="px-4 py-2 bg-blue-100 text-black rounded hover:bg-blue-200 transition-colors"
          disabled={hotspots.length === 0}
        >
          {editingId !== null ? 'Atualizar' : 'Adicionar'} Oferta
        </button>
      </div>
      
      {#if hotspots.length === 0}
        <div class="text-amber-600 text-sm mt-2">
          Você precisa criar pelo menos um hotspot antes de adicionar ofertas.
        </div>
      {/if}
    </form>
  </div>
  
  <div class="bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold p-6 border-b">Lista de Ofertas</h2>
    
    {#if loading}
      <div class="p-6 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-2 text-gray-500">Carregando ofertas...</p>
      </div>
    {:else if offers.length === 0}
      <div class="p-6 text-center text-gray-500">
        Nenhuma oferta adicionada ainda. Adicione sua primeira oferta acima.
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preços</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotspot</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each offers as offer}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">{offer.title}</td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate">{offer.description}</div>
                  {#if offer.imageUrl}
                    <div class="text-xs text-gray-500 mt-1">Tem imagem</div>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm">
                    {#if offer.oldPrice}
                      <div class="text-gray-500 line-through text-xs">{formatPrice(offer.oldPrice)}</div>
                    {/if}
                    {#if offer.price}
                      <div class="text-green-600 font-semibold">{formatPrice(offer.price)}</div>
                    {:else}
                      <div class="text-gray-400">-</div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{getHotspotName(offer.hotspotId)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button 
                    on:click={() => editOffer(offer)}
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Editar
                  </button>
                  <button 
                    on:click={() => handleDeleteOffer(offer.id)}
                    class="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>