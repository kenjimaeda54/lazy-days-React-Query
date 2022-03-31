import { useMutation, useQueryClient } from 'react-query';

import { Appointment } from '../../../../../shared/types';
import { axiosInstance } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useCustomToast } from '../../app/hooks/useCustomToast';

// for when server call is needed
async function removeAppointmentUser(appointment: Appointment): Promise<void> {
  const patchData = [{ op: 'remove', path: '/userId' }];
  await axiosInstance.patch(`/appointment/${appointment.id}`, {
    data: patchData,
  });
}

export function useCancelAppointment(): (appointment: Appointment) => void {
  const toast = useCustomToast();
  const client = useQueryClient();

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
  return mutate;
}
