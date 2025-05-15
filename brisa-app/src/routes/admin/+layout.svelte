<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  
  let userName = "Administrador";
  let isAuthChecked = false; // Flag para controlar se a verificação já foi feita
  
  onMount(() => {
    // Verificar se o usuário está logado e é admin
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
      // Limpar qualquer localStorage antigo para evitar conflitos
      localStorage.removeItem('currentUser');
      goto('/');
      return;
    }
    
    try {
      const userData = JSON.parse(currentUser);
      if (!userData.isAdmin) {
        goto('/');
        return;
      }
      
      // Formatar o CPF para exibição
      const cpf = userData.cpf;
      if (cpf) {
        userName = `Admin (${cpf.slice(0, 3)}.XXX.XXX-${cpf.slice(-2)})`;
      }
      
      // Marcar que a verificação foi concluída
      isAuthChecked = true;
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
      sessionStorage.removeItem('currentUser');
      goto('/');
    }
  });
  
  function logout() {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser'); // Limpar também o localStorage para garantir
    goto('/');
  }
</script>

<!-- Só renderiza o conteúdo quando a verificação de autenticação estiver concluída -->
{#if isAuthChecked}
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-md">
      <div class="p-4 border-b">
        <h1 class="text-xl font-bold text-primary">Admin Panel</h1>
      </div>
      <nav class="p-4">
        <ul class="space-y-2">
          <li>
            <a 
              href="/admin/hotspots" 
              class="block p-2 rounded {$page.url.pathname.includes('/hotspots') ? 'bg-primary text-black' : 'hover:bg-gray-100'}"
            >
              Hotspots
            </a>
          </li>
          <li>
            <a 
              href="/admin/offers" 
              class="block p-2 rounded {$page.url.pathname.includes('/offers') ? 'bg-primary text-black' : 'hover:bg-gray-100'}"
            >
              Ofertas
            </a>
          </li>
        </ul>
      </nav>
      
      <div class="absolute bottom-0 left-0 w-64 p-4 border-t bg-white">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium truncate">{userName}</span>
          <button 
            on:click={logout}
            class="text-sm text-red-600 hover:text-red-800"
          >
            Sair
          </button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 p-8">
      <slot />
    </div>
  </div>
{:else}
  <!-- Mostrar um indicador de carregamento enquanto verifica a autenticação -->
  <div class="min-h-screen flex items-center justify-center">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
{/if}