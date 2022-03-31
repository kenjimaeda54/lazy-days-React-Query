import jsonpatch from 'fast-json-patch';
import { useMutation, useQueryClient } from 'react-query';

import type { User } from '../../../../../shared/types';
import { axiosInstance, getJWTHeader } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useCustomToast } from '../../app/hooks/useCustomToast';
import { useUser } from './useUser';

// for when we need a server function
async function patchUserOnServer(
  newData: User | null,
  originalData: User | null,
): Promise<User | null> {
  if (!newData || !originalData) return null;
  // create a patch for the difference between newData and originalData
  const patch = jsonpatch.compare(originalData, newData);

  // send patched data to the server
  const { data } = await axiosInstance.patch(
    `/user/${originalData.id}`,
    { patch },
    {
      headers: getJWTHeader(originalData),
    },
  );
  return data.user;
}

export function usePatchUser(): (newData: User | null) => void {
  const { user, updateUser } = useUser();
  const toast = useCustomToast();
  const clientQuery = useQueryClient();

  const { mutate: patchUser } = useMutation(
    (newUser: User | null) => patchUserOnServer(newUser, user),
    {
      // retorna um contexto, como callback caso de erro
      onMutate: async (newData: User | null) => {
        // vamos cancelar as query para evitar sobrescrita de valores
        clientQuery.cancelQueries([queryKeys.user]);

        // vamos recuperar os dados antes de dar erro
        const previousData: User = clientQuery.getQueryData(queryKeys.user);
        // caso seja sucesso, optimizando o cacho com novo usuário
        updateUser(newData);

        // retorna um objeto
        return { previousData };
      },
      onError: (error, newData, context) => {
        if (context.previousData) {
          updateUser(context.previousData);
          toast({
            title: 'Error updating user, restoring previous data',
            status: 'error',
          });
        }
      },
      onSuccess: (newUser) => {
        if (newUser) {
          toast({
            title: 'User updated',
            status: 'success',
          });
        }
      },
      onSettled: () => {
        clientQuery.invalidateQueries([queryKeys.user]);
      },
    },
  );

  return patchUser;
}
