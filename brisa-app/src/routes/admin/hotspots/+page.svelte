<script>
  import { onMount } from 'svelte';
  
  // Store for hotspots
  let hotspots = [];
  let name = '';
  let x = 0;
  let y = 0;
  let editingId = null;
  
  onMount(() => {
    // Load hotspots from localStorage for demo purposes
    const storedHotspots = localStorage.getItem('hotspots');
    if (storedHotspots) {
      hotspots = JSON.parse(storedHotspots);
    }
  });
  
  function saveHotspots() {
    localStorage.setItem('hotspots', JSON.stringify(hotspots));
  }
  
  function addHotspot() {
    if (!name.trim()) return;
    
    if (editingId !== null) {
      // Update existing hotspot
      const index = hotspots.findIndex(h => h.id === editingId);
      if (index !== -1) {
        hotspots[index] = { id: editingId, name, x, y };
        hotspots = [...hotspots];
      }
      editingId = null;
    } else {
      // Add new hotspot
      const newHotspot = {
        id: Date.now(),
        name,
        x,
        y
      };
      hotspots = [...hotspots, newHotspot];
    }
    
    // Reset form
    name = '';
    x = 0;
    y = 0;
    
    saveHotspots();
  }
  
  function editHotspot(hotspot) {
    name = hotspot.name;
    x = hotspot.x;
    y = hotspot.y;
    editingId = hotspot.id;
  }
  
  function deleteHotspot(id) {
    hotspots = hotspots.filter(h => h.id !== id);
    saveHotspots();
  }
</script>

<div>
  <h1 class="text-2xl font-bold mb-6">Gerenciar Hotspots</h1>
  
  <div class="bg-white p-6 rounded-lg shadow-md mb-8">
    <h2 class="text-xl font-semibold mb-4">{editingId !== null ? 'Editar' : 'Adicionar'} Hotspot</h2>
    
    <form on:submit|preventDefault={addHotspot} class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input 
          id="name"
          type="text" 
          bind:value={name} 
          class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
          placeholder="Nome do hotspot"
          required
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="x" class="block text-sm font-medium text-gray-700 mb-1">Coordenada X</label>
          <input 
            id="x"
            type="number" 
            bind:value={x} 
            class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
            min="0"
            max="100"
            required
          />
        </div>
        
        <div>
          <label for="y" class="block text-sm font-medium text-gray-700 mb-1">Coordenada Y</label>
          <input 
            id="y"
            type="number" 
            bind:value={y} 
            class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
            min="0"
            max="100"
            required
          />
        </div>
      </div>
      
      <div class="flex justify-end">
        {#if editingId !== null}
          <button 
            type="button" 
            on:click={() => { editingId = null; name = ''; x = 0; y = 0; }}
            class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        {/if}
        <button 
          type="submit" 
          class="px-4 py-2 bg-gray-200 text-black rounded hover:bg-primary/90"
        >
          {editingId !== null ? 'Atualizar' : 'Adicionar'} Hotspot
        </button>
      </div>
    </form>
  </div>
  
  <div class="bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold p-6 border-b">Lista de Hotspots</h2>
    
    {#if hotspots.length === 0}
      <div class="p-6 text-center text-gray-500">
        Nenhum hotspot adicionado ainda. Adicione seu primeiro hotspot acima.
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">X</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Y</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each hotspots as hotspot}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">{hotspot.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">{hotspot.x}</td>
                <td class="px-6 py-4 whitespace-nowrap">{hotspot.y}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button 
                    on:click={() => editHotspot(hotspot)}
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Editar
                  </button>
                  <button 
                    on:click={() => deleteHotspot(hotspot.id)}
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