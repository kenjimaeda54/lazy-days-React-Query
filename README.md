# Lazy Days React
Aplicação simulando app de SPA , possibilitando consultar os funcionários do (SPA). Usuário pode agendar, consultar suas reservas, como atualizar seus dadoseus dados

# Motivação
Aprofundar bem nos conceitos do React query, aplicando situações cotidianas como get,put,delete

# Feature
- Para   evitar consultas constantes na api, alterei as configurações padrões do client do react query
- Observação o tempo de staleTime nunca pode ultrapassar o cacheTime. 
- Quem determina o momento de consultar novamente o cache e o staleTime, e o tempo de cache e o responsável por resgatar ou limpar cache em si
- Por padrão as consultas de cache são feitas em três momentos quando: monta a tela, recebe o foco e reconecta
- Também é  possível determinar a quantidade que sera refeito a tentativa de reconectar. Exemplo se estiver 3 retry, serão 3 chamadas na api



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

- E possivel com React Query fazer interavalos de fetch, vantagem de ultilizar essa abordagem, em cada tempo determinado sera feiot um novo fetch,ideal em momentos que a pagina sofre constante mudanca de dados,precisa constantemente atualizar indeptendente atualizar browser
- Abordagem parecida ao web socket
- Na tela de agendamento onde ocorre a interacao do usuario com o calendario apliquei essa abordagem
- Foi importante aplicar neste caso de uso,por que seria pessimo ao usuario ele escolher uma data e ao mesmo outro usuario ja ter selecioado,assim evita essas situacoes 
- Apliquei novamente  pre fetch,assim garanto um carregamento dos dados antes da tela ser montada
- Nas mutations, para refletir as mudancas e ideial  fazer [invalidate de query](https://react-query.tanstack.com/guides/query-invalidation),porqeu por padrao o cache vai espera o stale time terminar.
- Todas as querys que deseja autalizar precisam estar em primeiro com o nome da chave no casso abaixo todas as querys precisam iniciar com a chave queryKeys.appointments

``` typescript

  useEffect(() => {
    const nextMonthYear = getNewMonthYear(monthYear, 1);
    client.prefetchQuery(
      [queryKeys.appointments, monthYear.year, monthYear.monthName],
      () => getAppointments(nextMonthYear.year, nextMonthYear.month),
      {
        ...commonOptionsForQuery,
      },
    );
  }, [monthYear, client]);

  const { data: appointments = {} } = useQuery(
    [queryKeys.appointments, monthYear.year, monthYear.monthName],
    () => getAppointments(monthYear.year, monthYear.month),
    {
      ...commonOptionsForQuery,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      refetchInterval: 420000, //  refetch a cada 7 minutos
      select: showAll ? undefined : selectFn,
    },
  );
  
//============================================================

 const { mutate } = useMutation(
    // aqui e uma função callback seria mesma coisa de fazer assim
    // removeAppointmentUser
    // idêntico fazer onChange= { função}
    (appointment: Appointment) => removeAppointmentUser(appointment),
    {
      onSuccess: () => {
        // precisa ser entre array,porque as outras query reflacionado a ela e em array
        client.invalidateQueries([queryKeys.appointments]);
        toast({
          title: 'Your appointment was canceled',
          status: 'warning',
        });
      },
    },
  );


```
##
- E possível tambem retornar no data do useQuery apenas os valores desejados, para isto usar o select, ele recebe uma função
- Esta função normalmente aplica as regras que deseja, por exemplo, filtro .filter(()=>)
- Para realizar atualização dos dados do usurário, implementei uma lógica complexa, com ela foi possível determinar se mantinha os valores anteriores ou os novos
- [useMuntation](https://react-query.tanstack.com/reference/useMutation#_top) retorna algumas funções interessantes para lidarmos com atualização de dados
- onMutate consigo cancelar as query, retornar as anteriores por contexto(este contexto disponível para onError e onSucess)
- onSetteled consigo realizar algo entre onSucess e onError neste caso fiz o invalidateQuerires assim atualizara os valores tanto no caso de sucesso quanto de erro




``` typescript


export function useStaff(): UseStaff {
  // for filtering staff by treatment
  const [filter, setFilter] = useState('all');

  const filterFn = useCallback(
    (data: Staff[]) => filterByTreatment(data, filter),
    [filter],
  );

 
  const { data: staff = [] } = useQuery(queryKeys.staff, getStaff, {
    select: filter === 'all' ? undefined : filterFn,
  });

  return { staff, filter, setFilter };
}

//==========================================================================
 const { mutate: patchUser } = useMutation(
    (newUser: User | null) => patchUserOnServer(newUser, user),
    {
      // https://react-query.tanstack.com/reference/useMutation#_top
      // retorna um contexto, como callback caso de erro
      // valor que esta em useMutation vem para onMutate como callback
      onMutate: async (newUser: User | null) => {
        // vamos cancelar as query para evitar sobrescrita de valores
        clientQuery.cancelQueries(queryKeys.user);

        // vamos recuperar os dados antes de dar erro
        const previousData: User = clientQuery.getQueryData(queryKeys.user);

        // salvar o usuário no cache
        updateUser(newUser);

        // retorna um objeto, para o contexto do useMutation
        return { previousData };
      },
      // mesma coia que const = () => {}
      onError: (error, newData, context) => {
        if (context.previousData) {
          updateUser(context.previousData);
          toast({
            title: "Can't update user, save previous data",
            status: 'warning',
          });
        }
      },
      // ja esta sendo salvo no onMutate
      onSuccess: (newUser) => {
        if (newUser) {
          toast({
            title: 'User updated',
            status: 'success',
          });
        }
      },
      // para atualizar o estado do componente
      onSettled: () => {
        clientQuery.invalidateQueries(queryKeys.user);
      },
    },
  );

```
##

- Caso deseje dependências de query poso usar o recurso [enabled](https://react-query.tanstack.com/guides/dependent-queries)
- No exemplo abaixo só possibilitei consultar o user, caso realmente exista um usuário na aplicação 
- Repare que o queryKeys.appointments esta em primeiro o motivo e que sera invalidado essas query, para garantir atualizar o usurário no tempo real que acontecer


``` typescript

 const { data: appointments = [] } = useQuery([queryKeys.appointments, queryKeys.userAppointments, queryKeys.user],
    () => getUserAppointments(user),
    {
      // essa query so vai ser executada se existir um user
      // https://react-query.tanstack.com/guides/dependent-queries
      enabled: !!user,
    },
  );


```







