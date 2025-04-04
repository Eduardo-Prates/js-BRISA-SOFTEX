<script>
    import { onMount } from 'svelte';
    import { getCarrinhos, getOfertas } from '$lib/firebaseFetch';
  
    let carrinhos = [];
    let ofertas = [];
    let ofertasMap = {};
  
    onMount(async () => {
      carrinhos = await getCarrinhos();
      ofertas = await getOfertas();
      ofertasMap = Object.fromEntries(ofertas.map(oferta => [oferta.id, oferta]));
  
      console.log('Carrinhos:', carrinhos);
      console.log('Ofertas:', ofertas);
    });
  
    function formatarData(timestamp) {
      const data = new Date(timestamp.seconds * 1000);
      return data.toLocaleDateString();
    }
  </script>
  
  <section class="max-w-6xl mx-auto px-4 py-8">
    <h2 class="text-3xl font-bold text-gray-800 mb-6">Carrinhos</h2>
    <ul class="space-y-6">
      {#each carrinhos as carrinho}
        <li class="p-6 border rounded-2xl bg-white shadow-sm">
          <p class="text-sm text-gray-600"><strong>ID:</strong> {carrinho.id}</p>
          <p><strong>Localização:</strong> {carrinho.localizacaoAtual}</p>
          <p><strong>Tablet ID:</strong> {carrinho.tabletId}</p>
          <p><strong>Tempo de Sessão:</strong> {carrinho.tempoDeSessao} min</p>
  
          <div class="mt-4">
            <p class="font-semibold">Ofertas Exibidas:</p>
            <ul class="ml-4 mt-2 list-disc text-sm text-gray-700 space-y-1">
              {#each carrinho.ofertasExibidas as ofertaId}
                {#if ofertasMap[ofertaId]}
                  <li>
                    <span class="font-medium">{ofertasMap[ofertaId].nomeProduto}</span> — 
                    R$ {ofertasMap[ofertaId].preco.toFixed(2)}  
                    <br />
                    <em class="text-xs text-gray-500">{ofertasMap[ofertaId].descricao}</em>
                  </li>
                {:else}
                  <li class="text-red-500">Oferta {ofertaId} não encontrada.</li>
                {/if}
              {/each}
            </ul>
          </div>
        </li>
      {/each}
    </ul>
  
    <h2 class="text-3xl font-bold text-gray-800 mt-12 mb-6">Ofertas</h2>
    <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each ofertas as oferta}
        <li class="p-6 border rounded-2xl bg-white shadow-md flex flex-col gap-3">
          <img src={oferta.imagemURL} alt="Imagem do produto" class="w-full h-40 object-cover rounded" />
          <div>
            <p class="text-sm text-gray-500"><strong>ID:</strong> {oferta.id}</p>
            <p><strong>Produto:</strong> {oferta.nomeProduto}</p>
            <p><strong>Preço:</strong> R$ {oferta.preco.toFixed(2)}</p>
            <p><strong>Categoria:</strong> {oferta.categoria}</p>
            <p><strong>Descrição:</strong> {oferta.descricao}</p>
            <p><strong>Hotspot:</strong> {oferta.hotspotId}</p>
            <p><strong>Validade:</strong> {formatarData(oferta.dataFim)}</p>
          </div>
        </li>
      {/each}
    </ul>
  </section>
  