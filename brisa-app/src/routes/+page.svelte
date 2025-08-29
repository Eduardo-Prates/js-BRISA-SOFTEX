<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getUserByCPF, updateUserLastLogin } from '$lib/firebaseFetch';
  
  let cpf = '';
  let error = '';
  let loading = false;
  let isCheckingAuth = true; // Flag para controlar a verificação inicial
  
  onMount(() => {
    // Limpar qualquer localStorage antigo para evitar conflitos
    localStorage.removeItem('currentUser');
    
    // Verificar se já existe um usuário logado
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (userData.isAdmin) {
          goto('/admin/hotspots');
        } else {
          goto('/client');
        }
      } catch (error) {
        console.error("Erro ao processar dados do usuário:", error);
        sessionStorage.removeItem('currentUser');
      }
    }
    
    // Marcar que a verificação inicial foi concluída
    isCheckingAuth = false;
  });
  
  function formatCPF(value) {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Aplica a formatação: XXX.XXX.XXX-XX
    if (numericValue.length <= 3) {
      return numericValue;
    } else if (numericValue.length <= 6) {
      return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
    } else if (numericValue.length <= 9) {
      return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
    } else {
      return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
    }
  }
  
  function handleInput(e) {
    const value = e.target.value;
    const formattedValue = formatCPF(value);
    cpf = formattedValue;
  }
  
  function validateCPF(cpf) {
    // Remove caracteres não numéricos para validação
    const numericCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (numericCPF.length !== 11) {
      return false;
    }
    
    // Verifica se todos os dígitos são iguais (CPF inválido, mas com formato correto)
    if (/^(\d)\1+$/.test(numericCPF)) {
      return false;
    }
    
    // Em um sistema real, você faria uma validação completa do CPF
    // Para este exemplo, vamos considerar válido se tiver 11 dígitos
    return true;
  }
  
  async function handleSubmit() {
    error = '';
    
    // Remove formatação para processar
    const numericCPF = cpf.replace(/\D/g, '');
    
    if (!validateCPF(cpf)) {
      error = 'CPF inválido. Por favor, verifique.';
      return;
    }
    
    loading = true;
    
    try {
      // Busca ou cria o usuário no banco de dados
      const userData = await getUserByCPF(numericCPF);
      
      // Atualiza o último login do usuário
      await updateUserLastLogin(numericCPF);
      
      // Limpar qualquer localStorage antigo para evitar conflitos
      localStorage.removeItem('currentUser');
      
      // Salva os dados do usuário na sessão
      sessionStorage.setItem('currentUser', JSON.stringify({
        id: userData.id,
        cpf: numericCPF,
        isAdmin: userData.isAdmin,
        loginTime: new Date().toISOString()
      }));
      
      // Redireciona para a interface apropriada
      if (userData.isAdmin) {
        goto('/admin/hotspots');
      } else {
        goto('/client');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      error = 'Ocorreu um erro ao fazer login. Tente novamente.';
    } finally {
      loading = false;
    }
  }
</script>

<!-- Só mostra o formulário quando a verificação inicial estiver concluída -->
{#if isCheckingAuth}
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
{:else}
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <div class="mb-6 items-center justify-center flex">
        <!-- Logo - Center -->
        <div class="flex items-center space-x-2">
          <div class="text-2xl">
            <span class="font-bold text-teal-600">VLC</span><span class="font-light text-gray-700">ART</span>
          </div>
          <img src="https://img.icons8.com/?size=100&id=13014&format=png&color=000000" alt="Carrinho de compras" class="w-6 h-6">
        </div>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div>
          <label for="cpf" class="block text-sm font-medium text-gray-700 mb-1">CPF</label>
          <input 
            id="cpf"
            type="text" 
            bind:value={cpf}
            on:input={handleInput}
            placeholder="000.000.000-00"
            maxlength="14"
            class="w-full p-3 border rounded-lg focus:ring focus:ring-primary/30 focus:border-primary focus:outline-none"
            required
          />
          {#if error}
            <p class="mt-1 text-sm text-red-600">{error}</p>
          {/if}
          <p class="mt-2 text-xs text-gray-500">
            Para fins de demonstração, use os CPFs de administrador: 123.456.789-00 ou 009.876.543-21
          </p>
        </div>
        
        <button 
          type="submit" 
          class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
          disabled={loading}
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
          Entrar
        </button>
      </form>
    </div>
  </div>
{/if}