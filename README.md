# Lazy Days React
Aplicação simulando app de SPA , possibilitando consultar os funcionários do (SPA). Usuário pode agendar, consultar suas reservas, como atualizar seus dadoseus dados

# Motivação
Aprofundar bem nos conceitos do React query, aplicando situações cotidianas como get,put,delete

# Feature
- Para aproveitar o maximo do react query, evitar consultas constantes na api, alterei as configuracoes padroes do client do react query
- Obeservacao o tempo de staleTime nunca pode ultrapasar o cacheTime. 
- Quem determina o momento de consultar novamente o cache e o staleTime, e o tempo de cache e o responsavel por resgatar ou limpar cache em si
- Por padrao as consultas de cache sao feitas em tres momentos quando monta a tela,recebe o foco e reconecta
- Tambem e possivel determinar a quantidade que sera refeito a tentativa de reconectar. Exemplo se estiver 3 retry,serao 3 chamadas na api



``` typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      onError: queryErrorHandler,
      staleTime: 600000, // 10 minutos
      cacheTime: 900000, // 15 minutos, cache sempre maior que staleTime
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      onError: queryErrorHandler,
    },
  },
});


```

##

- E possivel com React Query fazer interavalos de fetch, vantagem de ultilizar essa abordagem e que em cada tempo determinado sera feiot um novo fetch,ideal em momentos que a pagina sofre constante mudanca de dados e precisa sempre mostrar na tela para usuario indepdente de ele atualizar browser
- Abordagem parecida ao web socket



