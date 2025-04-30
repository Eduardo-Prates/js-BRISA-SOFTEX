<script>
  import { onMount } from 'svelte';
  
  // Store for offers and hotspots
  let offers = [];
  let hotspots = [];
  let title = '';
  let description = '';
  let imageUrl = '';
  let hotspotId = '';
  let editingId = null;
  
  onMount(() => {
    // Load data from localStorage for demo purposes
    const storedOffers = localStorage.getItem('offers');
    if (storedOffers) {
      offers = JSON.parse(storedOffers);
    }
    
    const storedHotspots = localStorage.getItem('hotspots');
    if (storedHotspots) {
      hotspots = JSON.parse(storedHotspots);
    }
  });
  
  function saveOffers() {
    localStorage.setItem('offers', JSON.stringify(offers));
  }
  
  function addOffer() {
    if (!title.trim() || !hotspotId) return;
    
    if (editingId !== null) {
      // Update existing offer
      const index = offers.findIndex(o => o.id === editingId);
      if (index !== -1) {
        offers[index] = { 
          id: editingId, 
          title, 
          description, 
          imageUrl, 
          hotspotId: parseInt(hotspotId) 
        };
        offers = [...offers];
      }
      editingId = null;
    } else {
      // Add new offer
      const newOffer = {
        id: Date.now(),
        title,
        description,
        imageUrl,
        hotspotId: parseInt(hotspotId)
      };
      offers = [...offers, newOffer];
    }
    
    // Reset form
    title = '';
    description = '';
    imageUrl = '';
    hotspotId = '';
    
    saveOffers();
  }
  
  function editOffer(offer) {
    title = offer.title;
    description = offer.description;
    imageUrl = offer.imageUrl;
    hotspotId = offer.hotspotId.toString();
    editingId = offer.id;
  }
  
  function deleteOffer(id) {
    offers = offers.filter(o => o.id !== id);
    saveOffers();
  }
  
  function getHotspotName(id) {
    const hotspot = hotspots.find(h => h.id === id);
    return hotspot ? hotspot.name : 'Desconhecido';
  }
</script>

<div>
  <h1 class="text-2xl font-bold mb-6">Gerenciar Ofertas</h1>
  
  <div class="bg-white p-6 rounded-lg shadow-md mb-8">
    <h2 class="text-xl font-semibold mb-4">{editingId !== null ? 'Editar' : 'Adicionar'} Oferta</h2>
    
    <form on:submit|preventDefault={addOffer} class="space-y-4">
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
            on:click={() => { editingId = null; title = ''; description = ''; imageUrl = ''; hotspotId = ''; }}
            class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        {/if}
        <button 
          type="submit" 
          class="px-4 py-2 bg-gray-200 text-black rounded hover:bg-primary/90"
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
    
    {#if offers.length === 0}
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
                <td class="px-6 py-4 whitespace-nowrap">{getHotspotName(offer.hotspotId)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button 
                    on:click={() => editOffer(offer)}
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Editar
                  </button>
                  <button 
                    on:click={() => deleteOffer(offer.id)}
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