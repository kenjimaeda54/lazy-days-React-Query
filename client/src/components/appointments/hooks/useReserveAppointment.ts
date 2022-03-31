import { useMutation, useQueryClient } from 'react-query';

import { Appointment } from '../../../../../shared/types';
import { axiosInstance } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useCustomToast } from '../../app/hooks/useCustomToast';
import { useUser } from '../../user/hooks/useUser';

// for when we need functions for useMutation
async function setAppointmentUser(
  appointment: Appointment,
  userId: number | undefined,
): Promise<void> {
  if (!userId) return;
  const patchOp = appointment.userId ? 'replace' : 'add';
  const patchData = [{ op: patchOp, path: '/userId', value: userId }];
  await axiosInstance.patch(`/appointment/${appointment.id}`, {
    data: patchData,
  });
}

type AppointmentMutationFunction = (appointment: Appointment) => void;

export function useReserveAppointment(): AppointmentMutationFunction {
  const { user } = useUser();
  const toast = useCustomToast();
  const client = useQueryClient();

  const { mutate } = useMutation(
    async (appointment: Appointment) =>
      setAppointmentUser(appointment, user?.id),
    {
      onSuccess: () => {
        // https://react-query.tanstack.com/guides/query-invalidation
        // preciso invalida as query de apontamento
        // caso contrario precisaria atualizar o navegador para refletir os apontamentos
        // normalmente isto e feito,porque preciso fazer um refetch e o stale time das query, nao vai permitir
        // recorda que estamos lidando com cache, mesmo principio de usar as mesma key para as data
        // nao irão ocorrer atualização.
        client.invalidateQueries(queryKeys.appointments);
        toast({ title: 'Appointment reserved', status: 'success' });
      },
    },
  );

  return mutate;
}
