<script>
  import { onMount } from 'svelte';
  import { getHotspots, addHotspot, updateHotspot, deleteHotspot } from '$lib/firebaseFetch';
  
  let hotspots = [];
  let name = '';
  let x = 0;
  let y = 0;
  let frequency = 0;
  let editingId = null;
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      hotspots = await getHotspots();
      loading = false;
    } catch (err) {
      console.error('Erro ao carregar hotspots:', err);
      error = 'Erro ao carregar hotspots. Tente recarregar a página.';
      loading = false;
    }
  });
  
  async function handleAddHotspot() {
    if (!name.trim()) return;
    
    try {
      if (editingId !== null) {
        // Update existing hotspot
        await updateHotspot(editingId, { 
          name, 
          x: Number(x), 
          y: Number(y), 
          frequency: Number(frequency) 
        });
        
        // Atualiza a lista local
        const index = hotspots.findIndex(h => h.id === editingId);
        if (index !== -1) {
          hotspots[index] = { 
            ...hotspots[index], 
            name, 
            x: Number(x), 
            y: Number(y), 
            frequency: Number(frequency) 
          };
          hotspots = [...hotspots];
        }
        
        editingId = null;
      } else {
        // Add new hotspot
        const newHotspot = {
          name,
          x: Number(x),
          y: Number(y),
          frequency: Number(frequency)
        };
        
        const docRef = await addHotspot(newHotspot);
        
        // Adiciona à lista local com o ID gerado pelo Firestore
        hotspots = [...hotspots, { id: docRef.id, ...newHotspot }];
      }
      
      // Reset form
      name = '';
      x = 0;
      y = 0;
      frequency = 0;
    } catch (err) {
      console.error('Erro ao salvar hotspot:', err);
      error = 'Ocorreu um erro ao salvar o hotspot. Tente novamente.';
    }
  }
  
  function editHotspot(hotspot) {
    name = hotspot.name;
    x = hotspot.x;
    y = hotspot.y;
    frequency = hotspot.frequency !== undefined ? Number(hotspot.frequency) : 0;
    editingId = hotspot.id;
  }
  
  async function handleDeleteHotspot(id) {
    if (confirm('Tem certeza que deseja excluir este hotspot?')) {
      try {
        await deleteHotspot(id);
        hotspots = hotspots.filter(h => h.id !== id);
      } catch (err) {
        console.error('Erro ao excluir hotspot:', err);
        error = 'Ocorreu um erro ao excluir o hotspot. Tente novamente.';
      }
    }
  }
</script>

<div>
  <h1 class="text-2xl font-bold mb-6">Gerenciar Hotspots</h1>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  <div class="bg-white p-6 rounded-lg shadow-md mb-8">
    <h2 class="text-xl font-semibold mb-4">{editingId !== null ? 'Editar' : 'Adicionar'} Hotspot</h2>
    
    <form on:submit|preventDefault={handleAddHotspot} class="space-y-4">
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
      
      <!-- Campo de frequência -->
      <div>
        <label for="frequency" class="block text-sm font-medium text-gray-700 mb-1">Frequência (valor numérico)</label>
        <input 
          id="frequency"
          type="number" 
          bind:value={frequency} 
          class="w-full p-2 border rounded focus:ring focus:ring-primary/50 focus:outline-none"
          placeholder="Ex: 10, 20, 30..."
          min="0"
          step="1"
        />
        <p class="mt-1 text-xs text-gray-500">Informe um valor numérico para a frequência do hotspot.</p>
      </div>
      
      <div class="flex justify-end">
        {#if editingId !== null}
          <button 
            type="button" 
            on:click={() => { editingId = null; name = ''; x = 0; y = 0; frequency = 0; }}
            class="mr-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        {/if}
        <button 
          type="submit" 
          class="px-4 py-2 bg-blue-100 text-black rounded hover:bg-blue-200 transition-colors"
        >
          {editingId !== null ? 'Atualizar' : 'Adicionar'} Hotspot
        </button>
      </div>
    </form>
  </div>
  
  <div class="bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-semibold p-6 border-b">Lista de Hotspots</h2>
    
    {#if loading}
      <div class="p-6 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-2 text-gray-500">Carregando hotspots...</p>
      </div>
    {:else if hotspots.length === 0}
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequência</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each hotspots as hotspot}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">{hotspot.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">{hotspot.x}</td>
                <td class="px-6 py-4 whitespace-nowrap">{hotspot.y}</td>
                <td class="px-6 py-4 whitespace-nowrap">{hotspot.frequency !== undefined ? hotspot.frequency : 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <button 
                    on:click={() => editHotspot(hotspot)}
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Editar
                  </button>
                  <button 
                    on:click={() => handleDeleteHotspot(hotspot.id)}
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