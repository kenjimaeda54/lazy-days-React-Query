import { AxiosResponse } from 'axios';
import { useQuery, useQueryClient } from 'react-query';

import type { User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from '../../../user-storage';

async function getUser(user: User | null): Promise<User | null> {
  if (!user) return null;
  const { data }: AxiosResponse<{ user: User }> = await axiosInstance.get(
    `/user/${user.id}`,
    {
      headers: getJWTHeader(user),
    },
  );
  return data.user;
}

interface UseUser {
  user: User | null;
  updateUser: (user: User) => void;
  clearUser: () => void;
}

export function useUser(): UseUser {
  const client = useQueryClient();
  // estou recebendo user, e enviando para getUser
  // para isto aqui nao ficar em um loop infitio ser a usado o setQueryData
  // https://react-query.tanstack.com/reference/QueryClient#queryclientsetquerydata
  const { data: user } = useQuery(queryKeys.user, () => getUser(user), {
    // toda vez que a pagina for carregada ou atualizada, vai chamar o initialData
    // isto e para garantir que useQuery vai iniciar apos a pagina  ser carregada ou atualizada com
    // valor prefixo,caso contrario precisaremos setar usuário novamente no local storage,
    // nao esqueça no onSuccess estou apenas salvando,mas preciso de alguma forma recuperar também
    initialData: getStoredUser(),
    // onSuccess e sempre acionado quando o query for sucesso
    // ou no setQueryData ou no useQUery
    onSuccess: (received: User | null) => {
      if (!received) {
        clearStoredUser();
      } else {
        setStoredUser(received);
      }
    },
  });

  // meant to be called from useAuth
  function updateUser(newUser: User): void {
    // função updateUser sempre recebe um user,
    // por isso setQueryData para useQuery possuir um user
    client.setQueriesData(queryKeys.user, newUser);
  }

  // meant to be called from useAuth
  function clearUser() {
    client.setQueriesData(queryKeys.user, null);
    // estou colando o queryKeys.appointments porque esta query
    // precisa ser invalidada, para refletir na tela de apontamento
    // ela depende do mutation
    // precisa a query que vai ser invalidada estar em primeiro
    // exemplo queryKeys.appointments
    client.removeQueries([queryKeys.appointments, queryKeys.userAppointments]);
  }

  return { user, updateUser, clearUser };
}
